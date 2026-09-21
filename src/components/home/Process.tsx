import Link from "next/link";

/**
 * How a project runs, in the four facts clients ask about. The service
 * links under it keep the homepage pointing at the service pages, which
 * is where search authority needs to flow.
 */
const STEPS = [
  { title: "One call", body: "Thirty minutes. You bring what you have; we tell you what we'd build and what it costs." },
  { title: "A number in writing", body: "Fixed price before anything starts. No hourly surprises, no platform fee to keep what you paid for." },
  { title: "Live in about two weeks", body: "Design, copy with you, build, launch on your own domain. Two clients had sites live in under eight days." },
  { title: "Found on Google", body: "Page titles, city pages, schema, and your Business Profile matched to the site. Part of the build, not an add-on." },
];

const SERVICES = [
  { href: "/services/web-development", label: "Websites" },
  { href: "/services/mobile-development", label: "Mobile apps" },
  { href: "/services/ai-enhancement-ai-workflows", label: "Automation & AI" },
  { href: "/services/enterprise-systems", label: "Custom software & CRM" },
];

export default function Process() {
  return (
    <section className="bg-[#0C0B0A] px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28" data-theme="dark">
      <div className="mx-auto max-w-7xl">
        <div className="grid border-t border-white/[0.16] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.title} className="border-b border-white/[0.09] py-7 pr-6 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <span aria-hidden="true" className="mb-4 block h-0.5 w-7 bg-[#DC2626]" />
              <h3 className="text-[clamp(26px,2.4vw,34px)] leading-tight text-white">{s.title}</h3>
              <p className="mt-3 text-[15px] text-white/65">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
          <span>What we build</span>
          {SERVICES.map((s) => (
            <Link key={s.href} href={s.href} className="text-white/65 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-[#DC2626]">
              {s.label}
            </Link>
          ))}
        </p>
      </div>
    </section>
  );
}
