import { getCharacter, getProducts } from "@/lib/api-client";
import { ProductGrid } from "@/components/ProductGrid";
import { Reveal } from "@/components/Reveal";
import {
  PLACEHOLDER_CHARACTER_DESCRIPTION,
  placeholderCharacterName,
  placeholderIndexFromSlug,
} from "@/lib/placeholders";
import { Container, ImageWithFallback, Section } from "@repo/ui";
import type { Character } from "@repo/types";
import { notFound } from "next/navigation";

export const revalidate = 0;

// Same "placeholder-N" convention as products — lets a placeholder character
// card link somewhere real instead of a dead end while Directus has none yet.
function buildPlaceholderCharacter(slug: string): Character {
  const index = placeholderIndexFromSlug(slug);
  return {
    id: slug,
    slug,
    name: placeholderCharacterName(index),
    description: PLACEHOLDER_CHARACTER_DESCRIPTION,
    image: null,
    status: "published",
  };
}

export default async function CharacterDetailPage({ params }: { params: { slug: string } }) {
  let character = await getCharacter(params.slug);

  if (!character) {
    if (!params.slug.startsWith("placeholder-")) notFound();
    character = buildPlaceholderCharacter(params.slug);
  }

  // No real product is ever tagged with a "placeholder-N" character slug, so
  // this naturally returns [] for placeholder characters — no extra branch needed.
  const products = await getProducts({ character: character.slug });

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-black/5">
              {character.image ? (
                <ImageWithFallback src={character.image} alt={character.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <i className="fa-solid fa-user text-2xl text-black/20" aria-hidden="true" />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold">{character.name}</h1>
              {character.description && <p className="mt-2 max-w-xl text-black/70">{character.description}</p>}
            </div>
          </div>
        </Reveal>
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </Container>
    </Section>
  );
}
