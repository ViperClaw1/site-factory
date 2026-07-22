import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-[var(--color-bg)] border border-black/5 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
