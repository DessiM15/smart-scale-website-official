"use client";

/**
 * A submit button that says it is working.
 *
 * The rest of this tracker is server-rendered and does not need it, because
 * saving a record is instant. Sending an email is not: it waits on someone
 * else's API and can take several seconds, and a button that looks untouched
 * for five seconds reads as broken. So this one — and only the buttons that
 * wait on a third party — reports its own state.
 */

import { useFormStatus } from "react-dom";

export function SubmitButton({
  className,
  children,
  pendingLabel,
  disabled,
}: {
  className: string;
  children: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
