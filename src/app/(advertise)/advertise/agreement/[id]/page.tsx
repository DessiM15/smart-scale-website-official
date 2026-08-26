/**
 * Where a client reads and signs their advertising agreement.
 *
 * No account and no password: the link is the credential, signed with the same
 * secret as the renewal buttons. It is styled like the rest of the client-facing
 * pages rather than the dark tracker, because this is the last thing they see
 * before committing money and it should look like it came from a business.
 *
 * The terms come from the frozen copy on the record, never live from the
 * roster — what they read has to be what they signed.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  getAgreement,
  isIntact,
  markViewed,
  type Agreement,
} from "@/lib/ads/agreements";
import {
  agreementClauses,
  agreementTitle,
  TEMPLATE_VERSION,
} from "@/lib/ads/agreement-template";
import { verifyAgreementToken } from "@/lib/ads/links";
import { formatDate } from "@/lib/ads/roster";
import { signAgreementAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your advertising agreement",
  robots: { index: false, follow: false },
};

const PHONE_DISPLAY = "832.407.0773";
const PHONE_HREF = "tel:+18324070773";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf6f0] px-5 py-14 flex items-start justify-center">
      <div className="w-full max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#DC2626] font-semibold text-center">
          Mex Taco House · Screen Advertising
        </p>
        {children}
        <p className="mt-8 text-center text-xs text-[#9a8b7d]">
          Managed by Smart Scale ·{" "}
          <a href={PHONE_HREF} className="text-[#7a6a5d] hover:text-[#1a1210]">
            {PHONE_DISPLAY}
          </a>
        </p>
      </div>
    </main>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-7 sm:p-9">
      {children}
    </div>
  );
}

/** Shown for a bad link, a cancelled agreement, or one not yet sent. */
function Unavailable({ line }: { line: string }) {
  return (
    <Shell>
      <Card>
        <h1 className="text-2xl font-semibold text-[#1a1210]">
          This link isn&apos;t active
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5c4f45]">{line}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-[#5c4f45]">
          Give us a call at{" "}
          <a href={PHONE_HREF} className="font-semibold text-[#DC2626] hover:underline">
            {PHONE_DISPLAY}
          </a>{" "}
          and we&apos;ll sort it out in a minute.
        </p>
      </Card>
    </Shell>
  );
}

/* --------------------------------- terms ---------------------------------- */

