import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | ETNYX Jasa Joki Mobile Legends",
  description: "Kebijakan privasi ETNYX menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi kamu.",
  openGraph: {
    title: "Kebijakan Privasi | ETNYX",
    description: "Kebijakan privasi layanan jasa joki Mobile Legends ETNYX.",
    url: "https://etnyx.com/privacy",
  },
  alternates: { canonical: "https://etnyx.com/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
