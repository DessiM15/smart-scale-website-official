/**
 * Passkeys for the books.
 *
 * The rest of the portal opens with one shared key, and that is how the two
 * of them want it. The books will hold the EIN and the tax returns, so they
 * get a second door: a passkey, which is Face ID or a fingerprint on a phone
 * and belongs to one person. Signing in with one says who you are, which is
 * why the Books pages no longer need the name picker.
 *
 * The rule is simple. Until anyone has enrolled a passkey, the books are
 * open to the shared key, so there is a way in on day one. The moment one
 * exists, every Books page, action and file needs a passkey session. The
 * enrolment page itself stays behind the shared key, which is also how a
 * lost phone is replaced.
 *
 * A session is a signed cookie, good for a day, naming the person and the
 * passkey that opened it. The signing key is derived from the shared admin
 * key, so nothing new has to be configured for it.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import { currentWho, isTeamMember, type TeamMember } from "@/lib/ads/who";

const RP_NAME = "Smart Scale Books";
const SESSION_COOKIE = "ss_books";
const SESSION_SECONDS = 24 * 60 * 60;
const CHALLENGE_SECONDS = 300;

/* -------------------------------- storage --------------------------------- */

export type Passkey = {
  /** The credential id, base64url. */
  id: string;
  who: TeamMember;
  /** "Dessi's iPhone". Chosen at enrolment. */
  label: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt?: string;
};

const KEY = (id: string) => `books:passkey:${id}`;
const INDEX = "books:passkeys";
const CHALLENGE = (id: string) => `books:challenge:${id}`;

function parse(raw: unknown): Passkey | null {
  try {
    return raw ? (JSON.parse(String(raw)) as Passkey) : null;
  } catch {
    return null;
  }
}

export async function listPasskeys(): Promise<Passkey[]> {
  const [ids] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((p): p is Passkey => p !== null)
    .sort((a, b) => a.who.localeCompare(b.who) || a.createdAt.localeCompare(b.createdAt));
}

export async function getPasskey(id: string): Promise<Passkey | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

export async function deletePasskey(id: string): Promise<Passkey | null> {
  const passkey = await getPasskey(id);
  if (!passkey) return null;
  const ok = await redisWrite([
    ["DEL", KEY(id)],
    ["SREM", INDEX, id],
  ]);
  return ok ? passkey : null;
}

export async function renamePasskey(id: string, label: string): Promise<Passkey | null> {
  const passkey = await getPasskey(id);
  if (!passkey) return null;
  const next = { ...passkey, label };
  return (await redisWrite([["SET", KEY(id), JSON.stringify(next)]])) ? next : null;
}

/** True once anyone has enrolled. From then on the books need a passkey. */
export async function booksLocked(): Promise<boolean> {
  const [n] = await redisPipeline([["SCARD", INDEX]]);
  return typeof n === "number" && n > 0;
}

/* ------------------------------- relying party ----------------------------- */

/**
 * The RP id is the site's hostname; a passkey is bound to it. Taken from the
 * request so previews and localhost work without configuration, with
 * PASSKEY_RP_ID as the override if that ever needs pinning.
 */
export function relyingParty(req: Request): { rpID: string; origin: string } {
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const rpID = process.env.PASSKEY_RP_ID || new URL(origin).hostname;
  return { rpID, origin };
}

/* -------------------------------- challenges ------------------------------- */

async function rememberChallenge(challenge: string, meta: Record<string, string>): Promise<string> {
  const id = randomBytes(16).toString("hex");
  await redisWrite([["SET", CHALLENGE(id), JSON.stringify({ challenge, ...meta }), "EX", CHALLENGE_SECONDS]]);
  return id;
}

/** Reads a challenge once. It is gone after this, replay or not. */
async function takeChallenge(id: string): Promise<{ challenge: string; [k: string]: string } | null> {
  if (!/^[a-f0-9]{32}$/.test(id)) return null;
  const [raw] = await redisPipeline([["GET", CHALLENGE(id)]]);
  await redisWrite([["DEL", CHALLENGE(id)]]);
  try {
    return raw ? (JSON.parse(String(raw)) as { challenge: string }) : null;
  } catch {
    return null;
  }
}

/* -------------------------------- enrolment -------------------------------- */

export async function registrationOptions(
  req: Request,
  who: TeamMember,
  label: string,
): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; challengeId: string }> {
  const { rpID } = relyingParty(req);
  const existing = await listPasskeys();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: who.toLowerCase(),
    userDisplayName: who,
    // One stable id per person, so a phone knows it already holds their key.
    userID: new Uint8Array(createHash("sha256").update(`smart-scale-books:${who}`).digest()),
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  const challengeId = await rememberChallenge(options.challenge, { who, label });
  return { options, challengeId };
}

export type EnrolResult = { ok: true; passkey: Passkey } | { ok: false; error: string };

