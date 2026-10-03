import type { Metadata } from "next";
import { getWbSettings, listSuppressedEmails } from "@/lib/wb/store";
import { PageHeader } from "../../../_components/shell";
import { SubmitButton } from "../../../_components/submit-button";
import { Card, Empty, Field, Note, btnPrimary, stamp } from "../../../_components/ui";
import { Shell } from "../../shell";
import { saveWbSettingsAction } from "../actions";

export const metadata: Metadata = { title: "Website Business settings" };

/**
 * The two values the free website check needs a person to set, and the list
 * of addresses that asked not to be written to. The mailing settings join
 * these when the postcard pipeline is built.
 */
export default async function WebsiteBusinessSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [params, settings, suppressed] = await Promise.all([searchParams, getWbSettings(), listSuppressedEmails()]);

  return (
    <Shell active="wbsettings" banner={params}>
      <PageHeader eyebrow="Website Business · Settings" title="What the check needs from you." />

      <div className="flex flex-col gap-5 max-w-3xl">
        {!settings.postalAddress && (
          <Note tone="warn">
            <p className="text-sm font-semibold text-white">No postal address yet, so emails to business owners are held.</p>
            <p className="mt-1.5 text-sm text-white/60">
              The law requires a postal address in every commercial email. Until one is saved here, reports only go to the team&apos;s own
              addresses, and each held email is noted on its lead.
            </p>
          </Note>
        )}

        <Card title="Emails and the scanner">
          <form action={saveWbSettingsAction} className="flex flex-col gap-5">
            <Field
              label="Postal address for emails"
              name="postalAddress"
              defaultValue={settings.postalAddress}
              placeholder="PO Box 123, Katy, TX 77494"
              hint="Printed at the foot of every email to a business owner. A PO box or private mailbox is fine."
            />
            <label className="flex items-start gap-3 text-sm text-white/85">
              <input type="checkbox" name="scannerPaused" defaultChecked={settings.scannerPaused} className="mt-1 h-4 w-4 accent-[#DC2626]" />
              <span>
                Pause the public scanner
                <span className="block mt-1 text-xs text-white/40 leading-snug">
                  Visitors can still submit the form. They are told we will check their site by hand, and each one is recorded as a lead.
                </span>
              </span>
            </label>
            <div>
              <SubmitButton className={btnPrimary} pendingLabel="Saving…">
                Save settings
              </SubmitButton>
            </div>
          </form>
          {settings.updatedAt && <p className="mt-4 text-xs text-white/35">Last saved {stamp(settings.updatedAt)}.</p>}
        </Card>

        <Card title="Do not email" lede="Addresses that unsubscribed. Nothing is sent to these again, and the system never removes one.">
          {suppressed.length === 0 ? (
            <Empty>Nobody has unsubscribed.</Empty>
          ) : (
            <ul>
              {suppressed.map((entry) => (
                <li key={entry.email} className="flex flex-col gap-1 py-3 border-b border-white/[0.06] last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-white/85 break-all">{entry.email}</span>
                  <span className="text-xs text-white/40">
                    {entry.reason}
                    {entry.at ? ` · ${stamp(entry.at)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
