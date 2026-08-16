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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return { title: "Project Not Found | Smart Scale" };

  // "Barbershop Website Design — The Houston Barber, Houston TX" reads as a
  // local search result; the bare project name does not.
  const label = project.businessType
    ? `${project.businessType} Website Design — ${project.title}${
        project.city ? `, ${project.city}` : ""
      }`
    : `${project.title} — Case Study`;

  return {
    title: label,
    description: project.shortDescription,
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
