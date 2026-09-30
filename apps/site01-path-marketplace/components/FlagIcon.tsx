import type { Locale } from "@/lib/i18n";

// SVG flags. Emoji flags render as letter codes (GB, RU) on Windows and sit
// above the text baseline, so the language menu uses these instead.
const FLAGS: Record<Locale, JSX.Element> = {
  en: (
    <>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#fff" strokeWidth="2.8" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M10 0 V14 M0 7 H20" stroke="#fff" strokeWidth="4.6" />
      <path d="M10 0 V14 M0 7 H20" stroke="#C8102E" strokeWidth="2.4" />
    </>
  ),
  ru: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect y="4.67" width="20" height="4.66" fill="#0039A6" />
      <rect y="9.33" width="20" height="4.67" fill="#D52B1E" />
    </>
  ),
  de: (
    <>
      <rect width="20" height="14" fill="#000" />
      <rect y="4.67" width="20" height="4.66" fill="#DD0000" />
      <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
    </>
  ),
  fr: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="6.67" height="14" fill="#002395" />
      <rect x="13.33" width="6.67" height="14" fill="#ED2939" />
    </>
  ),
  es: (
    <>
      <rect width="20" height="14" fill="#AA151B" />
      <rect y="3.5" width="20" height="7" fill="#F1BF00" />
    </>
  ),
  it: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="6.67" height="14" fill="#009246" />
      <rect x="13.33" width="6.67" height="14" fill="#CE2B37" />
    </>
  ),
  zh: (
    <>
      <rect width="20" height="14" fill="#DE2910" />
      <polygon points="4,1.6 4.5,3.1 6.1,3.1 4.8,4 5.3,5.5 4,4.6 2.7,5.5 3.2,4 1.9,3.1 3.5,3.1" fill="#FFDE00" />
    </>
  ),
  ja: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <circle cx="10" cy="7" r="3.2" fill="#BC002D" />
    </>
  ),
};

export function FlagIcon({ locale }: { locale: Locale }) {
  return (
    <svg
      viewBox="0 0 20 14"
      aria-hidden="true"
      className="block h-3.5 w-5 shrink-0 rounded-[2px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
    >
      {FLAGS[locale]}
    </svg>
  );
}
