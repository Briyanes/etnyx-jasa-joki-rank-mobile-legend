import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Riwayat Order Kamu",
  description: "Lihat riwayat order, lacak progress push rank, dan kelola akun ETNYX kamu.",
  robots: { index: false, follow: false },
};

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
