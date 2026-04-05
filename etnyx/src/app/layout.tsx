import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import TrackingPixels from "@/components/TrackingPixels";
import { LanguageProvider } from "@/contexts/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F1419",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  // Basic Meta
  title: {
    default: "ETNYX - Jasa Joki Mobile Legends Terpercaya | Push Rank Cepat & Aman",
    template: "%s | ETNYX",
  },
  description:
    "Platform jasa joki Mobile Legends terpercaya di Indonesia. Push rank cepat, aman, tanpa banned. Hitung harga instant, order langsung via WhatsApp.",
  keywords: [
    "joki ml",
    "jasa joki mobile legends",
    "push rank ml",
    "joki rank ml",
    "booster ml",
    "joki mythic",
    "jasa push rank",
    "joki mobile legends murah",
    "joki ml aman",
    "joki ml terpercaya",
    "etnyx",
    "joki mlbb",
    "jasa joki rank",
    "push rank mobile legends",
    "joki legend ke mythic",
  ],
  authors: [{ name: "ETNYX", url: siteUrl }],
  creator: "ETNYX",
  publisher: "ETNYX",
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  // Manifest
  manifest: "/manifest.json",

  // Open Graph (Facebook, Instagram, WhatsApp)
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "ETNYX",
    title: "ETNYX - Jasa Joki Mobile Legends Terpercaya",
    description:
      "Push rank ML cepat & aman. Hitung harga instant, order via WhatsApp. Booster berpengalaman, akun dijaga.",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "ETNYX - Jasa Joki Mobile Legends Terpercaya",
        type: "image/jpeg",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "ETNYX - Jasa Joki Mobile Legends Terpercaya",
    description:
      "Push rank ML cepat & aman. Hitung harga instant, order via WhatsApp. Booster berpengalaman, akun dijaga.",
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@etnyx_ml",
    site: "@etnyx_ml",
  },

  // Verification
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }),

  // App Links
  appLinks: {
    web: {
      url: siteUrl,
      should_fallback: true,
    },
  },

  // Canonical
  alternates: {
    canonical: siteUrl,
  },

  // Category
  category: "gaming",

  // Other
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "ETNYX",
    "application-name": "ETNYX",
    "msapplication-TileColor": "#0F1419",
    "msapplication-config": "/browserconfig.xml",
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://wa.me" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="geo.region" content="ID" />
        <meta name="geo.placename" content="Indonesia" />
        <meta name="language" content="Indonesian" />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />
        
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "ETNYX",
              description: "Platform jasa joki Mobile Legends terpercaya di Indonesia",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ETNYX",
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              description: "Jasa Joki Mobile Legends Terpercaya",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+62-814-1413-1321",
                contactType: "customer service",
                availableLanguage: ["Indonesian", "English"],
              },
              sameAs: [
                "https://instagram.com/etnyx_ml",
                "https://tiktok.com/@etnyx_ml",
                "https://facebook.com/etnyx.ml",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: "Jasa Joki Mobile Legends",
              description: "Layanan push rank Mobile Legends profesional dengan garansi keamanan",
              provider: {
                "@type": "Organization",
                name: "ETNYX",
              },
              serviceType: "Gaming Service",
              areaServed: {
                "@type": "Country",
                name: "Indonesia",
              },
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "25000",
                highPrice: "500000",
                priceCurrency: "IDR",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-text antialiased">
        <LanguageProvider>
          {children}
          <ThemeToggle />
        </LanguageProvider>
        <TrackingPixels />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
