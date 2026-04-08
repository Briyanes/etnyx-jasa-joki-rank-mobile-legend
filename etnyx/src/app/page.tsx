import {
  Navbar,
  Footer,
  HeroSection,
  PricingSection,
  TrackingSection,
  FAQSection,
} from "@/components";
import Testimonials from "@/components/Testimonials";
import Portfolio from "@/components/Portfolio";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import TeamShowcaseSection from "@/components/sections/TeamShowcaseSection";
import PromoBanner from "@/components/PromoBanner";
import WhatsAppButton from "@/components/WhatsAppButton";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollAnimation from "@/components/ScrollAnimation";
import CTASection from "@/components/sections/CTASection";
import BackToTop from "@/components/BackToTop";
import { createAdminClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

interface SectionVisibility {
  hero: boolean;
  pricing: boolean;
  whyChooseUs: boolean;
  teamShowcase: boolean;
  testimonials: boolean;
  portfolio: boolean;
  tracking: boolean;
  faq: boolean;
  cta: boolean;
}

const DEFAULT_VISIBILITY: SectionVisibility = {
  hero: true, pricing: true,
  whyChooseUs: true, teamShowcase: true, testimonials: true,
  portfolio: true, tracking: true, faq: true, cta: true,
};

async function getSectionVisibility(): Promise<SectionVisibility> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "section_visibility")
      .single();
    if (data?.value) return { ...DEFAULT_VISIBILITY, ...data.value };
  } catch {}
  return DEFAULT_VISIBILITY;
}

export default async function Home() {
  const vis = await getSectionVisibility();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "ETNYX - Jasa Joki & Gendong Mobile Legends",
    description: "Platform jasa joki & gendong Mobile Legends terpercaya di Indonesia. Push rank cepat, aman, tanpa banned.",
    url: "https://etnyx.com",
    logo: "https://etnyx.com/logo/etnyx-logo.png",
    image: "https://etnyx.com/og-image.jpg",
    priceRange: "Rp 10.000 - Rp 500.000",
    address: { "@type": "PostalAddress", addressCountry: "ID" },
    sameAs: ["https://instagram.com/etnyx_ml", "https://tiktok.com/@etnyx_ml"],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "500",
      bestRating: "5",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IDR",
      lowPrice: "10000",
      highPrice: "500000",
      offerCount: "30",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LoadingScreen />
      
      {/* Fixed header container */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PromoBanner />
        <Navbar hiddenSections={vis} />
      </div>
      
      <main>
        {vis.hero && <HeroSection />}
        
        {vis.pricing && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <PricingSection />
          </ScrollAnimation>
        )}
        
        {vis.whyChooseUs && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <WhyChooseUsSection />
          </ScrollAnimation>
        )}
        
        {vis.teamShowcase && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <TeamShowcaseSection />
          </ScrollAnimation>
        )}
        
        {vis.testimonials && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <Testimonials />
          </ScrollAnimation>
        )}
        
        {vis.portfolio && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <Portfolio />
          </ScrollAnimation>
        )}
        
        {vis.tracking && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <TrackingSection />
          </ScrollAnimation>
        )}
        
        {vis.faq && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <FAQSection />
          </ScrollAnimation>
        )}
        
        {vis.cta && (
          <ScrollAnimation animation="fadeUp" delay={100}>
            <CTASection />
          </ScrollAnimation>
        )}
      </main>

      <Footer />
      <WhatsAppButton />
      <BackToTop />
    </>
  );
}
