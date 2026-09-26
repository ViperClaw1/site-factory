import { Shape, type ShapeKind } from "./Shape";

export interface PlaceholderCardProps {
  index: number;
}

const TINTS = ["bg-pink-soft text-pink", "bg-sun-soft text-sun", "bg-electric-soft text-electric"];
const KINDS: ShapeKind[] = ["circle", "triangle", "square", "ring", "diamond", "dots"];

// Non-linking skeleton tile for content types with no placeholder detail page
// yet (collections): a tinted panel with one Memphis shape and grey text bars.
export function PlaceholderCard({ index }: PlaceholderCardProps) {
  return (
    <div>
      <div className={`relative aspect-[4/5] overflow-hidden ${TINTS[index % TINTS.length]}`}>
        <Shape kind={KINDS[index % KINDS.length]!} className="left-1/2 top-1/2 h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2 opacity-60" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-3 w-3/4 bg-black/10" />
        <div className="h-3 w-1/3 bg-black/10" />
      </div>
    </div>
  );
}
