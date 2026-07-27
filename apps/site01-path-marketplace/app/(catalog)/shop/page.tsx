import { getCharacters, getCollections, getProducts } from "@/lib/api-client";
import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import type { PillGroup } from "@/components/CategoryPills";
import { Container, Section } from "@repo/ui";

export const revalidate = 0;

// Fixed taxonomy matching the seeded product categories (see Phase 1 schema).
const CATEGORY_OPTIONS = [
  { label: "Toys", value: "toys" },
  { label: "Collectible Toys", value: "collectible_toys" },
  { label: "Books", value: "books" },
  { label: "Artbooks", value: "artbooks" },
  { label: "Designs", value: "designs" },
  { label: "Merch", value: "merch" },
  { label: "Figures", value: "figures" },
];

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
    { key: "category", options: CATEGORY_OPTIONS },
    { key: "collection", options: collections.map((c) => ({ label: c.name, value: c.slug })) },
    { key: "character", options: characters.map((c) => ({ label: c.name, value: c.slug })) },
  ];

  return (
    <Section>
      <Container>
        <h1 className="font-heading text-3xl font-bold">Shop</h1>
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
