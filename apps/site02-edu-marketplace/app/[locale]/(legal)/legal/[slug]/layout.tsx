import { alternates, type Lang } from "@repo/i18n";

// The page is a client component, so its metadata lives here.
export function generateMetadata({ params }: { params: { locale: Lang; slug: string } }) {
  return { alternates: alternates(`/legal/${params.slug}`, params.locale) };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
