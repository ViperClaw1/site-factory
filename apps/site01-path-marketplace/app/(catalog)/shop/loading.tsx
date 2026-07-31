import { SkeletonCard } from "@/components/SkeletonCard";
import { Container, Section } from "@repo/ui";

export default function ShopLoading() {
  return (
    <Section>
      <Container>
        <h1 className="font-heading text-3xl font-bold">Shop</h1>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
