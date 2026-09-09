import type { ReactNode } from "react";
import { currentWho } from "@/lib/ads/who";
import { venueOf } from "@/lib/ads/venues";
import { isRedisConfigured, isRedisReachable } from "@/lib/ads/redis";
import { MobileTabs, MobileTop, Sidebar, type NavKey } from "../_components/shell";
import { Banner, type BannerParams } from "../_components/banner";
import { Note } from "../_components/ui";
import { navCounts } from "./nav-counts";
import { NAV, NAV_SECONDARY } from "../_components/shell";

function DatabaseWarning({ reachable }: { reachable: boolean }) {
  if (!isRedisConfigured()) {
    return (
      <div className="mb-6">
        <Note tone="warn">
          <p className="text-sm font-semibold text-white">No database connected. Nothing you enter here will save.</p>
          <p className="mt-1.5 text-sm text-white/55">
            In Vercel: Storage, Create Database, Upstash Redis. Connect it to this project, then redeploy.
          </p>
        </Note>
      </div>
    );
  }
  if (reachable) return null;
  return (
    <div className="mb-6">
      <Note tone="bad">
        <p className="text-sm font-semibold text-white">
          The database is configured but isn&apos;t responding. Nothing will save.
        </p>
        <p className="mt-1.5 text-sm text-white/55">
          Usually the token was rotated in Upstash while Vercel still has the old one. Check{" "}
          <code className="font-mono text-xs text-white/75">KV_REST_API_TOKEN</code> matches, then redeploy.
        </p>
      </Note>
    </div>
  );
}

/** The path of a nav item, for the who-picker to come back to. */
function pathFor(active: NavKey): string {
  return [...NAV, ...NAV_SECONDARY].find((n) => n.key === active)?.href ?? "/advertise/admin";
}

/**
 * Sidebar, phone bars, database warning and the result banner around a page.
 *
 * The counts come from the same memoised reads the page makes, so wrapping a
 * page in this costs no extra trips to the database.
 */
export async function Shell({
  active,
  banner,
  children,
}: {
  active: NavKey;
  banner?: BannerParams;
  children: ReactNode;
}) {
  const [who, counts, reachable] = await Promise.all([currentWho(), navCounts(), isRedisReachable()]);
  const venue = venueOf();
  const returnTo = pathFor(active);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar active={active} counts={counts} venue={venue} who={who} returnTo={returnTo} />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTop venue={venue} who={who} returnTo={returnTo} />
        <main className="flex-1 w-full max-w-[1200px] px-4 sm:px-8 lg:px-12 pt-7 sm:pt-10 pb-28 lg:pb-16">
          <DatabaseWarning reachable={reachable} />
          {banner && <Banner {...banner} />}
          {children}
        </main>
      </div>
      <MobileTabs active={active} counts={counts} />
    </div>
  );
}
