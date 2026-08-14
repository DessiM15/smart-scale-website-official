import type { Metadata } from "next";
import { verifyRenewalToken } from "@/lib/ads/links";
import {
  formatDate,
  getAdvertiser,
  toView,
  PLAN_LIST,
  type AdvertiserView,
} from "@/lib/ads/roster";
import { getResponse, type RenewalChoice } from "@/lib/ads/responses";
import { submitRenewalChoice } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your ad at Mex Taco House",
  robots: { index: false, follow: false },
};

const PHONE_DISPLAY = "832.407.0773";
const PHONE_HREF = "tel:+18324070773";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf6f0] px-5 py-14 flex items-start justify-center">
      <div className="w-full max-w-xl">
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-7 sm:p-9">
      {children}
    </div>
  );
}

/** Shown for a bad, stale, or already-superseded link. Never says why. */
function ExpiredLink() {
  return (
    <Shell>
      <Card>
        <h1 className="text-2xl font-semibold text-[#1a1210]">
          This link is no longer active
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5c4f45]">
          It may have expired, or your spot may already have been renewed. Nothing
          has changed on your account.
        </p>
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

function Confirmation({
  view,
  choice,
}: {
  view: AdvertiserView;
  choice: RenewalChoice;
}) {
  const headline =
    choice === "renew"
      ? "You're renewed — we'll be in touch"
      : choice === "change"
        ? "Got it — we'll get your new package set up"
        : "Understood — thanks for running with us";

  const body =
    choice === "renew"
      ? `We've got your renewal for ${view.business} and your ${view.category || "category"} stays locked. Someone will call you shortly to confirm the details and the invoice.`
      : choice === "change"
        ? `We've noted that you'd like to change packages. Someone will call you shortly to walk through the options and get it switched over.`
        : `We've noted that you'd like to end your run when the term is up on ${formatDate(view.endDate)}. Someone will reach out to confirm — and if you change your mind before then, just say the word.`;

  return (
    <Shell>
      <Card>
        <div className="w-11 h-11 rounded-full bg-[#eef7ee] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[#1f5130]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-[#1a1210]">{headline}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5c4f45]">{body}</p>
        <p className="mt-5 text-sm text-[#9a8b7d]">
          Nothing is final until we speak — this just tells us what you want.
        </p>
      </Card>
    </Shell>
  );
}

export default async function RenewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    t?: string;
    choice?: string;
    done?: string;
    err?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const advertiser = await getAdvertiser(id);
  if (!advertiser) return <ExpiredLink />;

  const view = toView(advertiser);
  if (!query.t || !verifyRenewalToken(id, view.endDate, query.t)) {
    return <ExpiredLink />;
  }

  if (query.done && ["renew", "change", "cancel"].includes(query.done)) {
    return <Confirmation view={view} choice={query.done as RenewalChoice} />;
  }

  // Already answered for this term — show it, but let them change their mind.
  const existing = await getResponse(id, view.endDate);
  const preselected = ["renew", "change", "cancel"].includes(query.choice ?? "")
    ? (query.choice as RenewalChoice)
    : (existing?.choice ?? "renew");

  const daysLeft = view.daysRemaining;
  const timing =
    daysLeft < 0
      ? `ended on ${formatDate(view.endDate)}`
      : daysLeft === 0
        ? `ends today`
        : daysLeft === 1
          ? `ends tomorrow`
          : `ends in ${daysLeft} days, on ${formatDate(view.endDate)}`;

  const sellable = PLAN_LIST.filter((plan) => !plan.internalOnly);

  return (
    <Shell>
      <Card>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1210]">
          {view.business}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#5c4f45]">
          Your {view.planName} term {timing}.
          {view.category
            ? ` You're currently our only ${view.category} advertiser — renewing keeps that locked.`
            : ""}
        </p>

        {existing && (
          <p className="mt-4 rounded-xl bg-[#faf6f0] border border-black/[0.06] px-4 py-3 text-sm text-[#5c4f45]">
            You already told us{" "}
            <strong className="text-[#1a1210]">
              {existing.choice === "renew"
                ? "you'd like to renew"
                : existing.choice === "change"
                  ? "you'd like to change packages"
                  : "you'd like to end your run"}
            </strong>
            . You can change that below if you&apos;ve had a rethink.
          </p>
        )}

        {query.err && (
          <p className="mt-4 rounded-xl bg-[#fdecec] border border-[#DC2626]/30 px-4 py-3 text-sm text-[#8f1d1d]">
            {query.err === "save"
              ? "Something went wrong saving that. Please try again, or give us a call."
              : "Please pick one of the options below."}
          </p>
        )}

        <form action={submitRenewalChoice} className="mt-7 space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="token" value={query.t} />

          {(
            [
              {
                value: "renew",
                title: `Renew my ${view.planName} spot`,
                blurb: view.monthly
                  ? `Keep going at $${view.monthly}/mo. Your category stays locked.`
                  : "Keep going on the same terms.",
              },
              {
                value: "change",
                title: "Change my package",
                blurb: "Move to a different term length.",
              },
              {
                value: "cancel",
                title: "End my run",
                blurb: "Stop when the current term is up.",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex gap-3 items-start rounded-2xl border border-black/[0.1] px-4 py-3.5 cursor-pointer hover:border-[#DC2626]/40 transition-colors has-[:checked]:border-[#DC2626] has-[:checked]:bg-[#fdf6f6]"
            >
              <input
                type="radio"
                name="choice"
                value={option.value}
                defaultChecked={preselected === option.value}
                className="mt-1 accent-[#DC2626]"
              />
              <span>
                <span className="block font-semibold text-[#1a1210]">
                  {option.title}
                </span>
                <span className="block text-sm text-[#7a6a5d]">{option.blurb}</span>
              </span>
            </label>
          ))}

          <div className="pt-2">
            <label
              htmlFor="requestedPlan"
              className="block text-[11px] uppercase tracking-[0.12em] text-[#9a8b7d] font-semibold mb-1.5"
            >
              If you&apos;re changing, which package?
            </label>
            <select
              id="requestedPlan"
              name="requestedPlan"
              defaultValue={view.plan}
              className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm text-[#1a1210] focus:outline-none focus:border-[#DC2626]"
            >
              {sellable.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {plan.months} months at ${plan.monthly}/mo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="note"
              className="block text-[11px] uppercase tracking-[0.12em] text-[#9a8b7d] font-semibold mb-1.5"
            >
              Anything you&apos;d like us to know? (optional)
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm text-[#1a1210] focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#DC2626] text-white font-semibold py-3.5 hover:bg-[#b91c1c] transition-colors"
          >
            Send my answer
          </button>
          <p className="text-xs text-[#9a8b7d] text-center">
            Nothing changes until we speak with you.
          </p>
        </form>
      </Card>
    </Shell>
  );
}
