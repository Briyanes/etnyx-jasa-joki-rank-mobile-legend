import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

export const metadata: Metadata = {
  title: "Register - Daftar Akun ETNYX",
  description: "Buat akun ETNYX gratis untuk order joki ML lebih cepat, lacak progress, dan dapatkan kode referral untuk diskon tambahan.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Register - Daftar Akun ETNYX",
    description: "Buat akun ETNYX gratis. Order joki ML lebih cepat, lacak progress, dapatkan referral.",
    url: `${siteUrl}/register`,
  },
  alternates: { canonical: `${siteUrl}/register` },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
