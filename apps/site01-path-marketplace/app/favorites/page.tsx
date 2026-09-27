import { buttonClass } from "@/components/buttons";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { GRID_CLASSES } from "@/components/ProductGrid";
import { RevealGrid } from "@/components/RevealGrid";
import { T } from "@/components/T";
import { toCardItem } from "@/lib/to-card-item";
import { createSupabaseServerClient } from "@repo/lib/supabase-server";
import type { Product } from "@repo/types";
import { Container } from "@repo/ui";
import Link from "next/link";

// Gated by middleware.ts ("favorites" permission). RLS limits `wishlists` to
// the visitor's own rows; products that went inactive come back null.
export default async function FavoritesPage() {
  const { data } = await createSupabaseServerClient()
    .from("wishlists")
    .select("products(*)")
    .order("created_at", { ascending: false });
  const products = (data ?? [])
    .map((row) => row.products as unknown as Product | null)
    .filter((product): product is Product => product !== null);

  return (
    <>
      <PageHeader eyebrow="nav.account" title="fav.title" />
      <Container className="py-12">
        {products.length === 0 ? (
          <div className="flex flex-col items-start gap-6">
            <EmptyState messageKey="fav.empty" />
            <Link href="/shop" className={buttonClass("primary", "md")}>
              <T k="cart.browse" />
            </Link>
          </div>
        ) : (
          <RevealGrid className={GRID_CLASSES}>
            {products.map((product) => (
              <ProductCard key={product.id} item={toCardItem(product)} />
            ))}
          </RevealGrid>
        )}
      </Container>
    </>
  );
}
