import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil",
  description: "Pembayaran order joki Mobile Legends berhasil. Order kamu sedang diproses.",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
