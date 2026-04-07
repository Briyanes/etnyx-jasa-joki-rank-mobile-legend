import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

export const metadata: Metadata = {
  title: "Login - Masuk ke Akun ETNYX",
  description: "Login ke akun ETNYX untuk melihat riwayat order, lacak progress push rank, dan kelola akun joki Mobile Legends kamu.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Login - Masuk ke Akun ETNYX",
    description: "Login ke akun ETNYX untuk melihat riwayat order dan lacak progress push rank.",
    url: `${siteUrl}/login`,
  },
  alternates: { canonical: `${siteUrl}/login` },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
