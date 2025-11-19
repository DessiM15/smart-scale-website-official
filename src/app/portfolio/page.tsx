"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  description: string;
  logo?: string;
  logoType: "image" | "text";
  backgroundColor: string;
}

const categories = [
  "All Projects",
  "Mobile",
  "Web",
  "Enterprise Systems",
  "AI / Automation",
  "eCommerce",
  "Healthcare",
  "Finance",
  "Food Service",
  "Legal",
  "Non-Profit",
];

const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: "Arbor Cove Funding",
    category: "Finance",
    description: "Financial services platform",
    logo: "/assets/arbor-cove-logo-ss.png",
    logoType: "image" as const,
    backgroundColor: "#F3F4F6", // Light gray background
  },
  {
    id: 2,
    title: "Law Office of Sylvester R. Jamie",
    category: "Legal",
    description: "Legal practice management system",
    logoType: "text" as const,
    backgroundColor: "#000000", // Black background for text logo
  },
  {
    id: 3,
    title: "Mex Taco House",
    category: "Food Service",
    description: "Restaurant management and ordering system",
    logo: "/assets/mex-taco-logo-ss.jpg",
    logoType: "image" as const,
    backgroundColor: "#FFFFFF", // White background
  },
  {
    id: 4,
    title: "Angels Churros N' Chocolate",
    category: "Food Service",
    description: "E-commerce and ordering platform",
    logo: "/assets/angels-churros-logo-ss.webp",
    logoType: "image" as const,
    backgroundColor: "#DC2626", // Red background
  },
];

export default function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState("All Projects");

  const filteredItems =
    selectedCategory === "All Projects"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === selectedCategory);

  // Get unique categories that have items
  const categoriesWithItems = new Set(
    portfolioItems.map((item) => item.category)
  );

  // Filter categories to only show those with items (always include "All Projects")
  const visibleCategories = categories.filter(
    (category) =>
      category === "All Projects" || categoriesWithItems.has(category)
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Portfolio
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Explore our work across industries and technologies.
          </p>
        </div>
      </section>

      {/* Category Filter Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {visibleCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-[#DC2626] text-white"
                    : "bg-white text-black border border-gray-200 hover:border-[#DC2626]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden transition-all duration-300"
                style={{ backgroundColor: item.backgroundColor || "#F3F4F6" }}
              >
                {/* Background with logo/text */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  {item.logoType === "image" && item.logo ? (
                    <Image
                      src={item.logo}
                      alt={item.title}
                      width={200}
                      height={200}
                      className="object-contain w-full h-full max-w-[80%] max-h-[80%] group-hover:opacity-0 transition-opacity duration-300"
                      unoptimized
                    />
                  ) : (
                    <h3 className="text-xl md:text-2xl font-semibold text-white group-hover:opacity-0 transition-opacity duration-300 text-center px-4">
                      {item.title}
                    </h3>
                  )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 mb-4">{item.description}</p>
                    <Link
                      href={`/portfolio/${item.id}`}
                      className="inline-block px-6 py-2 bg-[#DC2626] text-white rounded-full text-sm font-semibold hover:bg-red-700 transition"
                    >
                      Success Story →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

