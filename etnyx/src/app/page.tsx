import {
  Navbar,
  Footer,
  HeroSection,
  PricingSection,
  TrackingSection,
  HowItWorksSection,
  TrustSection,
  FAQSection,
} from "@/components";
import Testimonials from "@/components/Testimonials";
import Portfolio from "@/components/Portfolio";
import LiveCounter from "@/components/LiveCounter";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import TeamShowcaseSection from "@/components/sections/TeamShowcaseSection";
import PromoBanner from "@/components/PromoBanner";
import WhatsAppButton from "@/components/WhatsAppButton";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollAnimation from "@/components/ScrollAnimation";
import TermsPopup from "@/components/TermsPopup";
import CTASection from "@/components/sections/CTASection";
import BackToTop from "@/components/BackToTop";

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <TermsPopup />
      
      {/* Fixed header container */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PromoBanner />
        <Navbar />
      </div>
      
      <main>
        <HeroSection />
        
        <ScrollAnimation animation="fadeUp">
          <LiveCounter />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <HowItWorksSection />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <PricingSection />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <WhyChooseUsSection />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <TeamShowcaseSection />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <Testimonials />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <Portfolio />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <TrackingSection />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <TrustSection />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <FAQSection />
        </ScrollAnimation>
        
        <ScrollAnimation animation="fadeUp" delay={100}>
          <CTASection />
        </ScrollAnimation>
      </main>

      <Footer />
      <WhatsAppButton />
      <BackToTop />
    </>
  );
}
