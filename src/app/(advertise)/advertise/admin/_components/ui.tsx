/**
 * The design system for the portal, in one file.
 *
 * Every surface, label, badge and button on the admin pages comes from here,
 * so the look is one decision. The look itself: near-black ground, hairline
 * square cards with a faint glass gradient, Bebas Neue for every small tracked
 * label, a light serif for the one sentence headline each page gets, Inter for
 * anything read at length, and the brand red used sparingly as the accent.
 *
 * The names are kept from the previous version (Card, Tile, Pill, Note, Field)
 * so the pages that already use them restyle without being rewritten.
 */

import type { ReactNode } from "react";

export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Houston time, short form. The stamp used everywhere on these pages. */
export function stamp(iso: string | number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Time only, for entries already grouped under a day. */
export function clock(iso: string | number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/* ---------------------------------- type ---------------------------------- */

/** The poster face, for tracked labels. Loaded by the root layout. */
export const bebas = "font-[family-name:var(--font-bebas)]";
/** The headline serif. Loaded by the admin layout. */
export const serif = "font-[family-name:var(--font-cormorant)]";

/** The small red line above a headline. */
export const eyebrowClass = `${bebas} text-[13px] tracking-[0.28em] text-[#DC2626]`;
/** A section label inside a card. */
export const labelClass = `${bebas} block text-[11px] tracking-[0.24em] text-white/40 mb-2`;
/** The one sentence at the top of each page. */
export const headlineClass = `${serif} text-4xl sm:text-[2.75rem] leading-[1.05] text-white font-normal`;
/** A large figure. */
export const numClass = `${serif} font-medium tabular-nums`;

/* --------------------------------- classes -------------------------------- */

export const inputClass =
  "w-full border border-white/[0.12] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 [color-scheme:dark] focus:outline-none focus:border-[#DC2626]/70 focus:bg-white/[0.05] transition-colors";

export const selectClass = `${inputClass} appearance-none [&>option]:bg-[#161616] [&>option]:text-white`;

const btnBase = `${bebas} inline-flex items-center justify-center gap-2.5 tracking-[0.22em] text-[13px] leading-none px-5 py-3.5 border transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`;

/** Outlined in red. The one action a page or card leads with. */
export const btnPrimary = `${btnBase} border-[#DC2626]/70 text-white hover:bg-[#DC2626] hover:border-[#DC2626]`;
/** Filled red. For the thing you came to do. */
export const btnSolid = `${btnBase} border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#b91c1c] hover:border-[#b91c1c]`;
/** Hairline. Secondary actions. */
export const btnGhost = `${btnBase} border-white/[0.14] text-white/75 hover:text-white hover:border-white/40`;
/** Hairline, red text. Removing and deleting. */
export const btnDanger = `${btnBase} border-white/[0.14] text-[#f87171] hover:bg-[#DC2626] hover:text-white hover:border-[#DC2626]`;
/** Smaller padding for a row. Combine: `${btnGhost} ${btnSm}`. */
export const btnSm = "px-3.5 py-2.5 text-[12px] tracking-[0.2em]";

export const linkAction = "text-xs font-semibold text-[#f87171] hover:text-white transition-colors";
export const linkQuiet = "text-xs font-semibold text-white/40 hover:text-white transition-colors";
/** A tracked text link with a hairline under it. */
export const linkLine = `${bebas} text-[12px] tracking-[0.22em] text-white/70 hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors`;

/* --------------------------------- surfaces ------------------------------- */

/** The card surface on its own, for things that are not a Card. */
export const cardClass =
  "border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.012]";

const CARD_SURFACE = {
  plain: "border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.012]",
  warn: "border-[#E0B36A]/25 bg-gradient-to-b from-[#E0B36A]/[0.06] to-transparent",
  bad: "border-[#DC2626]/30 bg-gradient-to-b from-[#DC2626]/[0.07] to-transparent",
} as const;

export function Card({
  title,
  lede,
  action,
  id,
  surface = "plain",
  children,
  className = "",
  padding = "p-5 sm:p-6",
}: {
  title?: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  id?: string;
  surface?: keyof typeof CARD_SURFACE;
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <section id={id} className={`border ${CARD_SURFACE[surface]} ${padding} ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            {title && <h2 className={`${labelClass} !text-[#DC2626] !mb-0`}>{title}</h2>}
            {lede && <p className="mt-2 text-sm text-white/45 max-w-2xl leading-relaxed">{lede}</p>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export type Tone = "ok" | "warn" | "bad" | "neutral" | "brand";

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-[#7FBF8E]",
  warn: "text-[#E0B36A]",
  bad: "text-[#f87171]",
  neutral: "text-white",
  brand: "text-[#f87171]",
};

export function Tile({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "alert" | "ok" | "warn";
}) {
  const colour =
    tone === "alert" ? "text-[#f87171]" : tone === "ok" ? "text-[#7FBF8E]" : tone === "warn" ? "text-[#E0B36A]" : "text-white";
  return (
    <div className={`${cardClass} px-5 py-5 flex flex-col gap-1.5`}>
      <p className={`${labelClass} !mb-0`}>{label}</p>
      <p className={`${numClass} ${colour} text-[2.25rem] leading-none mt-1`}>{value}</p>
      {hint && <p className="text-xs text-white/40 leading-snug">{hint}</p>}
    </div>
  );
}

const BADGE_TONE: Record<Tone, string> = {
  ok: "text-[#7FBF8E] border-[#7FBF8E]/35",
  warn: "text-[#E0B36A] border-[#E0B36A]/35",
  bad: "text-[#f87171] border-[#DC2626]/45",
  neutral: "text-white/70 border-white/[0.14]",
  brand: "text-white border-[#DC2626] bg-[#DC2626]",
};

/**
 * A small tracked label with a dot in its colour: PAID, LATE, ON SCREEN.
 * `Pill` is the same thing under the name the older pages use.
 */
export function Badge({
  tone = "neutral",
  children,
  title,
  dot = true,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={`${bebas} inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-1 text-[11px] tracking-[0.2em] leading-none ${BADGE_TONE[tone]} ${className}`}
    >
      {dot && tone !== "brand" && <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export const Pill = Badge;

/** A framed callout inside a card. */
export function Note({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const border =
    tone === "bad"
      ? "border-[#DC2626]/35 bg-[#DC2626]/[0.06]"
      : tone === "warn"
        ? "border-[#E0B36A]/30 bg-[#E0B36A]/[0.05]"
        : tone === "ok"
          ? "border-[#7FBF8E]/30 bg-[#7FBF8E]/[0.05]"
          : "border-white/[0.08] bg-white/[0.02]";
  return <div className={`border px-5 py-4 ${border}`}>{children}</div>;
}

/* ---------------------------------- fields -------------------------------- */

export function Field({
  label,
  name,
  id = name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  hint,
  inputMode,
  readOnly,
}: {
  label: string;
  name: string;
  id?: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  inputMode?: "text" | "decimal" | "numeric";
  readOnly?: boolean;
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
        inputMode={inputMode}
        readOnly={readOnly}
        className={`${inputClass} ${readOnly ? "text-white/40" : ""}`}
      />
      {hint && <p className="mt-1.5 text-xs text-white/30 leading-snug">{hint}</p>}
    </div>
  );
}

/** Section heading inside a card. */
export function SubHead({ children }: { children: ReactNode }) {
  return <p className={labelClass}>{children}</p>;
}

/** Shown in place of a list with nothing in it yet. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-white/[0.1] px-5 py-6 text-sm text-white/35 leading-relaxed">
      {children}
    </p>
  );
}

/* ---------------------------------- tables -------------------------------- */

export const thClass = `${bebas} text-left text-[11px] tracking-[0.24em] text-white/40 font-normal px-4 py-3.5 border-b border-white/[0.08]`;
export const tdClass = "px-4 py-4 border-b border-white/[0.06] align-middle";

/** The filter row above a list. `on` is the one selected. */
export function FilterPill({
  href,
  on,
  children,
  count,
}: {
  href: string;
  on: boolean;
  children: ReactNode;
  count?: number;
}) {
  return (
    <a
      href={href}
      aria-current={on ? "page" : undefined}
      className={`${bebas} inline-flex items-center gap-2 border px-3.5 py-2.5 text-[12px] tracking-[0.2em] leading-none transition-colors ${
        on ? "border-white text-white" : "border-white/[0.12] text-white/55 hover:text-white hover:border-white/40"
      }`}
    >
      {children}
      {typeof count === "number" && <span className="text-white/40 tracking-normal font-sans text-[11px]">({count})</span>}
    </a>
  );
}

/** A `<details>` styled as a card row with a tracked toggle on the right. */
export function Disclosure({
  summary,
  children,
  open,
  id,
  hint,
  className = "",
}: {
  summary: ReactNode;
  children: ReactNode;
  open?: boolean;
  id?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <details id={id} open={open} className={`group border border-white/[0.08] bg-white/[0.02] scroll-mt-28 ${className}`}>
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className="flex flex-wrap items-center gap-2.5 text-sm text-white">{summary}</span>
        <span className={`${bebas} text-[11px] tracking-[0.22em] text-white/35`}>
          {hint && <span className="mr-3 group-open:hidden">{hint}</span>}
          <span className="group-open:hidden">Open</span>
          <span className="hidden group-open:inline">Close</span>
        </span>
      </summary>
      <div className="px-5 pb-5 pt-1 border-t border-white/[0.06]">{children}</div>
    </details>
  );
}

export { TONE_TEXT as toneText };
