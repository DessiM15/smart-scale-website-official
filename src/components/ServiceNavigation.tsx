"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function ServiceNavigation() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    const element = document.getElementById("service-navigation");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Navigation Buttons */}
      <section id="service-navigation" className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection("key-features")}
              className="group hover:shadow-[#DC2626]/30 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-[#DC2626]/60 overflow-hidden bg-gradient-to-br from-[#DC2626]/40 via-black/60 to-black/80 border-[#DC2626]/30 border-2 rounded-lg relative shadow-2xl backdrop-blur-xl px-8 py-4 flex-1 sm:flex-initial min-w-[280px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DC2626]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
              <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/20 to-[#DC2626]/10 opacity-0 absolute top-0 right-0 bottom-0 left-0 rounded-lg"></div>
              <div className="relative z-10 flex items-center justify-between">
                <p className="group-hover:text-white transition-colors duration-300 text-base font-bold text-white drop-shadow-sm">
                  Key Features
                </p>
                <div className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5 text-white">
                    <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => scrollToSection("benefits")}
              className="group hover:shadow-[#DC2626]/30 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-[#DC2626]/60 overflow-hidden bg-gradient-to-br from-[#DC2626]/40 via-black/60 to-black/80 border-[#DC2626]/30 border-2 rounded-lg relative shadow-2xl backdrop-blur-xl px-8 py-4 flex-1 sm:flex-initial min-w-[280px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DC2626]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
              <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/20 to-[#DC2626]/10 opacity-0 absolute top-0 right-0 bottom-0 left-0 rounded-lg"></div>
              <div className="relative z-10 flex items-center justify-between">
                <p className="group-hover:text-white transition-colors duration-300 text-base font-bold text-white drop-shadow-sm">
                  Benefits
                </p>
                <div className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5 text-white">
                    <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => scrollToSection("use-cases")}
              className="group hover:shadow-[#DC2626]/30 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-[#DC2626]/60 overflow-hidden bg-gradient-to-br from-[#DC2626]/40 via-black/60 to-black/80 border-[#DC2626]/30 border-2 rounded-lg relative shadow-2xl backdrop-blur-xl px-8 py-4 flex-1 sm:flex-initial min-w-[280px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DC2626]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
              <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/20 to-[#DC2626]/10 opacity-0 absolute top-0 right-0 bottom-0 left-0 rounded-lg"></div>
              <div className="relative z-10 flex items-center justify-between">
                <p className="group-hover:text-white transition-colors duration-300 text-base font-bold text-white drop-shadow-sm">
                  Use Cases
                </p>
                <div className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5 text-white">
                    <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 group hover:shadow-[#DC2626]/30 hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-[#DC2626]/60 overflow-hidden bg-gradient-to-br from-[#DC2626]/40 via-black/60 to-black/80 border-[#DC2626]/30 border-2 rounded-full shadow-2xl backdrop-blur-xl w-12 h-12 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DC2626]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/20 to-[#DC2626]/10 opacity-0 absolute top-0 right-0 bottom-0 left-0 rounded-full"></div>
          <ChevronUp className="w-6 h-6 text-white relative z-10" />
        </button>
      )}
    </>
  );
}

