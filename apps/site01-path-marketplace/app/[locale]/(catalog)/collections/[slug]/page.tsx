import { getCollection, getProducts } from "@/lib/api-client";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { generateMetadata as seo } from "@repo/lib";
import { Container, ImageWithFallback } from "@repo/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return {};
  return seo(
    collection.name,
    (collection.description ?? `The ${collection.name} collection.`).slice(0, 160),
    collection.hero_image ?? undefined,
    `/collections/${collection.slug}`
  );
}

export default async function CollectionDetailPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  // Products aren't Directus content — pull the ones tagged with this
  // collection straight from the commerce DB.
  const products = await getProducts({ collection: collection.slug });

  return (
    <>
      {/* Full-bleed cover image */}
      {collection.hero_image && (
        <div className="relative h-[50vh] w-full">
          <ImageWithFallback src={collection.hero_image} alt={collection.name} fill sizes="100vw" className="object-cover" />
        </div>
      )}

      <PageHeader eyebrow="page.collection" titleText={collection.name}>
        {collection.series && <p className="eyebrow mt-3 text-pink">{collection.series}</p>}
        {collection.description && <p className="mt-4 max-w-2xl text-black/65">{collection.description}</p>}
      </PageHeader>

      <Container className="py-10">
        <ProductGrid products={products} />
      </Container>
    </>
  );
}
