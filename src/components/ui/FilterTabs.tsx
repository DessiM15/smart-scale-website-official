"use client";

interface FilterTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  theme?: "dark" | "light";
}

export default function FilterTabs({
  categories,
  activeCategory,
  onCategoryChange,
  theme = "dark",
}: FilterTabsProps) {
  const isDark = theme === "dark";

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === category
              ? "bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/20"
              : isDark
                ? "bg-white/5 text-white/70 border border-white/[0.08] hover:bg-white/10 hover:text-white"
                : "bg-black/5 text-black/70 border border-black/[0.08] hover:bg-black/10 hover:text-black"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
