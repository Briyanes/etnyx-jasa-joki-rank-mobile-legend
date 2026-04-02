import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.vercel.app";
const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX";

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
    "Platform jasa joki Mobile Legends terpercaya di Indonesia. Push rank cepat, aman, tanpa banned. Hitung harga instant, order langsung via WhatsApp. 3000+ order sukses.",
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
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
      "Push rank ML cepat & aman. Hitung harga instant, order via WhatsApp. 3000+ order sukses, 99% success rate. Platform joki ML #1 Indonesia.",
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
      "Push rank ML cepat & aman. Hitung harga instant, order via WhatsApp. Platform joki ML #1 Indonesia.",
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@etnyx_ml",
    site: "@etnyx_ml",
  },

  // Verification (add your actual verification codes)
  verification: {
    google: "your-google-verification-code",
  },

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
                telephone: "+62-812-3456-7890",
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
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>
        
        {children}
        <ThemeToggle />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
