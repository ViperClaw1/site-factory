// Category list of the standard (categories.csv): code, name, fields allowed in attributes,
// and whether third-party brands are allowed (rule 02, exception O-8). The customer owns the
// list (open question 67), so an unknown category or field is a warning, not an error.
import { CATEGORIES_CSV } from "./categories.generated";
import { readCsv } from "./csv";

export interface Category {
  code: string;
  name: string;
  fields: ReadonlySet<string>;
  thirdPartyBrands: boolean;
}

export const CATEGORIES: ReadonlyMap<string, Category> = new Map(
  readCsv(CATEGORIES_CSV).records.map(({ values }) => {
    const code = values.get("code") ?? "";
    const category: Category = {
      code,
      name: values.get("name") ?? "",
      fields: new Set((values.get("fields") ?? "").split(/\s+/).filter(Boolean)),
      thirdPartyBrands: (values.get("third_party_brands") ?? "").trim().toLowerCase() === "yes",
    };
    return [code, category];
  }),
);
