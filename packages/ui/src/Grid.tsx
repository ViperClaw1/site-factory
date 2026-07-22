import type { HTMLAttributes, ReactNode } from "react";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4;
  children: ReactNode;
}

const colsClasses: Record<NonNullable<GridProps["cols"]>, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function Grid({ cols = 3, className = "", children, ...props }: GridProps) {
  return (
    <div className={`grid gap-6 ${colsClasses[cols]} ${className}`} {...props}>
      {children}
    </div>
  );
}
