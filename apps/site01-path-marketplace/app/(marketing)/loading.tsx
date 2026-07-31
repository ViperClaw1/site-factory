import { SkeletonCard } from "@/components/SkeletonCard";
import { Container, Section } from "@repo/ui";

export default function HomeLoading() {
  return (
    <>
      <Section className="pt-8">
        <Container>
          <div className="grid animate-pulse gap-8 lg:grid-cols-2 lg:items-center">
            <div className="aspect-square w-full rounded-3xl bg-black/5" />
            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-black/5" />
              <div className="h-8 w-2/3 rounded bg-black/5" />
              <div className="h-4 w-full rounded bg-black/5" />
              <div className="h-4 w-1/2 rounded bg-black/5" />
            </div>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <h2 className="font-heading text-2xl font-bold">New Arrivals</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
