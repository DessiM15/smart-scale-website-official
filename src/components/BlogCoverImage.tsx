"use client";

import Image from "next/image";
import { useState } from "react";

interface BlogCoverImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function BlogCoverImage({
  src,
  alt,
  fill = true,
  className = "object-cover transition-opacity duration-300",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}: BlogCoverImageProps) {
  // Try .jpg first since that's what the files are
  const [imgSrc, setImgSrc] = useState(`${src}.jpg`);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (errorCount === 0) {
      // Try .webp
      setImgSrc(`${src}.webp`);
      setErrorCount(1);
    } else if (errorCount === 1) {
      // Try .png
      setImgSrc(`${src}.png`);
      setErrorCount(2);
    } else {
      // All formats failed, use gradient fallback
      setImgSrc("");
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If all image formats failed, show gradient fallback
  if (!imgSrc || hasError) {
    return (
      <div
        className={`${className} flex items-center justify-center`}
        style={{
          background: "linear-gradient(135deg, #1F2937 0%, #000000 100%), radial-gradient(circle at 30% 30%, rgba(220,38,38,0.3) 0%, transparent 50%)",
        }}
      >
        <div className="text-white/50 text-sm font-medium">Image Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
          }}
        />
      )}
      
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        sizes={sizes}
        priority={priority}
        quality={75}
        onError={handleError}
        onLoad={handleLoad}
        // Enable optimization - remove unoptimized
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  );
}

