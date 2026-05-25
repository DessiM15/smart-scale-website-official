"use client";

import Link from "next/link";
import Image from "next/image";
import { getFeaturedProjects } from "@/data/projects";

export default function SelectedWork() {
  const featured = getFeaturedProjects();

  return (
    <section id="work" className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl text-white text-center mb-4"
          data-animate="fade-up"
        >
          Selected Work
        </h2>
        <p
          className="text-center text-white/50 text-lg mb-20 max-w-xl mx-auto"
          data-animate="fade-up"
        >
          Enterprise platforms, AI systems, and digital experiences — built with precision.
        </p>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          data-animate="stagger"
        >
          {featured.map((project) => (
            <Link
              key={project.slug}
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
                  unoptimized
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500" />
                {/* Title on hover */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
                  <span className="text-xs uppercase tracking-widest text-white/60 mb-2">
                    {project.serviceType}
                  </span>
                  <h3 className="text-2xl md:text-3xl text-white">
                    {project.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-16" data-animate="fade-up">
          <Link
            href="/portfolio"
            className="text-sm uppercase tracking-widest text-white/50 hover:text-white transition-colors duration-300 border-b border-white/20 hover:border-white/50 pb-1"
          >
            View complete portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}
