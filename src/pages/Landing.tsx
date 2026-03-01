import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ComparisonTable } from "@/components/landing/features/ComparisonTable";
import { LiveDemoSection } from "@/components/landing/features/LiveDemoSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { OpenSource } from "@/components/landing/OpenSource";
import { Pricing } from "@/components/landing/Pricing";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { KonamiEasterEgg } from "@/components/ui/KonamiEasterEgg";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <ScrollProgress />
      <KonamiEasterEgg />
      <Header />
      <main>
        <Hero />
        <SocialProofBar />
        <Features />
        <ComparisonTable />
        <LiveDemoSection />
        <Testimonials />
        <OpenSource />
        <Pricing />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}