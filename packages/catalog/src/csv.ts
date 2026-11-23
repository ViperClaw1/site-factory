// CSV form of the catalog (standard §4): catalog.csv with one row per item, plus an optional
// translations.csv with one row per (sku, lang). Port of csv_to_document / document_to_csv
// from catalog.py, including its quirks, so both accept the same files with the same report.
import { CATALOG_LANGS, type CatalogFile, type CatalogMode } from "./types";
import type { Issue } from "./issues";
import { CATEGORIES } from "./categories";
import { readCsv } from "./csv-read";

export { readCsv, type CsvRecord } from "./csv-read";

export const CLEAR = "#clear";

type ColumnKind = "str" | "int" | "number" | "list" | "map" | "bool";

// catalog.csv columns in export order, with the kind of value they hold.
const SCALAR_COLUMNS: Record<string, ColumnKind> = {
  sku: "str", status: "str", type: "str", category: "str",
  group_id: "str", brand: "str", brand_owner: "str",
  manufacturer: "str", mpn: "str", gtin: "str", price_usd: "str",
  availability: "str", quantity: "int", lead_time_days: "int",
  not_sold_to: "list", not_shown_in: "list", min_buyer_age: "int",
  min_buyer_age_by_country: "map",
  delivery_restrictions: "list", buyer_id_check: "list",
  radio_equipment: "bool", compliance_marks: "list",
  label_languages: "list", weight_g: "int", length_mm: "int",
  width_mm: "int", height_mm: "int", hs_code: "str",
  country_of_origin: "str", sort: "int",
};
const MEDIA_COLUMNS = ["images", "videos", "audio"] as const;
// Rights are written per kind of file: all photos of a row share one rights record.
const RIGHTS_FIELDS = ["rights", "confirmed_by", "confirmed_at"] as const;
const RIGHTS_COLUMNS = MEDIA_COLUMNS.flatMap((kind) => RIGHTS_FIELDS.map((field) => `${kind}_${field}`));
const DIMENSION_COLUMNS: Record<string, "length" | "width" | "height"> = {
  length_mm: "length",
  width_mm: "width",
  height_mm: "height",
};
const TEXT_FIELDS = ["title", "short", "description", "image_alt", "source"] as const;
const TRANSLATION_COLUMNS = ["sku", "lang", ...TEXT_FIELDS];

export interface CsvSource {
  /** File name used in the report, e.g. "catalog.csv". */
  name: string;
  text: string;
}

// --- Cell values -----------------------------------------------------------------

type Converted = string | number | boolean | string[] | Record<string, number> | null;
type ConvertResult =
  | { ok: true; value: Converted }
  | { ok: false; rule: "csv_not_int" | "csv_not_number" | "csv_not_bool" |"csv_bad_age_pair" | "csv_duplicate_country"; params: Record<string, unknown> };

const ok = (value: Converted): ConvertResult => ({ ok: true, value });

function convert(value: string, kind: ColumnKind): ConvertResult {
  if (value === CLEAR) {
    // radio_equipment is never empty: clearing it restores the default.
    return ok(kind === "list" ? [] : kind === "bool" ? false : null);
  }
  switch (kind) {
    case "int":
      return /^-?[0-9]+$/.test(value) ? ok(Number(value)) : { ok: false, rule: "csv_not_int", params: { value } };
    case "number":
      // Decimals use a point: a comma is the column delimiter.
      if (/^-?[0-9]+$/.test(value) || /^-?[0-9]+\.[0-9]+$/.test(value)) return ok(Number(value));
      return { ok: false, rule: "csv_not_number", params: { value } };
    case "bool":
      // Excel turns true into TRUE by itself, so case does not matter.
      if (!["true", "false"].includes(value.toLowerCase())) return { ok: false, rule: "csv_not_bool", params: { value } };
      return ok(value.toLowerCase() === "true");
    case "list":
      return ok(value.split(/\s+/).filter(Boolean));
    case "map": {
      // "SE=21 NO=18": country code, equals sign, whole number.
      const result: Record<string, number> = {};
      for (const pair of value.split(/\s+/).filter(Boolean)) {
        const at = pair.indexOf("=");
        const code = at < 0 ? pair : pair.slice(0, at);
        const age = at < 0 ? "" : pair.slice(at + 1);
        if (at < 0 || !/^[0-9]+$/.test(age)) return { ok: false, rule: "csv_bad_age_pair", params: { value: pair } };
        if (code in result) return { ok: false, rule: "csv_duplicate_country", params: { country: code } };
        result[code] = Number(age);
      }
      return ok(result);
    }
    default:
      return ok(value);
  }
}

function textColumn(name: string): { lang: string; field: string } | null {
  const match = /^(title|short|description|image_alt|source)\.([a-z]{2})$/.exec(name);
  return match ? { field: match[1]!, lang: match[2]! } : null;
}

// --- CSV -> document ---------------------------------------------------------------

export interface CsvConversion {
  /** null when catalog.csv has no sku column. */
  doc: CatalogFile | null;
  /** CSV location of every item, in item order, for formatRu. */
  origins: string[];
  issues: Issue[];
}

