import { Card } from "@repo/ui";

export interface PlaceholderCardProps {
  icon?: string;
  rounded?: boolean;
}

// Font Awesome classes (loaded via CDN in app/layout.tsx) cycled across
// placeholder cards so an empty grid doesn't look like N copies of one icon.
const PLACEHOLDER_ICONS = [
  "fa-solid fa-gift",
  "fa-solid fa-box-open",
  "fa-solid fa-shirt",
  "fa-solid fa-palette",
  "fa-solid fa-dice-d20",
  "fa-solid fa-puzzle-piece",
  "fa-solid fa-star",
  "fa-solid fa-robot",
];

export function placeholderIcon(index: number): string {
  return PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length]!;
}

// Stand-in for ProductCard/CollectionCard/CharacterCard when there's no real
// data yet — same Card shell and image-slot proportions, an icon instead of a
// photo, so "coming soon" states look designed rather than empty.
export function PlaceholderCard({ icon = PLACEHOLDER_ICONS[0], rounded = false }: PlaceholderCardProps) {
  return (
    <Card className={`overflow-hidden ${rounded ? "rounded-full" : ""}`}>
      <div className="flex aspect-square w-full items-center justify-center bg-black/5">
        <i className={`${icon} text-4xl text-black/20`} aria-hidden="true" />
      </div>
      {!rounded && (
        <div className="space-y-2 p-4">
          <div className="h-3 w-3/4 rounded bg-black/10" />
          <div className="h-3 w-1/3 rounded bg-black/10" />
        </div>
      )}
    </Card>
  );
}
