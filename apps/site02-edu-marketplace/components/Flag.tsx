import type { Lang } from "@/lib/i18n/locales";

// SVG flags: emoji flags don't render on Windows, so draw simplified ones (3:2 box, "slice" crop).
const flags: Record<Lang, React.ReactNode> = {
  en: (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
  ru: (
    <svg viewBox="0 0 3 2">
      <rect width="3" height="2" fill="#fff" />
      <rect y="0.667" width="3" height="0.667" fill="#0039A6" />
      <rect y="1.333" width="3" height="0.667" fill="#D52B1E" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 5 3" preserveAspectRatio="xMidYMid slice">
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#DD0000" />
      <rect y="2" width="5" height="1" fill="#FFCE00" />
    </svg>
  ),
  fr: (
    <svg viewBox="0 0 3 2">
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ED2939" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 3 2">
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </svg>
  ),
  it: (
    <svg viewBox="0 0 3 2">
      <rect width="1" height="2" fill="#009246" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#CE2B37" />
    </svg>
  ),
  zh: (
    <svg viewBox="0 0 30 20">
      <rect width="30" height="20" fill="#DE2910" />
      <polygon
        fill="#FFDE00"
        points="5,2 5.674,4.073 7.853,4.073 6.09,5.354 6.763,7.427 5,6.146 3.237,7.427 3.91,5.354 2.147,4.073 4.326,4.073"
      />
      {[
        [10, 2],
        [12, 4],
        [12, 7],
        [10, 9],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.8" fill="#FFDE00" />
      ))}
    </svg>
  ),
  ja: (
    <svg viewBox="0 0 30 20">
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  ),
};

export function Flag({ code, className = "h-3.5 w-5" }: { code: Lang; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] ring-1 ring-white/15 [&>svg]:h-full [&>svg]:w-full ${className}`}
    >
      {flags[code]}
    </span>
  );
}
