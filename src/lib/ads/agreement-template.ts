/**
 * The advertising agreement, as text.
 *
 * Versioned, and the version is recorded on every signed copy. That is the
 * whole point: a client who signed in March signed *these* words, and changing
 * the wording later must never quietly change what they agreed to. Bump
 * TEMPLATE_VERSION whenever a clause changes; never edit a released version in
 * place.
 *
 * The terms below are a working draft written from how the business actually
 * runs. They are not legal advice and have not been reviewed by a lawyer. The
 * portal says so on the Documents card until the version is marked reviewed.
 */

import { formatDate } from "./roster";

/** Bump on any wording change. Recorded on every signature. */
export const TEMPLATE_VERSION = "v0-draft";

/**
 * Whether this version has been read and approved by the business. While false
 * the portal warns before sending. Flip it once the real terms are in.
 */
export const TEMPLATE_REVIEWED = false;

/** Everything the agreement needs to know, frozen at the moment it is prepared. */
export type AgreementTerms = {
  business: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  planName: string;
  monthly: number;
  setup: number;
  months: number;
  startDate: string;
  endDate: string;
  /** Set when the client is on a rate of their own, so the paper says why. */
  dealNote: string;
};

export type Clause = { heading: string; body: string[] };

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/** The venue and the rotation, stated once so every clause can refer to it. */
export const VENUE = "Mex Taco House";
export const PROVIDER = "Smart Scale";
export const GOVERNING_STATE = "Texas";

export function agreementTitle(terms: AgreementTerms): string {
  return `Screen Advertising Agreement — ${terms.business}`;
}

/**
 * The agreement as an ordered list of clauses. Rendered to HTML for the screen
 * and to plain text for the hash, from this one source, so the thing that gets
 * hashed is always the thing that was read.
 */
export function agreementClauses(terms: AgreementTerms): Clause[] {
  const total = terms.monthly * terms.months + terms.setup;

  return [
    {
      heading: "The parties",
      body: [
        `This agreement is between ${PROVIDER}, which manages screen advertising at ${VENUE}, and ${terms.business} ("the advertiser"), represented by ${terms.contactName || "the signer named below"}.`,
      ],
    },
    {
      heading: "What the advertiser gets",
      body: [
        `One advertising slide in the rotation shown on the dining-room screens at ${VENUE} during opening hours.`,
        `The slide appears in a continuous loop for the whole of the term below, every day the restaurant is open.`,
        `A tracked QR code, so scans of the advertiser's code can be counted and reported.`,
        `A report each month showing scans and how often the slide played.`,
      ],
    },
    {
      heading: "Category exclusivity",
      body: [
        terms.category
          ? `For the length of this term, ${terms.business} is the only ${terms.category} business in the rotation. ${PROVIDER} will not sell a slide to another ${terms.category} business while this agreement is in force.`
          : `Exclusivity applies to the advertiser's category once that category is agreed in writing.`,
        `Exclusivity ends when the term ends. If the advertiser does not renew before the end date, the category returns to the market and may be sold to another business.`,
      ],
    },
    {
      heading: "Term",
      body: [
        `This agreement runs for ${terms.months} month${terms.months === 1 ? "" : "s"}, from ${formatDate(terms.startDate)} to ${formatDate(terms.endDate)}.`,
        `It does not renew automatically. ${PROVIDER} will contact the advertiser before the end date so they can decide whether to continue.`,
      ],
    },
    {
      heading: "What it costs",
      body: [
        terms.monthly > 0
          ? `${money(terms.monthly)} per month${terms.setup > 0 ? `, plus a one-time setup fee of ${money(terms.setup)}` : ", with no setup fee"}.`
          : `No charge for this term${terms.setup > 0 ? `, other than a one-time setup fee of ${money(terms.setup)}` : ""}.`,
        `Total for the full term: ${money(total)}.`,
        `Invoices are issued monthly and are due on receipt unless agreed otherwise in writing.`,
        ...(terms.dealNote
          ? [`This rate is specific to this advertiser: ${terms.dealNote}. It is not a published price and does not carry over to a renewal unless agreed again.`]
          : []),
      ],
    },
    {
      heading: "Artwork",
      body: [
        `The advertiser may supply their own slide, or ask ${PROVIDER} to design one.`,
        `The advertiser confirms they have the right to use every logo, image and claim in their slide, and that its contents are accurate and lawful.`,
        `Artwork can be changed during the term at no cost. Changes go live once ${PROVIDER} has loaded the new slide.`,
        `${PROVIDER} and ${VENUE} may decline artwork that is unlawful, misleading, or unsuitable for a family restaurant, and will say why and give the advertiser a chance to replace it.`,
      ],
    },
    {
      heading: "If something goes wrong with the screens",
      body: [
        `Screens occasionally fail, and the restaurant may close for holidays, repairs or reasons outside anyone's control.`,
        `If the rotation is down for more than seven days in a row, the advertiser's term is extended by the number of days lost, at no charge. That extension is the remedy for downtime.`,
      ],
    },
    {
      heading: "What is not promised",
      body: [
        `${PROVIDER} reports what can be measured — how often the slide played, and how many times the QR code was scanned. Those are the figures in the monthly report.`,
        `No particular number of customers, calls, sales or scans is promised, and none can be. Advertising is not a guaranteed outcome, and nothing said in conversation changes that.`,
      ],
    },
    {
      heading: "Ending early",
      body: [
        `Either side may end this agreement early with 30 days' written notice, including by email.`,
        `If the advertiser ends early, months already run remain payable and the setup fee is not refundable. Nothing further is owed for the remaining months.`,
        `If ${PROVIDER} ends early for any reason other than a breach by the advertiser, any amount paid for months not yet run is refunded.`,
        `${PROVIDER} may suspend a slide if an invoice is more than 30 days late, and will give notice before doing so.`,
      ],
    },
    {
      heading: "Limits",
      body: [
        `Neither side is liable to the other for indirect or consequential losses, including lost profits.`,
        `${PROVIDER}'s total liability under this agreement is limited to the amount the advertiser has paid under it.`,
      ],
    },
    {
      heading: "The rest",
      body: [
        `This is the whole agreement between the parties about screen advertising at ${VENUE}, and replaces anything discussed beforehand.`,
        `Changes must be agreed in writing by both sides.`,
        `This agreement is governed by the laws of the State of ${GOVERNING_STATE}.`,
        `Signing electronically — typing a name and confirming below — has the same effect as signing on paper, and both sides agree to do business that way.`,
      ],
    },
  ];
}

/**
 * The exact plain text of the agreement. This is what gets hashed, so it must
 * be built from the same clauses that are shown on screen and must not include
 * anything that varies between renders — no timestamps, no generated ids.
 */
export function agreementText(terms: AgreementTerms): string {
  const lines = [
    agreementTitle(terms).toUpperCase(),
    `Template ${TEMPLATE_VERSION}`,
    "",
  ];

  agreementClauses(terms).forEach((clause, i) => {
    lines.push(`${i + 1}. ${clause.heading.toUpperCase()}`);
    clause.body.forEach((paragraph) => lines.push(`   ${paragraph}`));
    lines.push("");
  });

  return lines.join("\n").trimEnd();
}
