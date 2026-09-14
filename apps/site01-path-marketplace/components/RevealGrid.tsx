"use client";

import { staggerContainer, staggerItem } from "@repo/lib";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export interface RevealGridProps {
  // Full grid/flex layout classes for the wrapper — callers pass the same
  // classes they'd otherwise pass to <Grid> or a raw grid div.
  className: string;
  children: ReactNode[];
}

// Same "accept an array of already-rendered children" shape as
// HorizontalScroll, but staggers each child in on scroll instead of making
// them swipeable.
export function RevealGrid({ className, children }: RevealGridProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={staggerContainer}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
