import type { Lang } from "@/lib/i18n/locales";

// SVG flags. Emoji flags render as letter codes on Windows.
const flags: Record<Lang, React.ReactNode> = {
  en: (
    <>
      <rect width="20" height="14" fill="#B22234" />
      <rect y="2" width="20" height="2" fill="#fff" />
      <rect y="6" width="20" height="2" fill="#fff" />
      <rect y="10" width="20" height="2" fill="#fff" />
      <rect width="8" height="8" fill="#3C3B6E" />
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
  pt: (
    <>
      <rect width="20" height="14" fill="#FF0000" />
      <rect width="8" height="14" fill="#006600" />
      <circle cx="8" cy="7" r="2.2" fill="#FFCC00" />
    </>
  ),
  tr: (
    <>
      <rect width="20" height="14" fill="#E30A17" />
      <circle cx="8" cy="7" r="3.1" fill="#fff" />
      <circle cx="8.9" cy="7" r="2.45" fill="#E30A17" />
      <polygon points="12.2,7 11.3,7.35 11.55,6.4 10.7,6.05 11.65,5.9 12.05,5 12.45,5.9 13.4,6.05 12.55,6.4 12.8,7.35" fill="#fff" />
    </>
  ),
  id: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="7" fill="#CE1126" />
    </>
  ),
  ar: (
    <>
      <rect width="20" height="14" fill="#006C35" />
      <path d="M3.5 9.4 H14.5" stroke="#fff" strokeWidth="0.9" />
      <path d="M14.2 8.2 Q16 9.4 14.2 10.6" stroke="#fff" strokeWidth="0.8" fill="none" />
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
  th: (
    <>
      <rect width="20" height="14" fill="#A51931" />
      <rect y="2.33" width="20" height="9.34" fill="#F4F5F8" />
      <rect y="4.67" width="20" height="4.66" fill="#2D2A4A" />
    </>
  ),
  vi: (
    <>
      <rect width="20" height="14" fill="#DA251D" />
      <polygon points="10,2.8 11.1,6 14.5,6 11.7,7.9 12.8,11.2 10,9.2 7.2,11.2 8.3,7.9 5.5,6 8.9,6" fill="#FFCD00" />
    </>
  ),
  ko: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <circle cx="10" cy="7" r="3.1" fill="#CD2E3A" />
      <path d="M10 3.9 A3.1 3.1 0 0 0 10 10.1 A1.55 1.55 0 0 1 10 6.95 A1.55 1.55 0 0 0 10 3.9" fill="#0047A0" />
    </>
  ),
  hi: (
    <>
      <rect width="20" height="14" fill="#FF9933" />
      <rect y="4.67" width="20" height="4.66" fill="#fff" />
      <rect y="9.33" width="20" height="4.67" fill="#138808" />
      <circle cx="10" cy="7" r="1.45" fill="none" stroke="#000080" strokeWidth="0.35" />
    </>
  ),
  it: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="6.67" height="14" fill="#009246" />
      <rect x="13.33" width="6.67" height="14" fill="#CE2B37" />
    </>
  ),
  ru: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect y="4.67" width="20" height="4.66" fill="#0039A6" />
      <rect y="9.33" width="20" height="4.67" fill="#D52B1E" />
    </>
  ),
  sw: (
    <>
      <rect width="20" height="14" fill="#006600" />
      <rect width="20" height="9.1" fill="#fff" />
      <rect width="20" height="8.4" fill="#BB0000" />
      <rect width="20" height="4.9" fill="#fff" />
      <rect width="20" height="4.2" fill="#000" />
    </>
  ),
  ha: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="6.67" height="14" fill="#008751" />
      <rect x="13.33" width="6.67" height="14" fill="#008751" />
    </>
  ),
  am: (
    <>
      <rect width="20" height="14" fill="#078930" />
      <rect y="4.67" width="20" height="4.66" fill="#FCDD09" />
      <rect y="9.33" width="20" height="4.67" fill="#DA121A" />
      <circle cx="10" cy="7" r="2" fill="#0F47AF" />
    </>
  ),
};

export function Flag({ code, className = "h-3.5 w-5" }: { code: Lang; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] ring-1 ring-white/15 [&>svg]:h-full [&>svg]:w-full ${className}`}
    >
      <svg viewBox="0 0 20 14" preserveAspectRatio="xMidYMid slice">
        {flags[code]}
      </svg>
    </span>
  );
}
