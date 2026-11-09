export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}
