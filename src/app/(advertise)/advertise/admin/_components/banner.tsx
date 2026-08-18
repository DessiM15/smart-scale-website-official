/**
 * The one-line result of the last action. Server actions redirect back with
 * `?msg=` or `?err=`, so this is the only feedback channel the page has.
 */

const notices = (sent?: string, checked?: string): Record<string, string> => ({
  added: "Advertiser added.",
  updated: "Changes saved.",
  removed: "Advertiser removed.",
  prospect: "Saved to the interested list.",
  prospectRemoved: "Removed from the interested list.",
  replyCleared: "Reply cleared.",
  linkAdded: "QR code created — download the artwork below.",
  linkSaved: "QR code updated.",
  linkOn: "QR code switched back on.",
  linkOff: "QR code retired. Scans now land on the advertise page.",
  reportsDrafted:
    Number(sent ?? 0) === 0
      ? "No new reports to draft."
      : `Drafted ${sent} report${sent === "1" ? "" : "s"} for review.`,
  reportSent: "Report sent.",
  reportSkipped: "Report skipped — it won't be sent.",
  reportEdited: "Report wording updated.",
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
  code: detail ?? "That code isn't valid.",
  destination: detail ?? "That web address isn't valid.",
  codetaken: `"${detail}" is already in use. Codes can never be reassigned — pick a different one.`,
  codemissing: `There's no QR code named "${detail}".`,
  logotype: "Logos must be a PNG, JPEG, WebP or SVG.",
  logosize: "That logo is over 200KB. Export a smaller version and try again.",
  reportsend: detail ?? "Could not send that report.",
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
      ? notices(sent, checked)[msg]
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
