"use client";

import { useAuthStore } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { can } from "@/lib/rbac";
import { usePathname, useRouter } from "next/navigation";

export interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

// Heart toggle backed by the `wishlists` table. Guests are sent to /login
// and come back here afterwards.
export function FavoriteButton({ productId, className = "" }: FavoriteButtonProps) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const active = useAuthStore((state) => state.favorites.has(productId));
  const toggleFavorite = useAuthStore((state) => state.toggleFavorite);

  // Showcase placeholders aren't DB products. Signed-in users can't save them;
  // guests still see the heart so the click can send them to login.
  if (productId.startsWith("placeholder-") && can(role, "favorites")) return null;

  async function handleClick() {
    if (!can(role, "favorites")) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    await toggleFavorite(productId);
    // The favorites page is server rendered — re-fetch so the card disappears.
    if (pathname === "/favorites") router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={t(active ? "fav.remove" : "fav.add")}
      title={t(active ? "fav.remove" : "fav.add")}
      className={`flex h-9 w-9 items-center justify-center bg-white/90 transition-colors hover:text-pink ${
        active ? "text-pink" : "text-ink"
      } ${className}`}
    >
      <i className={`fa-${active ? "solid" : "regular"} fa-heart`} aria-hidden="true" />
    </button>
  );
}
