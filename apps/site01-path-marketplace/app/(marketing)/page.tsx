import { getCharacters, getProducts } from "@/lib/api-client";
import { toCardItem } from "@/lib/to-card-item";
import { FRESH_SALE_DEALS, SHOWCASE_ITEMS, SHOWCASE_NEW_ARRIVALS, placeholderCharacters } from "@/lib/placeholders";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CharacterShowcase } from "@/components/home/CharacterShowcase";
import { FlashSale } from "@/components/home/FlashSale";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { RevealGrid } from "@/components/RevealGrid";
import { SectionHeading } from "@/components/SectionHeading";

export const revalidate = 60;

export default async function HomePage() {
  // Catalog (Supabase) + character IPs (Directus), fetched in parallel.
  const [products, characters] = await Promise.all([getProducts({ sort: "newest" }), getCharacters()]);

  // Fall back to the showcase catalog while the real one is empty, so the
  // storefront is fully populated and every card leads to a working PDP.
  const isShowcase = products.length === 0;
  const items = isShowcase ? SHOWCASE_ITEMS : products.slice(0, 12).map(toCardItem);
  const newArrivals = isShowcase ? SHOWCASE_NEW_ARRIVALS : products.slice(0, 6).map(toCardItem);
  // Character tabs: Directus characters when published, otherwise the distinct
  // `character` values on the products themselves (capitalised for display).
  const productCharacters = Array.from(new Set(items.map((item) => item.characterKey).filter(Boolean) as string[]));
  const tabs = isShowcase
    ? placeholderCharacters().map((character) => ({ key: character.name.toLowerCase(), name: character.name }))
    : characters.length > 0
      ? characters.map((character) => ({ key: character.slug, name: character.name }))
      : productCharacters.map((key) => ({ key, name: key.charAt(0).toUpperCase() + key.slice(1) }));

  return (
    <>
      <HeroCarousel />

      <CharacterShowcase items={items} tabs={tabs} />

      <CategoryGrid />

      <FlashSale deals={FRESH_SALE_DEALS} />

      {/* New Arrivals: 6-column strip of the newest items. */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="section.newArrivals.eyebrow"
            title="section.newArrivals.title"
            viewAllHref="/shop?sort=newest"
          />
          <RevealGrid className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {newArrivals.map((item) => (
              <ProductCard key={item.id} item={item} compact authGate />
            ))}
          </RevealGrid>
        </div>
      </section>
    </>
  );
}
