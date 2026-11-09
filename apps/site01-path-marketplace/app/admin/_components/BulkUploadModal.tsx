"use client";

import { BulkPreviewTable, MediaStrip } from "@/app/admin/_components/BulkPreviewTable";
import { useUploadQueue, type LocalMedia } from "@/app/admin/_components/useUploadQueue";
import {
  basename,
  CATALOG_TEMPLATE,
  draftsFromFiles,
  downloadTextFile,
  errorReportJson,
  fetchMediaFile,
  fileIndex,
  inspectDraft,
  parseCatalogJson,
  unmatchedFiles,
  type DraftRow,
} from "@/lib/admin/catalog-json";
import { mimeForExtension } from "@/lib/admin/schema";
import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import { Button, Modal } from "@repo/ui";
import * as Progress from "@radix-ui/react-progress";
import { useEffect, useMemo, useState } from "react";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: (created: number, failed: number) => void;
}

type Step = "files" | "preview" | "import";

async function filesFromList(list: DataTransferItemList | FileList): Promise<File[]> {
  if (list instanceof FileList) return [...list];
  const entries = [...list].map((item) => item.webkitGetAsEntry?.()).filter((entry): entry is FileSystemEntry => Boolean(entry));
  if (entries.length === 0) return [...list].map((item) => item.getAsFile()).filter((file): file is File => Boolean(file));

  async function walk(entry: FileSystemEntry): Promise<File[]> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
      return [file];
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const nested: File[] = [];
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
      if (batch.length === 0) break;
      for (const child of batch) nested.push(...(await walk(child)));
    }
    return nested;
  }

  const files: File[] = [];
  for (const entry of entries) files.push(...(await walk(entry)));
  return files;
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Resolve a row's media at import time: attached files directly, URLs by download.
async function loadRowMedia(row: DraftRow, index: Map<string, File>, title: string): Promise<LocalMedia[]> {
  const loaded: LocalMedia[] = [];
  for (const [position, item] of row.media.entries()) {
    const file = item.url ? await fetchMediaFile(item.url) : index.get(basename(item.file ?? ""));
    const mime = file ? mimeForExtension(file.name) : null;
    if (!file || !mime) throw new Error(`Could not read ${item.file ?? item.url}.`);
    loaded.push({ id: `${row.id}:${position}`, file, type: mime.startsWith("video/") ? "video" : "image", alt: item.alt ?? title });
  }
  return loaded;
}