function Summary({ agreement }: { agreement: Agreement }) {
  const t = agreement.terms;
  const rows: [string, string][] = [
    ["Business", t.business],
    ...(t.category ? ([["Category held", t.category]] as [string, string][]) : []),
    ["Package", `${t.planName} · ${t.months} months`],
    [
      "Rate",
      t.monthly > 0
        ? `$${t.monthly.toLocaleString()}/month${t.setup > 0 ? ` · $${t.setup.toLocaleString()} setup` : ""}`
        : "No monthly charge",
    ],
    ["Runs", `${formatDate(t.startDate)} → ${formatDate(t.endDate)}`],
    ["Total for the term", `$${(t.monthly * t.months + t.setup).toLocaleString()}`],
  ];

  return (
    <dl className="rounded-2xl bg-[#faf6f0] border border-black/[0.05] px-5 py-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-wrap items-baseline justify-between gap-3 py-3 border-t border-black/[0.05] first:border-t-0"
        >
          <dt className="text-[13px] text-[#7a6a5d]">{label}</dt>
          <dd className="text-[14px] font-semibold text-[#1a1210] text-right">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Clauses({ agreement }: { agreement: Agreement }) {
  return (
    <ol className="mt-7 space-y-6">
      {agreementClauses(agreement.terms).map((clause, i) => (
        <li key={clause.heading}>
          <h2 className="text-[13px] uppercase tracking-[0.12em] font-bold text-[#1a1210]">
            {i + 1}. {clause.heading}
          </h2>
          <div className="mt-2 space-y-2">
            {clause.body.map((paragraph, j) => (
              <p key={j} className="text-[14px] leading-relaxed text-[#5c4f45]">
                {paragraph}
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------- signing --------------------------------- */

const ERRORS: Record<string, string> = {
  consent: "Please tick the box to confirm you agree to the terms.",
  name: "Please type your full name.",
  alreadysigned: "This agreement has already been signed.",
  notsent: "This agreement isn't ready to sign yet.",
  void: "This agreement was cancelled.",
  changed:
    "These terms have been updated since this link was sent, so it can't be signed as it stands. We'll send you a fresh copy.",
  save: "Something went wrong saving that. Please try again.",
  notfound: "We couldn't find that agreement.",
};

function SignForm({
  agreement,
  token,
  error,
}: {
  agreement: Agreement;
  token: string;
  error?: string;
}) {
  const message = error ? ERRORS[error] : undefined;

  return (
    <form action={signAgreementAction} className="mt-8 pt-7 border-t border-black/[0.07]">
      <input type="hidden" name="id" value={agreement.id} />
      <input type="hidden" name="t" value={token} />

      <h2 className="text-lg font-semibold text-[#1a1210]">Sign here</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[#7a6a5d]">
        Typing your name below is your signature and has the same effect as
        signing on paper.
      </p>

      {message && (
        <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[14px] text-red-700">
          {message}
        </p>
      )}

      <div className="mt-5">
        <label
          htmlFor="signerName"
          className="block text-[13px] font-medium text-[#5c4f45] mb-1.5"
        >
          Your full name
        </label>
        <input
          id="signerName"
          name="signerName"
          type="text"
          required
          autoComplete="name"
          defaultValue={agreement.terms.contactName}
          placeholder="Type your full name"
          className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-[#1a1210] text-lg placeholder:text-[#c4b8ac] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
        />
      </div>

      <label className="mt-5 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="consent"
          value="1"
          required
          className="mt-1 w-4 h-4 accent-[#DC2626] shrink-0"
        />
        <span className="text-[14px] leading-relaxed text-[#5c4f45]">
          I have read the terms above, I agree to them on behalf of{" "}
          <strong className="text-[#1a1210]">{agreement.terms.business}</strong>, and
          I&apos;m happy to sign electronically.
        </span>
      </label>

      <button
        type="submit"
        className="mt-6 w-full py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold transition-all duration-300 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/20"
      >
        Sign the agreement
      </button>

      <p className="mt-4 text-[12px] leading-relaxed text-[#9a8b7d]">
        We record the date, the name you type and the address you sign from, as
        the record of your signature. You&apos;ll get a copy by email straight away.
      </p>
    </form>
  );
}

function Signed({ agreement }: { agreement: Agreement }) {
  const signature = agreement.signature;
  return (
    <div className="mt-8 pt-7 border-t border-black/[0.07]">
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4">
        <p className="text-[15px] font-semibold text-emerald-900">
          Signed{signature ? ` by ${signature.name}` : ""}
          {signature ? ` on ${formatDate(signature.at.slice(0, 10))}` : ""}.
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-emerald-800">
          A copy is on its way to your email. Nothing else is needed from you —
          we&apos;ll be in touch about artwork and your start date.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default async function AgreementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; err?: string; msg?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = query.t ?? "";

  // A wrong token and a missing agreement give the same answer, so the page
  // can't be used to find out which ids exist.
  if (!verifyAgreementToken(id, token)) {
    return (
      <Unavailable line="It may have expired, or a newer copy may have been sent to you. Nothing has been agreed." />
    );
  }

  const agreement = await getAgreement(id);
  if (!agreement) {
    return (
      <Unavailable line="It may have expired, or a newer copy may have been sent to you. Nothing has been agreed." />
    );
  }

  if (agreement.status === "void") {
    return (
      <Unavailable line="This agreement was cancelled and replaced. Nothing has been agreed under it." />
    );
  }

  if (agreement.status === "draft") {
    return (
      <Unavailable line="This agreement hasn't been finished on our side yet. We'll send it over shortly." />
    );
  }

  // The copy on file must still match the words it claims to be, or there is
  // nothing here anyone should be signing.
  if (!isIntact(agreement)) {
    return (
      <Unavailable line="These terms have been updated since this link was sent. We'll send you a fresh copy to look over." />
    );
  }

  // Opening it moves `sent` to `viewed` and nothing else, so a mail scanner
  // following the link can't change anything that matters.
  await markViewed(id);

  const done = Boolean(agreement.signature);

  return (
    <Shell>
      <Card>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1210] leading-tight">
          {agreementTitle(agreement.terms)}
        </h1>
        <p className="mt-2 text-[13px] text-[#9a8b7d]">
          Prepared {formatDate(agreement.createdAt.slice(0, 10))} · terms{" "}
          {TEMPLATE_VERSION}
        </p>

        <div className="mt-6">
          <Summary agreement={agreement} />
        </div>

        <Clauses agreement={agreement} />

        {done ? (
          <Signed agreement={agreement} />
        ) : (
          <SignForm agreement={agreement} token={token} error={query.err} />
        )}
      </Card>
    </Shell>
  );
}
