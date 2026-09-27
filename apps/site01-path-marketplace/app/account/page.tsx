import { ProfileForm, type AvatarMeta } from "@/components/ProfileForm";
import { blurhashToDataUrl } from "@/lib/blurhash";
import { createSupabaseServerClient } from "@repo/lib/supabase-server";
import { Container } from "@repo/ui";
import { redirect } from "next/navigation";

// Gated by middleware.ts ("profile" permission); the redirect below is only a
// fallback if the matcher and PROTECTED_ROUTES ever drift apart.
export default async function AccountPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  // select("*") rather than naming avatar_meta: keeps working if that column
  // hasn't been migrated yet (it's then simply absent).
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const avatarMeta = (profile?.avatar_meta as AvatarMeta | null | undefined) ?? null;

  return (
    <Container className="max-w-xl py-14">
      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initial={{
          // Before the first save, fall back to the name given at signup.
          fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
          phone: profile?.phone ?? "",
          avatarUrl: profile?.avatar_url ?? null,
          avatarMeta,
        }}
        avatarBlurDataUrl={blurhashToDataUrl(avatarMeta?.blurhash)}
      />
    </Container>
  );
}
