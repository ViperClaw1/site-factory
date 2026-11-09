"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { DEFAULT_THEME, isTheme, type Theme } from "./theme";

export type { Theme } from "./theme";

const THEME_COOKIE = "theme";

// useLayoutEffect, so a language switch never paints the wrong theme; it warns on the server.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // The cookie is the source of truth: switching language remounts the root
  // layout, which resets data-theme on <html> to the default.
  useIsomorphicLayoutEffect(() => {
    const saved = document.cookie.match(/(?:^|; )theme=(light|dark)/)?.[1];
    if (isTheme(saved)) {
      setThemeState(saved);
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}

