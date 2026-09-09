/**
 * The frame around every page: sidebar on a laptop, a top bar and a tab bar
 * on a phone, and the eyebrow-plus-sentence header each page opens with.
 */

import type { ReactNode } from "react";
import { setWhoAction, signOutAction } from "../actions";
import { TEAM } from "@/lib/ads/who";
import type { Venue } from "@/lib/ads/venues";
import { ADMIN } from "./types";
import { bebas, eyebrowClass, headlineClass } from "./ui";

/* ---------------------------------- icons --------------------------------- */

const PATHS: Record<string, string> = {
  today: '<rect x="3" y="4" width="18" height="17"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  pipeline: '<path d="M4 4h16l-6 8v6l-4 2v-8z"/>',
  advertisers: '<rect x="2" y="4" width="20" height="13"/><path d="M8 21h8M12 17v4"/>',
  payments: '<rect x="2" y="5" width="20" height="14"/><path d="M2 10h20M6 15h4"/>',
  artwork: '<rect x="3" y="3" width="18" height="18"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="8" r="1.5"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v7h-4"/>',
  reports: '<path d="M6 2h9l5 5v15H6z"/><path d="M9 13h6M9 17h6M9 9h2"/>',
  flyers: '<path d="M4 3h12l4 4v14H4z"/><path d="M8 12h8M8 16h5"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  setup: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  books: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  ledger: '<rect x="4" y="3" width="16" height="18"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  receipts: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  recurring: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  clients: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 20h6a5 5 0 0 0-4-4.9"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  vault: '<rect x="3" y="4" width="18" height="16"/><circle cx="12" cy="12" r="4"/><path d="M12 10v2l1.5 1.5M3 8h2M3 16h2"/>',
  company: '<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5M9 10h2M13 10h2M9 14h2M13 14h2"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/>',
  lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  out: '<path d="M10 4H4v16h6M15 8l5 4-5 4M20 12H9"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
};

export function Icon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      dangerouslySetInnerHTML={{ __html: PATHS[name] ?? "" }}
    />
  );
}

/* ----------------------------------- nav ---------------------------------- */

export type NavKey =
  | "today"
  | "pipeline"
  | "advertisers"
  | "payments"
  | "artwork"
  | "qr"
  | "reports"
  | "flyers"
  | "history"
  | "setup"
  | "more"
  | "books"
  | "ledger"
  | "receipts"
  | "recurring"
  | "clients"
  | "vault"
  | "company"
  | "stripe";

export type NavCount = { value: number; hot?: boolean } | { soon: true };

export const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "today", label: "Today", href: ADMIN },
  { key: "pipeline", label: "Pipeline", href: `${ADMIN}/pipeline` },
  { key: "advertisers", label: "Advertisers", href: `${ADMIN}/advertisers` },
  { key: "payments", label: "Payments", href: `${ADMIN}/payments` },
  { key: "artwork", label: "Artwork", href: `${ADMIN}/artwork` },
  { key: "qr", label: "QR codes", href: `${ADMIN}/qr` },
  { key: "reports", label: "Reports", href: `${ADMIN}/reports` },
  { key: "flyers", label: "Flyers", href: `${ADMIN}/flyers` },
];

/** The books: the whole LLC's money, not just the screens. Its own group in the sidebar. */
export const NAV_BOOKS: { key: NavKey; label: string; href: string }[] = [
  { key: "books", label: "Books", href: `${ADMIN}/books` },
  { key: "ledger", label: "Ledger", href: `${ADMIN}/books/ledger` },
  { key: "receipts", label: "Receipts", href: `${ADMIN}/books/receipts` },
  { key: "recurring", label: "Bills", href: `${ADMIN}/books/recurring` },
  { key: "clients", label: "Clients", href: `${ADMIN}/books/clients` },
  { key: "stripe", label: "Stripe", href: `${ADMIN}/books/stripe` },
  { key: "vault", label: "Vault", href: `${ADMIN}/books/vault` },
  { key: "company", label: "Company", href: `${ADMIN}/books/company` },
];

export const BOOKS_KEYS: NavKey[] = NAV_BOOKS.map((n) => n.key);

export const NAV_SECONDARY: { key: NavKey; label: string; href: string }[] = [
  { key: "history", label: "History", href: `${ADMIN}/history` },
  { key: "setup", label: "Setup", href: `${ADMIN}/setup` },
];

