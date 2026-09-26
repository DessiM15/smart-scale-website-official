import Image from "next/image";
import Link from "next/link";
import { getFeaturedProjects, projects, type Project } from "@/data/projects";
import { REVIEWS } from "@/data/reviews";

/**
 * The homepage work grid. Andre Thomas Law leads, with his Google review
 * sitting beside the screenshot as the section's feature moment (Dessi's
 * ask, 2026-09-25). The other six featured projects follow in his order,
 * two to a row, so every card is the same size.
 */
const FEATURE_SLUG = "andre-thomas-law";

function Card({ project }: { project: Project }) {
  const live = Boolean(project.vercelUrl && !project.vercelUrl.includes("vercel.app")) || project.slug === "ascension-athlete-group";
  const concept = project.title.includes("Concept") || project.clientName.includes("Concept") || project.slug === "the-houston-barber";
  const city = project.city?.replace(/, TX$/, "");
  return (
    <Link href={`/portfolio/${project.slug}`} className="group block lg:col-span-6">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#1A1816]">
        <Image
          src={project.thumbnailImage}
          alt={`${project.title} website, built by Smart Scale`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-white/[0.09] pt-4">
        <h3 className="text-[clamp(20px,1.8vw,28px)] text-white">{project.title}</h3>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
          {live && !concept && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#DC2626] shadow-[0_0_0_4px_rgba(220,38,38,0.16)]" />}
          {city ? `${city} · ` : ""}{concept ? "Concept" : live ? "Live" : project.serviceType}
        </span>
      </div>
      <p className="mt-2 max-w-[34em] text-sm text-white/65">{project.shortDescription}</p>
    </Link>
  );
}

/**
 * The client's own words next to the site they are about. Pulled from the
 * same reviews data the marquee uses, so the text stays verbatim in one place.
 */
function FeatureReview({ project }: { project: Project }) {
  const review = REVIEWS.find((r) => r.projectSlugs?.includes(project.slug));
  if (!review) return null;
  const city = project.city?.replace(/, TX$/, "");
  return (
    <aside
      aria-labelledby="work-feature-review"
      className="flex flex-col justify-between rounded-[10px] border border-white/[0.09] bg-[#131211] p-7 sm:p-9 lg:col-span-6"
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#DC2626]">Client review · Google</p>
        <p className="mt-5">
          <span aria-hidden="true" className="text-lg tracking-[2px] text-[#D9B26A]">
            {"★".repeat(review.rating)}
          </span>
          <span className="sr-only">{review.rating} out of 5 stars</span>
        </p>
        <blockquote className="mt-6">
          <p className="text-[clamp(22px,2.1vw,32px)] leading-[1.25] text-white">&ldquo;{review.text}&rdquo;</p>
        </blockquote>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/[0.09] pt-5">
        <div>
          <p id="work-feature-review" className="text-white">{review.author}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
            {project.title}{city ? ` · ${city}` : ""}
          </p>
        </div>
        <Link
          href={`/portfolio/${project.slug}`}
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-white underline-offset-4 transition-colors hover:text-[#DC2626] hover:underline"
        >
          The case study <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </aside>
  );
}

export default function Work() {
  const featured = getFeaturedProjects().slice(0, 7);
  const lead = featured.find((p) => p.slug === FEATURE_SLUG) ?? featured[0];
  const rest = featured.filter((p) => p !== lead);
  return (
    <section id="work" className="bg-[#0C0B0A] px-4 sm:px-6 lg:px-8" data-theme="dark">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-6 pb-10 pt-20 sm:pt-28 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#DC2626]">Work</p>
            <h2 className="mt-3 text-[clamp(36px,5vw,72px)] leading-[1.05] text-white">
              Websites we built in the <em className="italic text-[#DC2626]">Houston metro.</em>
            </h2>
          </div>
          <p className="max-w-[28em] text-[15px] text-white/65 lg:text-right">
            Real businesses you can call. Each one opens a case study: what they had, what we built, what changed.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {lead && <Card project={lead} />}
          {lead && <FeatureReview project={lead} />}
          {rest.map((project) => (
            <Card key={project.slug} project={project} />
          ))}
        </div>
        <div className="pt-10">
          <Link
            href="/portfolio"
            className="inline-flex items-center rounded-full border border-white/[0.16] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#0C0B0A]"
          >
            All {projects.length} projects
          </Link>
        </div>
      </div>
    </section>
  );
}
