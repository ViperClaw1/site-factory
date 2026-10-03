"use client";

import { BulkPreviewTable } from "@/app/admin/_components/BulkPreviewTable";
import { useUploadQueue } from "@/app/admin/_components/useUploadQueue";
import {
  basename,
  CSV_TEMPLATE,
  draftsFromFiles,
  downloadTextFile,
  errorReportCsv,
  fileIndex,
  inspectDraft,
  parseCatalogCsv,
  unmatchedFiles,
  type DraftRow,
} from "@/lib/admin/csv";
import { mimeForExtension } from "@/lib/admin/schema";
import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import { Button, Modal } from "@repo/ui";
import * as Progress from "@radix-ui/react-progress";
import { useMemo, useState } from "react";

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

export function BulkUploadModal({ open, onOpenChange, onFinished }: BulkUploadModalProps) {
  const queue = useUploadQueue();
  const [step, setStep] = useState<Step>("files");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [groupByPrefix, setGroupByPrefix] = useState(false);
  const [hasCsv, setHasCsv] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const index = useMemo(() => fileIndex(files), [files]);
  const extras = useMemo(() => (hasCsv ? unmatchedFiles(rows, files) : []), [hasCsv, rows, files]);
  const readyCount = rows.filter((row) => !excluded.has(row.id) && Object.keys(inspectDraft(row, index).errors).length === 0).length;
  const doneCount = queue.states.filter((state) => state.status === "done" || state.status === "error").length;
  const percent = queue.states.length === 0 ? 0 : Math.round((doneCount / queue.states.length) * 100);

  function reset() {
    setStep("files");
    setFiles([]);
    setRows([]);
    setParseErrors([]);
    setGroupByPrefix(false);
    setHasCsv(false);
    setExcluded(new Set());
    setNotice(null);
  }

  async function takeFiles(incoming: File[]) {
    const csv = incoming.find((file) => file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv");
    const xlsx = incoming.find((file) => /\.xlsx?$/i.test(file.name));
    const media = incoming.filter((file) => mimeForExtension(file.name));
    setFiles(media);
    setNotice(xlsx ? "XLSX import is not in this version. Use the CSV template." : null);
    if (!csv) {
      setHasCsv(false);
      setParseErrors([]);
      return;
    }
    setHasCsv(true);
    const text = await csv.text();
    const parsed = parseCatalogCsv(text);
    setParseErrors(parsed.errors);
    setRows(parsed.rows);
  }

  function continueToPreview() {
    if (!hasCsv) {
      const drafts = draftsFromFiles(files, category, groupByPrefix);
      setRows(drafts);
      setParseErrors(drafts.length === 0 ? ["Drop at least one image."] : []);
    }
    setExcluded(new Set());
    setStep("preview");
  }

  function applyOverride(patch: Partial<DraftRow>) {
    setRows((current) => current.map((row) => ({ ...row, ...patch })));
  }

  async function startImport() {
    const jobs = rows.flatMap((row) => {
      const issue = inspectDraft(row, index);
      if (!issue.input || excluded.has(row.id)) return [];
      const media = row.media.flatMap((name) => {
        const file = index.get(basename(name));
        const mime = file ? mimeForExtension(file.name) : null;
        if (!file || !mime) return [];
        return [{ id: `${row.id}:${basename(name)}`, file, type: mime.startsWith("video/") ? ("video" as const) : ("image" as const), alt: issue.input?.title ?? row.title }];
      });
      if (media.length !== row.media.length || !issue.input) return [];
      return [{ id: row.id, fields: issue.input, media }];
    });
    setStep("import");
    const states = await queue.start(jobs, 3);
    const created = states.filter((state) => state.status === "done").length;
    const failed = states.filter((state) => state.status === "error").length;
    onFinished(created, failed);
  }

  function downloadErrors() {
    const failed = queue.states.filter((state) => state.status === "error");
    const report = errorReportCsv(
      failed.flatMap((state) => {
        const row = rows.find((item) => item.id === state.id);
        return row ? [{ row, message: state.error ?? "failed" }] : [];
      })
    );
    downloadTextFile("catalog-errors.csv", report);
  }

  return (
    <Modal
      open={open}
      size="xl"
      title="Bulk upload"
      description="CSV plus media files, or images alone."
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
            <p className="font-semibold text-ink">Drop a CSV and media files, or a folder</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <label className="cursor-pointer border border-black/20 px-3 py-2 text-xs font-semibold">
                Choose files
                <input
                  data-testid="bulk-files"
                  type="file"
                  multiple
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
          <p className="text-xs text-black/50">
            {files.length} media file{files.length === 1 ? "" : "s"}
            {hasCsv ? " · CSV loaded" : ""}
          </p>
          {!hasCsv && (
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
            <Button type="button" variant="ghost" onClick={() => downloadTextFile("catalog-template.csv", CSV_TEMPLATE)}>
              Download CSV template
            </Button>
            <Button type="button" onClick={continueToPreview} disabled={files.length === 0 && !hasCsv}>
              Continue
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
                  if (event.target.value === "active" || event.target.value === "draft") applyOverride({ status: event.target.value });
                }}
              >
                <option value="">Keep each row</option>
                <option value="active">active</option>
                <option value="draft">draft</option>
              </select>
            </label>
          </div>
          {extras.length > 0 && <p className="text-xs text-black/50">Not used by any row: {extras.join(", ")}</p>}
          <BulkPreviewTable
            rows={rows}
            files={files}
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
