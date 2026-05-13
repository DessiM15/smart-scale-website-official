"use client";

import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className="portfolio-item group block"
    >
      <div className="relative overflow-hidden rounded-3xl bg-[#161616] border border-white/[0.08] transition-all duration-300 hover:border-white/[0.15] hover:shadow-2xl hover:shadow-[#DC2626]/5">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[#111111]">
          <Image
            src={project.thumbnailImage}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent opacity-60" />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="accent">{project.serviceType}</Badge>
            {project.isAIPowered && <Badge variant="ai">AI-Powered</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#DC2626] transition-colors duration-300">
            {project.title}
          </h3>
          <p className="text-sm text-white/50 line-clamp-2">
            {project.shortDescription}
          </p>
        </div>
      </div>
    </Link>
  );
}
