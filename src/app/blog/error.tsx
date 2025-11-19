"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Blog page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-[#DC2626] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-black mb-4">Something went wrong!</h2>
        <p className="text-[#6B7280] mb-8">
          We encountered an error while loading the blog. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#DC2626] text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#DC2626] text-[#DC2626] rounded-full font-semibold hover:bg-[#DC2626] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

