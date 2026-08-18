/**
 * Shared shell for the ad tracker.
 *
 * Every surface, label and pill on the admin pages comes from here so the
 * dark palette stays one decision rather than a colour hand-typed per section.
 * Values track the site tokens in globals.css (#0A0A0A ground, #161616 card,
 * white/[0.08] hairline, #DC2626 brand).
 */

import type { ReactNode } from "react";

export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Houston time, short form — the stamp used everywhere on this page. */
export function stamp(iso: string | number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/* --------------------------------- classes -------------------------------- */

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 [color-scheme:dark] focus:outline-none focus:border-[#DC2626]/60 focus:bg-white/[0.06] transition-colors";

export const selectClass = `${inputClass} appearance-none [&>option]:bg-[#161616] [&>option]:text-white`;

export const labelClass =
  "block text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-2";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#DC2626] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#b91c1c] transition-colors";

export const btnSolid =
  "inline-flex items-center justify-center rounded-xl bg-white text-[#0A0A0A] text-sm font-semibold px-5 py-2.5 hover:bg-white/85 transition-colors";

export const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 text-sm font-semibold px-4 py-2 hover:text-white hover:border-white/25 transition-colors";

export const linkAction =
  "text-xs font-semibold text-[#f87171] hover:text-white transition-colors";

export const linkQuiet =
  "text-xs font-semibold text-white/40 hover:text-white transition-colors";

/* --------------------------------- surfaces ------------------------------- */

const CARD_SURFACE = {
  plain: "border-white/[0.07] bg-[#131313]",
  warn: "border-amber-400/25 bg-amber-400/[0.04]",
} as const;

export function Card({
  title,
  lede,
  action,
  id,
  surface = "plain",
  children,
  className = "",
}: {
  title?: string;
  lede?: ReactNode;
  action?: ReactNode;
  id?: string;
  surface?: keyof typeof CARD_SURFACE;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-3xl border p-6 sm:p-8 ${CARD_SURFACE[surface]} ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            {title && (
              <h2 className="text-xl sm:text-2xl text-white tracking-tight">{title}</h2>
            )}
            {lede && (
              <p className="mt-2 text-sm text-white/45 max-w-2xl leading-relaxed">{lede}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tile({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "alert";
}) {
  return (
    <div
      className={`rounded-2xl border px-5 py-5 ${
        tone === "alert"
          ? "border-[#DC2626]/30 bg-[#DC2626]/[0.07]"
          : "border-white/[0.07] bg-[#131313]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-white tabular-nums tracking-tight">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-white/35">{hint}</p>}
    </div>
  );
}

export type Tone = "ok" | "warn" | "bad" | "neutral" | "brand";

const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  warn: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  bad: "bg-[#DC2626]/15 text-[#f87171] border-[#DC2626]/30",
  neutral: "bg-white/[0.05] text-white/45 border-white/10",
  brand: "bg-[#DC2626] text-white border-transparent",
};

export function Pill({
  tone = "neutral",
  children,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/** A quiet framed block — used for callouts nested inside a Card. */
export function Note({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const border =
    tone === "bad"
      ? "border-[#DC2626]/30 bg-[#DC2626]/[0.06]"
      : tone === "warn"
        ? "border-amber-400/25 bg-amber-400/[0.06]"
        : tone === "ok"
          ? "border-emerald-400/25 bg-emerald-400/[0.05]"
          : "border-white/[0.07] bg-white/[0.02]";
  return <div className={`rounded-2xl border px-5 py-4 ${border}`}>{children}</div>;
}

/* ---------------------------------- fields -------------------------------- */

export function Field({
  label,
  name,
  // Several forms on this page share field names, so ids must be scoped or one
  // form's labels focus another form's inputs.
  id = name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  hint,
}: {
  label: string;
  name: string;
  id?: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
        {required && <span className="text-[#DC2626]"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
      {hint && <p className="mt-1.5 text-xs text-white/30">{hint}</p>}
    </div>
  );
}

/** Section heading inside a card — smaller than the card's own title. */
export function SubHead({ children }: { children: ReactNode }) {
  return <p className={labelClass}>{children}</p>;
}

/** Shown in place of a list that has nothing in it yet. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/[0.09] px-5 py-6 text-sm text-white/35">
      {children}
    </p>
  );
}
