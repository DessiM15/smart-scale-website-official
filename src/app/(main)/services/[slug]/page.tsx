import { SERVICES } from "@/lib/constants";
import ServicePageClient from "@/components/ServicePageClient";

// Server component wrapper to handle Promise-based params
interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);

  if (!service) {
    return {
      title: "Service Not Found",
    };
  }

  return {
    title: `${service.title} | Smart Scale Services`,
    description: service.extendedDescription,
    openGraph: {
      title: service.title,
      description: service.extendedDescription,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  return <ServicePageClient slug={slug} />;
}

