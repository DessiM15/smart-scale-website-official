import Link from "next/link";

interface ServiceCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  slug?: string;
}

export default function ServiceCard({ title, description, icon, slug }: ServiceCardProps) {
  const cardContent = (
    <>
      {icon && (
        <div className="mb-6 flex justify-center items-center">
          <div className="w-20 h-20 rounded-full bg-[#DC2626] flex items-center justify-center text-white shadow-lg p-4">
            <div className="flex items-center justify-center w-full h-full">
              {icon}
            </div>
          </div>
        </div>
      )}
      <h3 className="text-xl font-semibold mb-3 text-black text-center">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </>
  );

  if (slug) {
    return (
      <Link
        href={`/services/${slug}`}
        className="block p-8 rounded-lg hover:shadow-xl transition-all duration-300 bg-white group"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="p-8 rounded-lg bg-white">
      {cardContent}
    </div>
  );
}

