"use client";

import { clearRequest } from "./actions";

/**
 * Removes the dedupe entry so a client can be asked again. Confirms first —
 * clearing then re-sending double-texts someone who may have already declined.
 */
export default function ClearButton({
  phone,
  name,
}: {
  phone: string;
  name: string;
}) {
  return (
    <form
      action={clearRequest}
      onSubmit={(e) => {
        if (
          !confirm(
            `Clear the record for ${name}? They'll be eligible to be texted again.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="phone" value={phone} />
      <button
        type="submit"
        className="text-xs uppercase tracking-widest text-white/30 hover:text-[#DC2626] transition-colors"
      >
        Clear
      </button>
    </form>
  );
}
