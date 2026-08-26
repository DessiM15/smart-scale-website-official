/**
 * The Mex Taco House digital advertising agreement.
 *
 * This is Smart Scale's own wording, transcribed from the signed PDF used with
 * advertisers, with the deal-specific figures turned into fill-ins. It is not
 * drafted here and should not be redrafted here — if the business changes its
 * terms, the new text comes from the business.
 *
 * Versioned, and the version is recorded on every signature. That is the whole
 * point: a client who signs today signs *these* words, and changing the wording
 * later must never quietly change what they agreed to. Bump TEMPLATE_VERSION on
 * any wording change; never edit a released version in place.
 */

import { formatDate } from "./roster";

/** Bump on any wording change. Recorded on every signature. */
export const TEMPLATE_VERSION = "v1";

/**
 * Whether this version has been read against the source document.
 *
 * The wording is Smart Scale's own, but it was transcribed from a PDF, and a
 * transcription is exactly the kind of thing that looks right until the one
 * clause that matters is wrong. Flip this to true once a rendered agreement has
 * been read side by side with the original.
 */
export const TEMPLATE_REVIEWED = false;

/* -------------------------------- the parties ----------------------------- */

export const COMPANY = "Smart Scale LLC";
export const COMPANY_CITY = "Cypress, Texas";
export const COMPANY_SIGNATORIES = "Jay Maldonado & Dessiah Maldonado, Managing Members";

export const VENUE = "Mex Taco House";
export const VENUE_ADDRESS = "25410 B1 Northwest Fwy, Cypress, TX 77429";
export const GOVERNING_STATE = "Texas";
export const DISPUTE_VENUE = "Harris County, Texas";

/** How the advertiser pays. Set per client — it changes sections 1 and 3. */
export type PaymentType = "prepaid" | "monthly";

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
  /** Absent means monthly — the shape every plan in the price list takes. */
  paymentType?: PaymentType;
};

export type Clause = { heading: string; body: string[] };

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/** Everything the advertiser pays across the whole term. */
export function totalInvestment(terms: AgreementTerms): number {
  return terms.monthly * terms.months + terms.setup;
}

function paymentTypeOf(terms: AgreementTerms): PaymentType {
  return terms.paymentType ?? "monthly";
}

export function agreementTitle(terms: AgreementTerms): string {
  return `${VENUE} Digital Advertising Agreement — ${terms.business}`;
}

/** The red line under the title on the printed version. */
export function agreementSubtitle(terms: AgreementTerms): string {
  const parts = [
    `${terms.planName} Plan`,
    `${terms.months} Month${terms.months === 1 ? "" : "s"}`,
  ];
  if (terms.dealNote) parts.push("Promotional Rate");
  return parts.join(" · ");
}

/**
 * The agreement as an ordered list of clauses. Rendered to HTML for the screen
 * and to plain text for the hash from this one source, so the thing that gets
 * hashed is always the thing that was read.
 */
