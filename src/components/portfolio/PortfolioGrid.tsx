"use client";

import { useState } from "react";
import { projects, FILTER_CATEGORIES, filterByCategory } from "@/data/projects";
import type { FilterCategory } from "@/data/projects";
import FilterTabs from "@/components/ui/FilterTabs";
import ProjectCard from "@/components/portfolio/ProjectCard";

export default function PortfolioGrid() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All");

  const filteredProjects = filterByCategory(projects, activeCategory);

  return (
    <>
      {/* Filter Tabs */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FilterTabs
            categories={FILTER_CATEGORIES as unknown as string[]}
            activeCategory={activeCategory}
            onCategoryChange={(cat) => setActiveCategory(cat as FilterCategory)}
          />
        </div>
      </section>

      {/* Project Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/50 text-lg">
                No projects found in this category.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
