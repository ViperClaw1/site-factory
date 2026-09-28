import { getCharacter, getProducts } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import {
  placeholderCharacter,
  placeholderIndexFromSlug,
  showcaseItemsForCharacter,
} from "@/lib/placeholders";
import { generateMetadata as seo } from "@repo/lib";
import { Container, ImageWithFallback } from "@repo/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const character = await getCharacter(params.slug);
  // Placeholder characters are demo content — keep them out of the index.
  if (!character) return { robots: { index: false } };
  return seo(
    character.name,
    (character.description ?? `Collectibles featuring ${character.name}.`).slice(0, 160),
    character.image ?? undefined,
    `/characters/${character.slug}`
  );
}

export default async function CharacterDetailPage({ params }: { params: { slug: string } }) {
  // Same "placeholder-N" convention as products — showcase IPs resolve to a
  // real page instead of a dead end while Directus has none yet.
  let character = await getCharacter(params.slug);
  if (!character) {
    if (!params.slug.startsWith("placeholder-")) notFound();
    character = placeholderCharacter(placeholderIndexFromSlug(params.slug));
  }

  // No real product is tagged with a "placeholder-N" slug, so placeholder
  // characters fall through to their showcase items via fallbackItems.
  const products = await getProducts({ character: character.slug });
  const showcase = showcaseItemsForCharacter(character.name);

  return (
    <>
      <PageHeader eyebrow="page.character" titleText={character.name}>
        {character.description && <p className="mt-3 max-w-xl text-black/65">{character.description}</p>}
      </PageHeader>

      <Container className="py-10">
        {/* Avatar strip */}
        <div className="relative -mt-20 mb-10 h-28 w-28 overflow-hidden rounded-full bg-white ring-4 ring-pink ring-offset-4">
          {character.image ? (
            <ImageWithFallback src={character.image} alt={character.name} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <i className="fa-solid fa-user text-3xl text-black/20" aria-hidden="true" />
            </div>
          )}
        </div>

        <ProductGrid products={products} fallbackItems={showcase.length > 0 ? showcase : undefined} />
      </Container>
    </>
  );
}
