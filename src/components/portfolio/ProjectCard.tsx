"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-white/[0.04] transition-all duration-500 hover:border-white/[0.10]">
        {/* Thumbnail - full bleed */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={project.thumbnailImage}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <div className="p-5">
          <span className="text-xs uppercase tracking-widest text-white/35 mb-2 block">
            {project.serviceType}
          </span>
          <h3 className="text-lg font-medium text-white mb-1.5 group-hover:text-white/90 transition-colors duration-300">
            {project.title}
          </h3>
          <p className="text-sm text-white/40 line-clamp-2">
            {project.shortDescription}
          </p>
        </div>
      </div>
    </Link>
  );
}
