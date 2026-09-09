import { signInAction } from "../actions";
import { Logo } from "./shell";
import { bebas, btnSolid, eyebrowClass, headlineClass, inputClass } from "./ui";

export function LockScreen({ configured, wrong }: { configured: boolean; wrong: boolean }) {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 relative">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background: "radial-gradient(60rem 40rem at 50% -10%, rgba(220,38,38,0.12), transparent 70%)",
        }}
      />
      <form
        action={signInAction}
        className="relative w-full max-w-sm border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.012] p-8 flex flex-col gap-6"
      >
        <Logo size={44} />
        <div>
          <p className={eyebrowClass}>Ad Ops</p>
          <h1 className={`${headlineClass} mt-2`}>Good to see you.</h1>
        </div>
        {configured ? (
          <>
            <div>
              <label className={`${bebas} block text-[11px] tracking-[0.24em] text-white/40 mb-2`} htmlFor="key">
                Team key
              </label>
              <input id="key" type="password" name="key" autoFocus placeholder="The shared key" className={`${inputClass} py-3`} />
              {wrong && <p className="mt-2 text-xs text-[#f87171]">That key didn&apos;t work.</p>}
            </div>
            <button type="submit" className={`${btnSolid} w-full py-4`}>
              Sign in
            </button>
          </>
        ) : (
          <p className="text-sm text-white/50 leading-relaxed">
            Set <code className="font-mono text-xs text-white/70">ADS_ADMIN_KEY</code> in the Vercel project settings and
            redeploy to switch this on.
          </p>
        )}
      </form>
    </main>
  );
}
