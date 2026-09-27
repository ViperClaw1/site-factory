import type { Lang } from "../locales";
import { de } from "./de";
import { en, type Dict } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import { ru } from "./ru";
import { zh } from "./zh";

export type { Dict };

// All dictionaries ship to the client so switching language is instant (no round-trip).
export const dictionaries: Record<Lang, Dict> = { en, ru, de, fr, es, it, zh, ja };
