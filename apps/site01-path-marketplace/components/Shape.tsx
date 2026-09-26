// Decorative Memphis geometry (circles, rings, triangles, squares, dot grids,
// squiggles). Purely presentational: positioned by the caller via className,
// colored via `currentColor` (i.e. a text-* class), hidden from assistive tech.

export type ShapeKind = "circle" | "ring" | "triangle" | "square" | "diamond" | "dots" | "squiggle";

export interface ShapeProps {
  kind: ShapeKind;
  className?: string;
}

export function Shape({ kind, className = "" }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      fill="currentColor"
    >
      {kind === "circle" && <circle cx="50" cy="50" r="50" />}
      {kind === "ring" && <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="12" />}
      {kind === "triangle" && <polygon points="50,4 96,92 4,92" />}
      {kind === "square" && <rect width="100" height="100" />}
      {kind === "diamond" && <polygon points="50,0 100,50 50,100 0,50" />}
      {kind === "dots" &&
        Array.from({ length: 25 }).map((_, i) => (
          <circle key={i} cx={10 + (i % 5) * 20} cy={10 + Math.floor(i / 5) * 20} r="4" />
        ))}
      {kind === "squiggle" && (
        <path
          d="M2 50 Q14.5 22 27 50 T52 50 T77 50 T98 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
