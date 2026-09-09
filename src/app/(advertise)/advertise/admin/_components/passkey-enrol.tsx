"use client";

/**
 * Enrol this phone or laptop as a passkey.
 *
 * Asks the server for a challenge, hands it to the browser (Face ID,
 * fingerprint, or the laptop's own prompt), and posts the signed result
 * back. On success the page reloads signed in as that person.
 */

import { useState } from "react";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { bebas, btnSolid, inputClass, labelClass, selectClass } from "./ui";

export function PasskeyEnrol({ team, defaultWho, returnTo }: { team: readonly string[]; defaultWho: string; returnTo: string }) {
  const [who, setWho] = useState(defaultWho || team[0]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supported = typeof window === "undefined" ? true : browserSupportsWebAuthn();

  async function enrol() {
    setBusy(true);
    setError("");
    try {
      const opt = await fetch("/api/books/passkey/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ who, label: label || defaultLabel() }),
      });
      const optJson = (await opt.json()) as { options?: Parameters<typeof startRegistration>[0]["optionsJSON"]; challengeId?: string; error?: string };
      if (!opt.ok || !optJson.options || !optJson.challengeId) throw new Error(optJson.error || "Couldn't start. Try again.");

      const response = await startRegistration({ optionsJSON: optJson.options });

      const ver = await fetch("/api/books/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: optJson.challengeId, response }),
      });
      const verJson = (await ver.json()) as { ok?: boolean; error?: string };
      if (!ver.ok || !verJson.ok) throw new Error(verJson.error || "The passkey couldn't be saved.");
      window.location.assign(`${returnTo}${returnTo.includes("?") ? "&" : "?"}msg=passkeyEnrolled&detail=${encodeURIComponent(label || defaultLabel())}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(/NotAllowedError|cancel|timed out|abort/i.test(message) ? "That was cancelled before it finished. Try again when you're ready." : message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!supported && (
        <p className="text-sm text-[#E0B36A]">This browser can&apos;t make passkeys. Open the portal in Safari on the phone, or Chrome or Safari on the laptop.</p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="enrol-who">Whose passkey</label>
          <select id="enrol-who" value={who} onChange={(e) => setWho(e.target.value)} className={selectClass} disabled={busy}>
            {team.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="enrol-label">This device</label>
          <input
            id="enrol-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={defaultLabel()}
            className={inputClass}
            disabled={busy}
            maxLength={60}
          />
        </div>
      </div>
      {error && <p className="text-sm text-[#f87171]">{error}</p>}
      <button type="button" onClick={enrol} disabled={busy || !supported} className={`${btnSolid} self-start`} aria-busy={busy}>
        {busy ? "Waiting for the device" : "Add this device"}
      </button>
      <p className={`${bebas} text-[11px] tracking-[0.2em] text-white/30`}>Face ID, Touch ID, or the laptop&apos;s own prompt. Nothing to remember.</p>
    </div>
  );
}

function defaultLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android phone";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows laptop";
  return "This device";
}
