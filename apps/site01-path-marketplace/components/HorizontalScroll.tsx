"use client";

import useEmblaCarousel from "embla-carousel-react";
import type { ReactNode } from "react";

export interface HorizontalScrollProps {
  children: ReactNode[];
}

export function HorizontalScroll({ children }: HorizontalScrollProps) {
  const [emblaRef] = useEmblaCarousel({ align: "start", dragFree: true });

  return (
    <div className="overflow-hidden" ref={emblaRef} style={{ scrollSnapType: "x mandatory" }}>
      <div className="flex gap-4">
        {children.map((child, index) => (
          <div
            key={index}
            className="min-w-[70%] shrink-0 sm:min-w-[40%] lg:min-w-[24%]"
            style={{ scrollSnapAlign: "start" }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
