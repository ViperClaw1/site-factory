import { getCharacters, getCollections, getProducts } from "@/lib/api-client";
import { CharacterCard } from "@/components/CharacterCard";
import { CollectionCard } from "@/components/CollectionCard";
import { HorizontalScroll } from "@/components/HorizontalScroll";
import { PlaceholderCard } from "@/components/PlaceholderCard";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { RevealGrid } from "@/components/RevealGrid";
import {
  placeholderCharacterCardProps,
  placeholderIcon,
  placeholderProductCardProps,
} from "@/lib/placeholders";
import { formatPrice } from "@repo/lib";
import { Button, Container, ImageWithFallback, Section } from "@repo/ui";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  const [products, collections, characters] = await Promise.all([
    getProducts({ sort: "newest" }),
    getCollections(),
    getCharacters(),
  ]);

  const featuredDrop = products.find((product) => product.is_collectible) ?? products[0];
  const newArrivals = products.slice(0, 8);

  return (
    <>
      {/* Hero: the current featured drop, or a placeholder headline while the catalog is still empty. */}
      <Section className="pt-8">
        <Container>
          <Reveal>
            {featuredDrop ? (
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black/5">
                  {featuredDrop.images[0] ? (
                    <ImageWithFallback
                      src={featuredDrop.images[0].url}
                      alt={featuredDrop.images[0].alt ?? featuredDrop.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <i className="fa-solid fa-gift text-6xl text-black/20" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-primary)]">Featured Drop</p>
                  <h1 className="mt-2 font-heading text-4xl font-bold">{featuredDrop.title}</h1>
                  {featuredDrop.description && (
                    <p className="mt-4 text-black/70">{featuredDrop.description}</p>
                  )}
                  <p className="mt-4 text-lg font-semibold">
                    {formatPrice(featuredDrop.base_price, featuredDrop.currency)}
                  </p>
                  <Link href={`/p/${featuredDrop.slug}`}>
                    <Button className="mt-6">View drop</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-black/5">
                  <i className="fa-solid fa-shop text-6xl text-black/20" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-primary)]">Coming Soon</p>
                  <h1 className="mt-2 font-heading text-4xl font-bold">Path Animation Marketplace</h1>
                  <p className="mt-4 max-w-xl text-black/70">
                    Collectible toys, art, and digital drops — coming soon. Browse a placeholder drop below
                    to try the shopping flow.
                  </p>
                  <Link href="/p/placeholder-0">
                    <Button className="mt-6">Preview a sample product</Button>
                  </Link>
                </div>
              </div>
            )}
          </Reveal>
        </Container>
      </Section>

      {/* New arrivals: horizontal, swipeable via Embla on touch devices — or placeholder cards (linking to a real PDP) while the catalog is empty. */}
      <Section>
        <Container>
          <Reveal>
            <h2 className="font-heading text-2xl font-bold">New Arrivals</h2>
          </Reveal>
          <div className="mt-6">
            {newArrivals.length > 0 ? (
              <HorizontalScroll>
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </HorizontalScroll>
            ) : (
              <RevealGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <PlaceholderCard key={index} {...placeholderProductCardProps(index)} />
                ))}
              </RevealGrid>
            )}
          </div>
        </Container>
      </Section>

      {/* Collections grid: editorial entry points into the catalog — or placeholder cards while none are published. */}
      <Section>
        <Container>
          <Reveal>
            <h2 className="font-heading text-2xl font-bold">Collections</h2>
          </Reveal>
          <RevealGrid className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.length > 0
              ? collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)
              : Array.from({ length: 3 }).map((_, index) => (
                  <PlaceholderCard key={index} icon={placeholderIcon(index + 3)} />
                ))}
          </RevealGrid>
        </Container>
      </Section>

      {/* Character browser strip — or placeholder avatars (linking to a real character page) while none are published. */}
      <Section>
        <Container>
          <Reveal>
            <h2 className="font-heading text-2xl font-bold">Characters</h2>
          </Reveal>
          <RevealGrid className="mt-6 flex gap-6 overflow-x-auto pb-2">
            {characters.length > 0
              ? characters.map((character) => (
                  <div key={character.id} className="w-28 shrink-0">
                    <CharacterCard character={character} />
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="w-28 shrink-0">
                    <PlaceholderCard {...placeholderCharacterCardProps(index)} rounded />
                  </div>
                ))}
          </RevealGrid>
        </Container>
      </Section>
    </>
  );
}
