/**
 * Who pays Smart Scale.
 *
 * A short list, so income can be tied to a name and the reports can say who
 * the money came from. An advertiser on the screens is a client here too, made
 * the first time one of their payments posts, so the two lists never have to
 * be kept in step by hand.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";

export type Client = {
  id: string;
  name: string;
  /** The advertiser record this client is, when they are one. */
  advertiserId?: string;
  /** Filled in when Stripe sync arrives. */
  stripeCustomerId?: string;
  note: string;
  createdAt: string;
};

const KEY = (id: string) => `books:client:${id}`;
const INDEX = "books:clients";
const BY_ADVERTISER = (advertiserId: string) => `books:client:adv:${advertiserId}`;

function parse(raw: unknown): Client | null {
  try {
    return raw ? (JSON.parse(String(raw)) as Client) : null;
  } catch {
    return null;
  }
}

export async function listClients(): Promise<Client[]> {
  const [ids] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((c): c is Client => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClient(id: string): Promise<Client | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

export async function addClient(input: { name: string; advertiserId?: string; note?: string }): Promise<{ ok: boolean; client?: Client; error?: string }> {
  const name = input.name.trim().slice(0, 120);
  if (!name) return { ok: false, error: "Give the client a name." };
  const client: Client = {
    id: randomUUID().slice(0, 8),
    name,
    advertiserId: input.advertiserId,
    note: (input.note ?? "").slice(0, 300),
    createdAt: new Date().toISOString(),
  };
  const commands: (string | number)[][] = [
    ["SET", KEY(client.id), JSON.stringify(client)],
    ["SADD", INDEX, client.id],
  ];
  if (client.advertiserId) commands.push(["SET", BY_ADVERTISER(client.advertiserId), client.id]);
  const ok = await redisWrite(commands);
  return ok ? { ok: true, client } : { ok: false, error: "The database didn't accept it." };
}

export async function deleteClient(id: string): Promise<boolean> {
  const client = await getClient(id);
  if (!client) return false;
  const commands: (string | number)[][] = [
    ["DEL", KEY(id)],
    ["SREM", INDEX, id],
  ];
  if (client.advertiserId) commands.push(["DEL", BY_ADVERTISER(client.advertiserId)]);
  return redisWrite(commands);
}

/** The client for an advertiser, made on first use. */
export async function ensureClientForAdvertiser(advertiserId: string, name: string): Promise<Client | null> {
  const [id] = await redisPipeline([["GET", BY_ADVERTISER(advertiserId)]]);
  if (id) {
    const existing = await getClient(String(id));
    if (existing) return existing;
  }
  const made = await addClient({ name, advertiserId });
  return made.client ?? null;
}
