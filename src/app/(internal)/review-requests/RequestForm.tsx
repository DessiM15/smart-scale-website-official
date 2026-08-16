"use client";

import { useActionState } from "react";
import { requestReview, type ActionState } from "./actions";

const initial: ActionState = {};

const field =
  "w-full rounded-lg border border-white/[0.12] bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-white/40 disabled:opacity-40";

export default function RequestForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(requestReview, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-xs text-white/40 mb-1.5">
            Client name
          </label>
          <input id="name" name="name" required disabled={disabled} className={field} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs text-white/40 mb-1.5">
            Mobile number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            disabled={disabled}
            placeholder="832 555 0100"
            className={field}
          />
        </div>
      </div>
      <div>
        <label htmlFor="context" className="block text-xs text-white/40 mb-1.5">
          Project or business <span className="text-white/20">(optional)</span>
        </label>
        <input id="context" name="context" disabled={disabled} className={field} />
      </div>

      {state.error && <p className="text-sm text-[#DC2626]">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-400">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-full bg-[#DC2626] px-6 py-2.5 text-sm uppercase tracking-widest text-white disabled:opacity-40"
      >
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