const csvError = (rule: Issue["rule"], params: Record<string, unknown>): Issue => ({
  severity: "error",
  rule,
  path: String(params.file),
  params,
});

/**
 * catalog.csv (+ translations.csv) to a catalog document. Values arrive as written in the file:
 * attributes stay strings, as in catalog.py. Validate the result with checkCatalog.
 */
export function csvToDocument(
  catalogCsv: CsvSource,
  translationsCsv: CsvSource | null,
  catalog: string,
  mode: CatalogMode,
): CsvConversion {
  const issues: Issue[] = [];
  const items: Record<string, unknown>[] = [];
  const origins: string[] = [];
  const bySku = new Map<string, Record<string, unknown>>();
  const file = catalogCsv.name;
  const { records, columns } = readCsv(catalogCsv.text);

  const known = new Set([...Object.keys(SCALAR_COLUMNS), ...MEDIA_COLUMNS, ...RIGHTS_COLUMNS]);
  for (const column of columns) {
    if (!known.has(column) && !column.startsWith("attr.") && !textColumn(column)) {
      issues.push(csvError("csv_unknown_column", { file, column }));
    }
  }
  if (!columns.includes("sku")) {
    issues.push(csvError("csv_no_sku_column", { file }));
    return { doc: null, origins: [], issues };
  }

  records.forEach((record, index) => {
    const line = index + 2;
    const item: Record<string, unknown> = {};
    const dims: Record<string, number | null> = {};
    let hasDims = false;
    if (record.extra) issues.push(csvError("csv_extra_values", { file, line }));

    // Scalar, attribute and English text columns.
    for (const [column, raw] of record.values) {
      const value = raw.trim();
      if (value === "") continue;
      if (column in SCALAR_COLUMNS) {
        const converted = convert(value, SCALAR_COLUMNS[column]!);
        if (!converted.ok) {
          issues.push(csvError(converted.rule, { file, line, column, ...converted.params }));
        } else if (column in DIMENSION_COLUMNS) {
          dims[DIMENSION_COLUMNS[column]!] = converted.value as number | null;
          hasDims = true;
        } else {
          item[column] = converted.value;
        }
      } else if (column.startsWith("attr.")) {
        if (value !== CLEAR) ((item.attributes ??= {}) as Record<string, string>)[column.slice(5)] = value;
      } else {
        const text = textColumn(column);
        if (text) {
          const texts = (item.texts ??= {}) as Record<string, Record<string, string>>;
          (texts[text.lang] ??= {})[text.field] = value;
        }
      }
    }

    // Dimensions come in three columns; #clear in any of them clears the whole value.
    if (hasDims) {
      const values = Object.values(dims);
      if (values.includes(null)) item.dimensions_mm = null;
      else if (values.length === 3) item.dimensions_mm = dims;
      else issues.push(csvError("csv_partial_dimensions", { file, line }));
    }

    // attr.* is text in CSV; a category field is converted to its categories.csv type.
    const attrs = item.attributes as Record<string, Converted> | undefined;
    if (attrs && Object.keys(attrs).length > 0) {
      if (!("category" in item)) issues.push(csvError("csv_attr_without_category", { file, line }));
      else {
        const fields = CATEGORIES.get(item.category as string)?.fields;
        for (const [attr, value] of Object.entries(attrs)) {
          const kind = fields?.get(attr);
          if (!kind) continue;
          const converted = convert(value as string, kind);
          if (converted.ok) attrs[attr] = converted.value;
          else {
            // As with other columns, a value that does not convert stays out of the document.
            delete attrs[attr];
            issues.push(csvError(converted.rule, { file, line, column: `attr.${attr}`, ...converted.params }));
          }
        }
      }
    }

    // Media: space-separated URLs with one rights record per kind of file.
    for (const column of MEDIA_COLUMNS) {
      const value = (record.values.get(column) ?? "").trim();
      const rights: Record<string, string> = {};
      for (const field of RIGHTS_FIELDS) {
        const cell = (record.values.get(`${column}_${field}`) ?? "").trim();
        if (cell) rights[field === "rights" ? "source" : field] = cell;
      }
      if (value === CLEAR) item[column] = [];
      else if (value) item[column] = value.split(/\s+/).filter(Boolean).map((url) => ({ url, rights: { ...rights } }));
      else if (Object.keys(rights).length > 0) issues.push(csvError("csv_rights_without_files", { file, line, column }));
    }

    if (!("sku" in item)) {
      issues.push(csvError("csv_empty_sku", { file, line }));
      return;
    }
    items.push(item);
    origins.push(`${file}, строка ${line}`);
    if (!bySku.has(item.sku as string)) bySku.set(item.sku as string, item);
  });

  // Translations: one row per (sku, lang); a sku absent from catalog.csv becomes a new item.
  if (translationsCsv) {
    const tFile = translationsCsv.name;
    const { records: tRecords, columns: tColumns } = readCsv(translationsCsv.text);
    for (const column of tColumns) {
      if (!TRANSLATION_COLUMNS.includes(column)) issues.push(csvError("csv_unknown_column", { file: tFile, column }));
    }
    tRecords.forEach((record, index) => {
      const line = index + 2;
      if (record.extra) issues.push(csvError("csv_extra_values", { file: tFile, line }));
      const sku = (record.values.get("sku") ?? "").trim();
      const lang = (record.values.get("lang") ?? "").trim();
      if (!sku || !lang) {
        issues.push(csvError("csv_translation_key", { file: tFile, line }));
        return;
      }
      let item = bySku.get(sku);
      if (!item) {
        item = { sku };
        items.push(item);
        origins.push(`${tFile}, строка ${line}`);
        bySku.set(sku, item);
      }
      const texts = (item.texts ??= {}) as Record<string, Record<string, string>>;
      const text = (texts[lang] ??= {});
      for (const field of TEXT_FIELDS) {
        const value = (record.values.get(field) ?? "").trim();
        if (!value) continue;
        if (field in text) issues.push(csvError("csv_translation_duplicate", { file: tFile, line, field, lang, sku }));
        text[field] = value;
      }
    });
  }

  const doc = { format: "path-catalog", version: "1.0", catalog, mode, items } as unknown as CatalogFile;
  return { doc, origins, issues };
}