export async function finishRegistration(
  req: Request,
  challengeId: string,
  response: RegistrationResponseJSON,
): Promise<EnrolResult> {
  const stored = await takeChallenge(challengeId);
  if (!stored) return { ok: false, error: "That enrolment took too long. Start it again." };
  const who = stored.who;
  if (!isTeamMember(who)) return { ok: false, error: "Pick Dessi or Jay." };

  const { rpID, origin } = relyingParty(req);
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "The passkey couldn't be verified." };
  }
  if (!verification.verified) return { ok: false, error: "The passkey couldn't be verified." };

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const passkey: Passkey = {
    id: credential.id,
    who,
    label: (stored.label || `${who}'s device`).slice(0, 60),
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    createdAt: new Date().toISOString(),
  };
  const ok = await redisWrite([
    ["SET", KEY(passkey.id), JSON.stringify(passkey)],
    ["SADD", INDEX, passkey.id],
  ]);
  return ok ? { ok: true, passkey } : { ok: false, error: "The database didn't accept it." };
}

/* --------------------------------- unlock ---------------------------------- */

export async function authenticationOptions(
  req: Request,
): Promise<{ options: PublicKeyCredentialRequestOptionsJSON; challengeId: string }> {
  const { rpID } = relyingParty(req);
  const existing = await listPasskeys();
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: existing.map((p) => ({ id: p.id, transports: p.transports })),
    userVerification: "required",
  });
  const challengeId = await rememberChallenge(options.challenge, {});
  return { options, challengeId };
}

export type UnlockResult = { ok: true; passkey: Passkey } | { ok: false; error: string };

export async function finishAuthentication(
  req: Request,
  challengeId: string,
  response: AuthenticationResponseJSON,
): Promise<UnlockResult> {
  const stored = await takeChallenge(challengeId);
  if (!stored) return { ok: false, error: "That took too long. Try again." };
  const passkey = await getPasskey(response.id);
  if (!passkey) return { ok: false, error: "That passkey isn't enrolled here." };

  const { rpID, origin } = relyingParty(req);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64url")),
        counter: passkey.counter,
        transports: passkey.transports,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "The passkey couldn't be verified." };
  }
  if (!verification.verified) return { ok: false, error: "The passkey couldn't be verified." };

  const used: Passkey = { ...passkey, counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date().toISOString() };
  await redisWrite([["SET", KEY(used.id), JSON.stringify(used)]]);
  return { ok: true, passkey: used };
}

/* -------------------------------- sessions --------------------------------- */

type SessionClaims = { who: TeamMember; passkeyId: string; iat: number; exp: number };

function sessionKey(): Buffer | null {
  const admin = process.env.ADS_ADMIN_KEY;
  if (!admin) return null;
  return createHash("sha256").update(`books-session:${admin}`).digest();
}

function sign(payload: string): string | null {
  const key = sessionKey();
  if (!key) return null;
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function sessionToken(who: TeamMember, passkeyId: string): string | null {
  const now = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = { who, passkeyId, iat: now, exp: now + SESSION_SECONDS };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const mac = sign(payload);
  return mac ? `${payload}.${mac}` : null;
}

export function readSessionToken(token: string | undefined): SessionClaims | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  if (!expected) return null;
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
    if (!isTeamMember(claims.who) || typeof claims.exp !== "number") return null;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Must be called from a Route Handler or Server Action. */
export async function setBooksSession(who: TeamMember, passkeyId: string): Promise<boolean> {
  const token = sessionToken(who, passkeyId);
  if (!token) return false;
  const jar = await cookies();
  const base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  jar.set(SESSION_COOKIE, token, { ...base, maxAge: SESSION_SECONDS });
  // The passkey says who this is; the rest of the portal follows.
  jar.set("ss_ads_who", who, { ...base, maxAge: 365 * 24 * 60 * 60 });
  return true;
}

export async function clearBooksSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export type BooksAccess =
  /** A passkey opened the books; `who` is certain. */
  | { ok: true; who: string; via: "passkey"; passkeyId: string; expiresAt: number }
  /** Nobody has enrolled yet, so the shared key is enough for now. */
  | { ok: true; who: string; via: "open" }
  | { ok: false; who: ""; via: "locked" };

/**
 * Whether the books are open to this request, and as whom.
 *
 * A passkey session wins when there is one, even before the books are
 * locked, because it names the person for certain.
 */
export async function booksAccess(): Promise<BooksAccess> {
  const jar = await cookies();
  const claims = readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (claims && (await getPasskey(claims.passkeyId))) {
    return { ok: true, who: claims.who, via: "passkey", passkeyId: claims.passkeyId, expiresAt: claims.exp };
  }
  if (!(await booksLocked())) {
    return { ok: true, who: await currentWho(), via: "open" };
  }
  return { ok: false, who: "", via: "locked" };
}
