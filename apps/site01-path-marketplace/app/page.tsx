import { Button, Container, Section } from "@repo/ui";

export default function HomePage() {
  return (
    <Section>
      <Container>
        <h1 className="font-heading text-4xl font-bold">Path Animation Marketplace</h1>
        <p className="mt-4 max-w-xl text-black/70">
          Collectible toys, art, and digital drops — coming soon.
        </p>
        <Button className="mt-6">Browse the shop</Button>
      </Container>
    </Section>
  );
}
