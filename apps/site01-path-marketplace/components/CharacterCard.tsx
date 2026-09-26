import { ImageWithFallback } from "@repo/ui";
import type { Character } from "@repo/types";
import Link from "next/link";

export interface CharacterCardProps {
  character: Character;
  index?: number;
}

// Rings cycle the Memphis palette so a row of avatars reads as a set.
const RINGS = ["ring-pink", "ring-sun", "ring-electric"];

export function CharacterCard({ character, index = 0 }: CharacterCardProps) {
  return (
    <Link href={`/characters/${character.slug}`} className="group block text-center">
      <div
        className={`relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-black/5 ring-4 ring-offset-4 transition-transform duration-300 group-hover:-translate-y-1 ${
          RINGS[index % RINGS.length]
        }`}
      >
        {character.image ? (
          <ImageWithFallback
            src={character.image}
            alt={character.name}
            fill
            sizes="(min-width: 1024px) 20vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <i className="fa-solid fa-user text-4xl text-black/20" aria-hidden="true" />
          </div>
        )}
      </div>
      <p className="font-display mt-4 text-xl text-ink transition-colors group-hover:text-pink">{character.name}</p>
    </Link>
  );
}
