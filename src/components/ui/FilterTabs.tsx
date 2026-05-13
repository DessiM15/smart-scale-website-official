"use client";

interface FilterTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function FilterTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === category
              ? "bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/20"
              : "bg-white/5 text-white/70 border border-white/[0.08] hover:bg-white/10 hover:text-white"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
