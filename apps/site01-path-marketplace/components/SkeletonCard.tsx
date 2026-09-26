// Mirrors ProductCard's shape (square image, character/title lines, price row)
// so the swap from skeleton to real content doesn't jump.
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square w-full bg-black/5" />
      <div className="space-y-2 pt-3">
        <div className="h-2 w-1/4 bg-black/5" />
        <div className="h-3 w-3/4 bg-black/5" />
        <div className="flex justify-between pt-2">
          <div className="h-3 w-1/4 bg-black/5" />
          <div className="h-5 w-1/4 bg-black/5" />
        </div>
      </div>
    </div>
  );
}
