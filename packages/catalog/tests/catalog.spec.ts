import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { LOCALES } from "../../i18n/src/locales";
import schema from "../standard/catalog.schema.json";
import { CATEGORIES_CSV } from "../src/categories.generated";
import {
  CATALOG_LANGS,
  checkCatalog,
  csvToDocument,
  documentToCsv,
  formatReportRu,
  type Availability,
  type BrandOwner,
  type CatalogFile,
  type CatalogItem,
  type ComplianceMark,
  type DeliveryRestriction,
  type Issue,
  type ItemStatus,
  type ItemType,
  type RightsSource,
  type TextSource,
} from "../src";

const PKG = join(__dirname, "..");
const read = (path: string) => readFileSync(join(PKG, path), "utf8");
const lines = (text: string) => text.replace(/\r\n/g, "\n").split("\n").filter(Boolean);

interface Fixture {
  name: string;
  files: string[];
  catalog?: string;
  mode?: "merge" | "replace";
}
const FIXTURES = JSON.parse(read("fixtures/fixtures.json")) as Fixture[];

// The same steps as `catalog.py check`: JSON is checked as is, CSV is converted first and
// conversion errors come before the check's own.
function check(fixture: Fixture): { issues: Issue[]; origins?: string[] } {
  const [first, second] = fixture.files as [string, string?];
  if (first.endsWith(".json")) return { issues: checkCatalog(JSON.parse(read(first))) };
  const source = (path: string) => ({ name: basename(path), text: read(path) });
  const converted = csvToDocument(source(first), second ? source(second) : null, fixture.catalog!, fixture.mode!);
  if (!converted.doc) return { issues: converted.issues };
  return { issues: [...converted.issues, ...checkCatalog(converted.doc)], origins: converted.origins };
}

// --- Same report as catalog.py ---------------------------------------------------------

for (const fixture of FIXTURES) {
  test(`report matches catalog.py: ${fixture.name}`, () => {
    const { issues, origins } = check(fixture);
    const actual = formatReportRu(issues, origins);
    const expected = lines(read(`standard/expected/${fixture.name}.txt`));
    // Schema errors come in ajv's order, not catalog.py's; the lines and their count must match.
    expect([...actual].sort()).toEqual([...expected].sort());
  });
}

// --- The rule fires on the item that breaks it (independent of wording) -----------------

const RULES_AT: Record<string, [number | string, Issue["rule"]][]> = {
  "bad-merge": [
    [0, "price_without_on_request"],
    [1, "price_with_on_request"],
    [2, "duplicate_sku"],
    [3, "not_sold_to_region_redundant"],
    [4, "age_by_country_not_higher"],
    [5, "age_check_without_age"],
    [6, "not_shown_in_region_redundant"],
    [6, "shown_closed_sale_open"],
    [7, "id_check_redundant"],
    [8, "third_party_category"],
    [9, "third_party_no_category"],
    [11, "unknown_category"],
    [12, "unknown_attributes"],
    ["group_id OB-M", "group_field_mismatch"],
    ["group_id OB-M", "group_same_attributes"],
  ],
  "bad-replace": [
    [0, "no_images"],
    [0, "no_weight"],
    [0, "no_video_audio"],
    [1, "schema:required"],
    [1, "schema:minimum"],
    [2, "age_check_without_age"],
    ["items", "untranslated"],
  ],
  "bad-schema": [
    ["format", "schema:const"],
    ["extra", "schema:additionalProperties"],
    [0, "schema:pattern"],
    [0, "schema:enum"],
    [0, "schema:minimum"],
    [1, "schema:anyOf"],
    [1, "schema:maximum"],
    [1, "schema:type"],
    [2, "schema:minLength"],
    [3, "schema:uniqueItems"],
    [4, "schema:required"],
  ],
};

for (const [name, expectations] of Object.entries(RULES_AT)) {
  test(`rules fire on the right item: ${name}`, () => {
    const { issues } = check(FIXTURES.find((fixture) => fixture.name === name)!);
    for (const [where, rule] of expectations) {
      const hit = issues.some((issue) => issue.rule === rule && (typeof where === "number" ? issue.itemIndex === where : issue.path === where));
      expect(hit, `${rule} at ${where}`).toBe(true);
    }
  });
}

