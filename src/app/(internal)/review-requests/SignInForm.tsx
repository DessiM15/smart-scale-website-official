"use client";

import { useActionState } from "react";
import { authenticate, type ActionState } from "./actions";

const initial: ActionState = {};

export default function SignInForm() {
  const [state, action, pending] = useActionState(authenticate, initial);

  return (
    <form action={action} className="max-w-sm space-y-4">
      <label className="block text-sm text-white/60" htmlFor="key">
        Admin passphrase
      </label>
      <input
        id="key"
        name="key"
        type="password"
        autoComplete="current-password"
        required
        className="w-full rounded-lg border border-white/[0.12] bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-white/40"
      />
      {state.error && <p className="text-sm text-[#DC2626]">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#DC2626] px-6 py-2.5 text-sm uppercase tracking-widest text-white disabled:opacity-50"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
