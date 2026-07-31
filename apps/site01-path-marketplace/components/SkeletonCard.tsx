import { Card } from "@repo/ui";

// Mirrors ProductCard's shape (aspect-square image, title line, price line)
// so the swap from skeleton to real content doesn't jump.
export function SkeletonCard() {
  return (
    <Card className="animate-pulse overflow-hidden">
      <div className="aspect-square w-full bg-black/5" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-black/5" />
        <div className="h-4 w-1/3 rounded bg-black/5" />
      </div>
    </Card>
  );
}
