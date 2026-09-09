/**
 * The one-line result of the last action. Server actions redirect back with
 * `?msg=` or `?err=`, so this is the feedback channel every page has.
 */

import { bebas } from "./ui";

const notices = (
  sent?: string,
  checked?: string,
  detail?: string,
): Record<string, string> => ({
  added: "Advertiser added.",
  addedWithCode: `Advertiser added, and their QR code is live at /go/${detail}. Download the artwork on the QR codes page.`,
  addedNoCode: "Advertiser added, but their QR code couldn't be created. Make it on the QR codes page.",
  updated: "Changes saved.",
  removed: "Advertiser removed.",
  prospect: "Added to the pipeline.",
  prospectEdited: "Their details are updated.",
  prospectUpdated: "Update logged.",
  prospectRemoved: "Removed from the pipeline.",
  removedBackToList:
    "Advertiser removed. They came from the prospect list, so they've gone back on it as hot rather than being left pointing at a record that no longer exists.",
  replyCleared: "Reply cleared.",
  linkAdded: "QR code created. Download the artwork below.",
  linkSaved: "QR code updated.",
  linkOn: "QR code switched back on.",
  linkOff: "QR code retired. Scans now land on the advertise page.",
  testsExcluded:
    Number(sent ?? 0) === 0
      ? "Nothing to hold back. That code hasn't been scanned yet."
      : `${sent} scan${sent === "1" ? "" : "s"} held back as testing. They stay in the database and are left out of every report from here on.`,
  testsRestored: "Test scans put back. Every scan on that code counts again.",
  reportsDrafted:
    Number(sent ?? 0) === 0
      ? "No new reports to draft."
      : `Drafted ${sent} report${sent === "1" ? "" : "s"} for review.`,
  reportSent: "Report sent.",
  reportSkipped: "Report skipped. It won't be sent.",
  reportEdited: "Report wording updated.",
  reportRecalculated: "Figures rebuilt from the roster and the scans recorded so far.",
  reportRecalculatedRewritten:
    "Figures rebuilt, and the wording was replaced with a plain summary because it quoted numbers the corrected figures no longer support. Read it before sending.",
  reportAlreadyRight: "Already up to date. The figures still match the roster.",
  reportDeleted: "Draft removed.",
  testSent: `Test sent to ${detail}${sent ? ` (${sent})` : ""}. If it doesn't arrive within a minute, check spam, then the provider's own log. Accepted and delivered are two different things.`,
  backupDone: `Backed up: ${detail}.`,
  venueSaved: "Saved. It applies to statements from here on, never to one already issued.",
  alerts:
    Number(checked ?? 0) === 0
      ? "Renewal check ran. Nothing due today."
      : `Renewal check ran. ${sent ?? 0} of ${checked} notice${checked === "1" ? "" : "s"} sent.`,
  done: "Done. It's in the history.",
  undone: "Put back on the list.",
  taskAdded: "Added to the list.",
  taskDone: "Done. It's in the history.",
  taskRemoved: "Task removed.",
  paid: `Marked paid${detail ? `: ${detail}` : ""}.`,
  artworkStatus: `Artwork ${detail ?? "updated"}.`,
  whoSet: `Signed in as ${detail}.`,
  notesSaved: "Notes saved.",
  paymentRecorded: "Payment recorded.",
  paymentRemoved: "Payment removed.",
  agreementPrepared: "Agreement drafted. Read it through, then send it.",
  agreementFiled: "Signed agreement filed. This client's paperwork is covered.",
  documentSaved: "Document saved.",
  documentRemoved: "Document removed.",
  agreementSent: "Agreement sent.",
  agreementDone: "Countersigned. The paperwork is complete.",
  agreementVoided: "Agreement cancelled. It stays on file.",
  artworkSaved: "Artwork uploaded.",
  artworkRemoved: "Artwork removed.",
  entryAdded: `Logged${detail ? `: ${detail}` : ""}.`,
  entrySaved: "Entry updated.",
  entryRemoved: "Entry removed from the ledger.",
  receiptRead: "Photo kept and read. Check the numbers against it, then save.",
  receiptUnread: `Photo kept, but it couldn't be read${detail ? ` (${detail})` : ""}. Fill the form in by hand.`,
  receiptDuplicate: "That photo is already on file. Here it is.",
  receiptConfirmed: `Saved to the ledger${detail ? `: ${detail}` : ""}. The receipt is filed with it.`,
  receiptDiscarded: "Photo discarded.",
  receiptAttached: "Receipt attached.",
  noReceipt: "Noted. It won't ask again.",
  clientAdded: "Client added.",
  clientRemoved: "Client removed.",
  billAdded: "Bill added. It'll show on Today each month on its day.",
  billPaused: "Bill paused. It won't be expected until you switch it back on.",
  billResumed: "Bill switched back on.",
  billRemoved: "Bill removed.",
  billLogged: `Logged${detail ? `: ${detail}` : ""}.`,
  passkeyEnrolled: `Passkey added${detail ? `: ${detail}` : ""}. The books open with it from now on.`,
  passkeyRemoved: "Passkey removed.",
  passkeyRenamed: "Passkey renamed.",
  booksLocked: "Locked. Unlock with a passkey next time.",
  vaultSaved: `Sealed and filed${detail ? `: ${detail}` : ""}.`,
  vaultUpdated: "Document updated.",
  vaultRemoved: "Document removed.",
  companySaved: "Company details saved.",
  einSaved: "EIN sealed. It shows masked; reveal it when you need it.",
  filingAdded: "Filing added. It'll land on Today as the date approaches, every year.",
  filingRemoved: "Filing removed.",
  adPaymentsImported:
    Number(sent ?? 0) === 0
      ? "The ledger already has every ad payment."
      : `Brought ${sent} ad payment${sent === "1" ? "" : "s"} into the ledger.`,
});

