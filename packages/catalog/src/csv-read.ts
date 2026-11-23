// Low-level CSV reading, shared by the catalog CSV conversion and categories.csv.

// --- Reading -----------------------------------------------------------------
// RFC 4180 with Python csv's lenient defaults: a quote inside an unquoted value is literal,
// text after a closing quote is appended, a blank line is skipped.

function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let atFieldStart = true;
  let lineHasContent = false;
  const endRow = () => {
    if (lineHasContent) rows.push([...row, field]);
    row = [];
    field = "";
    atFieldStart = true;
    lineHasContent = false;
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"' && atFieldStart) {
      quoted = true;
      atFieldStart = false;
      lineHasContent = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
      atFieldStart = true;
      lineHasContent = true;
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else {
      field += ch;
      atFieldStart = false;
      lineHasContent = true;
    }
  }
  endRow();
  return rows;
}

export interface CsvRecord {
  /** Values by column; a missing trailing value reads as "". */
  values: Map<string, string>;
  /** Values beyond the header: a delimiter inside an unquoted value. */
  extra: boolean;
}

/** DictReader equivalent. Excel with a European locale saves with ";", so the header decides. */
export function readCsv(text: string): { records: CsvRecord[]; columns: string[] } {
  const raw = text.startsWith("﻿") ? text.slice(1) : text;
  const header = raw.split(/\r\n|\r|\n/, 1)[0] ?? "";
  const delimiter = header.split(";").length > header.split(",").length ? ";" : ",";
  const [columns = [], ...rows] = parseRows(raw, delimiter);
  const records = rows.map((cells) => ({
    values: new Map(columns.map((column, i) => [column, cells[i] ?? ""])),
    extra: cells.length > columns.length,
  }));
  return { records, columns };
}
