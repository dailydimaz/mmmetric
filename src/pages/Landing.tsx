import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { OpenSource } from "@/components/landing/OpenSource";
import { Pricing } from "@/components/landing/Pricing";
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
        <OpenSource />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}