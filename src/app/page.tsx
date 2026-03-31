import {
  Navbar,
  Footer,
  FloatingCTA,
  HeroSection,
  CalculatorSection,
  PricingSection,
  TrackingSection,
  HowItWorksSection,
  TrustSection,
  FAQSection,
} from "@/components";
import Testimonials from "@/components/Testimonials";
import Portfolio from "@/components/Portfolio";

export default function Home() {
  return (
    <>
      <Navbar />
      
      <main>
        <HeroSection />
        <CalculatorSection />
        <PricingSection />
        <Testimonials />
        <Portfolio />
        <TrackingSection />
        <HowItWorksSection />
        <TrustSection />
        <FAQSection />
      </main>

      <Footer />
      <FloatingCTA />
    </>
  );
}
