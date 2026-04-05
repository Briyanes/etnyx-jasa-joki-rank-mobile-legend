import type { Metadata } from "next";
import { Suspense } from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.vercel.app";

export const metadata: Metadata = {
  title: "Review Pesanan | ETNYX",
  description:
    "Berikan review untuk pesanan joki Mobile Legends kamu. Bantu kami meningkatkan pelayanan.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Review Pesanan | ETNYX",
    description: "Berikan review untuk pesanan kamu.",
    url: `${siteUrl}/review`,
    siteName: "ETNYX",
    type: "website",
  },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