const errors = (clash?: string, detail?: string): Record<string, string> => ({
  badkey: "That access key didn't work.",
  business: "Business name is required.",
  plan: "Pick a package.",
  startdate: "Start date is required.",
  category: `${clash ?? "Another advertiser"} already owns that category. End their run first, or use a different category.`,
  save: "Could not write to the database. Check that Upstash is connected, then try again.",
  missing: "Something didn't come through. Try that again.",
  prospectmissing: "That prospect isn't on the list any more.",
  followupdate: "That follow-up date didn't make sense. Pick one from the calendar.",
  emptyupdate: "Nothing to log. Say what happened, move them along, or set a date to come back to them.",
  code: detail ?? "That code isn't valid.",
  destination: detail ?? "That web address isn't valid.",
  codetaken: `"${detail}" is already in use. Codes can never be reassigned, so pick a different one.`,
  codemissing: `There's no QR code named "${detail}".`,
  logotype: "Logos must be a PNG, JPEG, WebP or SVG.",
  logosize: "That logo is over 200KB. Export a smaller version and try again.",
  reportsend: detail ?? "Could not send that report.",
  reportfigures: detail ?? "Could not update that report.",
  testaddress: "That doesn't look like an email address.",
  testunconfigured: "Email isn't connected yet, so there's nothing to test. Finish the Advertiser email steps first.",
  testsend: `${detail}. Most often the sending domain isn't verified yet, the from-address isn't on the verified domain, or the key is the wrong one.`,
  backupoff: "No file storage connected, so there's nowhere to put a backup.",
  backupfailed: detail ?? "The backup didn't write.",
  sharepercent: "The share has to be a number between 0 and 100. Leave it blank to clear the split.",
  dealnote: "Say why this client isn't on list price. Future you will want to know.",
  dealnumber: `"${detail}" isn't a number I can use. Enter the amount in dollars, like 275.`,
  dealmonths: "A custom term has to be at least one whole month.",
  slot: "A slot is a number from 1 to 16.",
  tasktitle: "Give the task a name.",
  taskdate: "That date didn't make sense.",
  who: "Pick Dessi or Jay.",
  amount: "How much? Enter an amount greater than zero.",
  artwork: "That artwork didn't upload.",
  artworkmissing: "Pick a file first.",
  agreementNoEmail: "This client has no email address, so there's nowhere to send it. Add one on their contract, or copy the signing link and send it yourself.",
  agreementNoMail: "Email isn't connected yet. Copy the signing link and send it however you like. The signing page works either way.",
  agreementNoSecret: "ADS_LINK_SECRET isn't set, so no signing link can be made. It's on the Setup page.",
  agreementSend: "The agreement didn't send.",
  agreementState: "That agreement isn't in a state where that's possible. Reload the page.",
  docmissing: "Pick a file first.",
  docupload: "That file didn't upload.",
  docsigneddate: "When was it signed? Give a date.",
  doccovers: "Which term does it cover? Give the end date.",
  docsigner: "Who signed it? A full name.",
  payment: detail ?? "That payment didn't record.",
  entry: detail ?? "That entry didn't save.",
  entrymissing: "That entry isn't in the ledger any more.",
  receipt: detail ?? "That photo didn't upload.",
  receiptmissing: "Take or pick a photo first.",
  receiptgone: "That receipt isn't there any more.",
  client: detail ?? "That client didn't save.",
  bill: detail ?? "That bill didn't save.",
  billmissing: "That bill isn't on the list any more.",
  locked: "The books are locked. Unlock them with a passkey first.",
  passkeymissing: "That passkey isn't enrolled any more.",
  lastpasskey: "That's the only passkey. Removing it would open the books to the shared key again; add another first if that's not what you want.",
  vault: detail ?? "That file didn't upload.",
  vaultmissing: "Pick a file first.",
  vaultgone: "That document isn't in the vault any more.",
  company: detail ?? "That didn't save.",
  ein: detail ?? "That EIN didn't save.",
  filing: detail ?? "That filing didn't save.",
});

export type BannerParams = {
  msg?: string;
  err?: string;
  clash?: string;
  sent?: string;
  checked?: string;
  detail?: string;
};

export function Banner({ msg, err, clash, sent, checked, detail }: BannerParams) {
  const text = err ? errors(clash, detail)[err] : msg ? notices(sent, checked, detail)[msg] : undefined;
  if (!text) return null;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 border px-5 py-3.5 mb-6 text-sm ${
        err ? "border-[#DC2626]/35 bg-[#DC2626]/[0.07] text-[#f87171]" : "border-[#7FBF8E]/30 bg-[#7FBF8E]/[0.06] text-[#7FBF8E]"
      }`}
    >
      <span className={`${bebas} text-[11px] tracking-[0.22em] mt-0.5 shrink-0`}>{err ? "Hmm" : "Done"}</span>
      <span className="text-white/85 leading-relaxed">{text}</span>
    </div>
  );
}
