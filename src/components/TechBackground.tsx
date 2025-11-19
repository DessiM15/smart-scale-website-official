"use client";

export default function TechBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hero-bg-fade">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black"></div>
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      ></div>
      
      {/* Diagonal grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(220, 38, 38, 0.05) 10px,
              rgba(220, 38, 38, 0.05) 20px
            )
          `,
        }}
      ></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Circuit-like lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M0,50 L50,50 M50,0 L50,100 M50,50 L100,50" stroke="#DC2626" strokeWidth="1" fill="none"/>
            <circle cx="50" cy="50" r="3" fill="#DC2626"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)"/>
      </svg>
      
      {/* Hexagonal pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(220, 38, 38, 0.3) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      ></div>
      
      {/* Corner accent lines */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#DC2626] opacity-20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-[#DC2626] opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-[#DC2626] opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#DC2626] opacity-20"></div>
    </div>
  );
}

