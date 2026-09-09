"use client";

/**
 * The button that opens the books.
 *
 * One tap, one prompt from the device, and the page goes where it was
 * heading. Browsers want a real tap before they will show the prompt, so
 * this never fires on its own.
 */

import { useState } from "react";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import { btnSolid } from "./ui";

export function PasskeyUnlock({ to }: { to: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supported = typeof window === "undefined" ? true : browserSupportsWebAuthn();

  async function unlock() {
    setBusy(true);
    setError("");
    try {
      const opt = await fetch("/api/books/passkey/auth/options", { method: "POST" });
      const optJson = (await opt.json()) as { options?: Parameters<typeof startAuthentication>[0]["optionsJSON"]; challengeId?: string; error?: string };
      if (!opt.ok || !optJson.options || !optJson.challengeId) throw new Error(optJson.error || "Couldn't start. Try again.");

      const response = await startAuthentication({ optionsJSON: optJson.options });

      const ver = await fetch("/api/books/passkey/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: optJson.challengeId, response }),
      });
      const verJson = (await ver.json()) as { ok?: boolean; error?: string };
      if (!ver.ok || !verJson.ok) throw new Error(verJson.error || "That passkey didn't work.");
      window.location.assign(to);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(/NotAllowedError|cancel|timed out|abort/i.test(message) ? "That was cancelled. Tap again when you're ready." : message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!supported && <p className="text-sm text-[#E0B36A]">This browser can&apos;t use passkeys. Try Safari or Chrome.</p>}
      {error && <p className="text-sm text-[#f87171]">{error}</p>}
      <button type="button" onClick={unlock} disabled={busy || !supported} className={`${btnSolid} w-full sm:w-auto`} aria-busy={busy}>
        {busy ? "Waiting for the device" : "Unlock with passkey"}
      </button>
    </div>
  );
}
