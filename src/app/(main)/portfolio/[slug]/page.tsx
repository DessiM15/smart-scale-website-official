import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import ProjectDetail from "@/components/portfolio/ProjectDetail";
import { SITE_URL } from "@/lib/business";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

/**
 * The full description, cut to search-snippet length at a word boundary.
 * The one-line summaries were too thin for a meta description ("Houston
 * restaurant website with delivery integrations.") and one of them had the
 * wrong city.
 */
function metaDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return { title: "Project Not Found | Smart Scale" };

  // "Barbershop Website Design for The Houston Barber, Houston TX" reads as a
  // local search result; the bare project name does not.
  const label = project.businessType
    ? `${project.businessType} Website Design for ${project.title}${
        project.city ? `, ${project.city}` : ""
      }`
    : `${project.title}: Case Study`;

  return {
    title: label,
    description: metaDescription(project.description),
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      title: `${label} | Smart Scale`,
      description: project.description,
      images: [
        {
          url: project.thumbnailImage,
          width: 1920,
          height: 1080,
          alt: `${project.title} website homepage designed by Smart Scale`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} | Smart Scale`,
      description: project.shortDescription,
      images: [project.thumbnailImage],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const projectIndex = projects.findIndex((p) => p.slug === slug);

  if (projectIndex === -1) notFound();

  const project = projects[projectIndex];
  const prevProject = projectIndex > 0 ? projects[projectIndex - 1] : null;
  const nextProject =
    projectIndex < projects.length - 1 ? projects[projectIndex + 1] : null;

  const pageUrl = `${SITE_URL}/portfolio/${project.slug}`;

  const workSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.shortDescription,
    url: pageUrl,
    image: `${SITE_URL}${project.thumbnailImage}`,
    creator: { "@id": `${SITE_URL}/#business` },
    about: project.industry,
    ...(project.city && { locationCreated: { "@type": "Place", name: project.city } }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: `${SITE_URL}/portfolio`,
      },
      { "@type": "ListItem", position: 3, name: project.title, item: pageUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(workSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProjectDetail
        project={project}
        prevProject={prevProject}
        nextProject={nextProject}
      />
    </>
  );
}
