"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { NOTICE_TEXT } from "@/lib/wb/notice";
import { useTurnstile } from "./useTurnstile";


const labelClass = "mb-2 block text-sm font-medium text-white/80";
const inputClass =
  "w-full rounded-xl border border-white/20 bg-[#161616] px-4 py-3 text-white placeholder-white/50 outline-none transition focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]";
const errorClass = "mt-2 text-sm text-[#FCA5A5]";

type Errors = { website?: string; email?: string; form?: string };

/**
 * The free website check: two boxes and one button.
 *
 * One component, used wherever the check is offered. `source` says where
 * that is (nav, homepage, footer, ada-blog, postcard, email) and ends up on
 * the lead. `id` keeps the field ids unique when a page shows the form twice.
 */
export default function WebsiteCheckForm({ source = "", businessName = "", id = "check" }: { source?: string; businessName?: string; id?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const websiteRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const { holder, getToken, reset } = useTurnstile();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    const website = String(data.get("website") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    const found: Errors = {};
    if (!website) found.website = "Enter your website address, like yourbusiness.com.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) found.email = "Enter the email address to send your report to.";
    if (found.website || found.email) {
      setErrors(found);
      (found.website ? websiteRef : emailRef).current?.focus();
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/wb/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website,
          email,
          source,
          businessName,
          company_website: String(data.get("company_website") ?? ""),
          turnstileToken: await getToken(),
        }),
      });
      const result = (await res.json()) as { ok: boolean; scanId?: string; field?: "website" | "email"; message?: string };
      if (result.ok && result.scanId) {
        track("check_started", { source });
        router.push(`/check/scan/${result.scanId}`);
        return;
      }
      reset();
      setBusy(false);
      if (result.field && result.message) {
        setErrors({ [result.field]: result.message });
        (result.field === "website" ? websiteRef : emailRef).current?.focus();
      } else {
        setErrors({ form: "Something went wrong on our side. Please try again." });
      }
    } catch {
      reset();
      setBusy(false);
      setErrors({ form: "We could not start the check. Check your connection and try again." });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor={`${id}-website`} className={labelClass}>
          Your website
        </label>
        <input
          ref={websiteRef}
          id={`${id}-website`}
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="yourbusiness.com"
          required
          aria-invalid={errors.website ? true : undefined}
          aria-describedby={errors.website ? `${id}-website-error` : undefined}
          className={inputClass}
        />
        {errors.website && (
          <p id={`${id}-website-error`} className={errorClass}>
            {errors.website}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-email`} className={labelClass}>
          Your email
        </label>
        <input
          ref={emailRef}
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${id}-email-error` : undefined}
          className={inputClass}
        />
        {errors.email && (
          <p id={`${id}-email-error`} className={errorClass}>
            {errors.email}
          </p>
        )}
      </div>
      {/* Hidden from people and from assistive technology. A bot fills it in. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-company-website`}>Leave this empty</label>
        <input id={`${id}-company-website`} name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div ref={holder} />
      <div role="alert">{errors.form && <p className={errorClass}>{errors.form}</p>}</div>
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#DC2626] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {busy ? "Starting your check..." : "Start my free check"}
      </button>
      <p className="text-sm leading-relaxed text-white/65">
        {NOTICE_TEXT}{" "}
        <a href="/privacy" className="text-white underline underline-offset-4 hover:text-[#EF4444]">
          Privacy
        </a>
      </p>
    </form>
  );
}