/** The red mark cropped out of the official logo, wordmark beside it. */
export function Logo({ size = 40, wordmark = true }: { size?: number; wordmark?: boolean }) {
  const img = size * 2;
  return (
    <a href={ADMIN} className="flex items-center gap-3" aria-label="Smart Scale Ad Ops">
      <span className="relative block overflow-hidden shrink-0" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/smart-scale-logo-official.png"
          alt=""
          width={img}
          height={img}
          className="absolute max-w-none"
          style={{ width: img, height: img, left: -Math.round(img * 0.255), top: -Math.round(img * 0.1) }}
        />
      </span>
      {wordmark && (
        <span className={`${bebas} text-white leading-[0.92]`} style={{ fontSize: Math.round(size * 0.62) }}>
          Smart
          <br />
          Scale
        </span>
      )}
    </a>
  );
}

function CountBadge({ count, on }: { count?: NavCount; on: boolean }) {
  if (!count) return null;
  if ("soon" in count) {
    return <span className="ml-auto border border-white/[0.12] px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-white/40">SOON</span>;
  }
  if (count.value <= 0) return null;
  return (
    <span
      className={`ml-auto font-sans tracking-normal text-[11px] leading-none px-1.5 py-[3px] border tabular-nums ${
        count.hot ? "border-[#DC2626] bg-[#DC2626] text-white" : on ? "border-white/30 text-white" : "border-white/[0.12] text-white/50"
      }`}
    >
      {count.value}
    </span>
  );
}

function NavItem({
  item,
  active,
  count,
}: {
  item: { key: NavKey; label: string; href: string };
  active: NavKey;
  count?: NavCount;
}) {
  const on = item.key === active;
  return (
    <a
      href={item.href}
      aria-current={on ? "page" : undefined}
      className={`${bebas} flex items-center gap-3 px-3.5 py-3 text-[13px] tracking-[0.22em] border-l-2 transition-colors ${
        on ? "text-white bg-white/[0.04] border-[#DC2626]" : "text-white/55 border-transparent hover:text-white hover:bg-white/[0.03]"
      }`}
    >
      <Icon name={item.key} />
      <span>{item.label}</span>
      <CountBadge count={count} on={on} />
    </a>
  );
}

function WhoPicker({ who, returnTo }: { who: string; returnTo: string }) {
  return (
    <form action={setWhoAction} className="flex items-center gap-1">
      <input type="hidden" name="returnTo" value={returnTo} />
      {TEAM.map((name) => (
        <button
          key={name}
          type="submit"
          name="who"
          value={name}
          aria-pressed={who === name}
          className={`${bebas} px-2.5 py-1.5 text-[11px] tracking-[0.2em] border transition-colors ${
            who === name ? "border-white text-white" : "border-white/[0.12] text-white/45 hover:text-white hover:border-white/40"
          }`}
        >
          {name}
        </button>
      ))}
    </form>
  );
}

