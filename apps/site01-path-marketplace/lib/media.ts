import type { Product, ProductImage } from "@repo/types";

// First real image, or the poster of the first video. Cards and the PDP cover
// must never receive a video URL — the storefront image loader can't render one.
export function coverImage(product: Pick<Product, "images">): ProductImage | undefined {
  const images = product.images ?? [];
  const still = images.find((item) => item?.type !== "video" && item?.url);
  if (still) return still;

  const video = images.find((item) => item?.type === "video" && item.poster);
  if (!video?.poster) return undefined;

  return {
    type: "image",
    url: video.poster,
    alt: video.alt,
    blurhash: video.posterBlurhash,
    variants: video.posterVariants,
    v: video.v,
  };
}
