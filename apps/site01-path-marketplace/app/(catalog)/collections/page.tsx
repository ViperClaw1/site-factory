import { getCollections } from "@/lib/api-client";
import { CollectionCard } from "@/components/CollectionCard";
import { Container, Grid, Section } from "@repo/ui";

// revalidate = 0: never time-based cached — Directus's webhook hits
// /api/revalidate on publish instead, so this route renders per-request.
export const revalidate = 0;

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <Section>
      <Container>
        <h1 className="font-heading text-3xl font-bold">Collections</h1>
        <Grid cols={3} className="mt-8">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
