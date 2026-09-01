/**
 * The one-line result of the last action. Server actions redirect back with
 * `?msg=` or `?err=`, so this is the only feedback channel the page has.
 */

const notices = (
  sent?: string,
  checked?: string,
  detail?: string,
): Record<string, string> => ({
  added: "Advertiser added.",
  addedWithCode: `Advertiser added, and their QR code is live at /go/${detail}. Download the artwork on the QR codes tab.`,
  addedNoCode: "Advertiser added, but their QR code couldn't be created. Make it on the QR codes tab.",
  updated: "Changes saved.",
  removed: "Advertiser removed.",
  prospect: "Added to the pipeline.",
  prospectEdited: "Their details are updated.",
  prospectUpdated: "Update logged.",
  prospectRemoved: "Removed from the pipeline.",
  removedBackToList:
    "Advertiser removed. They came from the prospect list, so they've gone back on it as hot rather than being left pointing at a record that no longer exists.",
  replyCleared: "Reply cleared.",
  linkAdded: "QR code created — download the artwork below.",
  linkSaved: "QR code updated.",
  linkOn: "QR code switched back on.",
  linkOff: "QR code retired. Scans now land on the advertise page.",
  testsExcluded:
    Number(sent ?? 0) === 0
      ? "Nothing to hold back — that code hasn't been scanned yet."
      : `${sent} scan${sent === "1" ? "" : "s"} held back as testing. They stay in the database and are left out of every report from here on.`,
  testsRestored: "Test scans put back. Every scan on that code counts again.",
  reportsDrafted:
    Number(sent ?? 0) === 0
      ? "No new reports to draft."
      : `Drafted ${sent} report${sent === "1" ? "" : "s"} for review.`,
  reportSent: "Report sent.",
  reportSkipped: "Report skipped — it won't be sent.",
  reportEdited: "Report wording updated.",
  reportRecalculated:
    "Figures rebuilt from the roster and the scans recorded so far.",
  reportRecalculatedRewritten:
    "Figures rebuilt — and the wording was replaced with a plain summary, because it quoted numbers the corrected figures no longer support. Read it before sending.",
  reportAlreadyRight: "Already up to date — the figures still match the roster.",
  reportDeleted: "Draft removed.",
  testSent: `Test sent to ${detail}${sent ? ` — ${sent}` : ""}. If it doesn't arrive within a minute: check spam, then open Plunk's own log and find that address. Plunk accepting it and Plunk delivering it are two different things, and its log is the only place that tells them apart.`,
  backupDone: `Backed up — ${detail}.`,
  venueSaved: "Saved. It applies to statements from here on — never to one already issued.",
  alerts:
    Number(checked ?? 0) === 0
      ? "Renewal check ran — nothing due today."
      : `Renewal check ran — ${sent ?? 0} of ${checked} notice${checked === "1" ? "" : "s"} sent.`,
});

const errors = (clash?: string, detail?: string): Record<string, string> => ({
  badkey: "That access key didn't work.",
  business: "Business name is required.",
  plan: "Pick a package.",
  startdate: "Start date is required.",
  category: `${clash ?? "Another advertiser"} already owns that category. End their run first, or use a different category.`,
  save: "Could not write to the database. Check that Upstash is connected, then try again.",
  missing: "Nothing to remove.",
  prospectmissing: "That prospect isn't on the list any more.",
  followupdate: "That follow-up date didn't make sense. Pick one from the calendar.",
  emptyupdate:
    "Nothing to log — say what happened, move them along, or set a date to come back to them.",
  code: detail ?? "That code isn't valid.",
  destination: detail ?? "That web address isn't valid.",
  codetaken: `"${detail}" is already in use. Codes can never be reassigned — pick a different one.`,
  codemissing: `There's no QR code named "${detail}".`,
  logotype: "Logos must be a PNG, JPEG, WebP or SVG.",
  logosize: "That logo is over 200KB. Export a smaller version and try again.",
  reportsend: detail ?? "Could not send that report.",
  reportfigures: detail ?? "Could not update that report.",
  testaddress: "That doesn't look like an email address.",
  testunconfigured:
    "Email isn't connected yet, so there's nothing to test. Finish the Advertiser email steps first.",
  testsend: `${detail} — most often the sending domain isn't verified yet, the from-address isn't on the verified domain, or the key is the public pk_ one instead of the secret sk_ key.`,
  backupoff: "No file storage connected, so there's nowhere to put a backup.",
  backupfailed: detail ?? "The backup didn't write.",
  sharepercent: "The share has to be a number between 0 and 100. Leave it blank to clear the split.",
  dealnote: "Say why this client isn't on list price — future you will want to know.",
  dealnumber: `"${detail}" isn't a number I can use. Enter the amount in dollars, like 275.`,
  dealmonths: "A custom term has to be at least one whole month.",
});

export function Banner({
  msg,
  err,
  clash,
  sent,
  checked,
  detail,
}: {
  msg?: string;
  err?: string;
  clash?: string;
  sent?: string;
  checked?: string;
  detail?: string;
}) {
  const text = err
    ? errors(clash, detail)[err]
    : msg
      ? notices(sent, checked, detail)[msg]
      : undefined;
  if (!text) return null;

  return (
    <div
      role="status"
      className={`rounded-2xl px-5 py-3.5 mb-6 text-sm border ${
        err
          ? "border-[#DC2626]/30 bg-[#DC2626]/[0.08] text-[#f87171]"
          : "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300"
      }`}
    >
      {text}
    </div>
  );
}
