import { Card, ImageWithFallback } from "@repo/ui";
import * as Progress from "@radix-ui/react-progress";
import type { Collection } from "@repo/types";
import Link from "next/link";

export interface CollectionCardProps {
  collection: Collection;
  // Aggregate stats computed by the page (sum across the collection's
  // products) — kept out of this component so it stays a plain presentational
  // server component instead of doing its own Supabase query per card.
  stats?: { sold: number; total: number };
}

export function CollectionCard({ collection, stats }: CollectionCardProps) {
  const soldPercent = stats && stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : null;

  return (
    <Link href={`/collections/${collection.slug}`} className="group block">
      <Card className="overflow-hidden">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5">
          {collection.hero_image ? (
            <ImageWithFallback
              src={collection.hero_image}
              alt={collection.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <i className="fa-solid fa-images text-4xl text-black/20" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="space-y-2 p-5">
          {collection.series && (
            <p className="text-xs uppercase tracking-wide text-black/50">{collection.series}</p>
          )}
          <h3 className="font-heading text-lg font-semibold">{collection.name}</h3>
          {soldPercent !== null && (
            <div className="space-y-1">
              <Progress.Root className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                <Progress.Indicator
                  className="h-full bg-[var(--color-primary)] transition-transform"
                  style={{ transform: `translateX(-${100 - soldPercent}%)` }}
                />
              </Progress.Root>
              <p className="text-xs text-black/50">{soldPercent}% claimed</p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
