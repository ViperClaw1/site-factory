export const PRODUCT_IMAGE_BUCKETS: readonly string[];

export const PRODUCT_IMAGE_VARIANTS: {
  readonly thumb: { readonly width: number; readonly quality: number };
  readonly gallery: { readonly width: number; readonly quality: number };
  readonly hero: { readonly width: number; readonly quality: number };
};

export function parseStorageUrl(
  url: string,
  buckets?: readonly string[]
): { bucket: string; objectPath: string } | null;

export function isVariantPath(objectPath: string): boolean;

export function variantObjectPath(objectPath: string, variant: string): string;

export function prepareSource(bytes: Buffer): Promise<Buffer>;

export function renderVariant(source: Buffer, variant: string): Promise<Buffer>;

export function uploadVariant(
  supabase: {
    storage: {
      from(bucket: string): {
        upload(
          path: string,
          body: Buffer,
          options: { contentType: string; cacheControl: string; upsert: boolean }
        ): Promise<{ error: { message: string } | null }>;
      };
    };
  },
  bucket: string,
  objectPath: string,
  source: Buffer,
  variant: string
): Promise<{ path: string; bytes: number }>;

export function blurhashFromBytes(bytes: Buffer): Promise<string>;
