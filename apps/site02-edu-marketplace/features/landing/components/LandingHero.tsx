import { Button, Container, Section } from "@repo/ui";
import Link from "next/link";

export function LandingHero() {
  return (
    <Section className="flex min-h-[80vh] items-center">
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">01 / Образование</p>
        <h1 className="mt-6 max-w-3xl font-heading text-5xl leading-tight sm:text-6xl">
          Собирай навыки.{" "}
          <em className="italic text-[var(--color-primary)]">По одному курсу.</em>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--color-text)]/70">
          Витрина курсов: видео, аудио и текст. Покупаешь конкретный курс — учишься в плеере, когда готов.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/courses">
            <Button>Каталог курсов</Button>
          </Link>
          <a href="#catalog">
            <Button variant="ghost">Как это устроено ↓</Button>
          </a>
        </div>
      </Container>
    </Section>
  );
}
