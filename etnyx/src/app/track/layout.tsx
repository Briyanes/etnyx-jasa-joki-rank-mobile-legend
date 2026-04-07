import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

export const metadata: Metadata = {
  title: "Lacak Order Joki ML - Track Order Real-time | ETNYX",
  description:
    "Lacak progress order joki Mobile Legends kamu secara real-time. Masukkan Order ID untuk melihat status, progress rank, dan estimasi selesai.",
  keywords: [
    "lacak order joki ml", "track order ml", "cek status joki", "progress push rank",
    "tracking order mobile legends",
  ],
  openGraph: {
    title: "Lacak Order Joki ML - Track Order Real-time | ETNYX",
    description: "Lacak progress order joki ML real-time. Masukkan Order ID untuk cek status.",
    url: `${siteUrl}/track`,
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lacak Order Joki ML - Track Order Real-time | ETNYX",
    description: "Lacak progress order joki ML real-time. Masukkan Order ID untuk cek status.",
  },
  alternates: { canonical: `${siteUrl}/track` },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
