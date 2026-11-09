"use client";

import { basename, inspectDraft, isVideoMedia, type DraftIssue, type DraftMedia, type DraftRow, fileIndex } from "@/lib/admin/catalog-json";
import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import { variantUrl } from "@/lib/image-variants";
import { useState } from "react";

interface BulkPreviewTableProps {
  rows: DraftRow[];
  files: File[];
  previews: ReadonlyMap<string, string>;
  conflicts: ReadonlySet<string>;
  excluded: Set<string>;
  onChange: (id: string, patch: Partial<DraftRow>) => void;
  onToggle: (id: string, include: boolean) => void;
  onRemove: (id: string) => void;
}

const CELL = "w-full min-w-[7rem] border border-black/15 px-2 py-1 text-xs";
const THUMB = "shrink-0 bg-black/5 object-cover";

// Pregenerated `_thumb.webp` sits next to every Storage original, so try that small copy first.
function candidateUrls(url: string): string[] {
  return url.includes("/storage/v1/object/public/") ? [variantUrl(url, "thumb"), url] : [url];
}

function MediaThumb({ item, previews, size = "h-12 w-12" }: { item: DraftMedia; previews: ReadonlyMap<string, string>; size?: string }) {
  const [attempt, setAttempt] = useState(0);
  const name = item.file ?? item.url ?? "";
  const sources = item.url ? candidateUrls(item.url) : [previews.get(basename(name))].filter((src): src is string => Boolean(src));
  const src = sources[attempt];
  const next = () => setAttempt((current) => current + 1);

  // Nothing to show: say why and which file, instead of a bare marker.
  if (!src) {
    const reason = item.file ? "Not attached" : "Failed to load";
    return (
      <span
        role="img"
        aria-label={`${reason}: ${name}`}
        title={`${reason}: ${name}`}
        className={`${THUMB} ${size} flex flex-col items-center justify-center overflow-hidden border border-dashed border-pink px-0.5 text-center text-[9px] leading-tight text-pink-dark`}
      >
        <span className="font-semibold">{item.file ? "No file" : "Error"}</span>
        <span className="w-full truncate">{basename(name).replace(/[?#].*$/, "")}</span>
      </span>
    );
  }
  if (isVideoMedia(item)) {
    return <video src={src} title={name} aria-label={item.alt ?? name} muted playsInline preload="metadata" className={`${THUMB} ${size}`} onError={next} />;
  }
  // Blob and arbitrary remote URLs, so a plain img rather than the optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img key={src} src={src} alt={item.alt ?? name} title={name} className={`${THUMB} ${size}`} onError={next} />;
}

export function MediaStrip({ media, previews }: { media: DraftMedia[]; previews: ReadonlyMap<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {media.map((item, index) => (
        <MediaThumb key={`${index}:${item.file ?? item.url}`} item={item} previews={previews} />
      ))}
    </div>
  );
}

function RemoveButton({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center text-black/40 hover:text-pink"
      aria-label={`Remove ${title || "product"}`}
      onClick={onRemove}
    >
      <i className="fa-solid fa-trash" aria-hidden="true" />
    </button>
  );
}

function attributeText(attributes: Record<string, string> | undefined): string {
  return Object.entries(attributes ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

// Read-only view of the nested data, shown only when a row has some.
function NestedDetails({ row }: { row: DraftRow }) {
  const facts = [
    row.collection && `Collection: ${row.collection}`,
    row.character && `Character: ${row.character}`,
    row.series && `Series: ${row.series}`,
    row.weightGrams && `Weight: ${row.weightGrams} g`,
    row.isCollectible && "Collectible",
    row.editionSize && `Edition of ${row.editionSize}`,
  ].filter(Boolean);
  const variants = row.variants ?? [];
  const story = row.story ?? [];
  if (facts.length === 0 && variants.length === 0 && story.length === 0) return null;

  const counts = [variants.length > 0 && `${variants.length} variant${variants.length === 1 ? "" : "s"}`, story.length > 0 && `${story.length} chapter${story.length === 1 ? "" : "s"}`].filter(Boolean);
  return (
    <details className="mt-1 text-xs text-black/60">
      <summary className="cursor-pointer">{counts.length > 0 ? counts.join(" · ") : "Details"}</summary>
      <div className="mt-1 space-y-1">
        {facts.length > 0 && <p>{facts.join(" · ")}</p>}
        {variants.length > 0 && (
          <ul>
            {variants.map((variant, index) => (
              <li key={variant.sku ?? index}>
                {variant.sku ?? "Generated SKU"}
                {variant.attributes ? ` (${attributeText(variant.attributes)})` : ""}: {variant.stock} in stock
                {variant.price === undefined ? "" : `, $${variant.price.toFixed(2)}`}
              </li>
            ))}
          </ul>
        )}
        {story.length > 0 && (
          <ol className="list-decimal pl-4">
            {story.map((chapter, index) => (
              <li key={index}>{chapter.title}</li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

export function BulkPreviewTable({ rows, files, previews, conflicts, excluded, onChange, onToggle, onRemove }: BulkPreviewTableProps) {
  const index = fileIndex(files);
  // Only rows without errors can be ticked, so "all" means all valid rows.
  const valid = rows.filter((row) => Object.keys(inspectDraft(row, index).errors).length === 0);
  const ticked = valid.filter((row) => !excluded.has(row.id)).length;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-black/45">
            <th className="p-2">
              <input
                type="checkbox"
                aria-label="Select all valid rows"
                disabled={valid.length === 0}
                title={valid.length === 0 ? "No row is ready: fix the highlighted errors first" : undefined}
                checked={valid.length > 0 && ticked === valid.length}
                ref={(node) => {
                  if (node) node.indeterminate = ticked > 0 && ticked < valid.length;
                }}
                onChange={(event) => {
                  for (const row of valid) onToggle(row.id, event.target.checked);
                }}
              />
            </th>
            <th className="p-2">Media</th>
            <th className="p-2">Title</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Category</th>
            <th className="p-2">Price</th>
            <th className="p-2">Type</th>
            <th className="p-2">Status</th>
            <th className="p-2">Stock</th>
            <th className="p-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const issue: DraftIssue = inspectDraft(row, index);
            const invalid = Object.keys(issue.errors).length > 0;
            const severalVariants = (row.variants?.length ?? 0) > 1;
            // Field errors not tied to a cell here, such as a bad edition size or chapter.
            const otherErrors = Object.entries(issue.errors)
              .filter(([key]) => !["media", "title", "slug", "category", "price", "productType", "status", "stock"].includes(key))
              .map(([, message]) => message);
            return (
              <tr key={row.id} className="border-t border-black/10 align-top">
                <td className="p-2">
                  <input
                    type="checkbox"
                    aria-label={`Include ${row.title || "row"}`}
                    checked={!invalid && !excluded.has(row.id)}
                    disabled={invalid}
                    onChange={(event) => onToggle(row.id, event.target.checked)}
                  />
                </td>
                <td className="min-w-[8rem] max-w-[14rem] p-2">
                  <MediaStrip media={row.media} previews={previews} />
                  {issue.errors.media && <p className="mt-1 text-xs text-pink-dark">{issue.errors.media}</p>}
                </td>
                <td className="p-2">
                  <input
                    aria-label="title"
                    className={`${CELL} ${issue.errors.title ? "border-pink" : ""}`}
                    title={issue.errors.title}
                    value={row.title}
                    onChange={(event) => onChange(row.id, { title: event.target.value })}
                  />
                  <NestedDetails row={row} />
                  {otherErrors.map((message) => (
                    <p key={message} className="mt-1 text-xs text-pink-dark">
                      {message}
                    </p>
                  ))}
                </td>
                <td className="p-2">
                  <input
                    aria-label="slug"
                    className={`${CELL} ${issue.errors.slug ? "border-pink" : ""}`}
                    title={issue.errors.slug}
                    value={row.slug}
                    onChange={(event) => onChange(row.id, { slug: event.target.value })}
                  />
                  {conflicts.has(row.slug) && <p className="mt-1 max-w-[12rem] text-xs text-pink-dark">Already exists — tick to import as a copy</p>}
                </td>
                {(["category", "price", "productType", "status", "stock"] as const).map((key) => (
                  <td key={key} className="p-2">
                    {key === "category" || key === "productType" || key === "status" ? (
                      <select
                        aria-label={key}
                        className={`${CELL} ${issue.errors[key] ? "border-pink" : ""}`}
                        title={issue.errors[key]}
                        value={row[key]}
                        onChange={(event) => onChange(row.id, { [key]: event.target.value })}
                      >
                        {(key === "category" ? CATEGORIES : key === "productType" ? ["physical", "digital"] : ["active", "draft", "archived"]).map((value) => (
                          <option key={value} value={value}>
                            {value.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label={key}
                        className={`${CELL} ${issue.errors[key] ? "border-pink" : ""}`}
                        title={key === "stock" && severalVariants ? "Total across variants" : issue.errors[key]}
                        value={row[key]}
                        readOnly={key === "stock" && severalVariants}
                        onChange={(event) => onChange(row.id, { [key]: event.target.value })}
                      />
                    )}
                  </td>
                ))}
                <td className="p-2 text-right">
                  <RemoveButton title={row.title} onRemove={() => onRemove(row.id)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
