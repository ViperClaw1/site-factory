import type { Lang } from "../locales";
import { am } from "./am";
import { ar } from "./ar";
import { de } from "./de";
import { en, type Dict } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { ha } from "./ha";
import { hi } from "./hi";
import { id } from "./id";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { ru } from "./ru";
import { tr } from "./tr";
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
  tr,
  id,
  ar,
  zh,
  ja,
  th,
  vi,
  ko,
  hi,
  it,
  ru,
  sw,
  ha,
  am,
};
