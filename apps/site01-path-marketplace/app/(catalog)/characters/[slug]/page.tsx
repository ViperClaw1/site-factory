import { getCharacter, getProducts } from "@/lib/api-client";
import { ProductGrid } from "@/components/ProductGrid";
import { Container, ImageWithFallback, Section } from "@repo/ui";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function CharacterDetailPage({ params }: { params: { slug: string } }) {
  const character = await getCharacter(params.slug);
  if (!character) notFound();

  const products = await getProducts({ character: character.slug });

  return (
    <Section>
      <Container>
        <div className="flex items-center gap-6">
          {character.image && (
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-black/5">
              <ImageWithFallback src={character.image} alt={character.name} fill className="object-cover" />
            </div>
          )}
          <div>
            <h1 className="font-heading text-3xl font-bold">{character.name}</h1>
            {character.description && <p className="mt-2 max-w-xl text-black/70">{character.description}</p>}
          </div>
        </div>
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </Container>
    </Section>
  );
}
