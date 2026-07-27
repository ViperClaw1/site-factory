import { getCharacters, getCollections, getProducts } from "@/lib/api-client";
import { CharacterCard } from "@/components/CharacterCard";
import { CollectionCard } from "@/components/CollectionCard";
import { HorizontalScroll } from "@/components/HorizontalScroll";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice } from "@repo/lib";
import { Button, Container, Grid, ImageWithFallback, Section } from "@repo/ui";
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
          {featuredDrop ? (
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black/5">
                {featuredDrop.images[0] && (
                  <ImageWithFallback
                    src={featuredDrop.images[0].url}
                    alt={featuredDrop.images[0].alt ?? featuredDrop.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-black/50">Featured Drop</p>
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
            <div>
              <h1 className="font-heading text-4xl font-bold">Path Animation Marketplace</h1>
              <p className="mt-4 max-w-xl text-black/70">
                Collectible toys, art, and digital drops — coming soon.
              </p>
            </div>
          )}
        </Container>
      </Section>

      {/* New arrivals: horizontal, swipeable via Embla on touch devices. */}
      {newArrivals.length > 0 && (
        <Section>
          <Container>
            <h2 className="font-heading text-2xl font-bold">New Arrivals</h2>
            <div className="mt-6">
              <HorizontalScroll>
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </HorizontalScroll>
            </div>
          </Container>
        </Section>
      )}

      {/* Collections grid: editorial entry points into the catalog. */}
      {collections.length > 0 && (
        <Section>
          <Container>
            <h2 className="font-heading text-2xl font-bold">Collections</h2>
            <Grid cols={3} className="mt-6">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </Grid>
          </Container>
        </Section>
      )}

      {/* Character browser strip. */}
      {characters.length > 0 && (
        <Section>
          <Container>
            <h2 className="font-heading text-2xl font-bold">Characters</h2>
            <div className="mt-6 flex gap-6 overflow-x-auto pb-2">
              {characters.map((character) => (
                <div key={character.id} className="w-28 shrink-0">
                  <CharacterCard character={character} />
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
