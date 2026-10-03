"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { BEST_TIMES, NEEDS, NO_WEBSITE_NOTICE_TEXT } from "@/lib/wb/notice";
import { useTurnstile } from "./useTurnstile";

const labelClass = "mb-2 block text-sm font-medium text-white/80";
const inputClass =
  "w-full rounded-xl border border-white/20 bg-[#161616] px-4 py-3 text-white placeholder-white/50 outline-none transition focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]";
const errorClass = "mt-2 text-sm text-[#FCA5A5]";
const choiceClass =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-white/20 bg-[#161616] px-4 py-3 text-white has-[:checked]:border-[#DC2626] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white";

type Field = "name" | "phone" | "email";
type Errors = Partial<Record<Field | "form", string>>;

/**
 * For a visitor with no website yet: who they are, how to reach them, and
 * what they need. Submitting it is a request for a call, so it lands in the
 * portal as a hot lead.
 */
export default function NoWebsiteForm({ source = "", businessName = "" }: { source?: string; businessName?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const refs = { name: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null) };
  const { holder, getToken, reset } = useTurnstile();

  function show(found: Errors) {
    setErrors(found);
    const first = (["name", "phone", "email"] as Field[]).find((f) => found[f]);
    if (first) refs[first].current?.focus();
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    const found: Errors = {};
    if (!name) found.name = "Enter your name.";
    if (phone.replace(/\D/g, "").length < 10) found.phone = "Enter a phone number with its area code.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) found.email = "Enter your email address.";
    if (found.name || found.phone || found.email) return show(found);

    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/wb/no-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          businessName: String(data.get("businessName") ?? businessName),
          needs: data.getAll("needs").map(String),
          bestTime: String(data.get("bestTime") ?? ""),
          source,
          company_website: String(data.get("company_website") ?? ""),
          turnstileToken: await getToken(),
        }),
      });
      const result = (await res.json()) as { ok: boolean; field?: Field; message?: string };
      if (result.ok) {
        track("generate_lead", { form: "no_website", source });
        router.push("/check/thanks?for=start");
        return;
      }
      reset();
      setBusy(false);
      show(result.field && result.message ? { [result.field]: result.message } : { form: "Something went wrong on our side. Please try again." });
    } catch {
      reset();
      setBusy(false);
      setErrors({ form: "We could not send that. Check your connection and try again." });
    }
  }

  const text = (field: Field, label: string, type: string, autoComplete: string) => (
    <div>
      <label htmlFor={`nw-${field}`} className={labelClass}>
        {label}
      </label>
      <input
        ref={refs[field]}
        id={`nw-${field}`}
        name={field}
        type={type}
        autoComplete={autoComplete}
        required
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={errors[field] ? `nw-${field}-error` : undefined}
        className={inputClass}
      />
      {errors[field] && (
        <p id={`nw-${field}-error`} className={errorClass}>
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {text("name", "Your name", "text", "name")}
      {text("phone", "Phone", "tel", "tel")}
      {text("email", "Email", "email", "email")}
      <div>
        <label htmlFor="nw-business" className={labelClass}>
          Business name <span className="text-white/65">(optional)</span>
        </label>
        <input id="nw-business" name="businessName" type="text" autoComplete="organization" defaultValue={businessName} className={inputClass} />
      </div>
      <fieldset>
        <legend className={labelClass}>What do you need? Pick any.</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {NEEDS.map((need) => (
            <label key={need} className={choiceClass}>
              <input type="checkbox" name="needs" value={need} className="h-5 w-5 accent-[#DC2626]" />
              {need}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={labelClass}>
          Best time to reach you <span className="text-white/65">(optional)</span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {BEST_TIMES.map((time) => (
            <label key={time} className={choiceClass}>
              <input type="radio" name="bestTime" value={time} className="h-5 w-5 accent-[#DC2626]" />
              {time}
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="nw-company-website">Leave this empty</label>
        <input id="nw-company-website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div ref={holder} />
      <div role="alert">{errors.form && <p className={errorClass}>{errors.form}</p>}</div>
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#DC2626] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {busy ? "Sending..." : "Get me online"}
      </button>
      <p className="text-sm leading-relaxed text-white/65">
        {NO_WEBSITE_NOTICE_TEXT} We only use your phone number to call you back.{" "}
        <a href="/privacy" className="text-white underline underline-offset-4 hover:text-[#EF4444]">
          Privacy
        </a>
      </p>
    </form>
  );
}
