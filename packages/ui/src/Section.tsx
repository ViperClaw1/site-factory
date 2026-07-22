import type { HTMLAttributes, ReactNode } from "react";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Section({ className = "", children, ...props }: SectionProps) {
  return (
    <section className={`py-18 xs:py-22 ${className}`} {...props}>
      {children}
    </section>
  );
}
