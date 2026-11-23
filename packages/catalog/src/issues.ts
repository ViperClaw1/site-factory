// Check results are data, not text. A rule code is stable across languages; formatRu turns an
// issue into the exact line catalog.py prints, because the person filling the file sees the
// same lines in the standard's own checker. Another language is another formatter over the
// same rule codes, so checks and tests do not change with it.

import type { AttrKind } from "./categories";
import { ATTR_KIND_NAMES } from "./categories";

export type Severity = "error" | "warning";

export type SchemaRule =
  | "schema:type"
  | "schema:const"
  | "schema:enum"
  | "schema:minLength"
  | "schema:maxLength"
  | "schema:pattern"
  | "schema:minimum"
  | "schema:maximum"
  | "schema:anyOf"
  | "schema:required"
  | "schema:additionalProperties"
  | "schema:uniqueItems";

export type SemanticRule =
  | "too_many_items"
  | "duplicate_sku"
  | "price_without_on_request"
  | "price_with_on_request"
  | "not_sold_to_region_redundant"
  | "age_by_country_not_higher"
  | "age_check_without_age"
  | "not_shown_in_region_redundant"
  | "shown_closed_sale_open"
  | "id_check_redundant"
  | "third_party_no_category"
  | "third_party_category"
  | "unknown_category"
  | "unknown_attributes"
  | "attr_type"
  | "no_images"
  | "no_video_audio"
  | "no_weight"
  | "untranslated"
  | "group_field_mismatch"
  | "group_same_attributes";

export type CsvRule =
  | "csv_unknown_column"
  | "csv_no_sku_column"
  | "csv_extra_values"
  | "csv_not_int"
  | "csv_not_bool"
  | "csv_not_number"
  | "csv_attr_without_category"
  | "csv_bad_age_pair"
  | "csv_duplicate_country"
  | "csv_partial_dimensions"
  | "csv_rights_without_files"
  | "csv_empty_sku"
  | "csv_translation_key"
  | "csv_translation_duplicate"
  | "csv_mixed_rights";

export type Rule = SchemaRule | SemanticRule | CsvRule;

export interface Issue {
  severity: Severity;
  rule: Rule;
  /** Where, as catalog.py names it: "items[2].price_usd", "items", "group_id X", "format". */
  path: string;
  /** Set when the issue belongs to one item. */
  itemIndex?: number;
  /** The item's sku as catalog.py prints it ("?" when the item has none). */
  sku?: string;
  /** Path inside the item, e.g. "texts.en.title"; empty for the item as a whole. */
  field?: string;
  params: Record<string, unknown>;
}

export const FILE_ITEM_WARN = 10000;

const EXTRA_VALUES =
  "значений больше, чем колонок: разделитель внутри значения без кавычек (например, цена 1 299,00)";

// --- Python-compatible value printing ------------------------------------------
// catalog.py prints values with repr() and str(); the reference reports depend on it.

export function pyRepr(value: unknown): string {
  if (typeof value === "string") {
    const quote = value.includes("'") && !value.includes('"') ? '"' : "'";
    const body = value
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .split(quote)
      .join(`\\${quote}`);
    return quote + body + quote;
  }
  if (Array.isArray(value)) return `[${value.map(pyRepr).join(", ")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).map(([key, item]) => `${pyRepr(key)}: ${pyRepr(item)}`).join(", ")}}`;
  }
  return pyStr(value);
}

export function pyStr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return pyRepr(value);
}

// --- Messages ------------------------------------------------------------------

