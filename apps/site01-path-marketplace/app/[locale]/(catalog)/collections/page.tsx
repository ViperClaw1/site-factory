import { getCollections } from "@/lib/api-client";
import { CollectionCard } from "@/components/CollectionCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PlaceholderCard } from "@/components/PlaceholderCard";
import { RevealGrid } from "@/components/RevealGrid";
import { Container } from "@repo/ui";

// ISR: cached, regenerated at most every 60s (ADR-004 fallback TTL);
// Directus's webhook hits /api/revalidate on publish to refresh it sooner.
export const revalidate = 60;

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <>
      <PageHeader title="page.collections" />
      <Container className="py-10">
        {/* Published collections — or a notice plus skeleton tiles while none exist. */}
        {collections.length === 0 && <EmptyState messageKey="empty.collections" />}
        <RevealGrid className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {collections.length > 0
            ? collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)
            : Array.from({ length: 6 }).map((_, index) => <PlaceholderCard key={index} index={index} />)}
        </RevealGrid>
      </Container>
    </>
  );
}
