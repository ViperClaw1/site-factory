"use client";

import { BulkPreviewTable } from "@/app/admin/_components/BulkPreviewTable";
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

const STEPS: { id: Step; label: string }[] = [
  { id: "files", label: "Files" },
  { id: "preview", label: "Preview" },
  { id: "import", label: "Import" },
];

// Checkpoint progress: finished steps get a check, the current one is outlined.
function Stepper({ step }: { step: Step }) {
  const current = STEPS.findIndex((item) => item.id === step);
  return (
    <ol className="mt-4 flex items-center" aria-label="Progress">
      {STEPS.map((item, position) => {
        const done = position < current;
        const active = position === current;
        return (
          <li key={item.id} className="flex flex-1 items-center last:flex-none" aria-current={active ? "step" : undefined}>
            <span className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  done ? "border-pink bg-pink text-white" : active ? "border-pink text-pink" : "border-black/20 text-black/40"
                }`}
              >
                {done ? <i className="fa-solid fa-check text-xs" aria-hidden="true" /> : position + 1}
              </span>
              <span className={`text-sm font-semibold ${done || active ? "text-ink" : "text-black/40"}`}>{item.label}</span>
            </span>
            {position < STEPS.length - 1 && <span aria-hidden className={`mx-3 h-0.5 flex-1 ${done ? "bg-pink" : "bg-black/15"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

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
  // Names the JSON points at that were not dropped yet, so the admin knows what to attach.
  const notAttached = useMemo(
    () => [...new Set(fileMedia.flatMap((item) => (item.file && !index.has(basename(item.file)) ? [item.file] : [])))],
    [fileMedia, index]
  );

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
    // Straight to the preview. A file with no usable products stays here with its errors.
    if (parsed.rows.length > 0) await checkSlugs(parsed.rows);
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
    setExcluded((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function removeCatalogFile() {
    setCatalogFile(null);
    setRows([]);
    setParseErrors([]);
  }

  async function continueToPreview() {
    if (catalogFile) return checkSlugs(rows);
    const drafts = draftsFromFiles(files, category, groupByPrefix);
    setRows(drafts);
    setParseErrors(drafts.length === 0 ? ["Drop at least one image."] : []);
    setConflicts(new Set());
    setExcluded(new Set());
    setStep("preview");
  }

  async function checkSlugs(target: DraftRow[]) {
    // Rows whose slug is already in the catalog start unticked. If the check fails,
    // stay on this step: importing blind could create duplicates without warning.
    setChecking(true);
    setNotice(null);
    try {
      const slugs = [...new Set(target.map((row) => row.slug).filter(Boolean))];
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
      setExcluded(new Set(target.filter((row) => taken.has(row.slug)).map((row) => row.id)));
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
      <Stepper step={step} />

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
            <div data-testid="catalog-file" className="flex items-center justify-between gap-3 border border-black/15 px-3 py-2">
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
        <div
          className="mt-6 space-y-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void filesFromList(event.dataTransfer.items).then((dropped) => takeFiles(dropped));
          }}
        >
          {notAttached.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-pink/60 bg-pink-soft px-3 py-2">
              <p className="min-w-0 flex-1 text-xs text-pink-dark">
                Attach {notAttached.length} file{notAttached.length === 1 ? "" : "s"} named in the JSON, or drop them here: {notAttached.join(", ")}
              </p>
              <label className="cursor-pointer border border-black/20 bg-white px-3 py-2 text-xs font-semibold">
                Attach files
                <input
                  data-testid="bulk-attach"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                  className="sr-only"
                  onChange={(event) => {
                    if (event.target.files) void takeFiles([...event.target.files]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          )}
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
            onRemove={removeRow}
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
