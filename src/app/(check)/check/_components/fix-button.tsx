"use client";

import { useFormStatus } from "react-dom";
import { track } from "@/lib/analytics";
import { buttonPrimary } from "./ui";

/** "Fix my website for me", saying so while the request is recorded. */
export function FixButton({ from }: { from: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} onClick={() => track("generate_lead", { form: "fix_request", from })} className={buttonPrimary}>
      {pending ? "Sending your request..." : "Fix my website for me"}
    </button>
  );
}
