import { getCollections } from "@/lib/api-client";
import { CollectionCard } from "@/components/CollectionCard";
import { PlaceholderCard } from "@/components/PlaceholderCard";
import { placeholderIcon } from "@/lib/placeholders";
import { Reveal } from "@/components/Reveal";
import { RevealGrid } from "@/components/RevealGrid";
import { Container, Section } from "@repo/ui";

// revalidate = 0: never time-based cached — Directus's webhook hits
// /api/revalidate on publish instead, so this route renders per-request.
export const revalidate = 0;

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <Section>
      <Container>
        <Reveal>
          <h1 className="font-heading text-3xl font-bold">Collections</h1>
        </Reveal>
        <RevealGrid className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.length > 0
            ? collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)
            : Array.from({ length: 6 }).map((_, index) => (
                <PlaceholderCard key={index} icon={placeholderIcon(index)} />
              ))}
        </RevealGrid>
      </Container>
    </Section>
  );
}
