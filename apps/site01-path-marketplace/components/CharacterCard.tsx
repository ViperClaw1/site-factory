import { Card, ImageWithFallback } from "@repo/ui";
import type { Character } from "@repo/types";
import Link from "next/link";

export interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link href={`/characters/${character.slug}`} className="group block text-center">
      <Card className="overflow-hidden rounded-full">
        <div className="relative aspect-square w-full overflow-hidden bg-black/5">
          {character.image && (
            <ImageWithFallback
              src={character.image}
              alt={character.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
      </Card>
      <p className="mt-2 font-heading text-sm font-semibold">{character.name}</p>
    </Link>
  );
}