function message(issue: Issue): string {
  const p = issue.params;
  switch (issue.rule) {
    // Schema keywords, worded as catalog.py's own validator words them.
    case "schema:type":
      return `ожидается ${(p.types as string[]).join(" или ")}`;
    case "schema:const":
      return `должно быть ${pyRepr(p.expected)}`;
    case "schema:enum":
      return `допустимо: ${(p.allowed as unknown[]).map(pyStr).join(", ")}`;
    case "schema:minLength":
      return "пустое значение";
    case "schema:maxLength":
      return `длиннее ${pyStr(p.limit)} знаков`;
    case "schema:pattern":
      return `не по формату: ${pyRepr(p.value)}`;
    case "schema:minimum":
      return `меньше ${pyStr(p.limit)}`;
    case "schema:maximum":
      return `больше ${pyStr(p.limit)}`;
    case "schema:anyOf":
      return `не по формату: ${pyRepr(p.value)} — ${String(p.hint)}`;
    case "schema:required":
      return "обязательное поле не заполнено";
    case "schema:additionalProperties":
      return "неизвестное поле";
    case "schema:uniqueItems":
      return "повторяющиеся значения";

    // Rules the schema cannot express (catalog.py semantic_checks).
    case "too_many_items":
      return `${pyStr(p.count)} позиций в одном файле — разбейте на части до ${FILE_ITEM_WARN}`;
    case "duplicate_sku":
      return `артикул ${pyStr(p.sku)} уже встречался в файле, позиция ${pyStr(p.firstPosition)}`;
    case "price_without_on_request":
      return "цены нет — наличие должно быть on_request (запрос предложения)";
    case "price_with_on_request":
      return "цена указана, но наличие on_request — покупатель увидит запрос предложения";
    case "not_sold_to_region_redundant":
      return `not_sold_to: регион ${pyStr(p.region)} лишний — страна ${pyStr(p.country)} исключена целиком`;
    case "age_by_country_not_higher":
      return (
        `min_buyer_age_by_country: ${pyStr(p.country)} — ${pyStr(p.age)} не выше общего min_buyer_age ` +
        `${pyStr(p.generalAge)}: по стране возраст только повышается`
      );
    case "age_check_without_age":
      return (
        "delivery_restrictions: age_check_on_delivery без min_buyer_age и " +
        "min_buyer_age_by_country — возраст, который проверять при вручении, не задан"
      );
    case "not_shown_in_region_redundant":
      return `not_shown_in: регион ${pyStr(p.region)} лишний — страна ${pyStr(p.country)} скрыта целиком`;
    case "shown_closed_sale_open":
      return `not_shown_in: ${pyStr(p.code)} — показ закрыт, продажа открыта (нет в not_sold_to): проверить`;
    case "id_check_redundant":
      return `buyer_id_check: страна ${pyStr(p.country)} исключена целиком (not_sold_to) — проверка документа лишняя`;
    case "third_party_no_category":
      return "brand_owner third_party без категории в файле — допустимость проверит служба загрузки";
    case "third_party_category":
      return (
        `чужая марка (third_party) в категории ${pyRepr(p.category)}: по правилу 02 ` +
        "допустима только в категориях с third_party_brands = yes в categories.csv"
      );
    case "unknown_category":
      return `категории ${pyRepr(p.category)} нет в categories.csv`;
    case "unknown_attributes":
      return `полей ${(p.fields as string[]).join(", ")} нет у категории ${pyStr(p.category)} в categories.csv`;
    case "attr_type":
      return `ожидается ${ATTR_KIND_NAMES[p.kind as AttrKind]} (тип поля в categories.csv), а не ${pyRepr(p.value)}`;
    case "no_images":
      return "у позиции в продаже нет фото";
    case "no_video_audio":
      return "по правилам у карточки есть видео и звук — их нет";
    case "no_weight":
      return (
        "у физического товара в продаже нет веса (weight_g) — по стандарту обязателен, " +
        "без него доставку и пошлины не посчитать"
      );
    case "untranslated":
      return (
        `${pyStr(p.count)} поз. переведены не на все 19 языков — ` +
        "на недостающих покажется машинный перевод с английского"
      );
    case "group_field_mismatch":
      return `у вариантов разное поле ${pyStr(p.field)}: ${pyRepr(p.values)}`;
    case "group_same_attributes":
      return "у двух вариантов одинаковые attributes — покупатель их не различит";

    // CSV conversion. These carry their own location (file and line).
    case "csv_unknown_column":
      return `${pyStr(p.file)}: неизвестная колонка ${pyRepr(p.column)}`;
    case "csv_no_sku_column":
      return `${pyStr(p.file)}: нет колонки sku`;
    case "csv_extra_values":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)} — ${EXTRA_VALUES}`;
    case "csv_not_int":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)}, ${pyStr(p.column)} — не целое число: ${pyRepr(p.value)}`;
    case "csv_not_bool":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)}, ${pyStr(p.column)} — ожидается true или false: ${pyRepr(p.value)}`;
    case "csv_not_number":
      return (
        `${pyStr(p.file)}, строка ${pyStr(p.line)}, ${pyStr(p.column)} — ` +
        `не число (дробная часть через точку): ${pyRepr(p.value)}`
      );
    case "csv_attr_without_category":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)} — attr.* без category: тип поля задан категорией, заполните category`;
    case "csv_bad_age_pair":
      return (
        `${pyStr(p.file)}, строка ${pyStr(p.line)}, ${pyStr(p.column)} — ` +
        `ожидается КОД=число через пробел, например SE=21 NO=18: ${pyRepr(p.value)}`
      );
    case "csv_duplicate_country":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)}, ${pyStr(p.column)} — страна ${pyStr(p.country)} указана дважды`;
    case "csv_partial_dimensions":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)} — размеры заполняются тремя колонками сразу`;
    case "csv_rights_without_files":
      return (
        `${pyStr(p.file)}, строка ${pyStr(p.line)}, ${pyStr(p.column)}_rights — ` +
        "права без файлов: файлы и права меняются вместе"
      );
    case "csv_empty_sku":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)} — пустой артикул`;
    case "csv_translation_key":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)} — нужны sku и lang`;
    case "csv_translation_duplicate":
      return `${pyStr(p.file)}, строка ${pyStr(p.line)} — ${pyStr(p.field)}.${pyStr(p.lang)} для ${pyStr(p.sku)} уже задан`;
    case "csv_mixed_rights":
      return (
        `${pyStr(p.sku)}: у файлов ${pyStr(p.column)} разные права — в CSV одна запись прав на вид файлов, ` +
        "такую позицию ведите в JSON"
      );
  }
}

/**
 * One line as catalog.py prints it, without the ОШИБКА/ВНИМАНИЕ prefix. origins are the CSV
 * locations of items ("catalog.csv, строка 3"); without them an item is "позиция N".
 */
export function formatRu(issue: Issue, origins?: readonly string[]): string {
  if (issue.rule.startsWith("csv_")) return message(issue);
  let where = issue.path;
  if (issue.itemIndex !== undefined) {
    const place = origins?.[issue.itemIndex] ?? `позиция ${issue.itemIndex + 1}`;
    where = `${place}, ${issue.sku ?? "?"}${issue.field ? `: ${issue.field}` : ""}`;
  }
  return `${where} — ${message(issue)}`;
}

/** The full report of `catalog.py check`: errors, then warnings, then the summary line. */
export function formatReportRu(issues: readonly Issue[], origins?: readonly string[]): string[] {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return [
    ...errors.map((issue) => `ОШИБКА  ${formatRu(issue, origins)}`),
    ...warnings.map((issue) => `ВНИМАНИЕ ${formatRu(issue, origins)}`),
    `Итог: ошибок ${errors.length}, предупреждений ${warnings.length}`,
  ];
}

export function hasErrors(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
