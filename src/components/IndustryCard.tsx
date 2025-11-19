interface IndustryCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
}

export default function IndustryCard({ name, description, icon }: IndustryCardProps) {
  return (
    <div className="group p-6 bg-[#F3F4F6] rounded-lg hover:bg-black hover:shadow-2xl transition-all duration-300">
      {icon && (
        <div className="mb-4 text-[#DC2626] group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2 text-black group-hover:text-white transition-colors duration-300">
        {name}
      </h3>
      <p className="text-sm text-[#6B7280] group-hover:text-white/80 transition-colors duration-300">
        {description}
      </p>
    </div>
  );
}

