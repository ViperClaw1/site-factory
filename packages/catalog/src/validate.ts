// Checks a catalog document the way `catalog.py check` does: the JSON Schema of the standard
// (compiled by ajv from the vendored file, never retyped), then the rules the schema cannot
// express (catalog.py semantic_checks), ported one to one. Both accept and reject the same
// files; tests compare the reports line by line with catalog.py's own output.
import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import schema from "../standard/catalog.schema.json";
import { attrTypeOk, CATEGORIES } from "./categories";
import { FILE_ITEM_WARN, pyStr, type Issue, type Rule, type SchemaRule, type Severity } from "./issues";
import { CATALOG_LANGS } from "./types";

type Json = Record<string, unknown>;

const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
const schemaValidator = ajv.compile(schema);

const isObject = (value: unknown): value is Json => value !== null && typeof value === "object" && !Array.isArray(value);
const isInt = (value: unknown): value is number => Number.isInteger(value);

// Python truthiness: catalog.py tests fields with `if value` / `not value`.
function pyFalsy(value: unknown): boolean {
  if (value === null || value === undefined || value === false || value === 0 || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

// Python `x in container` for the containers catalog.py meets: list or dict keys.
function pyKeys(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isObject(value)) return Object.keys(value);
  return [];
}

// JSON with sorted keys at every level, so equal attributes give equal strings.
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const COUNTRY = /^[A-Z]{2}$/;
const REGION = /^[A-Z]{2}-[A-Z0-9]{1,3}$/;

// --- Schema ------------------------------------------------------------------------
// ajv errors reworded and placed as catalog.py's validator places them: a JSON pointer becomes
// items[0].texts.en, a missing or unknown key is reported on the key itself, and a value that
// has the wrong type or fails anyOf gets one error instead of one per branch.

function pointerToPath(pointer: string): string {
  return pointer
    .split("/")
    .slice(1)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((path, segment) => (/^\d+$/.test(segment) ? `${path}[${segment}]` : path ? `${path}.${segment}` : segment), "");
}

const escapePointer = (key: string) => key.replace(/~/g, "~0").replace(/\//g, "~1");

// propertyNames errors point at the object; catalog.py reports them on the key.
const errorPointer = (error: ErrorObject) =>
  error.propertyName !== undefined ? `${error.instancePath}/${escapePointer(error.propertyName)}` : error.instancePath;

function schemaIssues(doc: unknown): { path: string; rule: SchemaRule; params: Json }[] {
  if (schemaValidator(doc)) return [];
  const errors = schemaValidator.errors ?? [];
  const failedAnyOf = new Set(errors.filter((e) => e.keyword === "anyOf").map(errorPointer));
  // Type errors inside a failed anyOf belong to its branches and are replaced by the anyOf error.
  const wrongType = new Set(errors.filter((e) => e.keyword === "type").map(errorPointer).filter((p) => !failedAnyOf.has(p)));
  const out: { path: string; rule: SchemaRule; params: Json }[] = [];

  for (const error of errors) {
    const pointer = errorPointer(error);
    if (error.keyword === "if" || error.keyword === "propertyNames") continue;
    if (failedAnyOf.has(pointer) && error.keyword !== "anyOf") continue;
    if (wrongType.has(pointer) && error.keyword !== "type") continue;
    const path = pointerToPath(pointer);
    const params = error.params as Json;
    switch (error.keyword) {
      case "type":
        out.push({ path, rule: "schema:type", params: { types: [error.schema].flat() } });
        break;
      case "const":
        out.push({ path, rule: "schema:const", params: { expected: error.schema } });
        break;
      case "enum":
        out.push({ path, rule: "schema:enum", params: { allowed: params.allowedValues } });
        break;
      case "minLength":
      case "maxLength":
      case "minimum":
      case "maximum":
        out.push({ path, rule: `schema:${error.keyword}`, params: { limit: params.limit } });
        break;
      case "pattern":
        out.push({ path, rule: "schema:pattern", params: { value: error.propertyName ?? error.data } });
        break;
      case "anyOf":
        out.push({
          path,
          rule: "schema:anyOf",
          params: {
            value: error.data,
            hint: (error.parentSchema as Json | undefined)?.["x-error"] ?? "не подходит ни один из допустимых вариантов",
          },
        });
        break;
      case "required":
        out.push({ path: pointerToPath(`${pointer}/${escapePointer(String(params.missingProperty))}`), rule: "schema:required", params: {} });
        break;
      case "additionalProperties":
        out.push({
          path: pointerToPath(`${pointer}/${escapePointer(String(params.additionalProperty))}`),
          rule: "schema:additionalProperties",
          params: {},
        });
        break;
      case "uniqueItems":
        out.push({ path, rule: "schema:uniqueItems", params: {} });
        break;
      default:
        // A keyword the standard does not use yet: fail loudly in tests rather than hide it.
        throw new Error(`catalog schema keyword ${error.keyword} has no message`);
    }
  }
  return out;
}

// --- Rules outside the schema --------------------------------------------------------
// Same order and wording as catalog.py semantic_checks. Standard sections are cited per block.

type Add = (severity: Severity, rule: Rule, path: string, params?: Json) => void;

function semanticChecks(doc: unknown, add: Add): void {
  const docItems = isObject(doc) ? doc.items : undefined;
  const items: unknown[] = Array.isArray(docItems) ? docItems : [];
  const full = isObject(doc) && doc.mode === "replace";
  const seen = new Map<unknown, number>();
  const groups = new Map<unknown, number[]>();
  let untranslated = 0;

  if (items.length > FILE_ITEM_WARN) add("warning", "too_many_items", "items", { count: items.length });

  items.forEach((item, i) => {
    if (!isObject(item)) return;
    const where = `items[${i}]`;

    // Item key: a sku is unique within the file (§1, sku).
    const sku = item.sku ?? null;
    if (seen.has(sku)) add("error", "duplicate_sku", where, { sku, firstPosition: seen.get(sku)! + 1 });
    if (!seen.has(sku)) seen.set(sku, i);

    // Price and availability: no price means a quote request (rule 01).
    if ("price_usd" in item && "availability" in item) {
      if (item.price_usd === null && item.availability !== "on_request") add("error", "price_without_on_request", where);
      if (item.price_usd !== null && item.availability === "on_request") add("warning", "price_with_on_request", where);
    }

    // Sales restrictions, items 1 and 13: a region next to its whole country is redundant.
    const sold = item.not_sold_to;
    if (Array.isArray(sold)) {
      const whole = new Set(sold.filter((code) => typeof code === "string" && COUNTRY.test(code)));
      for (const code of sold) {
        if (typeof code === "string" && REGION.test(code) && whole.has(code.slice(0, 2))) {
          add("warning", "not_sold_to_region_redundant", where, { region: code, country: code.slice(0, 2) });
        }
      }
    }

    // Sales restrictions, items 2 and 9: a country age only raises the general one.
    // Without the general age in the file (merge mode) there is nothing to compare with.
    const byCountry = item.min_buyer_age_by_country;
    const generalAge = item.min_buyer_age ?? null;
    if (isObject(byCountry) && isInt(generalAge)) {
      for (const [country, age] of Object.entries(byCountry)) {
        if (isInt(age) && age <= generalAge) add("error", "age_by_country_not_higher", where, { country, age, generalAge });
      }
    }

    // Sales restrictions, item 3: an age check on delivery needs an age. In merge mode an
    // absent field means "unchanged", so only fields present and empty count.
    const restrictions = item.delivery_restrictions;
    if (Array.isArray(restrictions) && restrictions.includes("age_check_on_delivery")) {
      const noGeneral = generalAge === null && ("min_buyer_age" in item || full);
      const noCountry = pyFalsy(byCountry) && ("min_buyer_age_by_country" in item || full);
      if (noGeneral && noCountry) add("error", "age_check_without_age", where);
    }

    // Sales restrictions, item 13: not shown is not the same as not sold.
    const shown = item.not_shown_in;
    if (Array.isArray(shown)) {
      const whole = new Set(shown.filter((code) => typeof code === "string" && COUNTRY.test(code)));
      for (const code of shown) {
        if (typeof code === "string" && REGION.test(code) && whole.has(code.slice(0, 2))) {
          add("warning", "not_shown_in_region_redundant", where, { region: code, country: code.slice(0, 2) });
        }
      }
      // In merge mode without not_sold_to in the file the stored value is unknown; in replace
      // mode an absent field is an empty list.
      const closed = Array.isArray(sold) ? sold : full ? [] : null;
      if (closed) {
        for (const code of shown) {
          if (typeof code !== "string") continue;
          if (!closed.includes(code) && !(code.length > 2 && closed.includes(code.slice(0, 2)))) {
            add("warning", "shown_closed_sale_open", where, { code });
          }
        }
      }
    }

    // Sales restrictions, item 10: an ID check in a country the item is not sold to is redundant.
    const idCheck = item.buyer_id_check;
    if (Array.isArray(idCheck) && Array.isArray(sold)) {
      for (const country of idCheck) {
        if (sold.includes(country)) add("warning", "id_check_redundant", where, { country });
      }
    }

    // Brands: third_party only where the category allows it (rule 02, O-8).
    if (item.brand_owner === "third_party") {
      if (pyFalsy(item.category)) add("warning", "third_party_no_category", where);
      else if (!CATEGORIES.get(item.category as string)?.thirdPartyBrands) {
        add("error", "third_party_category", where, { category: item.category });
      }
    }

    // Categories and their attributes (categories.csv, owned by the customer, question 67).
    if (!pyFalsy(item.category)) {
      const category = CATEGORIES.get(item.category as string);
      if (!category) add("warning", "unknown_category", where, { category: item.category });
      else {
        const attributes = isObject(item.attributes) ? item.attributes : {};
        const extra = Object.keys(attributes).filter((key) => !category.fields.has(key)).sort();
        if (extra.length > 0) add("warning", "unknown_attributes", where, { fields: extra, category: item.category });
        // A known field holds a value of its categories.csv type.
        for (const [name, value] of Object.entries(attributes)) {
          const kind = category.fields.get(name);
          if (kind && !attrTypeOk(value, kind)) add("error", "attr_type", `${where}.attributes.${name}`, { kind, value });
        }
      }
    }

    if (!pyFalsy(item.group_id)) groups.set(item.group_id, [...(groups.get(item.group_id) ?? []), i]);

    // Full catalog (replace): an item on sale has a photo, a physical one has a weight
    // (§1, weight_g; question 66); video, sound and all 19 languages are recommended.
    if (full && item.status === "active") {
      if (pyFalsy(item.images)) add("error", "no_images", where);
      if (pyFalsy(item.videos) || pyFalsy(item.audio)) add("warning", "no_video_audio", where);
      if (item.type === "physical" && (item.weight_g ?? null) === null) add("error", "no_weight", where);
      const langs = pyFalsy(item.texts) ? [] : pyKeys(item.texts);
      if (CATALOG_LANGS.some((lang) => !langs.includes(lang))) untranslated += 1;
    }
  });

  if (untranslated) add("warning", "untranslated", "items", { count: untranslated });

  // Variants of one product (group_id) share category, brand and type and differ in attributes.
  for (const [group, indexes] of groups) {
    const variants = indexes.map((i) => items[i] as Json);
    for (const field of ["category", "brand", "type"]) {
      const values = new Set(variants.filter((variant) => field in variant).map((variant) => variant[field]));
      if (values.size > 1) {
        add("error", "group_field_mismatch", `group_id ${pyStr(group)}`, { field, values: [...values].map(pyStr).sort() });
      }
    }
    const attrs = variants.filter((variant) => "attributes" in variant).map((variant) => stableJson(variant.attributes));
    if (attrs.length !== new Set(attrs).size) add("error", "group_same_attributes", `group_id ${pyStr(group)}`);
  }
}

// --- Entry point -----------------------------------------------------------------------

/**
 * All errors and warnings for a parsed catalog file (JSON, or the result of csvToDocument).
 * Errors block the upload; warnings do not.
 */
export function checkCatalog(doc: unknown): Issue[] {
  const docItems = isObject(doc) && Array.isArray(doc.items) ? doc.items : [];
  const issues: Issue[] = [];
  const add: Add = (severity, rule, path, params = {}) => {
    const issue: Issue = { severity, rule, path, params };
    const match = /^items\[(\d+)\](.*)$/.exec(path);
    if (match) {
      const index = Number(match[1]);
      const item = docItems[index];
      issue.itemIndex = index;
      issue.sku = isObject(item) && "sku" in item ? pyStr(item.sku) : "?";
      issue.field = match[2]!.replace(/^\.+/, "");
    }
    issues.push(issue);
  };
  for (const { path, rule, params } of schemaIssues(doc)) add("error", rule, path, params);
  semanticChecks(doc, add);
  return issues;
}
