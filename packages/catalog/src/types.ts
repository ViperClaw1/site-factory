// Types of the catalog upload file, written by hand from standard/catalog.schema.json.
// The schema stays the source of truth: tests check that standard/example.json fits these
// types and that CATALOG_LANGS matches the schema. Field comments name the standard's rule
// only where the type alone does not explain it.

export const CATALOG_FORMAT = "path-catalog";

/** texts.<lang>: the schema's language list, in the same order as @repo/i18n LOCALES. */
export const CATALOG_LANGS = [
  "en", "de", "fr", "es", "pt", "it", "tr", "ru", "zh", "ja",
  "ko", "ar", "id", "hi", "vi", "th", "sw", "ha", "am",
] as const;

export type CatalogLang = (typeof CATALOG_LANGS)[number];
/** merge changes only the fields present; replace is the full catalog and archives absent items. */
export type CatalogMode = "merge" | "replace";
export type ItemStatus = "active" | "hidden" | "archived";
export type ItemType = "physical" | "digital" | "service";
/** third_party only in categories with third_party_brands = yes (rule 02, O-8). */
export type BrandOwner = "own" | "stm" | "third_party";
export type Availability = "in_stock" | "out_of_stock" | "preorder" | "on_request";
export type RightsSource = "own" | "stm_supplier" | "generated" | "licensed";
export type TextSource = "human" | "machine" | "machine_checked";
export type DeliveryRestriction = "age_check_on_delivery" | "no_parcel_locker";
export type ComplianceMark = "FCC" | "UKCA" | "CE" | "ISED" | "RCM" | "R-NZ";

export interface MediaRights {
  source: RightsSource;
  confirmed_by?: string;
  /** YYYY-MM-DD */
  confirmed_at?: string;
}

export interface CatalogMedia {
  /** https only */
  url: string;
  rights: MediaRights;
}

export interface CatalogText {
  title?: string;
  short?: string;
  description?: string;
  image_alt?: string;
  source?: TextSource;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

/**
 * One catalog position. Only sku is required in merge mode; in replace mode the schema also
 * requires status, type, category, brand, brand_owner, price_usd, availability and
 * texts.en.title/description. null clears a value in merge mode.
 */
export interface CatalogItem {
  sku: string;
  status?: ItemStatus;
  type?: ItemType;
  category?: string;
  group_id?: string | null;
  brand?: string;
  brand_owner?: BrandOwner;
  manufacturer?: string | null;
  mpn?: string | null;
  gtin?: string | null;
  /** "1299.00"; null means price on request (availability must be on_request). */
  price_usd?: string | null;
  availability?: Availability;
  quantity?: number | null;
  lead_time_days?: number | null;
  /** ISO 3166-1 country (AU) or ISO 3166-2 region (AU-SA). */
  not_sold_to?: string[];
  /** Same codes as not_sold_to; hides the card and keeps it out of ads, does not block sale. */
  not_shown_in?: string[];
  min_buyer_age?: number | null;
  /** Country code -> age; only raises min_buyer_age. */
  min_buyer_age_by_country?: Record<string, number> | null;
  delivery_restrictions?: DeliveryRestriction[];
  buyer_id_check?: string[];
  radio_equipment?: boolean;
  compliance_marks?: ComplianceMark[];
  /** ISO 639-1 languages on the product and packaging, not limited to site languages. */
  label_languages?: string[];
  weight_g?: number | null;
  dimensions_mm?: Dimensions | null;
  hs_code?: string | null;
  country_of_origin?: string | null;
  /** Category fields from categories.csv; scalars only. */
  attributes?: Record<string, string | number | boolean>;
  images?: CatalogMedia[];
  videos?: CatalogMedia[];
  audio?: CatalogMedia[];
  texts?: Partial<Record<CatalogLang, CatalogText>>;
  sort?: number | null;
}

export interface CatalogFile {
  format: typeof CATALOG_FORMAT;
  /** "1.<minor>" */
  version: string;
  /** Ecosystem catalog code, not a site: the site comes from the category (ADR-008). */
  catalog: string;
  mode: CatalogMode;
  generated_at?: string;
  items: CatalogItem[];
}
