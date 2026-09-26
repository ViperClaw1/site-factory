import { getProduct } from "@/lib/api-client";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { Reveal } from "@/components/Reveal";
import { Shape } from "@/components/Shape";
import { T } from "@/components/T";
import {
  PLACEHOLDER_PRODUCT_DESCRIPTION,
  placeholderIndexFromSlug,
  placeholderProduct,
} from "@/lib/placeholders";
import { CatalogImage } from "@/components/CatalogImage";
import { blurhashToDataUrl } from "@/lib/blurhash";
import { Container } from "@repo/ui";
import type { Product } from "@repo/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

// "placeholder-N" slugs never hit Supabase — they resolve to the matching
// showcase item so placeholder cards link somewhere real to exercise the
// browse → cart → checkout flow before actual products exist.
function buildPlaceholderProduct(slug: string): { product: Product; character: string | null; soldOut: boolean } {
  const item = placeholderProduct(placeholderIndexFromSlug(slug));
  const now = new Date().toISOString();
  return {
    character: item.character ?? null,
    soldOut: item.soldOut ?? false,
    product: {
      id: slug,
      slug,
      title: item.title,
      description: PLACEHOLDER_PRODUCT_DESCRIPTION,
      category: item.category ?? "toys",
      product_type: item.category === "designs" ? "digital" : "physical",
      collection: null,
      character: null,
      is_collectible: false,
      edition_size: null,
      series: item.subtitle ?? null,
      images: item.image ? [{ url: item.image, alt: item.imageAlt }] : [],
      base_price: item.price,
      currency: item.currency,
      weight_grams: null,
      collectible_story: null,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const real = await getProduct(params.slug);
  if (!real && !params.slug.startsWith("placeholder-")) notFound();

  const { product, character, soldOut } = real
    ? { product: real, character: real.character, soldOut: false }
    : buildPlaceholderProduct(params.slug);
  const cover = product.images[0];

  return (
    <Container className="py-12 lg:py-16">
      <Reveal>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Photo on a Memphis-decorated panel */}
          <div className="relative">
            <Shape kind="dots" className="-left-4 -top-4 h-20 w-20 text-electric/40" />
            <Shape kind="triangle" className="-bottom-5 -right-3 h-14 w-14 text-sun" />
            <div className="relative aspect-square w-full overflow-hidden bg-black/[0.04] shadow-[10px_10px_0_0_#FF2D55]">
              {cover ? (
                <CatalogImage
                  src={cover.url}
                  alt={cover.alt ?? product.title}
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  variants={cover.variants}
                  version={cover.v}
                  blurDataUrl={blurhashToDataUrl(cover.blurhash)}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <i className="fa-solid fa-box-open text-6xl text-black/20" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          {/* Copy + purchase */}
          <div className="lg:pt-6">
            {character && <p className="eyebrow text-pink">{character}</p>}
            <h1 className="font-display mt-2 text-4xl leading-tight text-ink md:text-5xl">{product.title}</h1>
            {product.series && <p className="mt-2 text-sm text-black/45">{product.series}</p>}
            <div className="mt-8">
              <ProductPurchasePanel product={product} soldOut={soldOut} />
            </div>
            {product.description && (
              <p className="mt-8 border-t border-black/10 pt-6 leading-relaxed text-black/65">{product.description}</p>
            )}
            <Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-pink hover:underline">
              ← <T k="page.shop" />
            </Link>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
