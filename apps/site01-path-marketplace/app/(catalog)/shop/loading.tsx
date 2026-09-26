import { SkeletonCard } from "@/components/SkeletonCard";
import { Container } from "@repo/ui";

// Banner block + product grid skeleton, matching the shop page layout.
export default function ShopLoading() {
  return (
    <>
      <div className="bg-cream">
        <Container className="animate-pulse py-14">
          <div className="h-3 w-24 bg-black/5" />
          <div className="mt-3 h-12 w-48 bg-black/5" />
        </Container>
      </div>
      <Container className="py-10">
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Container>
    </>
  );
}
