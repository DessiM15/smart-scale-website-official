import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cachedPasskeys } from "@/lib/ads/cached";
import { booksAccess } from "@/lib/books/passkeys";
import { PasskeyUnlock } from "../../../_components/passkey-unlock";
import { Icon, PageHeader } from "../../../_components/shell";
import { Card, bebas, linkLine } from "../../../_components/ui";
import { Shell } from "../../shell";

export const metadata: Metadata = { title: "Unlock the books" };

const BOOKS = "/advertise/admin/books";

/** The door. One tap on a device that holds a passkey. */
export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ to?: string; msg?: string; err?: string }> }) {
  const [params, access, passkeys] = await Promise.all([searchParams, booksAccess(), cachedPasskeys()]);
  const to = params.to && params.to.startsWith(BOOKS) && !params.to.includes("//") ? params.to : BOOKS;
  if (access.ok) redirect(to);

  const people = [...new Set(passkeys.map((p) => p.who))];

  return (
    <Shell active="books" banner={params}>
      <PageHeader eyebrow="Books · locked" title="The books open with a passkey." />
      <div className="max-w-xl">
        <Card>
          <div className="flex items-start gap-4">
            <Icon name="lock" size={28} className="text-[#DC2626] shrink-0 mt-1" />
            <div className="flex flex-col gap-4 min-w-0">
              <p className="text-sm text-white/70 leading-relaxed">
                {people.length ? `Enrolled: ${people.join(" and ")}.` : ""} Face ID or a fingerprint on a phone that has one, or the laptop&apos;s own prompt.
                A session lasts a day.
              </p>
              <PasskeyUnlock to={to} />
              <p className={`${bebas} text-[11px] tracking-[0.2em] text-white/30`}>
                New phone, or no passkey yet?{" "}
                <a href={`${BOOKS}/passkeys`} className={linkLine}>
                  Add one
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
