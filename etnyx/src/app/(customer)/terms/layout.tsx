import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | ETNYX Jasa Joki Mobile Legends",
  description: "Syarat dan ketentuan penggunaan layanan jasa joki Mobile Legends ETNYX. Baca sebelum menggunakan layanan kami.",
  openGraph: {
    title: "Syarat & Ketentuan | ETNYX",
    description: "Syarat dan ketentuan penggunaan layanan jasa joki Mobile Legends ETNYX.",
    url: "https://etnyx.com/terms",
  },
  alternates: { canonical: "https://etnyx.com/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
