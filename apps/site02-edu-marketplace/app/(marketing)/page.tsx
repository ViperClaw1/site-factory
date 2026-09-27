import { CoursesShowcase } from "@/features/landing/components/CoursesShowcase";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Instructors } from "@/features/landing/components/Instructors";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { Pricing } from "@/features/landing/components/Pricing";
import { StatsCounter } from "@/features/landing/components/StatsCounter";
import { Testimonials } from "@/features/landing/components/Testimonials";
import { TrustMarquee } from "@/features/landing/components/TrustMarquee";

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <TrustMarquee />
      <CoursesShowcase />
      <StatsCounter />
      <HowItWorks />
      <Instructors />
      <Testimonials />
      <Pricing />
    </>
  );
}
