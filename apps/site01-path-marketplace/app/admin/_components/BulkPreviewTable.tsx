"use client";

import { inspectDraft, type DraftIssue, type DraftRow, fileIndex } from "@/lib/admin/csv";
import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";

interface BulkPreviewTableProps {
  rows: DraftRow[];
  files: File[];
  excluded: Set<string>;
  onChange: (id: string, patch: Partial<DraftRow>) => void;
  onToggle: (id: string, include: boolean) => void;
}

const CELL = "w-full min-w-[7rem] border border-black/15 px-2 py-1 text-xs";

export function BulkPreviewTable({ rows, files, excluded, onChange, onToggle }: BulkPreviewTableProps) {
  const index = fileIndex(files);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-black/45">
            <th className="p-2">Use</th>
            <th className="p-2">Title</th>
            <th className="p-2">Category</th>
            <th className="p-2">Price</th>
            <th className="p-2">Media</th>
            <th className="p-2">Type</th>
            <th className="p-2">Status</th>
            <th className="p-2">Stock</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const issue: DraftIssue = inspectDraft(row, index);
            const invalid = Object.keys(issue.errors).length > 0;
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
                {(["title", "category", "price", "media", "productType", "status", "stock"] as const).map((key) => (
                  <td key={key} className="p-2">
                    {key === "category" || key === "productType" || key === "status" ? (
                      <select
                        aria-label={key}
                        className={`${CELL} ${issue.errors[key] ? "border-pink" : ""}`}
                        title={issue.errors[key]}
                        value={key === "productType" ? row.productType : key === "status" ? row.status : row.category}
                        onChange={(event) => onChange(row.id, { [key === "productType" ? "productType" : key === "status" ? "status" : "category"]: event.target.value })}
                      >
                        {(key === "category" ? CATEGORIES : key === "productType" ? ["physical", "digital"] : ["active", "draft"]).map((value) => (
                          <option key={value} value={value}>
                            {value.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label={key}
                        className={`${CELL} ${issue.errors[key] ? "border-pink" : ""}`}
                        title={issue.errors[key]}
                        value={key === "media" ? row.media.join("; ") : row[key]}
                        onChange={(event) =>
                          onChange(
                            row.id,
                            key === "media"
                              ? { media: event.target.value.split(";").map((name) => name.trim()).filter(Boolean) }
                              : { [key]: event.target.value }
                          )
                        }
                      />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