export function BulkUploadModal({ open, onOpenChange, onFinished }: BulkUploadModalProps) {
  const queue = useUploadQueue();
  const [step, setStep] = useState<Step>("files");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [groupByPrefix, setGroupByPrefix] = useState(false);
  const [catalogFile, setCatalogFile] = useState<{ name: string; size: number } | null>(null);
  const [conflicts, setConflicts] = useState<ReadonlySet<string>>(new Set());
  const [checking, setChecking] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const index = useMemo(() => fileIndex(files), [files]);
  const extras = useMemo(() => (catalogFile ? unmatchedFiles(rows, files) : []), [catalogFile, rows, files]);
  const fileMedia = useMemo(() => rows.flatMap((row) => row.media), [rows]);

  // Object URLs for attached files, shared by the file card and the preview table.
  const previews = useMemo(() => new Map(files.map((file) => [basename(file.name), URL.createObjectURL(file)])), [files]);
  useEffect(() => {
    return () => {
      for (const url of previews.values()) URL.revokeObjectURL(url);
    };
  }, [previews]);

  const readyCount = rows.filter((row) => !excluded.has(row.id) && Object.keys(inspectDraft(row, index).errors).length === 0).length;
  const doneCount = queue.states.filter((state) => state.status === "done" || state.status === "error").length;
  const percent = queue.states.length === 0 ? 0 : Math.round((doneCount / queue.states.length) * 100);

  function reset() {
    setStep("files");
    setFiles([]);
    setRows([]);
    setParseErrors([]);
    setGroupByPrefix(false);
    setCatalogFile(null);
    setConflicts(new Set());
    setExcluded(new Set());
    setNotice(null);
  }

  // Additive, so the JSON and its media can arrive in separate picks, in either order.
  async function takeFiles(incoming: File[]) {
    const json = incoming.find((file) => file.name.toLowerCase().endsWith(".json") || file.type === "application/json");
    const media = incoming.filter((file) => mimeForExtension(file.name));
    const unsupported = incoming.find((file) => /\.(csv|xlsx?)$/i.test(file.name));
    setNotice(unsupported ? `${unsupported.name} was skipped. Use the JSON template.` : null);
    setFiles((current) => [...new Map([...current, ...media].map((file) => [basename(file.name), file])).values()]);
    if (!json) return;
    const parsed = parseCatalogJson(await json.text());
    setCatalogFile({ name: json.name, size: json.size });
    setParseErrors(parsed.errors);
    setRows(parsed.rows);
  }

  function removeCatalogFile() {
    setCatalogFile(null);
    setRows([]);
    setParseErrors([]);
  }

  async function continueToPreview() {
    if (!catalogFile) {
      const drafts = draftsFromFiles(files, category, groupByPrefix);
      setRows(drafts);
      setParseErrors(drafts.length === 0 ? ["Drop at least one image."] : []);
      setConflicts(new Set());
      setExcluded(new Set());
      setStep("preview");
      return;
    }

    // Rows whose slug is already in the catalog start unticked. If the check fails,
    // stay on this step: importing blind could create duplicates without warning.
    setChecking(true);
    setNotice(null);
    try {
      const slugs = [...new Set(rows.map((row) => row.slug).filter(Boolean))];
      let existing: string[] = [];
      if (slugs.length > 0) {
        const response = await fetch("/api/admin/products/slugs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slugs }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        existing = ((await response.json()) as { existing: string[] }).existing;
      }
      const taken = new Set(existing);
      setConflicts(taken);
      setExcluded(new Set(rows.filter((row) => taken.has(row.slug)).map((row) => row.id)));
      setStep("preview");
    } catch {
      setNotice("Could not check for existing products. Try again.");
    } finally {
      setChecking(false);
    }
  }

  function applyOverride(patch: Partial<DraftRow>) {
    setRows((current) => current.map((row) => ({ ...row, ...patch })));
  }

  async function startImport() {
    const jobs = rows.flatMap((row) => {
      const { input } = inspectDraft(row, index);
      if (!input || excluded.has(row.id)) return [];
      // A ticked conflict imports as a copy. The server gives it a new slug, and dropping
      // the SKUs lets it generate new ones too, since the originals are already taken.
      const fields = conflicts.has(row.slug)
        ? { ...input, variants: input.variants?.map(({ attributes, price, stock }) => ({ attributes, price, stock })) }
        : input;
      return [{ id: row.id, fields, media: () => loadRowMedia(row, index, input.title) }];
    });
    setStep("import");
    const states = await queue.start(jobs, 3);
    const created = states.filter((state) => state.status === "done").length;
    const failed = states.filter((state) => state.status === "error").length;
    onFinished(created, failed);
  }

  function downloadErrors() {
    const failed = queue.states.filter((state) => state.status === "error");
    const report = errorReportJson(
      failed.flatMap((state) => {
        const row = rows.find((item) => item.id === state.id);
        return row ? [{ row, message: state.error ?? "failed" }] : [];
      })
    );
    downloadTextFile("catalog-errors.json", report);
  }

  return (
    <Modal
      open={open}
      size="xl"
      title="Bulk upload"
      description="JSON plus media files, or images alone."
      onOpenChange={(next) => {
        if (!next && queue.running && !window.confirm("Import is still running. Close anyway?")) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <ol className="mt-4 flex gap-4 text-sm font-semibold">
        {(["files", "preview", "import"] as const).map((name, indexNumber) => (
          <li key={name} className={step === name ? "text-pink" : "text-black/40"}>
            {indexNumber + 1} {name[0]?.toUpperCase()}
            {name.slice(1)}
          </li>
        ))}
      </ol>

      {step === "files" && (
        <div className="mt-6 space-y-4">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void filesFromList(event.dataTransfer.items).then((dropped) => takeFiles(dropped));
            }}
            className="border-2 border-dashed border-black/20 px-4 py-10 text-center text-sm"
          >
            <p className="font-semibold text-ink">Drop a JSON file and media files, or a folder</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <label className="cursor-pointer border border-black/20 px-3 py-2 text-xs font-semibold">
                Choose files
                <input
                  data-testid="bulk-files"
                  type="file"
                  multiple
                  accept=".json,application/json,image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                  className="sr-only"
                  onChange={(event) => {
                    if (event.target.files) void takeFiles([...event.target.files]);
                    event.target.value = "";
                  }}
                />
              </label>
              <label className="cursor-pointer border border-black/20 px-3 py-2 text-xs font-semibold">
                Choose folder
                <input
                  type="file"
                  className="sr-only"
                  multiple
                  // Non-standard directory picker. The attribute is set on the node.
                  ref={(node) => {
                    node?.setAttribute("webkitdirectory", "");
                  }}
                  onChange={(event) => {
                    if (event.target.files) void takeFiles([...event.target.files]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          {catalogFile ? (
            // File preview: what the JSON holds, before moving on to the full table.
            <div data-testid="catalog-file" className="border border-black/15 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <p className="truncate font-semibold text-ink">{catalogFile.name}</p>
                  <p className="text-xs text-black/50">
                    {formatSize(catalogFile.size)} · {rows.length} product{rows.length === 1 ? "" : "s"} · {fileMedia.length} media item{fileMedia.length === 1 ? "" : "s"} · {files.length} attached
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={removeCatalogFile}>
                  Remove
                </Button>
              </div>
              {fileMedia.length > 0 && (
                <div className="mt-3">
                  <MediaStrip media={fileMedia.slice(0, 12)} previews={previews} />
                  {fileMedia.length > 12 && <p className="mt-1 text-xs text-black/50">+{fileMedia.length - 12} more in the next step</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-black/50">
              {files.length} media file{files.length === 1 ? "" : "s"}
            </p>
          )}
          {!catalogFile && (
            <>
              <label className="block text-sm font-semibold text-ink">
                Category
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full border-2 border-black/15 px-3 py-2 text-sm font-normal">
                  {CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                      {value.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={groupByPrefix} onChange={(event) => setGroupByPrefix(event.target.checked)} />
                Group by filename prefix (`name-1.jpg`, `name-2.jpg`)
              </label>
            </>
          )}
          {notice && <p className="text-sm text-pink-dark">{notice}</p>}
          {parseErrors.map((error) => (
            <p key={error} role="alert" className="text-sm text-pink-dark">
              {error}
            </p>
          ))}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => downloadTextFile("catalog-template.json", CATALOG_TEMPLATE)}>
              Download JSON template
            </Button>
            <Button type="button" onClick={() => void continueToPreview()} disabled={checking || (catalogFile ? rows.length === 0 : files.length === 0)}>
              {checking ? "Checking…" : "Continue"}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="mt-6 space-y-4">
          {parseErrors.map((error) => (
            <p key={error} role="alert" className="text-sm text-pink-dark">
              {error}
            </p>
          ))}
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              Override category
              <select
                className="ml-2 border border-black/15 px-2 py-1"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) applyOverride({ category: event.target.value });
                }}
              >
                <option value="">Keep each row</option>
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Override status
              <select
                className="ml-2 border border-black/15 px-2 py-1"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) applyOverride({ status: event.target.value });
                }}
              >
                <option value="">Keep each row</option>
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>
          {extras.length > 0 && <p className="text-xs text-black/50">Not used by any row: {extras.join(", ")}</p>}
          <BulkPreviewTable
            rows={rows}
            files={files}
            previews={previews}
            conflicts={conflicts}
            excluded={excluded}
            onChange={(id, patch) => setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))}
            onToggle={(id, include) =>
              setExcluded((current) => {
                const next = new Set(current);
                if (include) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep("files")}>
              Back
            </Button>
            <Button type="button" disabled={readyCount === 0} onClick={() => void startImport()}>
              Import {readyCount} product{readyCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}

      {step === "import" && (
        <div className="mt-6 space-y-4">
          <Progress.Root value={percent} className="h-2 overflow-hidden bg-black/10" aria-label="Import progress">
            <Progress.Indicator className="h-full bg-pink" style={{ width: `${percent}%` }} />
          </Progress.Root>
          <p className="text-sm text-black/60">
            {queue.states.filter((state) => state.status === "done").length} created,{" "}
            {queue.states.filter((state) => state.status === "error").length} failed
          </p>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {queue.states.map((state) => {
              const row = rows.find((item) => item.id === state.id);
              return (
                <li key={state.id} className="flex justify-between gap-4 border-b border-black/5 py-1">
                  <span>{row?.title || state.slug || state.id}</span>
                  <span className={state.status === "error" ? "text-pink-dark" : "text-black/50"}>
                    {state.status}
                    {state.error ? ` — ${state.error}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={queue.running || queue.states.every((state) => state.status !== "error")}
              onClick={() =>
                void queue.retryFailed(3).then((states) =>
                  onFinished(
                    states.filter((state) => state.status === "done").length,
                    states.filter((state) => state.status === "error").length
                  )
                )
              }
            >
              Retry failed
            </Button>
            <Button type="button" variant="ghost" disabled={queue.states.every((state) => state.status !== "error")} onClick={downloadErrors}>
              Download error report
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)} disabled={queue.running}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
