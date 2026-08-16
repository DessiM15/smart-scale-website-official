import { isSignedIn, isAdminConfigured } from "@/lib/ads/auth";
import { listRequests, isRedisConfigured } from "@/lib/reviews/store";
import { isSmsConfigured, buildMessage } from "@/lib/reviews/send";
import { GBP_URL } from "@/lib/business";
import SignInForm from "./SignInForm";
import RequestForm from "./RequestForm";
import ClearButton from "./ClearButton";

export const dynamic = "force-dynamic";

export default async function ReviewRequestsPage() {
  if (!isAdminConfigured()) {
    return (
      <Shell>
        <p className="text-white/60">
          Set <code className="text-[#DC2626]">ADS_ADMIN_KEY</code> in the
          environment to enable this page.
        </p>
      </Shell>
    );
  }

  if (!(await isSignedIn())) {
    return (
      <Shell>
        <SignInForm />
      </Shell>
    );
  }

  const requests = isRedisConfigured() ? await listRequests() : [];
  const smsReady = isSmsConfigured();
  const storeReady = isRedisConfigured();

  return (
    <Shell>
      <div className="space-y-10">
        {(!smsReady || !storeReady) && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200/80">
            {!smsReady && (
              <p>Twilio is not configured — sending is disabled.</p>
            )}
            {!storeReady && (
              <p>
                Upstash is not configured — sending is blocked so we can&apos;t
                text the same client twice.
              </p>
            )}
          </div>
        )}

        <section>
          <h2 className="text-lg text-white mb-2">Ask a client for a review</h2>
          <p className="text-sm text-white/40 mb-6">
            Send right after you deliver the work — that&apos;s when people
            actually follow through. Each client can only be asked once.
          </p>
          <RequestForm disabled={!smsReady || !storeReady} />
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">
            Message preview
          </h3>
          <pre className="whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-[#111111] p-5 text-sm text-white/60 font-mono">
            {buildMessage("Jordan")}
          </pre>
          <p className="mt-3 text-xs text-white/30">
            Never offer a discount or gift in exchange for a review — Google
            removes incentivised reviews and can penalise the whole profile.
            Review link:{" "}
            <a
              href={GBP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {GBP_URL}
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg text-white mb-4">
            Already asked{" "}
            <span className="text-white/30 text-sm">({requests.length})</span>
          </h2>
          {requests.length === 0 ? (
            <p className="text-sm text-white/40">
              No review requests sent yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
              {requests.map((req) => (
                <li
                  key={req.phone}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="text-sm text-white/80">
                      {req.name}
                      {req.context && (
                        <span className="text-white/30"> — {req.context}</span>
                      )}
                    </p>
                    <p className="text-xs text-white/30 font-mono">
                      {req.phone} ·{" "}
                      {new Date(req.sentAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ClearButton phone={req.phone} name={req.name} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-2xl text-white mb-1">Review Requests</h1>
      <p className="text-sm text-white/40 mb-10">
        Google reviews are the single biggest lever on local map-pack ranking.
      </p>
      {children}
    </div>
  );
}
