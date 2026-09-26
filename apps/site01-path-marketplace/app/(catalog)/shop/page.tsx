import { getCharacters, getCollections, getProducts } from "@/lib/api-client";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import type { PillGroup } from "@/components/CategoryPills";
import { SHOWCASE_ITEMS } from "@/lib/placeholders";
import { SHOP_CATEGORY_OPTIONS } from "@/lib/shop-categories";
import { Container } from "@repo/ui";

export const revalidate = 0;

interface ShopPageProps {
  searchParams: {
    category?: string;
    collection?: string;
    character?: string;
    sort?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  // Collections/characters come from Directus (for the filter pill labels),
  // products come from Supabase (the actual catalog) — fetched in parallel.
  const [collections, characters, products] = await Promise.all([
    getCollections(),
    getCharacters(),
    getProducts({
      category: searchParams.category,
      collection: searchParams.collection,
      character: searchParams.character,
      sort: searchParams.sort as "newest" | "price_asc" | "price_desc" | undefined,
    }),
  ]);

  const groups: PillGroup[] = [
    { key: "category", options: SHOP_CATEGORY_OPTIONS },
    { key: "collection", options: collections.map((c) => ({ label: c.name, value: c.slug })) },
    { key: "character", options: characters.map((c) => ({ label: c.name, value: c.slug })) },
  ];

  // Showcase preview honours the category pill too (whole showcase otherwise).
  const categoryShowcase = SHOWCASE_ITEMS.filter((item) => item.category === searchParams.category);

  return (
    <>
      <PageHeader title="page.shop" />
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
