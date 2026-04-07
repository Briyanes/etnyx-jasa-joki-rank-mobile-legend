import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

export const metadata: Metadata = {
  title: "Order Joki ML - Pilih Paket Push Rank | ETNYX",
  description:
    "Order jasa joki & gendong Mobile Legends sekarang. Pilih paket push rank dari Warrior hingga Mythic Glory. Harga mulai Rp3.999, proses cepat & aman. Bayar via QRIS, bank transfer, e-wallet.",
  keywords: [
    "order joki ml", "joki ml murah", "paket push rank ml", "harga joki mobile legends",
    "joki mythic murah", "order boost ml", "joki rank ml terpercaya",
  ],
  openGraph: {
    title: "Order Joki ML - Pilih Paket Push Rank | ETNYX",
    description: "Pilih paket push rank ML. Harga mulai Rp3.999. Proses cepat, aman & bergaransi.",
    url: `${siteUrl}/order`,
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Order Joki ML - Pilih Paket Push Rank | ETNYX",
    description: "Pilih paket push rank ML. Harga mulai Rp3.999. Proses cepat, aman & bergaransi.",
  },
  alternates: { canonical: `${siteUrl}/order` },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
