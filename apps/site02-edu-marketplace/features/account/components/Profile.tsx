"use client";

import { signOut } from "@/features/auth/api";
import { useUser } from "@/features/auth/hooks";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Signed-in user's profile. Guests are bounced to /login?next=/account.
// ponytail: client-side guard only; add middleware when /account serves private server data.
export function Profile() {
  const { t } = useI18n();
  const { user, ready } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  if (!user) return null;

  // Google fills full_name/avatar_url; email signups have neither yet.
  const meta = user.user_metadata as { full_name?: string; avatar_url?: string };

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{t.account.title}</h1>

      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        {meta.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Google avatar, not worth an images.domains entry
          <img src={meta.avatar_url} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl font-bold text-ink">
            {user.email?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          {meta.full_name && <p className="truncate font-semibold">{meta.full_name}</p>}
          <p className="truncate text-sm text-white/60">{user.email}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 h-11 rounded-full border border-white/15 px-6 text-sm font-semibold transition hover:border-red-400 hover:text-red-300"
      >
        {t.account.signOut}
      </button>
    </section>
  );
}
