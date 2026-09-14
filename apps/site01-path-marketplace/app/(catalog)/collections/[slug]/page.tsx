import { getCollection, getProducts } from "@/lib/api-client";
import { ProductGrid } from "@/components/ProductGrid";
import { Reveal } from "@/components/Reveal";
import { Container, ImageWithFallback, Section } from "@repo/ui";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function CollectionDetailPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  // Products aren't Directus content — pull the ones tagged with this
  // collection straight from the commerce DB.
  const products = await getProducts({ collection: collection.slug });

  return (
    <>
      {collection.hero_image && (
        <div className="relative h-[50vh] w-full">
          <ImageWithFallback
            src={collection.hero_image}
            alt={collection.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <Section>
        <Container>
          <Reveal>
            {collection.series && (
              <p className="text-xs uppercase tracking-wide text-[var(--color-primary)]">{collection.series}</p>
            )}
            <h1 className="font-heading text-3xl font-bold">{collection.name}</h1>
            {collection.description && (
              <p className="mt-4 max-w-2xl text-black/70">{collection.description}</p>
            )}
          </Reveal>
          <div className="mt-10">
            <ProductGrid products={products} />
          </div>
        </Container>
      </Section>
    </>
  );
}
