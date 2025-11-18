interface IndustryCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
}

export default function IndustryCard({ name, description, icon }: IndustryCardProps) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg hover:border-[#DC2626] hover:shadow-lg transition-all duration-300 bg-white">
      {icon && <div className="mb-3 text-[#DC2626]">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2 text-black">{name}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

