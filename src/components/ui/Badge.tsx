interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "ai";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variants = {
    default:
      "bg-white/[0.06] text-white/70 border border-white/[0.08]",
    accent:
      "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20",
    ai: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {variant === "ai" && (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      )}
      {children}
    </span>
  );
}
