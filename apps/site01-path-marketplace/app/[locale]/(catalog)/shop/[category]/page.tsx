import { getCharacters, getCollections, getProductsByCategory } from "@/lib/api-client";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import type { PillGroup } from "@/components/CategoryPills";
import { SHOWCASE_ITEMS } from "@/lib/placeholders";
import { categoryLabelKey } from "@/lib/shop-categories";
import { generateMetadata as seo } from "@repo/lib";
import { Container } from "@repo/ui";
import type { Metadata } from "next";

export const revalidate = 60;

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  // Unknown slugs still render (empty grid + showcase) — don't index them.
  if (!categoryLabelKey(params.category)) return { robots: { index: false } };
  const name = params.category.replace(/_/g, " ");
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  // Canonical drops ?collection/character/sort so filtered views don't compete with the category page.
  return seo(title, `Shop ${name} — designer toys, figures, art books and digital collectibles.`, undefined, `/shop/${params.category}`);
}

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
