import { Profile } from "@/features/account/components/Profile";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/account");

export default function AccountPage() {
  return <Profile />;
}
