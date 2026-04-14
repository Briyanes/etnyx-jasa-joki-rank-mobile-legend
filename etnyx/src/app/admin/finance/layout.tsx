import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance - ETNYX",
  robots: "noindex, nofollow",
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
