import Link from "next/link";

interface ServiceCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  slug?: string;
  theme?: "dark" | "light";
}

export default function ServiceCard({ title, description, icon, slug, theme = "dark" }: ServiceCardProps) {
  const isDark = theme === "dark";

  const cardContent = (
    <>
      {icon && (
        <div className="mb-6 flex justify-center items-center">
          <div className="w-20 h-20 rounded-full bg-[#DC2626] flex items-center justify-center text-white shadow-lg p-4 transition-transform duration-300 group-hover:scale-110">
            <div className="flex items-center justify-center w-full h-full">
              {icon}
            </div>
          </div>
        </div>
      )}
      <h3 className={`text-xl font-semibold mb-3 text-center ${isDark ? "text-white" : "text-[#111111]"}`}>{title}</h3>
      <p className={`text-center ${isDark ? "text-white/50" : "text-black/50"}`}>{description}</p>
    </>
  );

  if (slug) {
    return (
      <Link
        href={`/services/${slug}`}
        className={`service-card block p-8 rounded-3xl transition-all duration-300 group hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(220,38,38,0.08)] ${
          isDark
            ? "bg-[#161616] border border-white/[0.08] hover:border-white/[0.15] hover:shadow-xl"
            : "bg-[#F5F5F5] border border-black/[0.08] hover:border-black/[0.15] hover:shadow-xl"
        }`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={`service-card p-8 rounded-3xl group transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(220,38,38,0.08)] ${
      isDark
        ? "bg-[#161616] border border-white/[0.08] hover:border-white/[0.15]"
        : "bg-[#F5F5F5] border border-black/[0.08] hover:border-black/[0.15]"
    }`}>
      {cardContent}
    </div>
  );
}
