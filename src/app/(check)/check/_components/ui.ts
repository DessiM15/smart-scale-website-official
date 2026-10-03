/**
 * The few classes the check pages share, copied from the public site so the
 * check reads as part of it: the mono red eyebrow, the pill button, the dark
 * rounded field. Every interactive thing gets a visible focus ring.
 */

export const eyebrow = "font-mono text-[11px] uppercase tracking-[0.18em] text-[#EF4444]";
export const lede = "text-lg leading-relaxed text-white/65";
const ring = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
export const buttonPrimary = `inline-flex items-center justify-center rounded-full bg-[#DC2626] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60 ${ring}`;
export const buttonSecondary = `inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white transition hover:border-white ${ring}`;
export const textLink = `rounded text-white underline underline-offset-4 hover:text-[#EF4444] ${ring}`;
export const fieldLabel = "mb-2 block text-sm font-medium text-white/80";
export const fieldInput =
  "w-full rounded-xl border border-white/20 bg-[#161616] px-4 py-3 text-white placeholder-white/50 outline-none transition focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]";
export const fieldError = "mt-2 text-sm text-[#FCA5A5]";
export const panel = "rounded-2xl border border-white/[0.09] bg-[#131211] p-6 sm:p-8";
