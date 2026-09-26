// Shared pregen runner: renders the requested variants for every product image
// that lacks them, uploads them next to the original, and records which
// variants exist on the image object (products.images[i].variants) so the
// storefront loader only ever requests files that are really there.

import {
  PRODUCT_IMAGE_VARIANTS,
  downloadObject,
  errorMessage,
  fetchProducts,
  isVariantPath,
  log,
  objectExists,
  parseStorageUrl,
  prepareSource,
  saveProductImages,
  uploadVariant,
  variantObjectPath,
} from "./product-images.mjs";

const ORDER = Object.keys(PRODUCT_IMAGE_VARIANTS);

// force: re-render variants that already exist (e.g. after changing the
// rendering pipeline) instead of skipping them.
export async function runPregen(supabase, { variants, dryRun, limit, slug, force = false, tag = "pregen" }) {
  const products = await fetchProducts(supabase, { limit, slug });
  let created = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const product of products) {
    let rowChanged = false;
    const images = [];

    for (const image of Array.isArray(product.images) ? product.images : []) {
      const ref = parseStorageUrl(image?.url);
      if (!ref || isVariantPath(ref.objectPath)) {
        images.push(image);
        continue;
      }

      const present = new Set(image.variants ?? []);
      let original = null; // downloaded lazily, once per image
      let source = null; // oriented + trimmed once per image, reused per variant
      let rendered = false; // any variant (re)written this run → bump version

      for (const variant of variants) {
        const path = variantObjectPath(ref.objectPath, variant);

        // Already on the image object, or already in storage from a previous run.
        if (!force && (present.has(variant) || (await objectExists(supabase, ref.bucket, path)))) {
          present.add(variant);
          skipped += 1;
          continue;
        }

        if (dryRun) {
          log(tag, `[dry-run] would create ${ref.bucket}/${path}`);
          created += 1;
          continue;
        }

        try {
          original ??= await downloadObject(supabase, ref.bucket, ref.objectPath);
          source ??= await prepareSource(original);
          const result = await uploadVariant(supabase, ref.bucket, ref.objectPath, source, variant);
          present.add(variant);
          rendered = true;
          created += 1;
          savedBytes += original.length - result.bytes;
          log(tag, `created ${ref.bucket}/${result.path} (${Math.round(result.bytes / 1024)} KB)`);
        } catch (err) {
          log(tag, `skip ${ref.bucket}/${ref.objectPath} (${variant}): ${errorMessage(err)}`);
        }
      }

      const next = ORDER.filter((variant) => present.has(variant));
      if (next.join() !== (image.variants ?? []).join() || rendered) rowChanged = true;
      // Variants are cached for a year under stable names, so a re-render
      // gets a new version `v` that the storefront loader appends as ?v=…
      // — browsers and the CDN then fetch the new file instead of a stale one.
      const version = rendered ? Date.now().toString(36) : image.v;
      images.push(next.length > 0 ? { ...image, variants: next, ...(version ? { v: version } : {}) } : image);
    }

    // Persist the variants list on the product (one update per changed row).
    if (rowChanged && !dryRun) {
      await saveProductImages(supabase, product.id, images);
      log(tag, `updated ${product.slug}`);
    }
  }

  const savings = savedBytes > 0 ? `, ~${Math.round(savedBytes / 1024 / 1024)} MB lighter than originals` : "";
  log(tag, `done: ${created} file(s) ${dryRun ? "(dry-run)" : "created"}, ${skipped} already present${savings}`);
}
