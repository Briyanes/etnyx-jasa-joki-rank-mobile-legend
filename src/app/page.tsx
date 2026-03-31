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

export default function Home() {
  return (
    <>
      <Navbar />
      
      <main>
        <HeroSection />
        <CalculatorSection />
        <PricingSection />
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
