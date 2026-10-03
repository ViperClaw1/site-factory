import type { Lang } from "../locales";
import { am } from "./am";
import { ar } from "./ar";
import { de } from "./de";
import { en, type Dict } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { ha } from "./ha";
import { id } from "./id";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { sw } from "./sw";
import { th } from "./th";
import { vi } from "./vi";
import { zh } from "./zh";

export type { Dict };

// All dictionaries ship to the client so switching language is instant (no round-trip).
export const dictionaries: Record<Lang, Dict> = {
  en,
  de,
  fr,
  es,
  pt,
  id,
  ar,
  zh,
  ja,
  th,
  vi,
  ko,
  it,
  sw,
  ha,
  am,
};
