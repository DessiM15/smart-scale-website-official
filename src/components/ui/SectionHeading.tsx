interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeading({
  label,
  title,
  subtitle,
  centered = true,
}: SectionHeadingProps) {
  return (
    <div className={`mb-16 ${centered ? "text-center" : ""}`}>
      {label && (
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626]/10 rounded-full mb-6 border border-[#DC2626]/20 ${
            centered ? "" : ""
          }`}
        >
          <span className="text-sm font-semibold text-[#DC2626]">{label}</span>
        </div>
      )}
      <h2 className="scroll-reveal text-4xl sm:text-5xl font-bold mb-4 text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="scroll-reveal text-lg text-white/60 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
