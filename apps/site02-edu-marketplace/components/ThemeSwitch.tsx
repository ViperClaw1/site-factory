"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useTheme } from "@/lib/theme/ThemeProvider";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      aria-pressed={light}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      title={light ? "Dark" : "Light"}
      onClick={() => setTheme(light ? "dark" : "light")}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/75 transition hover:border-brand hover:text-brand"
    >
      {light ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
