import { localeMetadata } from "@repo/i18n";

// The page is a client component, so its metadata lives here.
export const generateMetadata = localeMetadata("/cart");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
