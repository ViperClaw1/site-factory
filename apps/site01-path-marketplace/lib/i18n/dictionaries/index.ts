import type { Lang } from "../locales";
import { en, type Dict, type MessageKey } from "./en";
import { de } from "./de";
import { fr } from "./fr";
import { es } from "./es";
import { pt } from "./pt";
import { tr } from "./tr";
import { id } from "./id";
import { ar } from "./ar";
import { zh } from "./zh";
import { ja } from "./ja";
import { th } from "./th";
import { vi } from "./vi";
import { ko } from "./ko";
import { hi } from "./hi";
import { it } from "./it";
import { ru } from "./ru";
import { sw } from "./sw";
import { ha } from "./ha";
import { am } from "./am";
export type { Dict, MessageKey };

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
