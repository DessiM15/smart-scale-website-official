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
  className = "object-cover",
  sizes,
  priority = false,
}: BlogCoverImageProps) {
  // Try .jpg first since that's what the files are
  const [imgSrc, setImgSrc] = useState(`${src}.jpg`);
  const [errorCount, setErrorCount] = useState(0);

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
    }
  };

  // If all image formats failed, show gradient fallback
  if (!imgSrc) {
    return (
      <div
        className={className}
        style={{
          background: "linear-gradient(135deg, #1F2937 0%, #000000 100%), radial-gradient(circle at 30% 30%, rgba(220,38,38,0.3) 0%, transparent 50%)",
        }}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={handleError}
      unoptimized
    />
  );
}

