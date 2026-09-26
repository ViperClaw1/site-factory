import { SkeletonCard } from "@/components/SkeletonCard";
import { Container } from "@repo/ui";

// Pink hero block + product grid skeleton, matching the home page layout.
export default function HomeLoading() {
  return (
    <>
      <div className="min-h-[560px] animate-pulse bg-pink/80 lg:min-h-[640px]" />
      <Container className="py-20">
        <div className="h-3 w-24 bg-black/5" />
        <div className="mt-3 h-12 w-80 max-w-full bg-black/5" />
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Container>
    </>
  );
}
