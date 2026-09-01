import { signInAction } from "../actions";
import { btnPrimary, inputClass } from "./ui";

export function LockScreen({
  configured,
  wrong,
}: {
  configured: boolean;
  wrong: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      {/* A single warm glow behind the card, so the sign-in reads as part of
          the site rather than a bare form on black. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% -10%, rgba(220,38,38,0.10), transparent 70%)",
        }}
      />
      <form
        action={signInAction}
        className="relative w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#131313] p-8"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#DC2626] font-semibold">
          Mex Taco House
        </p>
        <h1 className="mt-3 text-3xl text-white tracking-tight">Ad Tracker</h1>
        {configured ? (
          <>
            <p className="mt-2 text-sm text-white/45">
              Enter the access key to manage advertisers.
            </p>
            <input
              type="password"
              name="key"
              autoFocus
              placeholder="Access key"
              className={`mt-6 ${inputClass} py-3`}
            />
            {wrong && (
              <p className="mt-2 text-xs text-[#f87171]">That key didn&apos;t work.</p>
            )}
            <button type="submit" className={`mt-4 w-full ${btnPrimary} py-3`}>
              Sign in
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-white/50 leading-relaxed">
            Set <code className="font-mono text-xs text-white/70">ADS_ADMIN_KEY</code> in
            the Vercel project settings and redeploy to switch this page on.
          </p>
        )}
      </form>
    </main>
  );
}
