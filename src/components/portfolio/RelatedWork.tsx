import Link from "next/link";
import ProjectCard from "@/components/portfolio/ProjectCard";
import type { Project } from "@/data/projects";

/**
 * A short grid of case studies with a heading, used on city and service
 * pages so each one links to real work. Renders nothing with an empty list
 * rather than an empty section.
 */
export default function RelatedWork({
  heading,
  intro,
  projects,
}: {
  heading: string;
  intro: string;
  projects: Project[];
}) {
  if (projects.length === 0) return null;
  return (
    <section
      data-theme="dark"
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] noise-overlay"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl sm:text-4xl text-white mb-4">{heading}</h2>
        <p className="text-white/50 mb-12 max-w-2xl">{intro}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
        <p className="mt-10">
          <Link
            href="/portfolio"
            className="text-sm text-white/60 hover:text-white underline underline-offset-4 transition-colors"
          >
            See every project
          </Link>
        </p>
      </div>
    </section>
  );
}
