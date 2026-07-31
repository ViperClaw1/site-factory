import { SkeletonCard } from "@/components/SkeletonCard";
import { Container, Grid, Section } from "@repo/ui";

export default function CollectionsLoading() {
  return (
    <Section>
      <Container>
        <h1 className="font-heading text-3xl font-bold">Collections</h1>
        <Grid cols={3} className="mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
