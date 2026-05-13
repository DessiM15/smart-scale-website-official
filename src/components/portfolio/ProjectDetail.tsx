"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Project } from "@/data/projects";

interface ProjectDetailProps {
  project: Project;
  prevProject: Project | null;
  nextProject: Project | null;
}

export default function ProjectDetail({
  project,
  prevProject,
  nextProject,
}: ProjectDetailProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const showIframe = project.vercelUrl && project.serviceType !== "Mobile App";

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Back Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
      </div>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Screenshot */}
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-[#161616] border border-white/[0.08]">
              <Image
                src={project.thumbnailImage}
                alt={project.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="accent">{project.serviceType}</Badge>
                {project.isAIPowered && (
                  <Badge variant="ai">AI-Powered</Badge>
                )}
                <Badge>{project.industry}</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {project.title}
              </h1>

              <p className="text-lg text-white/60 mb-8 leading-relaxed">
                {project.description}
              </p>

              {/* Tech Stack */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] text-white/70 border border-white/[0.08]"
                      style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {project.vercelUrl && (
                  <a
                    href={project.vercelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
                  >
                    Visit Site
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {project.secondaryVercelUrl && (
                  <a
                    href={project.secondaryVercelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/[0.08]"
                  >
                    Recruitment Portal
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/[0.08]"
                >
                  GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded iframe preview */}
      {showIframe && !iframeError && (
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Live Preview</h2>
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#111111]" style={{ minHeight: "600px" }}>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#DC2626] mb-4" />
                    <p className="text-white/40 text-sm">Loading preview...</p>
                  </div>
                </div>
              )}
              <iframe
                src={project.vercelUrl}
                className="w-full h-[600px] md:h-[700px]"
                style={{
                  border: "none",
                  opacity: iframeLoaded ? 1 : 0,
                  transition: "opacity 0.3s",
                }}
                title={`${project.title} Live Preview`}
                allow="fullscreen"
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
                onError={() => setIframeError(true)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </section>
      )}

      {/* Case Study */}
      {project.caseStudy && (
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Challenge</h2>
              <p className="text-white/60 leading-relaxed text-lg">
                {project.caseStudy.challenge}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Solution</h2>
              <p className="text-white/60 leading-relaxed text-lg">
                {project.caseStudy.solution}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Results</h2>
              <ul className="space-y-3">
                {project.caseStudy.results.map((result, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-white/60 text-lg"
                  >
                    <span className="text-[#DC2626] font-bold mt-1 shrink-0">
                      &bull;
                    </span>
                    <span>{result}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Prev/Next Navigation */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-white/[0.08] pt-12 flex items-center justify-between">
            {prevProject ? (
              <Link
                href={`/portfolio/${prevProject.slug}`}
                className="group flex items-center gap-3 text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider">
                    Previous
                  </p>
                  <p className="text-sm font-medium">{prevProject.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextProject ? (
              <Link
                href={`/portfolio/${nextProject.slug}`}
                className="group flex items-center gap-3 text-white/50 hover:text-white transition-colors text-right"
              >
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider">
                    Next
                  </p>
                  <p className="text-sm font-medium">{nextProject.title}</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl bg-[#161616] border border-white/[0.08] p-12 md:p-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start Your Project
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Ready to build something like this? Let&apos;s talk about your
              vision and make it happen.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Request Estimate
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
