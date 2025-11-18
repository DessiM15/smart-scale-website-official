interface ServiceCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function ServiceCard({ title, description, icon }: ServiceCardProps) {
  return (
    <div className="p-8 border border-gray-200 rounded-lg hover:border-[#DC2626] hover:shadow-lg transition-all duration-300 bg-white">
      {icon && <div className="mb-4 text-[#DC2626]">{icon}</div>}
      <h3 className="text-xl font-semibold mb-3 text-black">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

