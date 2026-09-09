import type { Metadata } from "next";
import { signOutAction } from "../../actions";
import { Icon, NAV, NAV_SECONDARY, PageHeader } from "../../_components/shell";
import { bebas, cardClass } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "More" };

/** The rest of the navigation, for the phone tab bar's fifth tab. */
export default async function MorePage() {
  const items = [...NAV.filter((n) => !["today", "pipeline", "advertisers", "payments"].includes(n.key)), ...NAV_SECONDARY];
  return (
    <Shell active="more">
      <PageHeader eyebrow="More" title="Everything else." />
      <ul className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <li key={item.key}>
            <a href={item.href} className={`${cardClass} flex items-center gap-4 px-5 py-4 hover:bg-white/[0.05] transition-colors`}>
              <Icon name={item.key} size={20} className="text-[#DC2626]" />
              <span className={`${bebas} text-[14px] tracking-[0.22em] text-white`}>{item.label}</span>
            </a>
          </li>
        ))}
        <li>
          <form action={signOutAction}>
            <button type="submit" className={`${cardClass} w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.05] transition-colors text-left`}>
              <Icon name="out" size={20} className="text-white/50" />
              <span className={`${bebas} text-[14px] tracking-[0.22em] text-white/70`}>Sign out</span>
            </button>
          </form>
        </li>
      </ul>
    </Shell>
  );
}
