// locale: any BCP 47 tag (site02 passes its UI language); defaults to ru-RU.
export function formatPrice(amount: number, currency: string, locale = "ru-RU"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return `${str.slice(0, len).trimEnd()}…`;
}
