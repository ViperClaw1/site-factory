import { NewsFeed } from "@/features/news/components/NewsFeed";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/news");

export default function NewsPage() {
  return <NewsFeed />;
}