export function agreementClauses(terms: AgreementTerms): Clause[] {
  const total = totalInvestment(terms);
  const prepaid = paymentTypeOf(terms) === "prepaid";

  const investmentLine = prepaid
    ? `${money(total)} one-time, paid in full`
    : `${money(terms.monthly)} per month${terms.setup > 0 ? `, plus ${money(terms.setup)} setup` : ""} — ${money(total)} total`;

  const paymentBody = prepaid
    ? [
        `${money(total)} total for the full ${terms.months}-month term, paid one time and in full, due within three (3) days of signing. A Stripe payment link will be sent directly to Advertiser upon signing. No automatic renewal.`,
        ...(terms.dealNote
          ? [
              `This is a one-time promotional rate: it applies to this term only and does not establish pricing for any renewal or future term. ${terms.dealNote}`,
            ]
          : []),
      ]
    : [
        `${money(terms.monthly)} per month for ${terms.months} months${terms.setup > 0 ? `, plus a one-time setup fee of ${money(terms.setup)}` : ""} — ${money(total)} total across the term. Invoiced monthly and due on receipt. A Stripe payment link is sent with each invoice. No automatic renewal.`,
        ...(terms.dealNote
          ? [
              `This rate is specific to this Advertiser and applies to this term only; it does not establish pricing for any renewal or future term. ${terms.dealNote}`,
            ]
          : []),
      ];

  return [
    {
      heading: "The parties",
      body: [
        `This Agreement is made between ${COMPANY} (${COMPANY_CITY}) ("Company") and ${terms.business}${terms.contactName ? `, represented by ${terms.contactName}` : ""}${terms.phone ? `, Phone: ${terms.phone}` : ""}${terms.email ? `, Email: ${terms.email}` : ""} ("Advertiser"), effective as of ${formatDate(terms.startDate)} (the "Effective Date").`,
        `The advertising described in this Agreement is displayed on digital screens located at ${VENUE}, ${VENUE_ADDRESS} (the "Venue"). The Venue is not a party to this Agreement but is an intended third-party beneficiary of the Sections titled "Advertiser Content Responsibility," "Removal Rights," "Indemnification," and "Limitation of Liability."`,
      ],
    },
    {
      heading: "Plan summary",
      body: [
        `TERM: ${terms.months} months`,
        `INVESTMENT: ${investmentLine}`,
        `CATEGORY: ${terms.category || "—"}`,
        `PLAN: ${terms.planName}${terms.dealNote ? " — Promotional" : ""}`,
        `RUNS: ${formatDate(terms.startDate)} through ${formatDate(terms.endDate)}`,
      ],
    },
    {
      heading: "The placement",
      body: [
        `A 10-second static ad on the dining-room screens at ${VENUE} (Cypress, TX), rotating during all posted business hours — cycling roughly every three (3) minutes while guests are seated. Venue Hours: Monday – Saturday, 6:00 AM – 2:00 PM; Sunday, 7:00 AM – 2:00 PM.`,
      ],
    },
    {
      heading: "Investment & payment",
      body: paymentBody,
    },
    {
      heading: "What's included",
      body: [
        `Ad design & production (Advertiser to provide logos and ad content), ad mockup delivered within 24 hours of receiving all necessary ad information from Advertiser, and up to three (3) rounds of revisions before launch.`,
      ],
    },
    {
      heading: "Ad launch timeline",
      body: [
        `The Ad will go live the next business day after both of the following are complete: (a) payment has been received in full, and (b) Advertiser has approved the final Ad in writing. Advertiser must provide all content and approve the final design before display begins.`,
      ],
    },
    {
      heading: "Exclusivity",
      body: [
        `Advertiser will be the only business in the category identified in the Plan Summary advertised at the Venue for the duration of this Agreement, provided this Agreement remains active and in good standing. This exclusivity is limited solely to the Venue and the category as defined above. Should Advertiser's Agreement lapse, become delinquent, or be cancelled, the exclusivity protection is immediately void.`,
      ],
    },
    {
      heading: "Ad creative; approval",
      body: [
        `If Company designs the Ad, the design fee includes up to three (3) revision rounds; additional revisions are billed at Company's then-current rate. Advertiser must approve the final Ad in writing (email sufficient) before display. Approval constitutes Advertiser's confirmation that the Ad's content, claims, offers, and required disclosures are accurate, lawful, and authorized. Advertiser grants Company a limited, non-exclusive license to display, reproduce, and format the Ad (including Advertiser's trademarks and logos) solely to perform this Agreement.`,
      ],
    },
    {
      heading: "Advertiser content responsibility",
      body: [
        `Advertiser is solely responsible for the legality, accuracy, and regulatory compliance of the Ad and the products, services, and claims it promotes. Advertiser represents and warrants that: (a) it holds all licenses, permits, and authorizations required to operate its business and to advertise it; (b) the Ad complies with all applicable federal, state, and local laws, regulations, and industry rules, including any required disclaimers or disclosures; (c) the Ad does not infringe any third party's intellectual property, privacy, or publicity rights; and (d) for regulated categories (including without limitation legal services, financial services or trading platforms, alcohol, gaming, membership card clubs, or health services), Advertiser has obtained review of the Ad by its own qualified counsel or compliance function. Company does not provide legal or compliance advice and has no duty to review the Ad for legal sufficiency.`,
      ],
    },
    {
      heading: "Removal rights",
      body: [
        `Company or the Venue may decline, suspend, or remove any Ad at any time, in their sole discretion, if the Ad or the Advertiser's business creates, in their reasonable judgment, legal, regulatory, or reputational risk to Company or the Venue, or if the Ad conflicts with the Venue's family-oriented environment. If an Ad is removed under this Section for reasons other than Advertiser's breach, Company will refund the prorated unused portion of prepaid fees for the affected period; such refund is Advertiser's sole and exclusive remedy for removal.`,
      ],
    },
    {
      heading: "Cancellation",
      body: [
        `The ${terms.months}-month term is prepaid and non-refundable if Advertiser ends the placement early. Advertiser's spot is locked for the full term. See Removal Rights above for the sole refund exception.`,
      ],
    },
    {
      heading: "No guarantee of results",
      body: [
        `Company makes no representation or guarantee regarding foot traffic, impressions, responses, sales, or any business outcome. Visitor counts referenced in marketing materials are estimates provided by the Venue and are not warranted by Company.`,
      ],
    },
    {
      heading: "Indemnification",
      body: [
        `Advertiser will defend, indemnify, and hold harmless Company, the Venue, and their respective owners, officers, employees, and agents from and against any claims, damages, fines, penalties, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) the Ad or its content; (b) Advertiser's products, services, or business operations; or (c) Advertiser's breach of this Agreement, including the representations in the Section titled "Advertiser Content Responsibility."`,
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        `To the maximum extent permitted by law, neither Company nor the Venue will be liable for any indirect, incidental, consequential, special, or punitive damages, or lost profits, arising out of this Agreement. Company's total aggregate liability under this Agreement will not exceed the fees actually paid by Advertiser in the three (3) months preceding the event giving rise to the claim.`,
      ],
    },
    {
      heading: "Service delivery & venue",
      body: [
        `Company's responsibility is to display the Advertiser's ad in the agreed rotation at ${VENUE}. If Company fails to run the ad as promised, Advertiser's sole remedy is a pro-rated credit or refund for the days it did not run. Should the Venue close, change ownership, or otherwise become permanently unavailable through no fault of Company during the term, Company will, in good faith, refund the unused portion of prepaid fees for the remaining days of the term. Company is not otherwise liable for circumstances beyond its control. All creative is subject to the Venue's approval. Reach figures are the Venue's reported guest counts, given in good faith as an estimate, not a guarantee. This Agreement is governed by the laws of the State of ${GOVERNING_STATE}; exclusive venue for any dispute lies in the courts located in ${DISPUTE_VENUE}.`,
      ],
    },
    {
      heading: "Renewal",
      body: [
        `Approximately 30 days before the term ends, the parties will review the partnership together and decide whether to renew or adjust the plan. No automatic renewal. Any renewal will be at Company's then-current standard rates; ${terms.dealNote ? "the promotional rate in this Agreement does not carry forward" : "the rate in this Agreement does not carry forward"}.`,
      ],
    },
    {
      heading: "Electronic signature",
      body: [
        `Signing electronically — typing a name and confirming below — has the same effect as signing on paper, and both parties agree to do business that way. Company is represented by ${COMPANY_SIGNATORIES}.`,
      ],
    },
  ];
}

/**
 * The exact plain text of the agreement. This is what gets hashed, so it must
 * be built from the same clauses shown on screen and must not include anything
 * that varies between renders — no timestamps, no generated ids.
 */
export function agreementText(terms: AgreementTerms): string {
  const lines = [
    agreementTitle(terms).toUpperCase(),
    agreementSubtitle(terms),
    `Template ${TEMPLATE_VERSION}`,
    "",
  ];

  agreementClauses(terms).forEach((clause, i) => {
    lines.push(`${i + 1}. ${clause.heading.toUpperCase()}`);
    clause.body.forEach((paragraph) => lines.push(`   ${paragraph}`));
    lines.push("");
  });

  lines.push("AGREED AND ACCEPTED:");
  lines.push(`   ${COMPANY} — ${COMPANY_SIGNATORIES}`);
  lines.push(`   ${terms.business} — Advertiser / Authorized Representative`);

  return lines.join("\n").trimEnd();
}
