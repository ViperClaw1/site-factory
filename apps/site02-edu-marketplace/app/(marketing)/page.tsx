import { getCourses } from "@/features/catalog/api/courses";
import { CoursesShowcase } from "@/features/landing/components/CoursesShowcase";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Instructors } from "@/features/landing/components/Instructors";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { Pricing } from "@/features/landing/components/Pricing";
import { StatsCounter } from "@/features/landing/components/StatsCounter";
import { Testimonials } from "@/features/landing/components/Testimonials";
import { TrustMarquee } from "@/features/landing/components/TrustMarquee";

export const revalidate = 60;

export default async function HomePage() {
  const courses = await getCourses({ sort: "newest" });
  return (
    <>
      <LandingHero />
      <TrustMarquee />
      <CoursesShowcase courses={courses} />
      <StatsCounter />
      <HowItWorks />
      <Instructors />
      <Testimonials />
      <Pricing />
    </>
  );
}
