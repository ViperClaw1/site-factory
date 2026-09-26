import { getCharacters, getCollections, getProductsByCategory } from "@/lib/api-client";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import type { PillGroup } from "@/components/CategoryPills";
import { SHOWCASE_ITEMS } from "@/lib/placeholders";
import { categoryLabelKey } from "@/lib/shop-categories";
import { Container } from "@repo/ui";

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

  // Showcase preview limited to this category (whole showcase if none match).
  const categoryShowcase = SHOWCASE_ITEMS.filter((item) => item.category === params.category);
  const labelKey = categoryLabelKey(params.category);

  return (
    <>
      <PageHeader
        title={labelKey ?? undefined}
        titleText={labelKey ? undefined : params.category.replace(/_/g, " ")}
      />
      <Container className="py-10">
        <FilterBar groups={groups} />
        <div className="mt-10">
          <ProductGrid
            products={products}
            fallbackItems={categoryShowcase.length > 0 ? categoryShowcase : SHOWCASE_ITEMS}
          />
        </div>
      </Container>
    </>
  );
}
