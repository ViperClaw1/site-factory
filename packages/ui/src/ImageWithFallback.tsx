"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "/images/fallback.png";

export function ImageWithFallback({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}
