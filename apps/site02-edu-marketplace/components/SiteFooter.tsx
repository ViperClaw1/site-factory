import Link from "next/link";
import { Container } from "@repo/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-10 text-sm text-[var(--color-text)]/60">
      <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>Курсы Path Animation</p>
        <nav className="flex gap-6">
          <Link href="/legal/privacy" className="hover:text-[var(--color-text)]">
            Конфиденциальность
          </Link>
          <Link href="/legal/terms" className="hover:text-[var(--color-text)]">
            Оферта
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
