import { RankOption, FAQItem } from "@/types";

export const rankOptions: RankOption[] = [
  { value: "warrior", label: "Warrior", order: 1 },
  { value: "elite", label: "Elite", order: 2 },
  { value: "master", label: "Master", order: 3 },
  { value: "grandmaster", label: "Grandmaster", order: 4 },
  { value: "epic", label: "Epic", order: 5 },
  { value: "legend", label: "Legend", order: 6 },
  { value: "mythicgrading", label: "Mythic Grading", order: 7 },
  { value: "mythic", label: "Mythic", order: 8 },
  { value: "mythichonor", label: "Mythic Honor", order: 9 },
  { value: "mythicglory", label: "Mythic Glory", order: 10 },
  { value: "mythicimmortal", label: "Mythic Immortal", order: 11 },
];

export const rankLabels: Record<string, string> = Object.fromEntries(
  rankOptions.map((r) => [r.value, r.label])
);

export const faqItems: FAQItem[] = [
  {
    question: "Apakah aman dan tidak akan di-banned?",
    answer:
      "Kami pakai metode push rank yang natural, bukan cheat. Sejauh ini belum ada customer yang kena banned. Tapi untuk jaga-jaga, kami sarankan ganti password setelah selesai.",
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
    "Platform jasa joki & gendong Mobile Legends terpercaya. Push rank cepat, aman, tanpa ribet. Hitung harga instant, order langsung via WhatsApp.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com",
  ogImage: "/og-image.jpg",
  creator: "@etnyx_ml",
  keywords: [
    "joki ml",
    "jasa joki & gendong mobile legends",
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

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281515141452";
export const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "6285210420401";

// Reward system tiers
export const REWARD_TIERS = {
  bronze:   { name: "Bronze",   minPoints: 0,    discount: 0,  color: "#CD7F32" },
  silver:   { name: "Silver",   minPoints: 500,  discount: 3,  color: "#C0C0C0" },
  gold:     { name: "Gold",     minPoints: 1000, discount: 5,  color: "#FFD700" },
  platinum: { name: "Platinum", minPoints: 2500, discount: 8,  color: "#E5E4E2" },
} as const;

export type RewardTier = keyof typeof REWARD_TIERS;

// Points config
export const REWARD_CONFIG = {
  pointsPerRupiah: 10000,    // 1 point per Rp 10,000
  redeemRate: 100,           // 1 point = Rp 100
  minRedeem: 100,            // Minimum 100 points to redeem
} as const;
