"use client";

import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/data/projects";

interface FeaturedProjectCardProps {
  project: Project;
}

export default function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-[#111111] border border-white/[0.06] card-hover hover:border-white/[0.12]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={project.thumbnailImage}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500" />
        {/* Title on hover */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <span className="text-xs uppercase tracking-widest text-white/60 mb-2">
            {project.serviceType}
          </span>
          <h3 className="text-2xl md:text-3xl text-white">
            {project.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
