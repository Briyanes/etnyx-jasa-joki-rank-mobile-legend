import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pembayaran Manual — ETNYX",
  description: "Upload bukti transfer pembayaran joki Mobile Legends. Transfer ke rekening resmi ETNYX dan konfirmasi pembayaran kamu.",
  robots: { index: false, follow: false },
};

export default function PaymentManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
