import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Refund | ETNYX Jasa Joki Mobile Legends",
  description: "Kebijakan refund dan pengembalian dana ETNYX untuk layanan jasa joki Mobile Legends. Transparansi dan kepercayaan pelanggan.",
  openGraph: {
    title: "Kebijakan Refund | ETNYX",
    description: "Kebijakan refund dan pengembalian dana layanan ETNYX.",
    url: "https://etnyx.com/refund-policy",
  },
  alternates: { canonical: "https://etnyx.com/refund-policy" },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
