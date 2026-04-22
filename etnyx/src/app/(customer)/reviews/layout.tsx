import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Customer | ETNYX Jasa Joki Mobile Legends Terpercaya",
  description: "Baca review dan testimoni asli dari customer ETNYX. Rating tinggi, layanan cepat, dan hasil terjamin untuk jasa joki Mobile Legends.",
  openGraph: {
    title: "Review Customer | ETNYX",
    description: "Review asli dari ratusan customer yang sudah menggunakan layanan joki Mobile Legends ETNYX.",
    url: "https://etnyx.com/reviews",
  },
  alternates: { canonical: "https://etnyx.com/reviews" },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
