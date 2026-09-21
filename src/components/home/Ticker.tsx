import { projects } from "@/data/projects";

/**
 * Client names and cities, scrolling. Replaces the three-logo "Trusted by"
 * band: a dozen real business names with where they are says more than
 * three marks nobody outside Houston recognises.
 */
export default function Ticker() {
  const rows = projects
    .filter((p) => p.city && !p.clientName.includes("Concept") && !p.title.includes("Concept"))
    .slice(0, 12)
    .map((p) => ({ name: p.title, city: p.city!.replace(/, TX$/, "") }));
  const loop = [...rows, ...rows];
  return (
    <div className="overflow-hidden whitespace-nowrap border-y border-white/[0.09] bg-[#0C0B0A] py-4" aria-hidden="true" data-theme="dark">
      <div className="ticker-row inline-flex">
        {loop.map((r, i) => (
          <span key={`${r.name}-${i}`} className="border-r border-white/[0.09] px-8 font-[family-name:var(--font-playfair)] text-lg text-white/65">
            {r.name}
            <i className="ml-3 align-middle font-mono text-[11px] not-italic uppercase tracking-[0.14em] text-[#DC2626]">{r.city}</i>
          </span>
        ))}
      </div>
    </div>
  );
}
