import { getCharacters, getCollections, getProductsByCategory } from "@/lib/api-client";
import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import { Reveal } from "@/components/Reveal";
import type { PillGroup } from "@/components/CategoryPills";
import { Container, Section } from "@repo/ui";

export const revalidate = 0;

interface ShopCategoryPageProps {
  params: { category: string };
  searchParams: { collection?: string; character?: string; sort?: string };
}

export default async function ShopCategoryPage({ params, searchParams }: ShopCategoryPageProps) {
  // Category is fixed by the URL segment here, so only collection/character
  // remain as pill filters (no "category" group, unlike the general /shop page).
  const [collections, characters, products] = await Promise.all([
    getCollections(),
    getCharacters(),
    getProductsByCategory(params.category, {
      collection: searchParams.collection,
      character: searchParams.character,
      sort: searchParams.sort as "newest" | "price_asc" | "price_desc" | undefined,
    }),
  ]);

  const groups: PillGroup[] = [
    { key: "collection", options: collections.map((c) => ({ label: c.name, value: c.slug })) },
    { key: "character", options: characters.map((c) => ({ label: c.name, value: c.slug })) },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <h1 className="font-heading text-3xl font-bold capitalize">
            {params.category.replace(/_/g, " ")}
          </h1>
        </Reveal>
        <div className="mt-6">
          <FilterBar groups={groups} />
        </div>
        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      </Container>
    </Section>
  );
}
