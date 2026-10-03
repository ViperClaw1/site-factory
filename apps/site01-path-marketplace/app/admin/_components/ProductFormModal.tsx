"use client";

import { MediaDropzone, type MediaItem } from "@/app/admin/_components/MediaDropzone";
import { useUploadQueue } from "@/app/admin/_components/useUploadQueue";
import { defaultStock, fieldErrorsOf, productFieldsSchema, type ProductFields } from "@/lib/admin/schema";
import { productSlug } from "@/lib/admin/slug";
import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import { FormField, INPUT_CLASS } from "@/components/FormField";
import { Button, Modal } from "@repo/ui";
import { useEffect, useState } from "react";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (slug: string, warnings: string[]) => void;
}

export function ProductFormModal({ open, onOpenChange, onCreated }: ProductFormModalProps) {
  const queue = useUploadQueue();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState<"physical" | "digital">("physical");
  const [stock, setStock] = useState("25");
  const [stockTouched, setStockTouched] = useState(false);
  const [character, setCharacter] = useState("");
  const [series, setSeries] = useState("");
  const [editionSize, setEditionSize] = useState("");
  const [isCollectible, setIsCollectible] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!slugTouched) setSlug(productSlug(title, character));
  }, [title, character, slugTouched]);

  useEffect(() => {
    if (!stockTouched) setStock(String(defaultStock(productType)));
  }, [productType, stockTouched]);

  useEffect(() => {
    if (!title) return;
    setMedia((current) => current.map((item) => (item.altTouched ? item : { ...item, alt: title })));
  }, [title]);

  function reset() {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setCategory(CATEGORIES[0]);
    setDescription("");
    setPrice("");
    setProductType("physical");
    setStock("25");
    setStockTouched(false);
    setCharacter("");
    setSeries("");
    setEditionSize("");
    setIsCollectible(false);
    setMedia([]);
    setErrors({});
    setFormError(null);
    setProgress({});
  }

  function fieldsFor(status: "active" | "draft"): ProductFields | null {
    const nextErrors: Record<string, string> = {};
    if (media.length === 0) nextErrors.media = "Add at least one file.";
    if (media.some((item) => item.error)) nextErrors.media = "Remove files that failed the check.";
    const parsed = productFieldsSchema.safeParse({
      title,
      category,
      description,
      price: price.trim() === "" ? Number.NaN : Number(price),
      productType,
      status,
      stock: stock.trim() === "" ? Number.NaN : Number(stock),
      character,
      series,
      editionSize: editionSize.trim() === "" ? undefined : Number(editionSize),
      isCollectible,
      slug,
    });
    if (!parsed.success) Object.assign(nextErrors, fieldErrorsOf(parsed.error));
    setErrors(nextErrors);
    return parsed.success && Object.keys(nextErrors).length === 0 ? parsed.data : null;
  }

  async function submit(status: "active" | "draft") {
    setFormError(null);
    const fields = fieldsFor(status);
    if (!fields || queue.running) return;
    const [state] = await queue.start([
      {
        id: "single",
        fields,
        media: media.map((item) => ({ id: item.id, file: item.file, type: item.type, alt: item.alt || fields.title })),
        onFile: (fileId, value) => setProgress((current) => ({ ...current, [fileId]: value })),
      },
    ]);
    if (!state || state.status === "error") {
      setErrors(state?.fieldErrors ?? {});
      setFormError(state?.error ?? "Could not save the product.");
      return;
    }
    reset();
    onOpenChange(false);
    onCreated(state.slug ?? fields.slug, state.warnings ?? []);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && queue.running) return;
        if (!next) reset();
        onOpenChange(next);
      }}
      title="Add product"
      description="Files upload straight to storage, then the product is saved."
      size="xl"
    >
      <form
        className="mt-6 grid gap-6 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit("active");
        }}
      >
        <div>
          <MediaDropzone items={media} onChange={setMedia} progress={progress} disabled={queue.running} />
          {errors.media && (
            <p role="alert" className="mt-2 text-xs text-pink-dark">
              {errors.media}
            </p>
          )}
        </div>
        <div className="space-y-4">
          <FormField id="product-title" label="Title" error={errors.title}>
            <input id="product-title" value={title} onChange={(event) => setTitle(event.target.value)} className={INPUT_CLASS} aria-invalid={!!errors.title} />
          </FormField>
          <FormField id="product-slug" label="Slug" error={errors.slug}>
            <input
              id="product-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className={INPUT_CLASS}
              aria-invalid={!!errors.slug}
            />
          </FormField>
          <FormField id="product-category" label="Category" error={errors.category}>
            <select id="product-category" value={category} onChange={(event) => setCategory(event.target.value)} className={INPUT_CLASS}>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="product-description" label="Description" error={errors.description}>
            <textarea id="product-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={INPUT_CLASS} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="product-price" label="Price, $" error={errors.price}>
              <input id="product-price" inputMode="decimal" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className={INPUT_CLASS} aria-invalid={!!errors.price} />
            </FormField>
            <FormField id="product-stock" label="Stock" error={errors.stock}>
              <input
                id="product-stock"
                inputMode="numeric"
                value={stock}
                onChange={(event) => {
                  setStockTouched(true);
                  setStock(event.target.value);
                }}
                className={INPUT_CLASS}
                aria-invalid={!!errors.stock}
              />
            </FormField>
          </div>
          <FormField id="product-type" label="Product type" error={errors.productType}>
            <select
              id="product-type"
              value={productType}
              onChange={(event) => setProductType(event.target.value === "digital" ? "digital" : "physical")}
              className={INPUT_CLASS}
            >
              <option value="physical">physical</option>
              <option value="digital">digital</option>
            </select>
          </FormField>
          <FormField id="product-character" label="Character" error={errors.character}>
            <input id="product-character" value={character} onChange={(event) => setCharacter(event.target.value)} className={INPUT_CLASS} />
          </FormField>
          <FormField id="product-series" label="Series" error={errors.series}>
            <input id="product-series" value={series} onChange={(event) => setSeries(event.target.value)} className={INPUT_CLASS} />
          </FormField>
          <FormField id="product-edition" label="Edition size" error={errors.editionSize}>
            <input id="product-edition" inputMode="numeric" value={editionSize} onChange={(event) => setEditionSize(event.target.value)} className={INPUT_CLASS} />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={isCollectible} onChange={(event) => setIsCollectible(event.target.checked)} />
            Collectible
          </label>
        </div>
        {formError && (
          <p role="alert" className="text-sm text-pink-dark lg:col-span-2">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 lg:col-span-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={queue.running}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" disabled={queue.running} onClick={() => void submit("draft")}>
            Save as draft
          </Button>
          <Button type="submit" disabled={queue.running}>
            {queue.running ? "Saving…" : "Publish"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
