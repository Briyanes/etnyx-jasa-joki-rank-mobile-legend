import type { Metadata, Viewport } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F1419",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "ETNYX - Link Bio",
  description:
    "Jasa Joki Mobile Legends terpercaya. Order, cek harga, lacak progress, dan hubungi kami langsung.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "ETNYX - Link Bio",
    description: "Jasa Joki Mobile Legends terpercaya.",
    url: `${siteUrl}/bio`,
    siteName: "ETNYX",
    type: "website",
    images: [{ url: `${siteUrl}/logo/circle-landscape.webp`, width: 512, height: 512 }],
  },
};

export default function BioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
