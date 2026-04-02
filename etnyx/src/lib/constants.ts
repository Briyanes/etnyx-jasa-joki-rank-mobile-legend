import { RankOption, FAQItem } from "@/types";

export const rankOptions: RankOption[] = [
  { value: "warrior", label: "Warrior", order: 1 },
  { value: "elite", label: "Elite", order: 2 },
  { value: "master", label: "Master", order: 3 },
  { value: "grandmaster", label: "Grandmaster", order: 4 },
  { value: "epic", label: "Epic", order: 5 },
  { value: "legend", label: "Legend", order: 6 },
  { value: "mythic", label: "Mythic", order: 7 },
  { value: "mythicglory", label: "Mythic Glory", order: 8 },
];

export const faqItems: FAQItem[] = [
  {
    question: "Apakah aman dan tidak akan di-banned?",
    answer:
      "Ya, 100% aman. Tim kami menggunakan metode push rank yang natural dan sudah berpengalaman. Tidak pernah ada kasus banned selama 3+ tahun beroperasi. Kami juga memberikan garansi keamanan akun.",
  },
  {
    question: "Berapa lama proses joki?",
    answer:
      "Tergantung paket yang dipilih. Basic: 1-2 hari per tier. Standard: 2-4 hari per rank. Express: 1-2 hari per rank. Waktu bisa lebih cepat tergantung kondisi.",
  },
  {
    question: "Bisa request hero tertentu?",
    answer:
      "Bisa! Untuk paket Standard bisa request maksimal 3 hero favorit. Untuk paket Express, bebas request hero apapun sesuai keinginan kamu.",
  },
  {
    question: "Apakah data login saya aman?",
    answer:
      "Keamanan data adalah prioritas kami. Data login hanya digunakan untuk proses joki dan akan dihapus setelah selesai. Kami sarankan ganti password setelah proses selesai untuk keamanan ekstra.",
  },
];

export const siteConfig = {
  name: "ETNYX",
  description:
    "Platform jasa joki Mobile Legends terpercaya. Push rank cepat, aman, tanpa ribet. Hitung harga instant, order langsung via WhatsApp.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.vercel.app",
  ogImage: "/og-image.jpg",
  creator: "@etnyx_ml",
  keywords: [
    "joki ml",
    "jasa joki mobile legends",
    "push rank ml",
    "joki rank ml",
    "booster ml",
    "joki mythic",
    "jasa push rank",
    "joki mobile legends murah",
    "joki ml aman",
    "etnyx",
  ],
};
