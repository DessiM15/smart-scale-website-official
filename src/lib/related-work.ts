import { getFeaturedProjects, projects, type Project } from "@/data/projects";

/**
 * Which portfolio pages each city and service page should link to.
 *
 * The reason this exists: Search Console showed 22 pages "Discovered,
 * currently not indexed" five weeks after launch, most of them portfolio
 * pages, while the city pages were the ones earning impressions. Google
 * crawls what indexed pages link to. Until this, city and service pages
 * linked only to the portfolio index, so every case study was one hop
 * further from the pages Google already trusted.
 */

/** How many cards a related-work section shows. */
export const RELATED_WORK_LIMIT = 4;

/**
 * Projects for a client based in `cityName`, matched on the project's own
 * `city` field. Falls back to the featured set when a city has no client
 * yet, so the section always links somewhere real; `local` says which.
 */
export function projectsForCity(cityName: string): {
  projects: Project[];
  local: boolean;
} {
  const prefix = `${cityName},`;
  const local = projects
    .filter((p) => p.city?.startsWith(prefix))
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));
  if (local.length > 0) {
    return { projects: local.slice(0, RELATED_WORK_LIMIT), local: true };
  }
  return {
    projects: getFeaturedProjects().slice(0, RELATED_WORK_LIMIT),
    local: false,
  };
}

/**
 * The service page each project is proof for. Landing pages sit under web
 * development because there is no separate service page for them.
 */
export function serviceSlugForProject(project: Project): string {
  switch (project.serviceType) {
    case "Mobile App":
      return "mobile-development";
    case "Platform/CRM":
      return "enterprise-systems";
    case "Website":
    case "Landing Page":
    default:
      return "web-development";
  }
}

/**
 * Projects that prove a service page. Featured work first so the section
 * leads with the strongest examples, then everything else in data order.
 */
export function projectsForService(serviceSlug: string): Project[] {
  const matches = (p: Project): boolean => {
    switch (serviceSlug) {
      case "ai-enhancement-ai-workflows":
      case "integrations-and-automation":
        return Boolean(p.isAIPowered);
      case "web-applications":
        return p.serviceType === "Platform/CRM";
      default:
        return serviceSlugForProject(p) === serviceSlug;
    }
  };
  const order = (p: Project) => p.featuredOrder ?? 99;
  return projects
    .filter(matches)
    .sort((a, b) => order(a) - order(b))
    .slice(0, RELATED_WORK_LIMIT);
}
