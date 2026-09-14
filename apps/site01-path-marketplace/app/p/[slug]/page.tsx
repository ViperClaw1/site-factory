import { getProduct } from "@/lib/api-client";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { Reveal } from "@/components/Reveal";
import {
  PLACEHOLDER_PRODUCT_DESCRIPTION,
  placeholderIndexFromSlug,
  placeholderProductTitle,
} from "@/lib/placeholders";
import { Container, ImageWithFallback, Section } from "@repo/ui";
import type { Product } from "@repo/types";
import { notFound } from "next/navigation";

export const revalidate = 0;

// "placeholder-N" slugs never hit Supabase — they let placeholder cards
// (rendered while the real catalog is empty) link somewhere real to exercise
// the browse → cart → checkout flow before actual products exist.
function buildPlaceholderProduct(slug: string): Product {
  const index = placeholderIndexFromSlug(slug);
  const now = new Date().toISOString();
  return {
    id: slug,
    slug,
    title: placeholderProductTitle(index),
    description: PLACEHOLDER_PRODUCT_DESCRIPTION,
    category: "toys",
    product_type: "physical",
    collection: null,
    character: null,
    is_collectible: false,
    edition_size: null,
    series: null,
    images: [],
    base_price: 25,
    currency: "USD",
    weight_grams: null,
    collectible_story: null,
    status: "active",
    created_at: now,
    updated_at: now,
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  let product = await getProduct(params.slug);

  if (!product) {
    if (!params.slug.startsWith("placeholder-")) notFound();
    product = buildPlaceholderProduct(params.slug);
  }

  const cover = product.images[0];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black/5">
              {cover ? (
                <ImageWithFallback
                  src={cover.url}
                  alt={cover.alt ?? product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <i className="fa-solid fa-box-open text-6xl text-black/20" aria-hidden="true" />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold">{product.title}</h1>
              {product.description && <p className="mt-4 text-black/70">{product.description}</p>}
              <div className="mt-6">
                <ProductPurchasePanel product={product} />
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
