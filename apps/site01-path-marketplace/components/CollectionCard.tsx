import { ImageWithFallback } from "@repo/ui";
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
      {/* Cover image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5">
        {collection.hero_image ? (
          <ImageWithFallback
            src={collection.hero_image}
            alt={collection.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <i className="fa-solid fa-images text-4xl text-black/20" aria-hidden="true" />
          </div>
        )}
        <span className="absolute bottom-0 left-0 h-1.5 w-12 bg-pink transition-all duration-300 group-hover:w-full" />
      </div>

      {/* Series, name, claimed progress */}
      <div className="space-y-2 pt-4">
        {collection.series && <p className="eyebrow text-black/45">{collection.series}</p>}
        <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-pink">{collection.name}</h3>
        {soldPercent !== null && (
          <div className="space-y-1">
            <Progress.Root className="h-1.5 w-full overflow-hidden bg-black/10">
              <Progress.Indicator
                className="h-full bg-pink transition-transform"
                style={{ transform: `translateX(-${100 - soldPercent}%)` }}
              />
            </Progress.Root>
            <p className="text-xs text-black/50">{soldPercent}% claimed</p>
          </div>
        )}
      </div>
    </Link>
  );
}
