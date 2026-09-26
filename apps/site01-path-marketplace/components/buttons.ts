// Square, uppercase Memphis-style buttons. Kept app-local (plain class strings
// usable on <button> and <Link>) instead of restyling @repo/ui's Button, which
// other sites in the monorepo still render with their own rounded look.

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.14em] transition-colors disabled:pointer-events-none disabled:opacity-50";

const VARIANTS = {
  primary: "bg-pink text-white hover:bg-pink-dark",
  dark: "bg-ink text-white hover:bg-pink",
  light: "bg-white text-pink hover:bg-ink hover:text-white",
  outline: "border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
  muted: "bg-black/10 text-black/50",
};

const SIZES = {
  sm: "px-3 py-1.5 text-[10px]",
  md: "px-6 py-3 text-xs",
  lg: "px-8 py-4 text-sm",
};

export function buttonClass(
  variant: keyof typeof VARIANTS = "primary",
  size: keyof typeof SIZES = "md",
  extra = ""
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}
