import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-white/60 text-lg mb-8">
          This project could not be found.
        </p>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
        >
          View All Projects
        </Link>
      </div>
    </div>
  );
}