// --- Document -> CSV ---------------------------------------------------------------
// Python's csv writer: CRLF line ends, quotes only where a value needs them.

function csvLine(values: string[]): string {
  return values.map((value) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)).join(",") + "\r\n";
}

export interface CsvExport {
  catalogCsv: string;
  translationsCsv: string;
  /** Items CSV cannot hold (different rights within one kind of file): keep those in JSON. */
  issues: Issue[];
}

/** Document to catalog.csv + translations.csv, as `catalog.py json2csv` writes them. */
export function documentToCsv(doc: CatalogFile): CsvExport {
  const issues: Issue[] = [];
  const items = doc.items as unknown as Record<string, unknown>[];
  const attrs = [...new Set(items.flatMap((item) => Object.keys((item.attributes as object | undefined) ?? {})))].sort();
  const columns = [
    ...Object.keys(SCALAR_COLUMNS),
    ...attrs.map((attr) => `attr.${attr}`),
    ...MEDIA_COLUMNS,
    ...RIGHTS_COLUMNS,
    ...TEXT_FIELDS.map((field) => `${field}.en`),
  ];

  let catalogCsv = csvLine(columns);
  for (const item of items) {
    const row: Record<string, string> = {};
    for (const column of Object.keys(SCALAR_COLUMNS)) {
      const key = DIMENSION_COLUMNS[column];
      const dims = item.dimensions_mm as Record<string, unknown> | null | undefined;
      const value = key ? dims?.[key] : item[column];
      const present = key ? "dimensions_mm" in item : column in item;
      if (present && (value === null || value === undefined)) row[column] = CLEAR;
      else if (Array.isArray(value)) row[column] = value.length ? value.join(" ") : column in item ? CLEAR : "";
      else if (value !== null && typeof value === "object") {
        const entries = Object.entries(value);
        row[column] = entries.length ? entries.map(([k, v]) => `${k}=${String(v)}`).join(" ") : column in item ? CLEAR : "";
      } else if (typeof value === "boolean") row[column] = value ? "true" : "false";
      else if (value !== undefined) row[column] = String(value);
    }
    for (const [attr, value] of Object.entries((item.attributes as Record<string, unknown> | undefined) ?? {})) {
      row[`attr.${attr}`] = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
    }
    for (const column of MEDIA_COLUMNS) {
      if (!(column in item)) continue;
      const media = item[column] as { url: string; rights: Record<string, string> }[];
      row[column] = media.map((file) => file.url).join(" ") || CLEAR;
      const rights = new Set(media.map((file) => JSON.stringify(Object.fromEntries(Object.entries(file.rights).sort()))));
      if (rights.size > 1) {
        issues.push({ severity: "error", rule: "csv_mixed_rights", path: String(item.sku), params: { sku: item.sku, column } });
      } else if (rights.size === 1) {
        for (const [key, value] of Object.entries(JSON.parse([...rights][0]!) as Record<string, string>)) {
          row[`${column}_${key === "source" ? "rights" : key}`] = value;
        }
      }
    }
    const en = (item.texts as Record<string, Record<string, string>> | undefined)?.en ?? {};
    for (const [field, value] of Object.entries(en)) row[`${field}.en`] = value;
    catalogCsv += csvLine(columns.map((column) => row[column] ?? ""));
  }

  let translationsCsv = csvLine(TRANSLATION_COLUMNS);
  for (const item of items) {
    const texts = (item.texts as Record<string, Record<string, string>> | undefined) ?? {};
    for (const lang of CATALOG_LANGS.slice(1)) {
      const text = texts[lang];
      if (text && Object.keys(text).length > 0) {
        translationsCsv += csvLine(TRANSLATION_COLUMNS.map((column) =>
          column === "sku" ? String(item.sku) : column === "lang" ? lang : (text[column] ?? ""),
        ));
      }
    }
  }
  return { catalogCsv, translationsCsv, issues };
}