export function Sidebar({
  active,
  counts,
  venue,
  who,
  returnTo,
}: {
  active: NavKey;
  counts: Partial<Record<NavKey, NavCount>>;
  venue: Venue;
  who: string;
  returnTo: string;
}) {
  return (
    <aside
      // The site scrolls through Lenis, which swallows the wheel over nested
      // scroll boxes unless told to leave one alone.
      data-lenis-prevent
      className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0F0F0F] sticky top-0 h-screen overflow-y-auto"
    >
      <div className="px-6 pt-7 pb-5 border-b border-white/[0.07] flex flex-col gap-4">
        <Logo size={42} />
        <div>
          <p className={eyebrowClass}>Ad Ops</p>
          <p className="text-xs text-white/40 mt-0.5">Screen advertising</p>
        </div>
        <div
          className="flex items-center justify-between gap-3 border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-xs text-white"
          title="A second location will appear here when it signs"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Icon name="pin" size={14} className="text-[#DC2626] shrink-0" />
            <span className="truncate">{venue.name}</span>
          </span>
          <Icon name="down" size={14} className="text-white/40 shrink-0" />
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {NAV.map((item) => (
          <NavItem key={item.key} item={item} active={active} count={counts[item.key]} />
        ))}
        <p className={`${bebas} text-[11px] tracking-[0.24em] text-white/30 px-3.5 pt-5 pb-1.5`}>Books · Smart Scale LLC</p>
        {NAV_BOOKS.map((item) => (
          <NavItem key={item.key} item={item} active={active} count={counts[item.key]} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.07] flex flex-col gap-0.5">
        {NAV_SECONDARY.map((item) => (
          <NavItem key={item.key} item={item} active={active} count={counts[item.key]} />
        ))}
      </div>

      <div className="px-6 pt-5 pb-6 border-t border-white/[0.07] flex flex-col gap-4">
        <div>
          <p className={`${bebas} text-[11px] tracking-[0.24em] text-white/40 mb-2`}>Who is this</p>
          <WhoPicker who={who} returnTo={returnTo} />
          {!who && <p className="mt-2 text-[11px] text-white/30 leading-snug">Pick a name so the history says who did what.</p>}
        </div>
        <div className="flex flex-col gap-2 text-xs text-white/55">
          <a href="/" className="flex items-center gap-2 hover:text-white transition-colors">
            <Icon name="ext" size={13} /> View smartscaleagent.com
          </a>
          <form action={signOutAction}>
            <button type="submit" className="flex items-center gap-2 hover:text-white transition-colors">
              <Icon name="out" size={13} /> Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

/** The phone header: logo and the location. */
export function MobileTop({ venue, who, returnTo }: { venue: Venue; who: string; returnTo: string }) {
  return (
    <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#0A0A0A]/90 backdrop-blur-xl">
      <Logo size={30} />
      <div className="flex items-center gap-2">
        <WhoPicker who={who} returnTo={returnTo} />
        <span className="hidden sm:flex items-center gap-2 border border-white/[0.12] px-2.5 py-1.5 text-[11px] text-white">
          <Icon name="pin" size={12} className="text-[#DC2626]" />
          {venue.name}
        </span>
      </div>
    </div>
  );
}

const MOBILE_TABS: { key: NavKey; label: string; href: string }[] = [
  { key: "today", label: "Today", href: ADMIN },
  { key: "pipeline", label: "Pipeline", href: `${ADMIN}/pipeline` },
  { key: "advertisers", label: "Clients", href: `${ADMIN}/advertisers` },
  { key: "payments", label: "Ads $", href: `${ADMIN}/payments` },
  { key: "books", label: "Books", href: `${ADMIN}/books` },
  { key: "more", label: "More", href: `${ADMIN}/more` },
];

const MORE_KEYS: NavKey[] = ["artwork", "qr", "reports", "flyers", "history", "setup", "more"];

/** The phone tab bar. Every Books page lights the Books tab. */
export function MobileTabs({ active, counts }: { active: NavKey; counts: Partial<Record<NavKey, NavCount>> }) {
  const current = MORE_KEYS.includes(active) ? "more" : BOOKS_KEYS.includes(active) ? "books" : active;
  return (
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-30 flex border-t border-white/[0.08] bg-[#0F0F0F] pb-[env(safe-area-inset-bottom)]">
      {MOBILE_TABS.map((tab) => {
        const on = tab.key === current;
        const count = counts[tab.key];
        const hot = count && "value" in count && count.hot && count.value > 0;
        return (
          <a
            key={tab.key}
            href={tab.href}
            aria-current={on ? "page" : undefined}
            className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[56px] ${on ? "text-white" : "text-white/40"}`}
          >
            <Icon name={tab.key} size={20} />
            <span className={`${bebas} text-[10px] tracking-[0.18em]`}>{tab.label}</span>
            {hot && <span className="absolute top-2 right-[calc(50%-14px)] h-1.5 w-1.5 rounded-full bg-[#DC2626]" />}
          </a>
        );
      })}
    </nav>
  );
}

/* --------------------------------- header --------------------------------- */

/** Eyebrow, one sentence, and at most one or two actions on the right. */
export function PageHeader({
  eyebrow,
  title,
  action,
  className = "",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 ${className}`}>
      <div className="flex flex-col gap-2.5 min-w-0">
        <p className={eyebrowClass}>{eyebrow}</p>
        <h1 className={headlineClass}>{title}</h1>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

/** Film grain over everything, like the site. */
export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.045] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
