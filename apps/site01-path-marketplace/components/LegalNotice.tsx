import { T } from "@/components/T";
import type { MessageKey } from "@/lib/i18n";
import { Container } from "@repo/ui";

export function LegalNotice({ titleKey }: { titleKey: MessageKey }) {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-display text-4xl text-ink">
        <T k={titleKey} />
      </h1>
      <p className="mt-6 leading-relaxed text-black/65">
        <T k="legal.pending" />
      </p>
    </Container>
  );
}
