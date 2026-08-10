interface IndustryCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
  theme?: "dark" | "light";
}

export default function IndustryCard({ name, description, icon, theme = "dark" }: IndustryCardProps) {
  const isDark = theme === "dark";

  return (
    <div className={`group p-6 rounded-3xl hover:border-[#DC2626]/30 hover:shadow-lg hover:shadow-[#DC2626]/5 transition-all duration-300 ${
      isDark
        ? "bg-[#161616] border border-white/[0.08]"
        : "bg-[#F5F5F5] border border-black/[0.08]"
    }`}>
      {icon && (
        <div className="mb-4 text-[#DC2626] transition-colors duration-300">
          {icon}
        </div>
      )}
      <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isDark ? "text-white" : "text-[#111111]"}`}>
        {name}
      </h3>
      <p className={`text-sm transition-colors duration-300 ${isDark ? "text-white/50" : "text-black/50"}`}>
        {description}
      </p>
    </div>
  );
}
