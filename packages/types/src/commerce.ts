export type ProductType = "physical" | "digital";

export type ProductStatus = "active" | "draft" | "archived";

/** Pregenerated resized copies stored next to the original (`name_thumb.webp`, …). */
export type ProductImageVariant = "thumb" | "gallery" | "hero";

export type ProductMediaType = "image" | "video";

export interface ProductImage {
  /** Default "image" — existing rows without the field are still images. */
  type?: ProductMediaType;
  url: string;
  alt?: string;
  /** Low-res placeholder hash, written by the image backfill scripts. */
  blurhash?: string;
  /** Which pregenerated variants exist for this image. */
  variants?: ProductImageVariant[];
  /** Variants version — changes whenever the variants are re-rendered (cache busting). */
  v?: string;
  /** Video only: still frame uploaded as its own image object. */
  poster?: string;
  posterBlurhash?: string;
  posterVariants?: ProductImageVariant[];
  mime?: string;
  width?: number;
  height?: number;
  durationSec?: number;
}

export interface CollectibleChapter {
  title: string;
  body: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  product_type: ProductType;
  collection: string | null;
  character: string | null;
  is_collectible: boolean;
  edition_size: number | null;
  series: string | null;
  images: ProductImage[];
  base_price: number;
  currency: string;
  weight_grams: number | null;
  collectible_story: CollectibleChapter[] | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  attributes: Record<string, string> | null;
  price: number | null;
  stock: number;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  product_id: string;
  variant_id: string;
  title: string;
  sku: string;
  quantity: number;
  unit_price: number;
}

export interface ShippingAddress {
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_provider: string | null;
  payment_method: string | null;
  payment_id: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DigitalAccess {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  expires_at: string | null;
  download_count: number;
  max_downloads: number;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}
