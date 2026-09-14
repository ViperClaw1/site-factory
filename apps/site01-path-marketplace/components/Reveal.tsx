"use client";

import { fadeUp } from "@repo/lib";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  className?: string;
}

// Client island: fades/slides a block in once it scrolls into view, using the
// shared fadeUp variant from @repo/lib/animations instead of a one-off here.
export function Reveal({ children, className }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}