test("OB-J: third_party in drones passes", () => {
  const { issues } = check(FIXTURES.find((fixture) => fixture.name === "bad-merge")!);
  expect(issues.filter((issue) => issue.itemIndex === 10)).toEqual([]);
});

// --- CSV <-> JSON ------------------------------------------------------------------------

test("CSV to JSON gives what catalog.py csv2json gives", () => {
  const { doc, issues } = csvToDocument(
    { name: "catalog.csv", text: read("standard/catalog.csv") },
    { name: "translations.csv", text: read("standard/translations.csv") },
    "example-store",
    "replace",
  );
  expect(issues).toEqual([]);
  expect(doc).toEqual(JSON.parse(read("standard/expected/example-csv2json.json")));
});

test("JSON to CSV gives the standard's catalog.csv and translations.csv", () => {
  const { catalogCsv, translationsCsv, issues } = documentToCsv(JSON.parse(read("standard/example.json")) as CatalogFile);
  expect(issues).toEqual([]);
  expect(lines(catalogCsv)).toEqual(lines(read("standard/catalog.csv")));
  expect(lines(translationsCsv)).toEqual(lines(read("standard/translations.csv")));
});

// --- Types and data follow the vendored standard ------------------------------------------

test("CatalogItem has exactly the schema's fields", () => {
  const keys: Record<keyof CatalogItem, true> = {
    sku: true, status: true, type: true, category: true, group_id: true, brand: true, brand_owner: true,
    manufacturer: true, mpn: true, gtin: true, price_usd: true, availability: true, quantity: true,
    lead_time_days: true, not_sold_to: true, not_shown_in: true, min_buyer_age: true,
    min_buyer_age_by_country: true, delivery_restrictions: true, buyer_id_check: true, radio_equipment: true,
    compliance_marks: true, label_languages: true, weight_g: true, dimensions_mm: true, hs_code: true,
    country_of_origin: true, attributes: true, images: true, videos: true, audio: true, texts: true, sort: true,
  };
  expect(Object.keys(keys).sort()).toEqual(Object.keys(schema.$defs.item.properties).sort());
});

test("enum types match the schema", () => {
  const enums = (values: Record<string, true>) => Object.keys(values).sort();
  const item = schema.$defs.item.properties;
  expect(enums({ active: true, hidden: true, archived: true } satisfies Record<ItemStatus, true>)).toEqual([...item.status.enum].sort());
  expect(enums({ physical: true, digital: true, service: true } satisfies Record<ItemType, true>)).toEqual([...item.type.enum].sort());
  expect(enums({ own: true, stm: true, third_party: true } satisfies Record<BrandOwner, true>)).toEqual([...item.brand_owner.enum].sort());
  expect(
    enums({ in_stock: true, out_of_stock: true, preorder: true, on_request: true } satisfies Record<Availability, true>),
  ).toEqual([...item.availability.enum].sort());
  expect(
    enums({ age_check_on_delivery: true, no_parcel_locker: true } satisfies Record<DeliveryRestriction, true>),
  ).toEqual([...item.delivery_restrictions.items.enum].sort());
  expect(
    enums({ FCC: true, UKCA: true, CE: true, ISED: true, RCM: true, "R-NZ": true } satisfies Record<ComplianceMark, true>),
  ).toEqual([...item.compliance_marks.items.enum].sort());
  expect(
    enums({ own: true, stm_supplier: true, generated: true, licensed: true } satisfies Record<RightsSource, true>),
  ).toEqual([...schema.$defs.rights.properties.source.enum].sort());
  expect(
    enums({ human: true, machine: true, machine_checked: true } satisfies Record<TextSource, true>),
  ).toEqual([...schema.$defs.text.properties.source.enum].sort());
});

test("catalog languages = schema languages = site languages, same order", () => {
  expect([...CATALOG_LANGS]).toEqual(schema.$defs.item.properties.texts.propertyNames.enum);
  expect([...CATALOG_LANGS]).toEqual(LOCALES.map((locale) => locale.code));
});

test("embedded categories are the vendored categories.csv", () => {
  expect(CATEGORIES_CSV).toBe(read("standard/categories.csv"));
});
