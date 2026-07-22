import type { HTMLAttributes } from "react";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

export function Spinner({ size = 20, className = "", ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] ${className}`}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}
