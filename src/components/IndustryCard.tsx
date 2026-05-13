interface IndustryCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
}

export default function IndustryCard({ name, description, icon }: IndustryCardProps) {
  return (
    <div className="group p-6 rounded-3xl bg-[#161616] border border-white/[0.08] hover:border-[#DC2626]/30 hover:shadow-lg hover:shadow-[#DC2626]/5 transition-all duration-300">
      {icon && (
        <div className="mb-4 text-[#DC2626] transition-colors duration-300">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2 text-white transition-colors duration-300">
        {name}
      </h3>
      <p className="text-sm text-white/50 transition-colors duration-300">
        {description}
      </p>
    </div>
  );
}
