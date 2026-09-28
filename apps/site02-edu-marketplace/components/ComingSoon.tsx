import { Container, Section } from "@repo/ui";

export function ComingSoon({
  title,
  description,
  eyebrow = "Скоро",
}: {
  title: string;
  description: string;
  eyebrow?: string;
}) {
  return (
    <Section>
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">{eyebrow}</p>
        <h1 className="mt-4 font-heading text-4xl italic">{title}</h1>
        <p className="mt-4 max-w-xl text-[var(--color-text)]/70">{description}</p>
      </Container>
    </Section>
  );
}
