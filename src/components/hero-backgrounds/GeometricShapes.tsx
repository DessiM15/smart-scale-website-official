"use client";

export default function GeometricShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hero-bg-elements" style={{ opacity: 0 }}>
      {/* Rotating geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-[#DC2626]/20 animate-rotate">
        <div className="w-full h-full border-2 border-[#DC2626]/30 transform rotate-45"></div>
      </div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 border-2 border-[#DC2626]/20 animate-rotate" style={{ animationDirection: 'reverse', animationDuration: '25s' }}>
        <div className="w-full h-full border-2 border-[#DC2626]/30 transform rotate-45"></div>
      </div>
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 border-2 border-[#DC2626]/20 animate-rotate" style={{ animationDuration: '35s' }}>
        <div className="w-full h-full border-2 border-[#DC2626]/30 transform rotate-45"></div>
      </div>
      
      {/* Hexagons */}
      <svg className="absolute top-1/3 right-1/3 w-20 h-20 animate-rotate" style={{ animationDuration: '40s' }}>
        <polygon
          points="50,5 90,25 90,65 50,85 10,65 10,25"
          fill="none"
          stroke="rgba(220, 38, 38, 0.2)"
          strokeWidth="2"
        />
      </svg>
      
      {/* Circles */}
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full border-2 border-[#DC2626]/20 animate-pulse-slow"></div>
      <div className="absolute top-1/2 left-1/5 w-12 h-12 rounded-full border-2 border-[#DC2626]/20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}

