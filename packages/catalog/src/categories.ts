// Category list of the standard (categories.csv): code, name, fields allowed in attributes
// with their types, and whether third-party brands are allowed (rule 02, exception O-8). The
// customer owns the list (open question 67), so an unknown category or field is a warning,
// not an error; a known field with a value of the wrong type is an error.
import { CATEGORIES_CSV } from "./categories.generated";
import { readCsv } from "./csv-read";

/**
 * Field type after the colon in categories.csv (blade_length_mm:number); no type is str.
 * CSV holds text, so without a type "90" from CSV and 90 from JSON would differ, and the
 * restriction thresholds (blade over 120 mm, energy over 7.5 J) compare numbers.
 */
export type AttrKind = "str" | "int" | "number" | "bool";

export const ATTR_KIND_NAMES: Record<AttrKind, string> = {
  str: "строка",
  int: "целое число",
  number: "число",
  bool: "true или false",
};

export interface Category {
  code: string;
  name: string;
  /** Field name -> type. */
  fields: ReadonlyMap<string, AttrKind>;
  thirdPartyBrands: boolean;
}

function parseFields(spec: string): Map<string, AttrKind> {
  const fields = new Map<string, AttrKind>();
  for (const token of spec.split(/\s+/).filter(Boolean)) {
    const at = token.indexOf(":");
    const name = at < 0 ? token : token.slice(0, at);
    const kind = (at < 0 ? "" : token.slice(at + 1)) || "str";
    if (!(kind in ATTR_KIND_NAMES)) {
      throw new Error(`categories.csv: field ${name} has unknown type ${kind}; allowed: ${Object.keys(ATTR_KIND_NAMES).join(", ")}`);
    }
    fields.set(name, kind as AttrKind);
  }
  return fields;
}

/** Whether a JSON value fits a field type, as catalog.py attr_type_ok decides it. */
export function attrTypeOk(value: unknown, kind: AttrKind): boolean {
  if (kind === "int") return Number.isInteger(value);
  if (kind === "number") return typeof value === "number";
  if (kind === "bool") return typeof value === "boolean";
  return typeof value === "string";
}

export const CATEGORIES: ReadonlyMap<string, Category> = new Map(
  readCsv(CATEGORIES_CSV).records.map(({ values }) => {
    const code = values.get("code") ?? "";
    const category: Category = {
      code,
      name: values.get("name") ?? "",
      fields: parseFields(values.get("fields") ?? ""),
      thirdPartyBrands: (values.get("third_party_brands") ?? "").trim().toLowerCase() === "yes",
    };
    return [code, category];
  }),
);
