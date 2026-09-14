import { getCharacter, getProducts } from "@/lib/api-client";
import { ProductGrid } from "@/components/ProductGrid";
import { Reveal } from "@/components/Reveal";
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
