"use client";

import { toast, toastError } from "@/components/ToastProvider";
import { useState, useCallback, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RankTier } from "@/types";
import {
  formatRupiah,
} from "@/lib/pricing-utils";
import Footer from "@/components/layout/Footer";
import TermsPopup from "@/components/TermsPopup";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Crown,
  Check,
  Loader2,
  MessageCircle,
  Tag,
  CreditCard,
  Phone,
  Gamepad2,
  Star,
  Package,
  Minus,
  Plus,
  Users,
  ArrowRight,
  Search,
  Sparkles,
  Swords,
  Clock,
  CalendarClock,
  ChevronDown,
  ShieldCheck,
  Smartphone,
  MapPin,
  Target,
  Wand2,
  TreePine,
  Coins,
} from "lucide-react";
import { MoontonIcon, FacebookIcon, GoogleIcon, TiktokIcon, VkIcon, AppleIcon } from "@/components/BrandIcons";
import { captureUtmParams, getStoredUtmParams, trackAddToCart, trackInitiateCheckout, trackViewContent } from "@/lib/tracking";

type LoginMethod = "moonton" | "facebook" | "google" | "tiktok" | "vk" | "apple";

interface OrderForm {
  loginMethod: LoginMethod;
  userId: string;
  serverId: string;
  nickname: string;
  accountLogin: string;
  accountPassword: string;
  heroRequest: string;
  notes: string;
  currentRank: RankTier | "";  // Allow empty for placeholder UX in Per Star mode
  targetRank: RankTier | "";
  isExpress: boolean;
  isPremium: boolean;
  promoCode: string;
  whatsapp: string;
  email: string;
  // Gendong-specific
  preferredRole: string;
  playSchedule: string;
}

// Login method options with brand icons (inline SVG — no react-icons dependency)
const LOGIN_METHODS: { id: LoginMethod; name: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { id: "moonton", name: "Moonton", Icon: MoontonIcon, color: "#FF6B35" },
  { id: "facebook", name: "Facebook", Icon: FacebookIcon, color: "#1877F2" },
  { id: "google", name: "Google", Icon: GoogleIcon, color: "#EA4335" },
  { id: "tiktok", name: "TikTok", Icon: TiktokIcon, color: "#000000" },
  { id: "vk", name: "VK", Icon: VkIcon, color: "#4A76A8" },
  { id: "apple", name: "Apple ID", Icon: AppleIcon, color: "#A2AAAD" },
];

// ML Roles for Gendong mode (client picks their preferred role)
const ML_ROLE_ICONS: Record<string, React.ReactNode> = {
  exp: <Swords className="w-5 h-5" />,
  roam: <Shield className="w-5 h-5" />,
  mid: <Wand2 className="w-5 h-5" />,
  jungler: <TreePine className="w-5 h-5" />,
  gold: <Coins className="w-5 h-5" />,
};

const DEFAULT_ML_ROLES = [
  { id: "exp", name: "EXP Laner", disabled: false },
  { id: "roam", name: "Roamer", disabled: false },
  { id: "mid", name: "Mid Laner", disabled: false },
  { id: "jungler", name: "Jungler", disabled: true },
  { id: "gold", name: "Gold Laner", disabled: true },
];

// Default play schedule options
const DEFAULT_SCHEDULE_OPTIONS = [
  { id: "pagi", label: "Pagi (08:00-12:00)" },
  { id: "siang", label: "Siang (12:00-16:00)" },
  { id: "sore", label: "Sore (16:00-19:00)" },
  { id: "malam", label: "Malam (19:00-22:00)" },
  { id: "larut", label: "Larut Malam (22:00-02:00)" },
  { id: "weekend", label: "Weekend Seharian" },
  { id: "flexible", label: "Fleksibel (Kapan Saja)" },
];

// Product catalog types
interface ProductPackage {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rankKey: string;
  currentRank: string;
  targetRank: string;
  currentDivision?: number;
  targetDivision?: number;
}

interface PackageCategory {
  id: string;
  title: string;
  type?: "paket" | "classic";
  packages: ProductPackage[];
}

const DEFAULT_CATALOG: PackageCategory[] = [
  {
    id: "promo",
    title: "Paket Rush 10 Star",
    packages: [
      { id: "rush5-epic", title: "Rush 5 Star Epic", price: 32000, originalPrice: 35000, discountPercent: 9, rankKey: "epic", currentRank: "epic", targetRank: "epic" },
      { id: "rush5-legend", title: "Rush 5 Star Legend", price: 37000, originalPrice: 40000, discountPercent: 8, rankKey: "legend", currentRank: "legend", targetRank: "legend" },
      { id: "rush9-epic", title: "Rush 9 Star Epic + Bonus 1", price: 58000, originalPrice: 70000, discountPercent: 17, rankKey: "epic", currentRank: "epic", targetRank: "epic" },
      { id: "rush9-legend", title: "Rush 9 Star Legend + Bonus 1", price: 68000, originalPrice: 80000, discountPercent: 15, rankKey: "legend", currentRank: "legend", targetRank: "legend" },
      { id: "rush5-mythic", title: "Rush 5 Star Mythic", price: 95000, originalPrice: 105000, discountPercent: 10, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "rush5-honor", title: "Rush 5 Star Honor", price: 105000, originalPrice: 115000, discountPercent: 9, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
      { id: "rush5-glory", title: "Rush 5 Star Glory", price: 130000, originalPrice: 137000, discountPercent: 5, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
      { id: "rush9-mythic", title: "Rush 9 Star Mythic + Bonus 1", price: 171000, originalPrice: 211000, discountPercent: 19, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "rush9-honor", title: "Rush 9 Star Honor + Bonus 1", price: 189000, originalPrice: 230000, discountPercent: 18, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
      { id: "rush9-glory", title: "Rush 9 Star Glory + Bonus 1", price: 234000, originalPrice: 275000, discountPercent: 15, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
    ],
  },
  {
    id: "paket-warrior",
    title: "Paket Warrior",
    packages: [
      { id: "warrior3-elite3", title: "Warrior III - Elite III", price: 25089, rankKey: "warrior", currentRank: "warrior", targetRank: "elite" },
      { id: "warrior3-master4", title: "Warrior III - Master IV", price: 70089, rankKey: "warrior", currentRank: "warrior", targetRank: "master" },
      { id: "warrior3-gm5", title: "Warrior III - GM V", price: 149089, rankKey: "warrior", currentRank: "warrior", targetRank: "grandmaster" },
      { id: "warrior3-epic5", title: "Warrior III - Epic V", price: 282089, rankKey: "warrior", currentRank: "warrior", targetRank: "epic" },
      { id: "warrior3-legend5", title: "Warrior III - Legend V", price: 459089, rankKey: "warrior", currentRank: "warrior", targetRank: "legend" },
      { id: "warrior1-mythic", title: "Warrior I - Mythic", price: 645089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic" },
      { id: "warrior2-mythic", title: "Warrior II - Mythic", price: 653089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic" },
      { id: "warrior3-mythic", title: "Warrior III - Mythic", price: 660089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic" },
    ],
  },
  {
    id: "paket-elite",
    title: "Paket Elite",
    packages: [
      { id: "elite3-master4", title: "Elite III - Master IV", price: 45089, rankKey: "elite", currentRank: "elite", targetRank: "master" },
      { id: "elite3-gm5", title: "Elite III - GM V", price: 123089, rankKey: "elite", currentRank: "elite", targetRank: "grandmaster" },
      { id: "elite3-epic5", title: "Elite III - Epic V", price: 259089, rankKey: "elite", currentRank: "elite", targetRank: "epic" },
      { id: "elite3-legend5", title: "Elite III - Legend V", price: 435089, rankKey: "elite", currentRank: "elite", targetRank: "legend" },
      { id: "elite1-mythic", title: "Elite I - Mythic", price: 605089, rankKey: "elite", currentRank: "elite", targetRank: "mythic" },
      { id: "elite2-mythic", title: "Elite II - Mythic", price: 620089, rankKey: "elite", currentRank: "elite", targetRank: "mythic" },
      { id: "elite3-mythic", title: "Elite III - Mythic", price: 635089, rankKey: "elite", currentRank: "elite", targetRank: "mythic" },
    ],
  },
  {
    id: "paket-master",
    title: "Paket Master",
    packages: [
      { id: "master4-gm5", title: "Master IV - GM V", price: 78089, rankKey: "master", currentRank: "master", targetRank: "grandmaster" },
      { id: "master4-epic5", title: "Master IV - Epic V", price: 213089, rankKey: "master", currentRank: "master", targetRank: "epic" },
      { id: "master4-legend5", title: "Master IV - Legend V", price: 389089, rankKey: "master", currentRank: "master", targetRank: "legend" },
      { id: "master1-mythic", title: "Master I - Mythic", price: 533089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
      { id: "master2-mythic", title: "Master II - Mythic", price: 550089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
      { id: "master3-mythic", title: "Master III - Mythic", price: 570089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
      { id: "master4-mythic", title: "Master IV - Mythic", price: 590089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
    ],
  },
  {
    id: "paket-gm",
    title: "Paket Grand Master",
    packages: [
      { id: "gm5-epic5", title: "GM V - Epic V", price: 113089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "epic" },
      { id: "gm5-legend5", title: "GM V - Legend V", price: 259089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "legend" },
      { id: "gm1-mythic", title: "GM I - Mythic", price: 338089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm2-mythic", title: "GM II - Mythic", price: 360089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm3-mythic", title: "GM III - Mythic", price: 383089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm4-mythic", title: "GM IV - Mythic", price: 405089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm5-mythic", title: "GM V - Mythic", price: 428089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm1-honor", title: "GM I - Mythic Honor", price: 511089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
      { id: "gm2-honor", title: "GM II - Mythic Honor", price: 533089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
      { id: "gm3-honor", title: "GM III - Mythic Honor", price: 556089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
      { id: "gm4-honor", title: "GM IV - Mythic Honor", price: 578089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
      { id: "gm5-honor", title: "GM V - Mythic Honor", price: 601089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
      { id: "gm1-glory", title: "GM I - Mythic Glory", price: 983089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
      { id: "gm2-glory", title: "GM II - Mythic Glory", price: 1006089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
      { id: "gm3-glory", title: "GM III - Mythic Glory", price: 1028089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
      { id: "gm4-glory", title: "GM IV - Mythic Glory", price: 1051089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
      { id: "gm5-glory", title: "GM V - Mythic Glory", price: 1073089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
      { id: "gm1-immortal", title: "GM I - Mythic Immortal", price: 2153089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
      { id: "gm2-immortal", title: "GM II - Mythic Immortal", price: 2176089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
      { id: "gm3-immortal", title: "GM III - Mythic Immortal", price: 2198089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
      { id: "gm4-immortal", title: "GM IV - Mythic Immortal", price: 2221089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
      { id: "gm5-immortal", title: "GM V - Mythic Immortal", price: 2243089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-epic",
    title: "Paket Epic",
    packages: [
      { id: "epic5-legend5", title: "Epic V - Legend V", price: 146089, rankKey: "epic", currentRank: "epic", targetRank: "legend" },
      { id: "epic1-mythic", title: "Epic I - Mythic", price: 198089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic2-mythic", title: "Epic II - Mythic", price: 227089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic3-mythic", title: "Epic III - Mythic", price: 257089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic4-mythic", title: "Epic IV - Mythic", price: 286089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic5-mythic", title: "Epic V - Mythic", price: 315089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic1-honor", title: "Epic I - Mythic Honor", price: 371089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
      { id: "epic2-honor", title: "Epic II - Mythic Honor", price: 401089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
      { id: "epic3-honor", title: "Epic III - Mythic Honor", price: 430089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
      { id: "epic4-honor", title: "Epic IV - Mythic Honor", price: 459089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
      { id: "epic5-honor", title: "Epic V - Mythic Honor", price: 488089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
      { id: "epic1-glory", title: "Epic I - Mythic Glory", price: 844089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
      { id: "epic2-glory", title: "Epic II - Mythic Glory", price: 873089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
      { id: "epic3-glory", title: "Epic III - Mythic Glory", price: 902089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
      { id: "epic4-glory", title: "Epic IV - Mythic Glory", price: 932089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
      { id: "epic5-glory", title: "Epic V - Mythic Glory", price: 961089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
      { id: "epic1-immortal", title: "Epic I - Mythic Immortal", price: 2014089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
      { id: "epic2-immortal", title: "Epic II - Mythic Immortal", price: 2043089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
      { id: "epic3-immortal", title: "Epic III - Mythic Immortal", price: 2072089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
      { id: "epic4-immortal", title: "Epic IV - Mythic Immortal", price: 2102089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
      { id: "epic5-immortal", title: "Epic V - Mythic Immortal", price: 2131089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-legend",
    title: "Paket Legend",
    packages: [
      { id: "legend1-mythic", title: "Legend I - Mythic", price: 34089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
      { id: "legend2-mythic", title: "Legend II - Mythic", price: 68089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
      { id: "legend3-mythic", title: "Legend III - Mythic", price: 101089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
      { id: "legend4-mythic", title: "Legend IV - Mythic", price: 135089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
      { id: "legend5-mythic", title: "Legend V - Mythic", price: 169089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
      { id: "legend1-honor", title: "Legend I - Mythic Honor", price: 376089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
      { id: "legend2-honor", title: "Legend II - Mythic Honor", price: 410089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
      { id: "legend3-honor", title: "Legend III - Mythic Honor", price: 443089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
      { id: "legend4-honor", title: "Legend IV - Mythic Honor", price: 477089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
      { id: "legend5-honor", title: "Legend V - Mythic Honor", price: 511089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
      { id: "legend1-glory", title: "Legend I - Mythic Glory", price: 848089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend2-glory", title: "Legend II - Mythic Glory", price: 882089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend3-glory", title: "Legend III - Mythic Glory", price: 916089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend4-glory", title: "Legend IV - Mythic Glory", price: 950089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend5-glory", title: "Legend V - Mythic Glory", price: 983089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend1-immortal", title: "Legend I - Mythic Immortal", price: 2018089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
      { id: "legend2-immortal", title: "Legend II - Mythic Immortal", price: 2052089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
      { id: "legend3-immortal", title: "Legend III - Mythic Immortal", price: 2086089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
      { id: "legend4-immortal", title: "Legend IV - Mythic Immortal", price: 2120089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
      { id: "legend5-immortal", title: "Legend V - Mythic Immortal", price: 2153089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-mythic",
    title: "Paket Mythic",
    packages: [
      { id: "mythic-grading", title: "Open Grading (Auto Star 15)", price: 180089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "mythic-honor", title: "Mythic Grading - Mythic Honor (25)", price: 342089, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
      { id: "mythic-glory", title: "Mythic Grading - Mythic Glory (50)", price: 815089, rankKey: "mythicglory", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "mythic-immortal", title: "Mythic Grading - Mythic Immortal (100)", price: 1985089, rankKey: "mythicimmortal", currentRank: "mythic", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-honor",
    title: "Paket Mythic Honor",
    packages: [
      { id: "honor-glory", title: "Mythic Honor (25) - Mythic Glory (50)", price: 473089, rankKey: "mythicglory", currentRank: "mythichonor", targetRank: "mythicglory" },
      { id: "honor-immortal", title: "Mythic Honor (25) - Mythic Immortal (100)", price: 1643089, rankKey: "mythicimmortal", currentRank: "mythichonor", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-glory",
    title: "Paket Mythic Glory",
    packages: [
      { id: "glory-immortal", title: "Mythic Glory (50) - Mythic Immortal (100)", price: 1170089, rankKey: "mythicimmortal", currentRank: "mythicglory", targetRank: "mythicimmortal" },
    ],
  },
  // ===== CLASSIC MODE CATEGORIES =====
  // Keep in sync with admin dashboard default classic seed
  {
    id: "classic-10-win",
    title: "Paket Classic 10 WIN",
    type: "classic",
    packages: [
      { id: "epic-10win", title: "Epic 10 Win", price: 50000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "legend-10win", title: "Legend 10 Win", price: 50000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "mythic-10win", title: "Mythic 10 Win", price: 55000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "honor-10win", title: "Honor 10 Win", price: 55000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "glory-10win", title: "Glory 10 Win", price: 60000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "immortal-10win", title: "Immortal 10 Win", price: 60000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
    ],
  },
];

// Per-star pricing (based on screenshot)
interface PerStarRank {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  icon: string;
  maxStars: number;
  isFlat?: boolean; // Flat pricing (e.g. Mythic Grading) — price NOT multiplied by quantity
}

const PER_STAR_RANKS: PerStarRank[] = [
  { id: "master", name: "Master", price: 5000, icon: "/icons-tier/Master.webp", maxStars: 25 },
  { id: "grandmaster", name: "Grand Master", price: 6000, icon: "/icons-tier/Grandmaster.webp", maxStars: 25 },
  { id: "epic", name: "Epic", price: 7000, icon: "/icons-tier/Epic.webp", maxStars: 25 },
  { id: "legend", name: "Legend", price: 8000, icon: "/icons-tier/Legend.webp", maxStars: 25 },
  { id: "grading", name: "Mythic Grading", price: 230000, icon: "/icons-tier/Mythic.webp", maxStars: 10, isFlat: true },
  { id: "mythicromawi", name: "Mythic Romawi", price: 19000, icon: "/icons-tier/Mythic.webp", maxStars: 25 },
  { id: "honor", name: "Mythical Honor", price: 24000, icon: "/icons-tier/Mythical_Honor.webp", maxStars: 25 },
  { id: "glory", name: "Mythical Glory", price: 27000, icon: "/icons-tier/Mythical_Glory.webp", maxStars: 50 },
  { id: "immortal", name: "Mythical Immortal", price: 30000, icon: "/icons-tier/Mythical_Immortal.webp", maxStars: 100 },
];

/**
 * Safe price lookup: NEVER falls back to Rp 5.000 blindly.
 * Priority: DB/CMS data → PER_STAR_RANKS hardcoded default → grandmaster (Rp 6.000).
 *
 * This prevents the critical bug where a DB data mismatch (e.g. missing
 * "mythicromawi" entry) caused Mythic tier to silently use Rp 5.000/star
 * instead of the correct Rp 19.000/star.
 */
function getSafePriceForKey(key: string, perStarPrices: PerStarRank[]): number {
  // 1. Try DB/CMS data (runtime override)
  const entry = perStarPrices.find((r) => r.id === key);
  if (entry?.price && entry.price > 0) return entry.price;

  // 2. Fallback to hardcoded PER_STAR_RANKS default
  const defaultEntry = PER_STAR_RANKS.find((r) => r.id === key);
  if (defaultEntry?.price && defaultEntry.price > 0) return defaultEntry.price;

  // 3. Last resort: grandmaster price (NOT 5000 blindly)
  const gm = perStarPrices.find((r) => r.id === "grandmaster");
  return gm?.price || 6000;
}

// Gendong (duo boost) per-star pricing
const GENDONG_RANKS: PerStarRank[] = [
  { id: "grandmaster", name: "Grand Master", price: 9000, originalPrice: 11000, discountPercent: 18, icon: "/icons-tier/Grandmaster.webp", maxStars: 25 },
  { id: "epic", name: "Epic", price: 10000, originalPrice: 12000, discountPercent: 17, icon: "/icons-tier/Epic.webp", maxStars: 25 },
  { id: "legend", name: "Legend", price: 11000, originalPrice: 13000, discountPercent: 15, icon: "/icons-tier/Legend.webp", maxStars: 25 },
  { id: "grading", name: "Mythic Grading", price: 23000, originalPrice: 26000, discountPercent: 12, icon: "/icons-tier/Mythic.webp", maxStars: 10 },
  { id: "mythic", name: "Mythic", price: 21000, originalPrice: 24000, discountPercent: 13, icon: "/icons-tier/Mythic.webp", maxStars: 25 },
  { id: "honor", name: "Mythic Honor", price: 25000, originalPrice: 28000, discountPercent: 11, icon: "/icons-tier/Mythical_Honor.webp", maxStars: 25 },
  { id: "glory", name: "Mythic Glory", price: 30000, originalPrice: 34000, discountPercent: 12, icon: "/icons-tier/Mythical_Glory.webp", maxStars: 50 },
  { id: "immortal", name: "Mythic Immortal", price: 35000, originalPrice: 40000, discountPercent: 13, icon: "/icons-tier/Mythical_Immortal.webp", maxStars: 100 },
];

// Rank tier icon images
const rankIcons: Record<string, string> = {
  warrior: "/icons-tier/Warrior.webp",
  elite: "/icons-tier/Elite.webp",
  master: "/icons-tier/Master.webp",
  grandmaster: "/icons-tier/Grandmaster.webp",
  epic: "/icons-tier/Epic.webp",
  legend: "/icons-tier/Legend.webp",
  mythic: "/icons-tier/Mythic.webp",
  mythicgrading: "/icons-tier/Mythic.webp",
  mythichonor: "/icons-tier/Mythical_Honor.webp",
  mythicglory: "/icons-tier/Mythical_Glory.webp",
  mythicimmortal: "/icons-tier/Mythical_Immortal.webp",
};

// Ordered rank list for selector
const RANK_LIST = [
  { id: "warrior", label: "Warrior" },
  { id: "elite", label: "Elite" },
  { id: "master", label: "Master" },
  { id: "grandmaster", label: "Grand Master" },
  { id: "epic", label: "Epic" },
  { id: "legend", label: "Legend" },
  { id: "mythic", label: "Mythic" },
  { id: "mythichonor", label: "Mythic Honor" },
  { id: "mythicglory", label: "Mythic Glory" },
  { id: "mythicimmortal", label: "Mythic Immortal" },
];
const RANK_ORDER = RANK_LIST.map((r) => r.id);
// Ranks that have subdivisions (divisions)
const RANKS_WITH_STARS = ["warrior", "elite", "master", "grandmaster", "epic", "legend"];

// Rank config: divisions count and stars per division (based on ML actual system)
const RANK_DIVISION_CONFIG: Record<string, { divisions: number; starsPerDiv: number }> = {
  warrior: { divisions: 3, starsPerDiv: 3 },       // III, II, I — 3 bintang per divisi
  elite: { divisions: 3, starsPerDiv: 4 },          // III, II, I — 4 bintang per divisi
  master: { divisions: 4, starsPerDiv: 4 },         // IV, III, II, I — 4 bintang per divisi
  grandmaster: { divisions: 5, starsPerDiv: 5 },    // V, IV, III, II, I — 5 bintang per divisi
  epic: { divisions: 5, starsPerDiv: 5 },           // V, IV, III, II, I — 5 bintang per divisi
  legend: { divisions: 5, starsPerDiv: 5 },         // V, IV, III, II, I — 5 bintang per divisi
};

// Mythic+ star ranges
// - `min`/`max`: star range shown in the UI selector (inclusive displayable).
// - `nextMin`: threshold to ADVANCE to the next tier (used for star math).
//
// Why nextMin ≠ max: for Honor, the highest displayable star is 49 (`max`),
// but you actually need 50★ to promote to Glory (`nextMin`). Using `max`
// for promotion math caused an off-by-one that undercounted total stars
// across Mythic tiers (e.g. Honor 25 → Immortal 100 returned 73, not 75).
const MYTHIC_STAR_CONFIG: Record<string, { min: number; max: number; nextMin: number; label: string }> = {
  mythicgrading: { min: 0, max: 10, nextMin: 10, label: "Match" },
  mythic: { min: 0, max: 25, nextMin: 25, label: "Stars" },
  mythichonor: { min: 25, max: 49, nextMin: 50, label: "Stars" },
  mythicglory: { min: 50, max: 99, nextMin: 100, label: "Stars" },
  mythicimmortal: { min: 100, max: 999, nextMin: 1000, label: "Stars" },
};

// Bundle Tiers — volume-based bonus stars to incentivize larger orders
const BUNDLE_TIERS = [
  {
    id: "starter",
    name: "Starter Pack",
    minStars: 3,
    bonusStars: 0,
    icon: "🥉",
    color: "from-slate-600/20 to-slate-700/10",
    borderColor: "border-slate-500/30",
  },
  {
    id: "value",
    name: "Value Pack",
    minStars: 10,
    bonusStars: 2,
    icon: "🥈",
    color: "from-blue-500/20 to-cyan-500/10",
    borderColor: "border-blue-400/40",
  },
  {
    id: "mega",
    name: "Mega Pack",
    minStars: 25,
    bonusStars: 5,
    icon: "🥇",
    color: "from-yellow-500/20 to-amber-500/10",
    borderColor: "border-yellow-400/50",
  },
] as const;

// Rush 10 Star promotional packages — clickable quick-select cards
const RUSH_PACKAGES: {
  id: string;
  rankId: string;
  rankLabel: string;
  title: string;
  price: number;
  originalPrice: number;
  bonusStars: number;
  icon: string;
}[] = [
  { id: "rush-epic", rankId: "epic", rankLabel: "Epic", title: "Rush 10 Epic + Bonus 2", price: 68500, originalPrice: 70000, bonusStars: 2, icon: "/icons-tier/Epic.webp" },
  { id: "rush-legend", rankId: "legend", rankLabel: "Legend", title: "Rush 10 Legend + Bonus 2", price: 78500, originalPrice: 80000, bonusStars: 2, icon: "/icons-tier/Legend.webp" },
  { id: "rush-mythic", rankId: "mythic", rankLabel: "Mythic", title: "Rush 10 Mythic + Bonus 2", price: 188500, originalPrice: 190000, bonusStars: 2, icon: "/icons-tier/Mythic.webp" },
  { id: "rush-honor", rankId: "mythichonor", rankLabel: "Mythic Honor", title: "Rush 10 Honor + Bonus 2", price: 238500, originalPrice: 240000, bonusStars: 2, icon: "/icons-tier/Mythical_Honor.webp" },
  { id: "rush-glory", rankId: "mythicglory", rankLabel: "Mythic Glory", title: "Rush 10 Glory + Bonus 2", price: 268500, originalPrice: 270000, bonusStars: 2, icon: "/icons-tier/Mythical_Glory.webp" },
  { id: "rush-immortal", rankId: "mythicimmortal", rankLabel: "Mythic Immortal", title: "Rush 10 Immortal + Bonus 2", price: 298500, originalPrice: 300000, bonusStars: 2, icon: "/icons-tier/Mythical_Immortal.webp" },
];

// Get division options based on rank (dynamic)
function getDivisionOptions(rankId: string): { value: number; label: string }[] {
  const config = RANK_DIVISION_CONFIG[rankId];
  if (!config) return [];
  const labels = ["I", "II", "III", "IV", "V"];
  const options: { value: number; label: string }[] = [];
  for (let i = config.divisions; i >= 1; i--) {
    options.push({ value: i, label: labels[i - 1] });
  }
  return options;
}

// Combined rank+division options for dropdown (e.g. "Epic V", "Epic IV", ...)
function getRankDivisionOptions(): { value: string; label: string; rankId: string; division: number }[] {
  const divLabels = ["I", "II", "III", "IV", "V"];
  const options: { value: string; label: string; rankId: string; division: number }[] = [];
  for (const rank of RANK_LIST) {
    if (RANKS_WITH_STARS.includes(rank.id)) {
      const cfg = RANK_DIVISION_CONFIG[rank.id];
      for (let d = cfg.divisions; d >= 1; d--) {
        options.push({ value: `${rank.id}:${d}`, label: `${rank.label} ${divLabels[d - 1]}`, rankId: rank.id, division: d });
      }
    } else {
      options.push({ value: rank.id, label: rank.label, rankId: rank.id, division: 0 });
    }
  }
  return options;
}

// Calculate total stars between current rank+division and target rank+division
function calculateTotalStars(
  currentRank: string, currentDiv: number,
  targetRank: string, targetDiv: number,
  divisionStar: number = 0,
  currentMythicStars: number = 0,
  targetMythicStars: number = 0,
  targetDivisionStar: number = 0
): number {
  const ci = RANK_ORDER.indexOf(currentRank);
  const ti = RANK_ORDER.indexOf(targetRank);
  if (ci < 0 || ti < 0 || ci >= ti) {
    // Same rank: calculate within-rank stars
    if (ci === ti && RANKS_WITH_STARS.includes(currentRank)) {
      const cfg = RANK_DIVISION_CONFIG[currentRank];
      if (cfg && currentDiv > targetDiv) {
        // Higher div number = lower tier (V is lowest, I is highest)
        return (currentDiv - targetDiv) * cfg.starsPerDiv - divisionStar;
      }
    }
    // Same mythic tier: difference in stars
    if (ci === ti && MYTHIC_STAR_CONFIG[currentRank] && targetMythicStars > currentMythicStars) {
      return targetMythicStars - currentMythicStars;
    }
    return 0;
  }

  let stars = 0;
  // Stars remaining in current rank (from current position to top of tier)
  if (RANKS_WITH_STARS.includes(currentRank)) {
    const cfg = RANK_DIVISION_CONFIG[currentRank];
    if (cfg) stars += currentDiv * cfg.starsPerDiv - divisionStar;
  } else if (MYTHIC_STAR_CONFIG[currentRank]) {
    const mCfg = MYTHIC_STAR_CONFIG[currentRank];
    stars += mCfg.nextMin - currentMythicStars;
  }
  // Full ranks in between
  for (let i = ci + 1; i < ti; i++) {
    const rank = RANK_ORDER[i];

    const cfg = RANK_DIVISION_CONFIG[rank];
    if (cfg) {
      stars += cfg.divisions * cfg.starsPerDiv;
    } else {
      // Mythic tiers: use actual star range from config
      const mythicCfg = MYTHIC_STAR_CONFIG[rank];
      if (mythicCfg) {
        // Use nextMin - min (NOT max - min) to count promotion stars correctly.
        stars += mythicCfg.nextMin - mythicCfg.min;
      }
    }
  }
  // Stars needed in target rank
  if (RANKS_WITH_STARS.includes(targetRank)) {
    const cfg = RANK_DIVISION_CONFIG[targetRank];
    if (cfg) {
      stars += (cfg.divisions - targetDiv) * cfg.starsPerDiv;
    }
  } else if (MYTHIC_STAR_CONFIG[targetRank]) {
    const mCfg = MYTHIC_STAR_CONFIG[targetRank];
    stars += targetMythicStars - mCfg.min;
  }
  return stars;
}

// Auto-calculate package price from rank selections (bundle discount vs per-star)
function autoCalcPackagePrice(
  currentRank: string,
  currentDiv: number,
  targetRank: string,
  targetDiv: number,
  currentDivisionStar: number,
  perStarPrices: PerStarRank[],
  currentMythicStars: number = 0,
  targetMythicStars: number = 0
): { price: number; totalStars: number; originalPrice: number; discountPercent: number } {
  const totalStars = calculateTotalStars(currentRank, currentDiv, targetRank, targetDiv, RANKS_WITH_STARS.includes(currentRank) ? currentDivisionStar : 0, currentMythicStars, targetMythicStars);
  if (totalStars <= 0) return { price: 0, totalStars: 0, originalPrice: 0, discountPercent: 0 };

  // Map rank to per-star price lookup key.
  // Keys must match the `id` field in PER_STAR_RANKS (not RANK_ORDER ids).
  // Missing keys cause silent fallback to grandmaster (Rp5.500/star), which
  // massively underprices Mythic (Rp19.000) and Mythic Honor (Rp24.000) segments.
  const rankToPriceKey: Record<string, string> = {
    warrior: "master",
    elite: "master",
    master: "master",
    grandmaster: "grandmaster",
    epic: "epic",
    legend: "legend",
    mythic: "mythicromawi",
    mythichonor: "honor",
    mythicglory: "glory",
    mythicimmortal: "immortal",
  };

  // Iterate each rank segment and sum weighted cost
  let originalTotal = 0;
  const ci = RANK_ORDER.indexOf(currentRank);
  const ti = RANK_ORDER.indexOf(targetRank);

  // Segment 1: current rank remaining stars
  {
    const key = rankToPriceKey[currentRank] || "grandmaster";
    const pricePerStar = getSafePriceForKey(key, perStarPrices);
    let starsInThisRank: number;
    if (RANKS_WITH_STARS.includes(currentRank)) {
      const cfg = RANK_DIVISION_CONFIG[currentRank];
      starsInThisRank = cfg ? (cfg.starsPerDiv - currentDivisionStar) + (currentDiv - 1) * cfg.starsPerDiv : 0;
    } else if (MYTHIC_STAR_CONFIG[currentRank]) {
      const mCfg = MYTHIC_STAR_CONFIG[currentRank];
      if (currentRank === targetRank) {
        starsInThisRank = targetMythicStars - currentMythicStars;
      } else {
        // Use nextMin (NOT max) to count stars needed to promote to next tier.
        starsInThisRank = mCfg.nextMin - currentMythicStars;
      }
    } else {
      starsInThisRank = 0;
    }
    originalTotal += pricePerStar * Math.max(0, starsInThisRank);
  }

  // Segments in between
  for (let i = ci + 1; i < ti; i++) {
    const rank = RANK_ORDER[i];
    const key = rankToPriceKey[rank] || "grandmaster";
    const pricePerStar = getSafePriceForKey(key, perStarPrices);
    let starsInThisRank: number;
    if (RANKS_WITH_STARS.includes(rank)) {
      const cfg = RANK_DIVISION_CONFIG[rank];
      starsInThisRank = cfg ? cfg.divisions * cfg.starsPerDiv : 0;
    } else {
      const mCfg = MYTHIC_STAR_CONFIG[rank];
      // Use nextMin - min (NOT max - min) to count promotion stars.
      starsInThisRank = mCfg ? mCfg.nextMin - mCfg.min : 0;
    }
    originalTotal += pricePerStar * starsInThisRank;
  }

  // Segment last: target rank stars needed
  if (ci < ti) {
    const key = rankToPriceKey[targetRank] || "grandmaster";
    const pricePerStar = getSafePriceForKey(key, perStarPrices);
    let starsInThisRank: number;
    if (RANKS_WITH_STARS.includes(targetRank)) {
      const cfg = RANK_DIVISION_CONFIG[targetRank];
      starsInThisRank = cfg ? (cfg.divisions - targetDiv) * cfg.starsPerDiv : 0;
    } else if (MYTHIC_STAR_CONFIG[targetRank]) {
      const mCfg = MYTHIC_STAR_CONFIG[targetRank];
      starsInThisRank = targetMythicStars - mCfg.min;
    } else {
      starsInThisRank = 0;
    }
    originalTotal += pricePerStar * Math.max(0, starsInThisRank);
  } else if (ci === ti && RANKS_WITH_STARS.includes(currentRank)) {
    // Same rank, division difference only — already covered in segment 1
  }

  // No bundle discount — paket price = same as per-star total
  return {
    price: originalTotal,
    totalStars,
    originalPrice: 0,
    discountPercent: 0,
  };
}

// Calculate per-tier star breakdown for Per Star mode.
// Returns an array of segments showing how many stars belong to each tier
// and the cost for that tier. E.g. Mythic → Mythic Glory (35★):
//   [{ tier: "Mythic (0–25)", stars: 10, pricePerStar: 19000, subtotal: 190000 },
//    { tier: "Mythic Honor (25–50)", stars: 25, pricePerStar: 24000, subtotal: 600000 }]
interface StarBreakdownSegment {
  tierId: string;
  tierLabel: string;
  stars: number;
  pricePerStar: number;
  subtotal: number;
}

function calculateStarBreakdown(
  currentRank: string,
  currentDiv: number,
  targetRank: string,
  targetDiv: number,
  currentDivisionStar: number,
  perStarPrices: PerStarRank[],
  currentMythicStars: number = 0,
  targetMythicStars: number = 0
): StarBreakdownSegment[] {
  const rankToPriceKey: Record<string, string> = {
    warrior: "master",
    elite: "master",
    master: "master",
    grandmaster: "grandmaster",
    epic: "epic",
    legend: "legend",
    mythic: "mythicromawi",
    mythichonor: "honor",
    mythicglory: "glory",
    mythicimmortal: "immortal",
  };

  const rankLabels: Record<string, string> = {
    warrior: "Warrior",
    elite: "Elite",
    master: "Master",
    grandmaster: "Grand Master",
    epic: "Epic",
    legend: "Legend",
    mythic: "Mythic (0–25)",
    mythichonor: "Mythic Honor (25–50)",
    mythicglory: "Mythic Glory (50–100)",
    mythicimmortal: "Mythic Immortal (100+)",
  };

  const segments: StarBreakdownSegment[] = [];
  const ci = RANK_ORDER.indexOf(currentRank);
  const ti = RANK_ORDER.indexOf(targetRank);
  if (ci < 0 || ti < 0) return segments;

  const getPrice = (key: string) => getSafePriceForKey(key, perStarPrices);

  // Segment 1: current rank remaining stars
  {
    const key = rankToPriceKey[currentRank] || "grandmaster";
    const pricePerStar = getPrice(key);
    let starsInThisRank: number;
    if (RANKS_WITH_STARS.includes(currentRank)) {
      const cfg = RANK_DIVISION_CONFIG[currentRank];
      starsInThisRank = cfg ? (cfg.starsPerDiv - currentDivisionStar) + (currentDiv - 1) * cfg.starsPerDiv : 0;
    } else if (MYTHIC_STAR_CONFIG[currentRank]) {
      const mCfg = MYTHIC_STAR_CONFIG[currentRank];
      if (currentRank === targetRank) {
        starsInThisRank = targetMythicStars - currentMythicStars;
      } else {
        starsInThisRank = mCfg.nextMin - currentMythicStars;
      }
    } else {
      starsInThisRank = 0;
    }
    starsInThisRank = Math.max(0, starsInThisRank);
    if (starsInThisRank > 0) {
      segments.push({
        tierId: currentRank,
        tierLabel: rankLabels[currentRank] || currentRank,
        stars: starsInThisRank,
        pricePerStar,
        subtotal: pricePerStar * starsInThisRank,
      });
    }
  }

  // Segments in between
  for (let i = ci + 1; i < ti; i++) {
    const rank = RANK_ORDER[i];
    const key = rankToPriceKey[rank] || "grandmaster";
    const pricePerStar = getPrice(key);
    let starsInThisRank: number;
    if (RANKS_WITH_STARS.includes(rank)) {
      const cfg = RANK_DIVISION_CONFIG[rank];
      starsInThisRank = cfg ? cfg.divisions * cfg.starsPerDiv : 0;
    } else {
      const mCfg = MYTHIC_STAR_CONFIG[rank];
      starsInThisRank = mCfg ? mCfg.nextMin - mCfg.min : 0;
    }
    if (starsInThisRank > 0) {
      segments.push({
        tierId: rank,
        tierLabel: rankLabels[rank] || rank,
        stars: starsInThisRank,
        pricePerStar,
        subtotal: pricePerStar * starsInThisRank,
      });
    }
  }

  // Segment last: target rank stars needed
  if (ci < ti) {
    const key = rankToPriceKey[targetRank] || "grandmaster";
    const pricePerStar = getPrice(key);
    let starsInThisRank: number;
    if (RANKS_WITH_STARS.includes(targetRank)) {
      const cfg = RANK_DIVISION_CONFIG[targetRank];
      starsInThisRank = cfg ? (cfg.divisions - targetDiv) * cfg.starsPerDiv : 0;
    } else if (MYTHIC_STAR_CONFIG[targetRank]) {
      const mCfg = MYTHIC_STAR_CONFIG[targetRank];
      starsInThisRank = targetMythicStars - mCfg.min;
    } else {
      starsInThisRank = 0;
    }
    starsInThisRank = Math.max(0, starsInThisRank);
    if (starsInThisRank > 0) {
      segments.push({
        tierId: targetRank,
        tierLabel: rankLabels[targetRank] || targetRank,
        stars: starsInThisRank,
        pricePerStar,
        subtotal: pricePerStar * starsInThisRank,
      });
    }
  }

  return segments;
}

// Render tier icon(s) inside badges. For same-tier → 1 icon.
// For cross-tier → 2 icons with arrow (e.g. Warrior → Mythic).
function TierIconsBadge({ currentRank, targetRank, size = 20 }: { currentRank?: string; targetRank?: string; size?: number }) {
  const cur = currentRank && rankIcons[currentRank] ? currentRank : null;
  const tgt = targetRank && rankIcons[targetRank] ? targetRank : null;
  if (!cur && !tgt) return null;
  if (cur && tgt && cur !== tgt) {
    return (
      <span className="inline-flex items-center gap-1">
        <Image src={rankIcons[cur]} alt={cur} width={size} height={size} className="w-5 h-5 object-contain drop-shadow-md" />
        <span className="text-[10px] opacity-60">→</span>
        <Image src={rankIcons[tgt]} alt={tgt} width={size} height={size} className="w-5 h-5 object-contain drop-shadow-md" />
      </span>
    );
  }
  const rank = tgt || cur!;
  return <Image src={rankIcons[rank]} alt={rank} width={size} height={size} className="w-5 h-5 object-contain drop-shadow-md" />;
}

// Extract division number from package ID or data.
// Package IDs follow patterns like "legend5-mythic" (currentDiv=5) or "epic5-legend5" (cur=5, tgt=5).
// If package has explicit currentDivision/targetDivision fields, use those.
function extractDivisions(pkg: ProductPackage): { currentDiv?: number; targetDiv?: number } {
  if (pkg.currentDivision) return { currentDiv: pkg.currentDivision, targetDiv: pkg.targetDivision };
  // Parse from ID: <rank><digits?>-<rank><digits?>
  const parts = pkg.id.split("-");
  const currentDiv = parts[0]?.match(/(\d+)$/)?.[1];
  const targetDiv = parts[1]?.match(/(\d+)$/)?.[1];
  return {
    currentDiv: currentDiv ? parseInt(currentDiv) : undefined,
    targetDiv: targetDiv ? parseInt(targetDiv) : undefined,
  };
}

// Parse rank from classic package title (e.g. "Epic 10 Win" → "epic")
function parseClassicRank(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("immortal")) return "mythicimmortal";
  if (lower.includes("glory")) return "mythicglory";
  if (lower.includes("honor")) return "mythichonor";
  if (lower.includes("mythic")) return "mythic";
  if (lower.includes("legend")) return "legend";
  if (lower.includes("epic")) return "epic";
  return "mythic";
}

// Format rank label WITH star count for Per Star mode displays.
// Mythic tiers: "Mythic 14★", "Mythical Honor 25★", "Mythical Immortal 100★"
// Division ranks: "Epic V 3★", "Legend III 2★"
function formatRankWithStars(
  rankId: string,
  division: number,
  divisionStar: number,
  mythicStars: number
): string {
  const label = RANK_LIST.find(r => r.id === rankId)?.label || rankId;
  if (RANKS_WITH_STARS.includes(rankId)) {
    const divLabel = ["I", "II", "III", "IV", "V"][division - 1] || "";
    return `${label} ${divLabel} ${divisionStar}★`;
  }
  if (MYTHIC_STAR_CONFIG[rankId]) {
    return `${label} ${mythicStars}★`;
  }
  return label;
}

// Fallback static options (max 5 divisions) — used if no rank selected yet
const STAR_OPTIONS = [
  { value: 5, label: "V" },
  { value: 4, label: "IV" },
  { value: 3, label: "III" },
  { value: 2, label: "II" },
  { value: 1, label: "I" },
];

// Translations
const translations = {
  id: {
    // Header
    safe: "Aman",
    fast: "Cepat",
    // Steps
    steps: [
      { num: 1, title: "Pilih Paket" },
      { num: 2, title: "Data Akun & Kontak" },
      { num: 3, title: "Opsi & Pembayaran" },
      { num: 4, title: "Konfirmasi" },
    ],
    // Step 1
    selectPackage: "Pilih Paket Joki",
    selectPackageDesc: "Pilih paket yang sesuai dengan kebutuhanmu",
    perStar: "/ Star",
    discount: "HEMAT",
    // Order mode
    modePackage: "Joki Paket",
    modePerStar: "Joki Per Bintang",
    modeGendong: "Joki Gendong",
    modeClassic: "Joki Classic",
    priceListTitle: "Daftar Harga",
    selectRank: "Pilih Rank",
    starQuantity: "Jumlah Bintang",
    minStars: "Minimal 3 bintang",
    totalPrice: "Total Harga",
    perStarPrice: "Harga per bintang",
    // Step 2
    accountData: "Data Akun Game",
    loginMethod: "Metode Login",
    selectLoginMethod: "Pilih metode login akun ML kamu",
    labelUserId: "User ID",
    placeholderUserId: "Contoh: 123456789",
    labelServerId: "Server ID",
    placeholderServerId: "Contoh: 1234",
    checkAccount: "Cek Akun",
    checking: "Mengecek...",
    accountVerified: "Akun terverifikasi",
    accountNotFound: "Akun tidak ditemukan",
    checkAccountHint: "Masukkan User ID & Server ID, lalu klik Cek Akun untuk verifikasi",
    labelNickname: "Nickname / IGN",
    placeholderNickname: "Nickname dalam game",
    labelAccountLogin: "Email / No. HP",
    placeholderAccountLogin: "Email atau No HP terdaftar",
    labelPassword: "Password",
    placeholderPassword: "Password akun ML",
    labelHero: "Request Hero (Min. 3 Hero)",
    placeholderHero: "Contoh: Lancelot, Fanny, Ling",
    heroDesc: "Jika tidak diisi, pilot akan bermain hero terbaik mereka",
    labelNotes: "Catatan Untuk Penjoki",
    placeholderNotes: "Catatan khusus (opsional)",
    // Gendong-specific Step 2
    gendongDataTitle: "Data Akun & Jadwal Mabar",
    labelPreferredRole: "Role yang Kamu Mainkan",
    preferredRoleHint: "Jungler & Gold Lane khusus booster",
    labelPlaySchedule: "Jadwal Main",
    placeholderPlaySchedule: "Pilih jadwal main kamu",
    playScheduleHint: "Worker akan menyesuaikan jadwal kamu",
    gendongNoLoginHint: "Mode Gendong tidak perlu login akun — kamu main bareng booster pakai akun sendiri",
    // Step 3
    optionsPromo: "Opsi & Promo",
    addons: "Add-ons",
    express: "Express (1-2 Hari)",
    expressDesc: "Prioritas pengerjaan dengan tim senior",
    premium: "Premium Pilot",
    premiumDesc: "Pilot MG dengan winrate 75%+",
    promoCode: "Kode Promo",
    promoPlaceholder: "Masukkan kode promo",
    applyPromo: "Terapkan",
    promoApplied: "Promo berhasil diterapkan",
    // Step 4
    contactPay: "Kontak & Pembayaran",
    labelWhatsapp: "Nomor WhatsApp",
    placeholderWhatsapp: "08xxxxxxxxxx",
    labelEmail: "Email (Opsional)",
    placeholderEmail: "email@contoh.com",
    emailDesc: "Untuk menerima invoice & notifikasi",
    // Step 5
    confirmOrder: "Konfirmasi Order",
    reviewOrder: "Review pesanan kamu sebelum melanjutkan",
    selectedPackage: "Paket Dipilih",
    accountInfo: "Info Akun",
    addonsLabel: "Add-ons",
    paymentDetails: "Detail Pembayaran",
    basePrice: "Harga Paket",
    expressAddon: "Express (+20%)",
    premiumAddon: "Premium (+30%)",
    promoDiscount: "Diskon Promo",
    tierDiscount: "Diskon Member",
    total: "Total Bayar",
    contact: "Kontak",
    // Buttons
    next: "Lanjut",
    back: "Kembali",
    processing: "Memproses...",
    payNow: "Bayar Sekarang",
    // Success
    orderSuccess: "Order Berhasil!",
    orderId: "Order ID",
    saveOrderId: "Simpan Order ID ini untuk tracking",
    continuePayment: "Lanjut ke Pembayaran",
    backToHome: "Kembali ke Beranda",
    // Validation
    required: "Wajib diisi",
    invalidEmail: "Format email tidak valid",
  },
  en: {
    // Header
    safe: "Safe",
    fast: "Fast",
    // Steps
    steps: [
      { num: 1, title: "Select Package" },
      { num: 2, title: "Account & Contact" },
      { num: 3, title: "Options & Payment" },
      { num: 4, title: "Confirm" },
    ],
    // Step 1
    selectPackage: "Select Boosting Package",
    selectPackageDesc: "Choose a package that fits your needs",
    perStar: "/ Star",
    discount: "SAVE",
    // Order mode
    modePackage: "Package Boost",
    modePerStar: "Per Star Boost",
    modeGendong: "Duo Boost",
    modeClassic: "Classic Boost",
    priceListTitle: "Price List",
    selectRank: "Select Rank",
    starQuantity: "Star Quantity",
    minStars: "Minimum 3 stars",
    totalPrice: "Total Price",
    perStarPrice: "Price per star",
    // Step 2
    accountData: "Game Account Data",
    loginMethod: "Login Method",
    selectLoginMethod: "Select your ML account login method",
    labelUserId: "User ID",
    placeholderUserId: "Example: 123456789",
    labelServerId: "Server ID",
    placeholderServerId: "Example: 1234",
    checkAccount: "Check Account",
    checking: "Checking...",
    accountVerified: "Account verified",
    accountNotFound: "Account not found",
    checkAccountHint: "Enter User ID & Server ID, then click Check Account to verify",
    labelNickname: "Nickname / IGN",
    placeholderNickname: "In-game nickname",
    labelAccountLogin: "Email / Phone",
    placeholderAccountLogin: "Registered email or phone",
    labelPassword: "Password",
    placeholderPassword: "ML account password",
    labelHero: "Hero Request (Min. 3 Heroes)",
    placeholderHero: "Example: Lancelot, Fanny, Ling",
    heroDesc: "If empty, pilot will play their best heroes",
    labelNotes: "Notes for Booster",
    placeholderNotes: "Special notes (optional)",
    // Gendong-specific Step 2
    gendongDataTitle: "Account Data & Mabar Schedule",
    labelPreferredRole: "Your Preferred Role",
    preferredRoleHint: "Jungler & Gold Lane are reserved for the booster",
    labelPlaySchedule: "Play Schedule",
    placeholderPlaySchedule: "Select your play schedule",
    playScheduleHint: "Worker will adjust to your schedule",
    gendongNoLoginHint: "Gendong mode doesn't need account login — you play together with the booster on your own account",
    // Step 3
    optionsPromo: "Options & Promo",
    addons: "Add-ons",
    express: "Express (1-2 Days)",
    expressDesc: "Priority processing with senior team",
    premium: "Premium Pilot",
    premiumDesc: "MG Pilot with 75%+ winrate",
    promoCode: "Promo Code",
    promoPlaceholder: "Enter promo code",
    applyPromo: "Apply",
    promoApplied: "Promo successfully applied",
    // Step 4
    contactPay: "Contact & Payment",
    labelWhatsapp: "WhatsApp Number",
    placeholderWhatsapp: "08xxxxxxxxxx",
    labelEmail: "Email (Optional)",
    placeholderEmail: "email@example.com",
    emailDesc: "To receive invoice & notifications",
    // Step 5
    confirmOrder: "Confirm Order",
    reviewOrder: "Review your order before proceeding",
    selectedPackage: "Selected Package",
    accountInfo: "Account Info",
    addonsLabel: "Add-ons",
    paymentDetails: "Payment Details",
    basePrice: "Package Price",
    expressAddon: "Express (+20%)",
    premiumAddon: "Premium (+30%)",
    promoDiscount: "Promo Discount",
    tierDiscount: "Member Discount",
    total: "Total",
    contact: "Contact",
    // Buttons
    next: "Next",
    back: "Back",
    processing: "Processing...",
    payNow: "Pay Now",
    // Success
    orderSuccess: "Order Successful!",
    orderId: "Order ID",
    saveOrderId: "Save this Order ID for tracking",
    continuePayment: "Continue to Payment",
    backToHome: "Back to Home",
    // Validation
    required: "Required",
    invalidEmail: "Invalid email format",
  },
};

function LangToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <button
      onClick={() => setLocale(locale === "id" ? "en" : "id")}
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-white/10 text-text text-xs hover:bg-white/5 transition-colors"
    >
      <span>{locale === "id" ? "🇮🇩" : "🇺🇸"}</span>
      <span className="font-medium">{locale.toUpperCase()}</span>
    </button>
  );
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations] || translations.id;
  const [catalog, setCatalog] = useState<PackageCategory[]>(DEFAULT_CATALOG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    paymentUrl?: string;
    paymentMethod?: string;
  } | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"dompetx" | "manual_transfer">("dompetx");
  const [dompetxEnabled, setDompetxEnabled] = useState(false);
  const [showManualTransfer, setShowManualTransfer] = useState(false);
    const [customerTier, setCustomerTier] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<string>("promo");
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Order mode: "paket", "perstar", or "gendong"
  const [orderMode, setOrderMode] = useState<"paket" | "perstar" | "gendong" | "classic">(() => {
    const modeParam = (typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("mode")) : null) || searchParams.get("mode");
    if (modeParam === "perstar") return "perstar";
    if (modeParam === "gendong") return "gendong";
    if (modeParam === "classic") return "classic";
    return "paket";
  });
  const [selectedStarRank, setSelectedStarRank] = useState<PerStarRank | null>(null);
  const [starQuantity, setStarQuantity] = useState(3); // minimum 3 stars
  const [perStarRanks, setPerStarRanks] = useState<PerStarRank[]>(PER_STAR_RANKS);
  const [gendongRanks, setGendongRanks] = useState<PerStarRank[]>(GENDONG_RANKS);
  const [selectedGendongRank, setSelectedGendongRank] = useState<PerStarRank | null>(null);
  const [gendongQuantity, setGendongQuantity] = useState(3);
  // Season pricing multiplier
  const [seasonMultiplier, setSeasonMultiplier] = useState(1);
  const [seasonLabel, setSeasonLabel] = useState("");
  // Rank selector for paket mode
  const [currentStar, setCurrentStar] = useState(3); // Division: Warrior default III=3
  const [targetStar, setTargetStar] = useState(3);
  const [showPackages, setShowPackages] = useState(false);
  // Star within current division (e.g. Epic II star 3/5)
  const [currentDivisionStar, setCurrentDivisionStar] = useState(1);
  // Mythic+ star count for current rank
  const [currentMythicStars, setCurrentMythicStars] = useState(0);
  const [targetMythicStars, setTargetMythicStars] = useState(0);

  // Per Star mode: track if user has actively selected ranks (empty state UX)
  const [perStarTouched, setPerStarTouched] = useState(false);

  // Account verification (Cek Akun)
  const [accountCheckLoading, setAccountCheckLoading] = useState(false);
  const [accountCheckResult, setAccountCheckResult] = useState<{ verified: boolean; nickname: string } | null>(null);
  const [accountCheckError, setAccountCheckError] = useState("");

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const isValidEmail = (email: string) =>
    !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const STEPS = t.steps;

  const [form, setForm] = useState<OrderForm>(() => {
    // If loading directly with ?mode=perstar, start with empty ranks for placeholder UX
    const modeParam = (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mode") : null) || searchParams.get("mode");
    const isPerstarInit = modeParam === "perstar";
    return {
      loginMethod: "moonton",
      userId: "",
      serverId: "",
      nickname: "",
      accountLogin: "",
      accountPassword: "",
      heroRequest: "",
      notes: "",
      currentRank: isPerstarInit ? ("" as RankTier) : "epic",
      targetRank: isPerstarInit ? ("" as RankTier) : "mythic",
      isExpress: false,
      isPremium: false,
      promoCode: "",
      whatsapp: "",
      email: "",
      preferredRole: "",
      playSchedule: "",
    };
  });

  // Gendong settings from CMS
  const [gendongRoles, setGendongRoles] = useState(DEFAULT_ML_ROLES);
  const [scheduleOptions, setScheduleOptions] = useState(DEFAULT_SCHEDULE_OPTIONS);

  // Fetch gendong settings from CMS
  useEffect(() => {
    fetch("/api/settings?keys=gendong_settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.gendong_settings) {
          const s = data.gendong_settings;
          if (s.roles && Array.isArray(s.roles) && s.roles.length > 0) {
            setGendongRoles(s.roles);
          }
          if (s.schedules && Array.isArray(s.schedules) && s.schedules.length > 0) {
            setScheduleOptions(s.schedules);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch pricing catalog from CMS, merge rankKey from defaults
  useEffect(() => {
    // Build lookup: package id -> rankKey from DEFAULT_CATALOG
    const defaultRankKeys: Record<string, string> = {};
    for (const cat of DEFAULT_CATALOG) {
      for (const pkg of cat.packages) {
        defaultRankKeys[pkg.id] = pkg.rankKey;
      }
    }
    // Build lookup: category id -> type from DEFAULT_CATALOG
    const defaultTypes: Record<string, string> = {};
    for (const cat of DEFAULT_CATALOG) {
      if (cat.type) defaultTypes[cat.id] = cat.type;
    }

    fetch("/api/settings?keys=pricing_catalog,classic_pricing_catalog")
      .then((res) => res.json())
      .then((data) => {
        // Start with default catalog as base (includes both paket & classic defaults)
        let merged: PackageCategory[] = DEFAULT_CATALOG;

        // If DB has pricing_catalog, use it for paket categories
        // BUT preserve classic categories from DEFAULT_CATALOG (DB only stores paket)
        if (data.pricing_catalog && Array.isArray(data.pricing_catalog) && data.pricing_catalog.length > 0) {
          const dbPaketCats = data.pricing_catalog.map((cat: PackageCategory) => ({
            ...cat,
            type: cat.type || defaultTypes[cat.id] || "paket",
            packages: cat.packages.map((pkg: ProductPackage) => ({
              ...pkg,
              rankKey: defaultRankKeys[pkg.id] || pkg.rankKey || pkg.currentRank,
            })),
          }));
          // Keep classic categories from DEFAULT_CATALOG as fallback
          const defaultClassicCats = DEFAULT_CATALOG.filter(c => c.type === "classic");
          merged = [...dbPaketCats, ...defaultClassicCats];
        }

        // If DB has classic_pricing_catalog, merge/replace classic categories
        if (data.classic_pricing_catalog && Array.isArray(data.classic_pricing_catalog) && data.classic_pricing_catalog.length > 0) {
          const classicCats = data.classic_pricing_catalog.map((cat: PackageCategory) => ({
            ...cat,
            type: "classic" as const,
            packages: cat.packages.map((pkg: ProductPackage) => ({
              ...pkg,
              // Force currentRank = "classic" so badge row condition triggers
              currentRank: "classic",
              targetRank: "classic",
              rankKey: pkg.rankKey || "classic",
            })),
          }));
          // Remove any existing classic categories from merged, then append DB classic categories
          merged = [
            ...merged.filter(c => c.type !== "classic"),
            ...classicCats,
          ];
        }

        setCatalog(merged);
      })
      .catch(() => {/* keep default catalog */});
  }, []);

  // Fetch customer tier for member discount
  useEffect(() => {
    fetch("/api/customer/rewards")
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => {
        if (data.reward_tier) setCustomerTier(data.reward_tier);
      })
      .catch(() => {/* not logged in or no tier */});
  }, []);

  // Capture UTM params + fire ViewContent on page load
  useEffect(() => {
    captureUtmParams();
    trackViewContent({ contentName: "Order Page" });
  }, []);

  // Fetch per-star pricing from CMS
  useEffect(() => {
    fetch("/api/settings?keys=perstar_pricing,gendong_pricing,season_pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.perstar_pricing && Array.isArray(data.perstar_pricing) && data.perstar_pricing.length > 0) {
          // Ensure maxStars from defaults if CMS doesn't include it
          const defaultMaxStars: Record<string, number> = {};
          for (const r of PER_STAR_RANKS) defaultMaxStars[r.id] = r.maxStars;
          // ID NORMALIZATION: Fix common DB typos so price lookups always match.
          // The `rankToPriceKey` map uses "mythicromawi" (single 'o'), but legacy
          // DB records may contain "mythicroomawi" (double 'o'). Without this fix,
          // the price lookup silently falls back to Rp 5.000 (grandmaster price)
          // and massively undercharges Mythic orders.
          const idAliases: Record<string, string> = {
            mythicroomawi: "mythicromawi", // double 'o' typo → correct ID
          };
          const normalized = data.perstar_pricing.map((r: PerStarRank) => ({
            ...r,
            id: idAliases[r.id] || r.id,
            maxStars: r.maxStars || defaultMaxStars[r.id] || defaultMaxStars[idAliases[r.id]] || 100,
          }));
          // MERGE: Ensure every default tier exists. If DB is missing a tier
          // (e.g. "mythicromawi"), use the hardcoded default so price lookups
          // never silently fall back to Rp 5.000.
          const dbMap: Record<string, PerStarRank> = {};
          for (const r of normalized) dbMap[r.id] = r;
          const merged = PER_STAR_RANKS.map((defaultRank) => {
            const dbRank = dbMap[defaultRank.id];
            if (dbRank) {
              return { ...defaultRank, ...dbRank };
            }
            return defaultRank;
          });
          setPerStarRanks(merged);
        }
        if (data.gendong_pricing && Array.isArray(data.gendong_pricing) && data.gendong_pricing.length > 0) {
          const defaultMaxStars: Record<string, number> = {};
          for (const r of GENDONG_RANKS) defaultMaxStars[r.id] = r.maxStars;
          setGendongRanks(data.gendong_pricing.map((r: PerStarRank) => ({ ...r, maxStars: r.maxStars || defaultMaxStars[r.id] || 100 })));
        }
        // Determine active season multiplier
        if (data.season_pricing && data.season_pricing.isEnabled && Array.isArray(data.season_pricing.phases)) {
          const now = new Date();
          const sorted = [...data.season_pricing.phases]
            .filter((p: { startDate: string }) => p.startDate && new Date(p.startDate) <= now)
            .sort((a: { startDate: string }, b: { startDate: string }) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          if (sorted.length > 0) {
            setSeasonMultiplier(sorted[0].multiplier || 1);
            setSeasonLabel(sorted[0].label || "");
          }
        }
      })
      .catch(() => {/* keep defaults */});
  }, []);

  // Check available payment methods
  useEffect(() => {
    fetch("/api/payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (data.dompetxEnabled) {
          setDompetxEnabled(true);
          setPaymentMethod("dompetx");
        }
      })
      .catch(() => {/* keep manual only */});
  }, []);

  // Pre-fill from query params (supports calculator redirect with full detail params)
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const packageId = searchParams.get("package");
    const fromRank = searchParams.get("from");
    const toRank = searchParams.get("to");
    const express = searchParams.get("express") === "1";
    const premium = searchParams.get("premium") === "1";

    // === MODE: PERSTAR — auto-fill all rank/div/star details ===
    if (modeParam === "perstar" && fromRank && toRank) {
      setOrderMode("perstar");
      setForm((prev) => ({
        ...prev,
        currentRank: fromRank as RankTier,
        targetRank: toRank as RankTier,
        isExpress: express,
        isPremium: premium,
      }));

      // Current rank details
      const curD = searchParams.get("curDiv");
      const curS = searchParams.get("curStar");
      const curMythic = searchParams.get("curMythic");
      if (curD) setCurrentStar(parseInt(curD));
      if (curS) setCurrentDivisionStar(parseInt(curS));
      if (curMythic) setCurrentMythicStars(parseInt(curMythic));

      // Target rank details
      const tgtD = searchParams.get("tgtDiv");
      const tgtMythic = searchParams.get("tgtMythic");
      if (tgtD) setTargetStar(parseInt(tgtD));
      if (tgtMythic) setTargetMythicStars(parseInt(tgtMythic));

      setPerStarTouched(true);
      return;
    }

    // === MODE: GENDONG — auto-fill rank + qty ===
    if (modeParam === "gendong") {
      const rankId = searchParams.get("rank");
      const qty = searchParams.get("qty");
      setOrderMode("gendong");
      if (rankId) {
        // Find in gendongRanks — use setTimeout to ensure state is loaded
        const found = gendongRanks.find((r) => r.id === rankId);
        if (found) setSelectedGendongRank(found);
      }
      if (qty) setGendongQuantity(parseInt(qty));
      setForm((prev) => ({ ...prev, isExpress: express, isPremium: premium }));
      return;
    }

    // === MODE: PAKET or CLASSIC (or legacy with package param) ===
    if (packageId || modeParam === "paket" || modeParam === "classic") {
      const pkgToFind = packageId || searchParams.get("package");
      if (pkgToFind) {
        for (const cat of catalog) {
          const found = cat.packages.find((p) => p.id === pkgToFind);
          if (found) {
            setSelectedPackage(found);
            setActiveCategory(cat.id);
            const { currentDiv: curD, targetDiv: tgtD } = extractDivisions(found);
            if (curD) setCurrentStar(curD);
            if (tgtD) setTargetStar(tgtD);
            setForm((prev) => ({
              ...prev,
              currentRank: found.currentRank as RankTier,
              targetRank: found.targetRank as RankTier,
              isExpress: express,
              isPremium: premium,
            }));
            break;
          }
        }
      }
      return;
    }

    // === LEGACY FALLBACK: from/to without mode param ===
    if (fromRank && toRank) {
      let bestMatch: { pkg: ProductPackage; cat: PackageCategory } | null = null;
      for (const cat of catalog) {
        for (const pkg of cat.packages) {
          if (pkg.currentRank === fromRank && pkg.targetRank === toRank) {
            if (!bestMatch || (bestMatch.cat.id === "per-star" && cat.id !== "per-star")) {
              bestMatch = { pkg, cat };
            }
          }
        }
      }
      if (bestMatch) {
        setSelectedPackage(bestMatch.pkg);
        setActiveCategory(bestMatch.cat.id);
        setForm((prev) => ({
          ...prev,
          currentRank: fromRank as RankTier,
          targetRank: toRank as RankTier,
          isExpress: express,
          isPremium: premium,
        }));
      } else {
        const catMap: Record<string, string> = {
          grandmaster: "paket-gm",
          epic: "paket-epic",
          legend: "paket-legend",
          mythic: "paket-mythic",
          mythicglory: "paket-honor",
        };
        setActiveCategory(catMap[fromRank] || "per-star");
        setForm((prev) => ({
          ...prev,
          currentRank: fromRank as RankTier,
          targetRank: toRank as RankTier,
          isExpress: express,
          isPremium: premium,
        }));
      }
    }
  }, [searchParams, catalog, gendongRanks]);

  // Filter catalog based on order mode (classic shows only classic categories)
  const visibleCategories = orderMode === "classic"
    ? catalog.filter(c => c.type === "classic")
    : catalog.filter(c => c.type !== "classic");
  // Ensure activeCategory is valid for current mode; fallback to first visible
  const activeCat = visibleCategories.find(c => c.id === activeCategory) || visibleCategories[0];

  // Auto-calculated package price for paket mode (real-time)
  const autoCalcResult = (orderMode === "paket" || orderMode === "perstar")
    ? autoCalcPackagePrice(form.currentRank, currentStar, form.targetRank, targetStar, currentDivisionStar, perStarRanks, currentMythicStars, targetMythicStars)
    : { price: 0, totalStars: 0, originalPrice: 0, discountPercent: 0 };

  // Auto-set selectedPackage when rank changes in paket mode (DISABLED — paket now uses catalog cards only)
  useEffect(() => {
    if (false && orderMode === "paket" && autoCalcResult.price > 0) {
      const currentLabel = RANK_LIST.find(r => r.id === form.currentRank)?.label || form.currentRank;
      const targetLabel = RANK_LIST.find(r => r.id === form.targetRank)?.label || form.targetRank;
      const currentDivLabel = RANKS_WITH_STARS.includes(form.currentRank)
        ? ` ${getDivisionOptions(form.currentRank).find(s => s.value === currentStar)?.label || ""}`
        : MYTHIC_STAR_CONFIG[form.currentRank] ? ` (${currentMythicStars})` : "";
      const targetDivLabel = RANKS_WITH_STARS.includes(form.targetRank)
        ? ` ${getDivisionOptions(form.targetRank).find(s => s.value === targetStar)?.label || ""}`
        : MYTHIC_STAR_CONFIG[form.targetRank] ? ` (${targetMythicStars})` : "";
      const virtualPkg: ProductPackage = {
        id: `auto-${form.currentRank}${currentStar}-${form.targetRank}${targetStar}`,
        title: `${currentLabel}${currentDivLabel} → ${targetLabel}${targetDivLabel}`,
        price: autoCalcResult.price,
        originalPrice: autoCalcResult.originalPrice > autoCalcResult.price ? autoCalcResult.originalPrice : undefined,
        discountPercent: autoCalcResult.discountPercent > 0 ? autoCalcResult.discountPercent : undefined,
        rankKey: form.targetRank,
        currentRank: form.currentRank,
        targetRank: form.targetRank,
      };
      setSelectedPackage(virtualPkg);
    }
  }, [orderMode, autoCalcResult.price, autoCalcResult.originalPrice, autoCalcResult.discountPercent, form.currentRank, form.targetRank, currentStar, targetStar, currentDivisionStar, currentMythicStars, targetMythicStars]);

  // Raw item price (before season/express/premium)
  const rawItemPrice = (() => {
    if ((orderMode === "paket" || orderMode === "classic") && selectedPackage) return selectedPackage.price;
    // Per Star: only show price AFTER user actively selects ranks (empty state UX)
    if (orderMode === "perstar" && perStarTouched && autoCalcResult.price > 0) return autoCalcResult.price;
    if (orderMode === "gendong" && selectedGendongRank) return selectedGendongRank.price * gendongQuantity;
    return 0;
  })();
  // Calculate base price based on order mode (with all multipliers)
  const basePrice = (() => {
    let price = rawItemPrice;
    if (seasonMultiplier !== 1) price *= seasonMultiplier;
    if (form.isExpress) price *= 1.2;
    if (form.isPremium) price *= 1.3;
    return Math.round(price);
  })();
  // Season-adjusted price (before express/premium, for display)
  const seasonAdjustedPrice = Math.round(rawItemPrice * seasonMultiplier);
  // Calculate tier discount based on base price (before promo)
  const tierDiscountAmount = (() => {
    if (!customerTier || customerTier === "bronze") return 0;
    const discountPct = customerTier === "platinum" ? 8 : customerTier === "gold" ? 5 : customerTier === "silver" ? 3 : 0;
    return Math.round(basePrice * discountPct / 100);
  })();
  const finalPrice = Math.max(0, basePrice - promoDiscount - tierDiscountAmount);

  const updateForm = useCallback((updates: Partial<OrderForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // Check ML account (Cek Akun)
  const handleCheckAccount = useCallback(async () => {
    if (!form.userId.trim() || !form.serverId.trim()) {
      setAccountCheckError(t.checkAccountHint);
      return;
    }
    setAccountCheckLoading(true);
    setAccountCheckError("");
    setAccountCheckResult(null);
    try {
      const res = await fetch("/api/check-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: form.userId.trim(), zoneId: form.serverId.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountCheckResult({ verified: true, nickname: data.nickname });
        setForm(prev => ({ ...prev, nickname: data.nickname }));
      } else {
        setAccountCheckError(data.error || t.accountNotFound);
      }
    } catch {
      setAccountCheckError("Gagal menghubungi server");
    } finally {
      setAccountCheckLoading(false);
    }
  }, [form.userId, form.serverId, t.checkAccountHint, t.accountNotFound]);

  // Max stars for current gendong selection
  const gendongMax = selectedGendongRank?.maxStars ?? 100;
  const gendongMin = selectedGendongRank?.id === "grading" ? 1 : 3;

  const handleSelectPackage = useCallback(
    (pkg: ProductPackage) => {
      setSelectedPackage(pkg);
      // BUGFIX: Sync division stars from package to state.
      // Without this, stale currentStar=3 (Warrior III default) leaks
      // to API → Telegram shows "Legend III" instead of "Legend V".
      const { currentDiv: curD, targetDiv: tgtD } = extractDivisions(pkg);
      if (curD) setCurrentStar(curD);
      if (tgtD) setTargetStar(tgtD);
      updateForm({
        currentRank: pkg.currentRank as RankTier,
        targetRank: pkg.targetRank as RankTier,
      });
      // Fire AddToCart conversion event
      trackAddToCart({ value: pkg.price, contentName: pkg.title });
    },
    [updateForm]
  );

  const canProceedStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          // For paket mode, need selected package
          // For perstar mode, need selected rank AND quantity >= min
          // For gendong mode, need selected gendong rank AND quantity >= min
          if (orderMode === "paket" || orderMode === "classic") {
            return !!selectedPackage;
          } else if (orderMode === "gendong") {
            const gMin = selectedGendongRank?.id === "grading" ? 1 : 3;
            return !!(selectedGendongRank && gendongQuantity >= gMin);
          } else {
            // Perstar mode: user must actively select ranks first (empty state UX)
            return perStarTouched && form.currentRank !== "" && form.targetRank !== "" && autoCalcResult.price > 0 && autoCalcResult.totalStars > 0;
          }
        case 2:
          if (orderMode === "gendong") {
            // Gendong: no login credentials needed, but need role + schedule
            return !!(
              form.userId &&
              form.nickname &&
              form.preferredRole &&
              form.playSchedule &&
              form.whatsapp &&
              form.whatsapp.length >= 9 &&
              form.whatsapp.length <= 13 &&
              form.whatsapp.startsWith("8") &&
              isValidEmail(form.email)
            );
          }
          return !!(
            form.userId &&
            form.nickname &&
            form.accountLogin &&
            form.accountPassword &&
            form.whatsapp &&
            form.whatsapp.length >= 9 &&
            form.whatsapp.length <= 13 &&
            form.whatsapp.startsWith("8") &&
            isValidEmail(form.email)
          );
        default:
          return true;
      }
    },
    [selectedPackage, selectedStarRank, starQuantity, selectedGendongRank, gendongQuantity, orderMode, form, perStarTouched, autoCalcResult.price, autoCalcResult.totalStars]
  );

  const goToStep = useCallback(
    (step: number) => {
      if (step > currentStep && !canProceedStep(currentStep)) return;
      setSlideDirection(step > currentStep ? "right" : "left");
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [currentStep, canProceedStep]
  );

  const nextStep = useCallback(() => {
    if (canProceedStep(currentStep) && currentStep < 4) {
      // For per-star mode on step 1, create virtual package from rank selections (like paket)
      if (currentStep === 1 && orderMode === "perstar" && autoCalcResult.price > 0) {
        const rankLabel = (id: string) => RANK_LIST.find(r => r.id === id)?.label || id;
        const divLabel = (div: number) => ["I", "II", "III", "IV", "V"][div - 1] || "";
        const curLabel = RANKS_WITH_STARS.includes(form.currentRank) ? `${rankLabel(form.currentRank)} ${divLabel(currentStar)}` : rankLabel(form.currentRank);
        const tgtLabel = RANKS_WITH_STARS.includes(form.targetRank) ? `${rankLabel(form.targetRank)} ${divLabel(targetStar)}` : rankLabel(form.targetRank);
        const title = `Per Star: ${curLabel} → ${tgtLabel} (${autoCalcResult.totalStars}★)`;
        setSelectedPackage({
          id: `perstar-${form.currentRank}-${form.targetRank}-${autoCalcResult.totalStars}`,
          title,
          price: autoCalcResult.price,
          rankKey: form.targetRank,
          currentRank: form.currentRank,
          targetRank: form.targetRank,
        });
        trackAddToCart({ value: autoCalcResult.price, contentName: title });
      }
      // For gendong mode on step 1, create virtual package first
      if (currentStep === 1 && orderMode === "gendong" && selectedGendongRank) {
        const price = selectedGendongRank.price * gendongQuantity;
        const gUnit = selectedGendongRank.id === "grading" ? "Match" : "Star";
        const title = `Duo Boost ${selectedGendongRank.name} × ${gendongQuantity} ${gUnit}`;
        setSelectedPackage({
          id: `gendong-${selectedGendongRank.id}-${gendongQuantity}`,
          title,
          price,
          rankKey: selectedGendongRank.id,
          currentRank: selectedGendongRank.id,
          targetRank: selectedGendongRank.id,
        });
        trackAddToCart({ value: price, contentName: title });
      }
      setSlideDirection("right");
      setCurrentStep((s) => s + 1);
      setTimeout(() => document.getElementById("order-step")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [currentStep, canProceedStep, orderMode, selectedStarRank, starQuantity, selectedGendongRank, gendongQuantity]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setSlideDirection("left");
      setCurrentStep((s) => s - 1);
      setTimeout(() => document.getElementById("order-step")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [currentStep]);

  const applyPromo = useCallback(async () => {
    if (!form.promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage("");

    try {
      const promoRes = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.promoCode, orderAmount: basePrice }),
      });
      const promoData = await promoRes.json();

      if (promoData.valid) {
        setPromoDiscount(promoData.calculatedDiscount);
        setPromoApplied(true);
        setPromoMessage(
          `✓ ${promoData.message} - Hemat ${formatRupiah(promoData.calculatedDiscount)}`
        );
        return;
      }

      const refRes = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.promoCode, customerEmail: form.email, customerWhatsapp: form.whatsapp }),
      });
      const refData = await refRes.json();

      if (refData.valid) {
        const refDiscount = Math.round((basePrice * refData.discount) / 100);
        setPromoDiscount(refDiscount);
        setPromoApplied(true);
        setPromoMessage(
          `✓ ${refData.message} - Hemat ${formatRupiah(refDiscount)}`
        );
        return;
      }

      setPromoDiscount(0);
      setPromoApplied(false);
      setPromoMessage("Kode tidak valid");
    } catch {
      setPromoMessage("Gagal memvalidasi kode");
    } finally {
      setPromoLoading(false);
    }
  }, [form.promoCode, form.email, form.whatsapp, basePrice]);

  const removePromo = useCallback(() => {
    updateForm({ promoCode: "" });
    setPromoDiscount(0);
    setPromoApplied(false);
    setPromoMessage("");
  }, [updateForm]);

  const canSubmit =
    !!selectedPackage &&
    form.userId &&
    form.nickname &&
    (orderMode === "gendong"
      ? (form.preferredRole && form.playSchedule)
      : (form.accountLogin && form.accountPassword)) &&
    form.whatsapp &&
    form.whatsapp.length >= 9 &&
    form.whatsapp.length <= 13 &&
    form.whatsapp.startsWith("8") &&
    isValidEmail(form.email) &&
    termsAccepted;

  const handleSubmitOrder = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const utmParams = getStoredUtmParams();
      const res = await fetch("/api/customer/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentRank: (orderMode === "paket" || orderMode === "classic" || orderMode === "perstar") ? (selectedPackage?.currentRank || form.currentRank) : (selectedGendongRank?.id || form.currentRank),
          targetRank: (orderMode === "paket" || orderMode === "classic" || orderMode === "perstar") ? (selectedPackage?.targetRank || form.targetRank) : (selectedGendongRank?.id || form.targetRank),
          currentStar: (orderMode === "paket" || orderMode === "perstar") && RANKS_WITH_STARS.includes(selectedPackage?.currentRank || form.currentRank) ? currentStar : null,
          targetStar: (orderMode === "paket" || orderMode === "perstar") && RANKS_WITH_STARS.includes(selectedPackage?.targetRank || form.targetRank) ? targetStar : null,
          currentMythicStars: (orderMode === "paket" || orderMode === "perstar") && MYTHIC_STAR_CONFIG[selectedPackage?.currentRank || form.currentRank] ? currentMythicStars : undefined,
          targetMythicStars: (orderMode === "paket" || orderMode === "perstar") && MYTHIC_STAR_CONFIG[selectedPackage?.targetRank || form.targetRank] ? targetMythicStars : undefined,
          packageTitle: (orderMode === "paket" || orderMode === "classic" || orderMode === "perstar") ? selectedPackage?.title : (orderMode === "gendong" ? `Gendong ${selectedGendongRank?.name} x${gendongQuantity} ${selectedGendongRank?.id === "grading" ? "match" : "star"}` : undefined),
          packageId: (orderMode === "paket" || orderMode === "classic" || orderMode === "perstar") ? selectedPackage?.id : undefined,
          bonusStars: (orderMode === "paket" || orderMode === "perstar") ? (() => {
            const ts = calculateTotalStars(form.currentRank, currentStar, form.targetRank, targetStar, RANKS_WITH_STARS.includes(form.currentRank) ? currentDivisionStar : 0, currentMythicStars, targetMythicStars);
            const tier = [...BUNDLE_TIERS].reverse().find(t => ts >= t.minStars);
            return tier?.bonusStars || 0;
          })() : 0,
          perStarRankId: orderMode === "gendong" ? selectedGendongRank?.id : undefined,
          starQuantity: orderMode === "gendong" ? gendongQuantity : undefined,
          orderType: orderMode,
          loginMethod: orderMode === "gendong" ? undefined : form.loginMethod,
          userId: form.serverId ? `${form.userId}(${form.serverId})` : form.userId,
          nickname: form.nickname,
          accountLogin: orderMode === "gendong" ? undefined : form.accountLogin,
          accountPassword: orderMode === "gendong" ? undefined : form.accountPassword,
          preferredRole: orderMode === "gendong" ? form.preferredRole : undefined,
          playSchedule: orderMode === "gendong" ? form.playSchedule : undefined,
          heroRequest: form.heroRequest,
          notes: orderMode === "gendong" 
            ? [form.notes, `Role: ${gendongRoles.find(r => r.id === form.preferredRole)?.name || form.preferredRole}`, `Jadwal: ${scheduleOptions.find(s => s.id === form.playSchedule)?.label || form.playSchedule}`].filter(Boolean).join(" | ")
            : form.notes,
          isExpress: form.isExpress,
          isPremium: form.isPremium,
          promoCode: promoApplied ? form.promoCode : undefined,
          promoDiscount,
          tierDiscount: tierDiscountAmount,
          whatsapp: form.whatsapp,
          email: form.email,
          totalPrice: finalPrice,
          paymentMethod,
          ...utmParams,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Gagal membuat order");
        return;
      }

      // Fire InitiateCheckout conversion event
      trackInitiateCheckout({ orderId: data.orderId, value: finalPrice });

      setOrderResult({
        orderId: data.orderId,
        paymentUrl: data.paymentUrl,
        paymentMethod: data.paymentMethod,
      });

      // Show info message if backend provides one (e.g. recovery fallback)
      if (data.message) {
        toast(data.message);
      }

      // Auto-redirect to DompetX payment page
      if (data.paymentUrl && data.paymentMethod !== "manual_transfer") {
        window.location.href = data.paymentUrl;
        return;
      }

      // Redirect to manual payment
      if (data.paymentMethod === "manual_transfer") {
        window.location.href = `/payment/manual?order_id=${data.orderId}`;
        return;
      }
    } catch {
      toastError("Terjadi kesalahan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, selectedPackage, canSubmit, promoApplied, promoDiscount, finalPrice, paymentMethod, orderMode, selectedStarRank, starQuantity, selectedGendongRank, gendongQuantity, gendongRoles, scheduleOptions, tierDiscountAmount, currentStar, targetStar]);

  // === REDIRECTING TO PAYMENT / FALLBACK SUCCESS ===
  if (orderResult) {
    // If payment URL exists and not manual, user is being redirected — show loading
    if (orderResult.paymentUrl && orderResult.paymentMethod !== "manual_transfer") {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-text mb-2">
              Mengalihkan ke Pembayaran...
            </h1>
            <p className="text-text-muted text-sm mb-6">
              Order <span className="font-mono text-accent font-bold">{orderResult.orderId}</span> berhasil dibuat. Kamu akan diarahkan ke halaman pembayaran.
            </p>
            <a
              href={orderResult.paymentUrl}
              className="block w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Klik di sini jika tidak otomatis redirect
            </a>
          </div>
        </div>
      );
    }

    // Manual Transfer — redirect to manual payment page
    if (orderResult.paymentMethod === "manual_transfer") {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-text mb-2">
              Mengalihkan ke Halaman Pembayaran...
            </h1>
            <p className="text-text-muted text-sm mb-6">
              Order <span className="font-mono text-accent font-bold">{orderResult.orderId}</span> berhasil dibuat.
            </p>
            <Link
              href={`/payment/manual?order_id=${orderResult.orderId}`}
              className="block w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Klik di sini jika tidak otomatis redirect
            </Link>
          </div>
        </div>
      );
    }

    // No payment URL (DompetX not configured) — show order success
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">
            {t.orderSuccess} <Sparkles className="w-6 h-6 inline text-yellow-400" />
          </h1>
          <p className="text-text-muted mb-6">
            {t.saveOrderId}
          </p>
          <div className="bg-background rounded-xl p-4 mb-6">
            <p className="text-text-muted text-sm">{t.orderId}</p>
            <p className="font-mono text-accent font-bold text-lg">
              {orderResult.orderId}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href={`/track?order_id=${orderResult.orderId}`}
              className="block w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Track Order
            </Link>
            <Link
              href="/"
              className="block text-text-muted text-sm hover:text-text transition-colors"
            >
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // === MAIN ORDER PAGE ===
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header + step bar */}
      <div className="sticky top-0 z-50">
        <header className="glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <Image
                src="/logo/circle-landscape.webp"
                alt="ETNYX"
                width={100}
                height={28}
                className="h-6 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <Shield className="w-3.5 h-3.5 text-success" /> {t.safe}
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> {t.fast}
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <MessageCircle className="w-3.5 h-3.5 text-accent" /> 24/7
              </span>
              <LangToggle />
            </div>
          </div>
        </header>

        {/* Step Progress Bar */}
        <div className="bg-surface border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => goToStep(step.num)}
                  className={`flex items-center gap-2 group ${
                    step.num <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                  disabled={step.num > currentStep && !canProceedStep(currentStep)}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step.num < currentStep
                        ? "bg-green-500 text-white"
                        : step.num === currentStep
                          ? "gradient-primary text-white shadow-lg"
                          : "bg-background border border-white/10 text-text-muted"
                    }`}
                  >
                    {step.num < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.num
                    )}
                  </span>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      step.num === currentStep
                        ? "text-text"
                        : step.num < currentStep
                          ? "text-green-400"
                          : "text-text-muted"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded ${
                      step.num < currentStep
                        ? "bg-green-500"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Mobile step label */}
          <p className="sm:hidden text-center text-xs text-accent font-medium mt-3">
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </p>
        </div>
      </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div
          id="order-step"
          key={currentStep}
          className={`transition-all duration-300 ${
            slideDirection === "right"
              ? "animate-in slide-in-from-right-4 fade-in"
              : "animate-in slide-in-from-left-4 fade-in"
          }`}
        >
        {/* ===== STEP 1: PILIH PAKET ===== */}
        {currentStep === 1 && (
          <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                1
              </span>
              <h2 className="font-bold text-text">{t.selectPackage}</h2>
            </div>
            <div className="p-5">
              {/* Mode Switcher (Paket / Per Bintang) */}
              <div className="flex flex-col sm:flex-row gap-2 mb-5 p-1 bg-background rounded-xl w-full">
                <button
                  onClick={() => {
                    setOrderMode("paket");
                    setSelectedStarRank(null);
                    setStarQuantity(3);
                    setSelectedPackage(null);
                    setShowPackages(false);
                    const firstPaket = catalog.find(c => c.type !== "classic");
                    if (firstPaket) setActiveCategory(firstPaket.id);
                  }}
                  className={`w-full sm:w-auto py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                    orderMode === "paket"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                  style={{ minWidth: 0 }}
                >
                  <Package className="w-5 h-5 inline-block mr-2 align-middle" />
                  {t.modePackage}
                </button>
                <button
                  onClick={() => {
                    setOrderMode("perstar");
                    setSelectedPackage(null);
                    setShowPackages(false);
                    setSelectedStarRank(null);
                    setStarQuantity(3);
                    setPerStarTouched(false);
                    // Reset ranks to empty — force user to explicitly select (placeholder UX)
                    updateForm({ currentRank: "" as RankTier, targetRank: "" as RankTier });
                    setCurrentStar(0);
                    setTargetStar(0);
                    setCurrentMythicStars(0);
                    setTargetMythicStars(0);
                    setCurrentDivisionStar(0);
                  }}
                  className={`w-full sm:w-auto py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                    orderMode === "perstar"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                  style={{ minWidth: 0 }}
                >
                  <Star className="w-5 h-5 inline-block mr-2 align-middle" />
                  {t.modePerStar}
                </button>
                <button
                  onClick={() => {
                    setOrderMode("gendong");
                    setSelectedPackage(null);
                    setShowPackages(false);
                    setSelectedStarRank(null);
                    setStarQuantity(3);
                  }}
                  className={`w-full sm:w-auto py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                    orderMode === "gendong"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                  style={{ minWidth: 0 }}
                >
                  <Users className="w-5 h-5 inline-block mr-2 align-middle" />
                  {t.modeGendong}
                </button>
                <button
                  onClick={() => {
                    setOrderMode("classic");
                    setSelectedPackage(null);
                    setShowPackages(false);
                    setSelectedStarRank(null);
                    setStarQuantity(3);
                    const firstClassic = catalog.find(c => c.type === "classic");
                    if (firstClassic) setActiveCategory(firstClassic.id);
                  }}
                  className={`w-full sm:w-auto py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                    orderMode === "classic"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                  style={{ minWidth: 0 }}
                >
                  <Crown className="w-5 h-5 inline-block mr-2 align-middle" />
                  {t.modeClassic}
                </button>
              </div>
              <p className="text-text-muted text-xs mb-4 -mt-3 px-1">
                {orderMode === "paket"
                  ? (locale === "id" ? "Pilih paket rank — booster login ke akunmu dan push rank." : "Choose a rank package — booster logs into your account and pushes rank.")
                  : orderMode === "perstar"
                  ? (locale === "id" ? "Bayar per bintang — fleksibel sesuai kebutuhan." : "Pay per star — flexible according to your needs.")
                  : orderMode === "gendong"
                  ? (locale === "id" ? "Main bareng booster — tanpa share akun, kamu tetap bermain." : "Play together with booster — no account sharing, you keep playing.")
                  : (locale === "id" ? "Joki Classic — joki per match dengan harga tetap, tanpa pilih rank." : "Classic Boost — fixed-price per match boosting, no rank selection needed.")}
              </p>

              {/* ===== Daftar Harga (Paket & Per Star only) ===== */}
              {(orderMode === "paket" || orderMode === "perstar") && (
              <div className="mb-5 p-4 bg-background rounded-xl border border-white/5">
                <h3 className="text-text font-bold text-sm mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  {t.priceListTitle}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {perStarRanks.map((rank) => (
                    <div key={rank.id} className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 bg-surface rounded-lg border border-white/5 text-center transition-colors hover:border-white/15">
                      <Image
                        src={rank.icon}
                        alt={rank.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                        unoptimized
                      />
                      <span className="text-text text-xs font-medium leading-tight">{rank.name}</span>
                      <span className="text-yellow-400 font-bold text-sm">{formatRupiah(rank.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* ===== PAKET & CLASSIC: CATALOG CARDS (no rank selector) ===== */}
              {(orderMode === "paket" || orderMode === "classic") && (
              <div className="mb-5">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {visibleCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        activeCategory === cat.id
                          ? "gradient-primary text-white"
                          : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                      }`}
                    >
                      {cat.title} ({cat.packages.length})
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeCat?.packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`relative text-left rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] overflow-hidden flex flex-col ${
                        selectedPackage?.id === pkg.id
                          ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
                          : "border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="p-4 bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex-1">
                        <p className="text-white text-sm font-semibold mb-2">{pkg.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-yellow-400 font-bold text-lg leading-tight">{formatRupiah(pkg.price)}</p>
                          {pkg.originalPrice && <p className="text-red-400/70 text-xs line-through">{formatRupiah(pkg.originalPrice)}</p>}
                        </div>
                      </div>
                      {/* Tier badge row: always show — all packages have rank icons.
                          Rush = icon left + text right; others = text left + icon right */}
                      {(
                        <div className="px-4 py-2 bg-slate-800/60 flex items-center justify-between">
                          {(() => {
                            const isClassic = pkg.currentRank === "classic";
                            const iconCur = isClassic ? parseClassicRank(pkg.title) : pkg.currentRank;
                            const iconTgt = isClassic ? parseClassicRank(pkg.title) : pkg.targetRank;
                            const hasDiscount = pkg.discountPercent != null && pkg.discountPercent > 0;
                            const isRush = pkg.id.startsWith("rush");
                            const bonusMatch = pkg.title.match(/\+?\s*Bonus\s*(\d+)/i);
                            const bonusStars = bonusMatch ? parseInt(bonusMatch[1]) : 0;
                            if (isRush) {
                              return (
                                <>
                                  <TierIconsBadge currentRank={iconCur} targetRank={iconTgt} />
                                  <div className="flex items-center gap-1">
                                    {bonusStars > 0 && (
                                      <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                                        <Star className="w-2 h-2 fill-current" /> +{bonusStars}
                                      </span>
                                    )}
                                    {hasDiscount && (
                                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                        {t.discount} {pkg.discountPercent}%
                                      </span>
                                    )}
                                  </div>
                                </>
                              );
                            }
                            return (
                              <>
                                {hasDiscount && (
                                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {t.discount} {pkg.discountPercent}%
                                  </span>
                                )}
                                <TierIconsBadge currentRank={iconCur} targetRank={iconTgt} />
                              </>
                            );
                          })()}
                        </div>
                      )}
                      {selectedPackage?.id === pkg.id && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Rank Awal selector — enabled for perstar mode */}
              {orderMode === "perstar" && (
              <div className="mb-5 p-4 bg-background rounded-xl border border-white/5">
                <label className="block text-sm text-text font-bold mb-2">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-red-400" />{locale === "id" ? "Rank Awalmu Sekarang" : "Your Current Rank"}</span>
                </label>
                <div className="flex flex-col gap-2">
                  {/* Tier-only Dropdown */}
                  <div className="relative">
                    <select
                      data-testid="perstar-current-rank"
                      value={form.currentRank}
                      onChange={(e) => {
                        const rankId = e.target.value;
                        setPerStarTouched(true);
                        updateForm({ currentRank: rankId as RankTier });
                        setSelectedPackage(null);
                        setShowPackages(false);
                        setCurrentDivisionStar(1);
                        // Set default division to lowest (highest number e.g. V)
                        const cfg = RANK_DIVISION_CONFIG[rankId];
                        if (cfg) setCurrentStar(cfg.divisions);
                        // Auto-reset target only if target was already selected and is now invalid
                        const ci = RANK_ORDER.indexOf(rankId);
                        const ti = RANK_ORDER.indexOf(form.targetRank);
                        if (form.targetRank !== "" && ci >= ti) {
                          const nextRank = RANK_ORDER[ci + 1];
                          if (nextRank) updateForm({ currentRank: rankId as RankTier, targetRank: nextRank as RankTier });
                          else updateForm({ currentRank: rankId as RankTier, targetRank: "" as RankTier });
                        }
                        // Reset mythic stars
                        const mythicCfg = MYTHIC_STAR_CONFIG[rankId];
                        if (mythicCfg) setCurrentMythicStars(mythicCfg.min);
                        else setCurrentMythicStars(0);
                      }}
                      className={`w-full bg-surface border rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer focus:outline-none transition-colors pr-10 ${
                        form.currentRank === ""
                          ? "border-white/10 text-text-muted"
                          : "border-white/10 text-text focus:border-accent"
                      }`}
                    >
                      <option value="" disabled>{locale === "id" ? "Pilih Rank Sekarang" : "Select Current Rank"}</option>
                      {RANK_LIST.map((rank) => (
                        <option key={rank.id} value={rank.id}>{rank.label}</option>
                      ))}
                    </select>
                    {form.currentRank !== "" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Image src={rankIcons[form.currentRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.currentRank}`} width={24} height={24} className="w-6 h-6 object-contain" />
                    </div>
                    )}
                  </div>
                  {/* Division Selector (for ranks with divisions) */}
                  {RANKS_WITH_STARS.includes(form.currentRank) && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-text-muted text-xs whitespace-nowrap font-medium">
                        {locale === "id" ? "Divisi:" : "Division:"}
                      </span>
                      <div className="flex gap-1">
                        {getDivisionOptions(form.currentRank).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setCurrentStar(opt.value);
                              // Ensure target is higher than current
                              if (form.currentRank === form.targetRank && opt.value <= targetStar) {
                                if (opt.value > 1) {
                                  setTargetStar(opt.value - 1);
                                } else {
                                  const ci = RANK_ORDER.indexOf(form.currentRank);
                                  const nextRank = RANK_ORDER[ci + 1];
                                  if (nextRank) updateForm({ targetRank: nextRank as RankTier });
                                }
                              }
                            }}
                            className={`px-3 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                              currentStar === opt.value
                                ? "bg-accent/20 border-2 border-accent text-accent"
                                : "bg-surface border border-white/10 text-text-muted hover:border-white/20"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Mythic Star Input */}
                  {MYTHIC_STAR_CONFIG[form.currentRank] && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentMythicStars(s => Math.max(MYTHIC_STAR_CONFIG[form.currentRank].min, s - 1))}
                          disabled={currentMythicStars <= MYTHIC_STAR_CONFIG[form.currentRank].min}
                          className="w-8 h-8 rounded-lg bg-surface border border-white/10 text-white flex items-center justify-center hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          value={currentMythicStars}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || MYTHIC_STAR_CONFIG[form.currentRank].min;
                            const cfg = MYTHIC_STAR_CONFIG[form.currentRank];
                            setCurrentMythicStars(Math.max(cfg.min, Math.min(cfg.max, v)));
                          }}
                          className="w-16 h-10 text-center bg-surface text-text rounded-lg border border-white/10 focus:outline-none focus:border-accent text-sm font-bold"
                        />
                        <button
                          onClick={() => setCurrentMythicStars(s => Math.min(MYTHIC_STAR_CONFIG[form.currentRank].max, s + 1))}
                          disabled={currentMythicStars >= MYTHIC_STAR_CONFIG[form.currentRank].max}
                          className="w-8 h-8 rounded-lg bg-surface border border-white/10 text-white flex items-center justify-center hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-text-muted text-xs whitespace-nowrap flex items-center gap-1">
                        {MYTHIC_STAR_CONFIG[form.currentRank].label === "Match" ? "Match" : <><Star className="w-3 h-3 text-yellow-400" /> Stars</>}
                      </span>
                    </div>
                  )}
                </div>
                {/* Star within division (for Warrior-Legend) */}
                {RANKS_WITH_STARS.includes(form.currentRank) && (() => {
                  const starsPerDiv = RANK_DIVISION_CONFIG[form.currentRank]?.starsPerDiv ?? 5;
                  return (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-text-muted text-xs whitespace-nowrap">
                        {locale === "id" ? "Bintang di divisi:" : "Stars in division:"}
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: starsPerDiv }, (_, i) => i + 1).map((s) => (
                          <button
                            key={s}
                            onClick={() => setCurrentDivisionStar(s)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                              currentDivisionStar === s
                                ? "bg-yellow-400/20 border-2 border-yellow-400 text-yellow-400"
                                : "bg-surface border border-white/10 text-text-muted hover:border-white/20"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {/* Mythic tier hint */}
                {MYTHIC_STAR_CONFIG[form.currentRank] && (
                  <p className="text-text-muted text-[10px] mt-2">
                    {form.currentRank === "mythicgrading"
                      ? (locale === "id" ? `Berapa match Mythic Grading yang sudah dimainkan (0-${MYTHIC_STAR_CONFIG[form.currentRank].max})` : `How many Mythic Grading matches played (0-${MYTHIC_STAR_CONFIG[form.currentRank].max})`)
                      : (locale === "id" ? `${RANK_LIST.find(r => r.id === form.currentRank)?.label}: ${MYTHIC_STAR_CONFIG[form.currentRank].min}-${MYTHIC_STAR_CONFIG[form.currentRank].max} bintang` : `${RANK_LIST.find(r => r.id === form.currentRank)?.label}: ${MYTHIC_STAR_CONFIG[form.currentRank].min}-${MYTHIC_STAR_CONFIG[form.currentRank].max} stars`)
                    }
                  </p>
                )}
              </div>
              )}

              {/* HIDDEN: Old PAKET MODE rank selectors (disabled — paket now uses catalog cards) */}
              {false && orderMode === "paket" && (
                <>
                  {/* Rank Tujuanmu */}
                  <div className="mb-5 p-4 bg-background rounded-xl border border-white/5">
                    <label className="block text-sm text-text font-bold mb-2">
                      <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-accent" />{locale === "id" ? "Rank Tujuanmu" : "Your Target Rank"}</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      {/* Tier-only Dropdown */}
                      <div className="relative">
                        <select
                          value={form.targetRank}
                          onChange={(e) => {
                            const rankId = e.target.value;
                            updateForm({ targetRank: rankId as RankTier });
                            setSelectedPackage(null);
                            setShowPackages(false);
                            // Set default division to top (I = highest)
                            const cfg = RANK_DIVISION_CONFIG[rankId];
                            if (cfg) setTargetStar(1);
                            // Reset mythic stars
                            const mythicCfg = MYTHIC_STAR_CONFIG[rankId];
                            if (mythicCfg) setTargetMythicStars(mythicCfg.min);
                          }}
                          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-text text-sm font-medium appearance-none cursor-pointer focus:border-accent focus:outline-none transition-colors pr-10"
                        >
                          {RANK_LIST.map((rank) => {
                            const ci = RANK_ORDER.indexOf(form.currentRank);
                            const oi = RANK_ORDER.indexOf(rank.id);
                            const isValid = oi > ci || (oi === ci && MYTHIC_STAR_CONFIG[rank.id]);
                            return (
                              <option key={rank.id} value={rank.id} disabled={!isValid}>
                                {rank.label}{!isValid ? " (di bawah rank awal)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Image src={rankIcons[form.targetRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.targetRank}`} width={24} height={24} className="w-6 h-6 object-contain" />
                        </div>
                      </div>
                      {/* Division Selector (for ranks with divisions) */}
                      {RANKS_WITH_STARS.includes(form.targetRank) && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-text-muted text-xs whitespace-nowrap font-medium">
                            {locale === "id" ? "Divisi:" : "Division:"}
                          </span>
                          <div className="flex gap-1">
                            {getDivisionOptions(form.targetRank).map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setTargetStar(opt.value)}
                                className={`px-3 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                                  targetStar === opt.value
                                    ? "bg-accent/20 border-2 border-accent text-accent"
                                    : "bg-surface border border-white/10 text-text-muted hover:border-white/20"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Target Mythic Star Input */}
                    {MYTHIC_STAR_CONFIG[form.targetRank] && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setTargetMythicStars(s => Math.max(MYTHIC_STAR_CONFIG[form.targetRank].min, s - 1))}
                            disabled={targetMythicStars <= MYTHIC_STAR_CONFIG[form.targetRank].min}
                            className="w-8 h-8 rounded-lg bg-surface border border-white/10 text-white flex items-center justify-center hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            value={targetMythicStars}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || MYTHIC_STAR_CONFIG[form.targetRank].min;
                              const cfg = MYTHIC_STAR_CONFIG[form.targetRank];
                              setTargetMythicStars(Math.max(cfg.min, Math.min(cfg.max, v)));
                            }}
                            className="w-16 h-10 text-center bg-surface text-text rounded-lg border border-white/10 focus:outline-none focus:border-accent text-sm font-bold"
                          />
                          <button
                            onClick={() => setTargetMythicStars(s => Math.min(MYTHIC_STAR_CONFIG[form.targetRank].max, s + 1))}
                            disabled={targetMythicStars >= MYTHIC_STAR_CONFIG[form.targetRank].max}
                            className="w-8 h-8 rounded-lg bg-surface border border-white/10 text-white flex items-center justify-center hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-text-muted text-xs whitespace-nowrap flex items-center gap-1">
                          {MYTHIC_STAR_CONFIG[form.targetRank].label === "Match" ? "Match" : <><Star className="w-3 h-3 text-yellow-400" /> {locale === "id" ? "Bintang Tujuan" : "Target Stars"}</>}
                        </span>
                      </div>
                    )}
                    {MYTHIC_STAR_CONFIG[form.targetRank] && (
                      <p className="text-text-muted text-[10px] mt-2">
                        {form.targetRank === "mythicgrading"
                          ? (locale === "id" ? `Target match Mythic Grading (${MYTHIC_STAR_CONFIG[form.targetRank].min}-${MYTHIC_STAR_CONFIG[form.targetRank].max})` : `Target Mythic Grading matches (${MYTHIC_STAR_CONFIG[form.targetRank].min}-${MYTHIC_STAR_CONFIG[form.targetRank].max})`)
                          : (locale === "id" ? `${RANK_LIST.find(r => r.id === form.targetRank)?.label}: pilih target ${MYTHIC_STAR_CONFIG[form.targetRank].min}-${MYTHIC_STAR_CONFIG[form.targetRank].max} bintang` : `${RANK_LIST.find(r => r.id === form.targetRank)?.label}: choose target ${MYTHIC_STAR_CONFIG[form.targetRank].min}-${MYTHIC_STAR_CONFIG[form.targetRank].max} stars`)
                        }
                      </p>
                    )}
                  </div>

                  {/* Selected Rank Flow Display */}
                  <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-background rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <Image src={rankIcons[form.currentRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.currentRank}`} width={28} height={28} className="w-7 h-7 object-contain" />
                      <span className="text-text text-sm font-medium">
                        {RANK_LIST.find(r => r.id === form.currentRank)?.label}
                        {RANKS_WITH_STARS.includes(form.currentRank) && <span className="text-text-muted ml-1">{getDivisionOptions(form.currentRank).find(s => s.value === currentStar)?.label}</span>}
                        {MYTHIC_STAR_CONFIG[form.currentRank] && <span className="text-text-muted ml-1">({currentMythicStars}★)</span>}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <Image src={rankIcons[form.targetRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.targetRank}`} width={28} height={28} className="w-7 h-7 object-contain" />
                      <span className="text-yellow-400 text-sm font-bold">
                        {RANK_LIST.find(r => r.id === form.targetRank)?.label}
                        {RANKS_WITH_STARS.includes(form.targetRank) && <span className="text-yellow-300 ml-1">{getDivisionOptions(form.targetRank).find(s => s.value === targetStar)?.label}</span>}
                        {MYTHIC_STAR_CONFIG[form.targetRank] && <span className="text-yellow-300 ml-1">({targetMythicStars}★)</span>}
                      </span>
                    </div>
                  </div>

                  {/* Star Summary Card + Bonus Stars */}
                  {(() => {
                    const totalStars = calculateTotalStars(form.currentRank, currentStar, form.targetRank, targetStar, RANKS_WITH_STARS.includes(form.currentRank) ? currentDivisionStar : 0, currentMythicStars, targetMythicStars);
                    if (totalStars <= 0) return null;
                    // Determine active bundle tier
                    const activeTier = [...BUNDLE_TIERS].reverse().find(t => totalStars >= t.minStars) || BUNDLE_TIERS[0];
                    const bonusStars = activeTier?.bonusStars || 0;
                    return (
                      <div className="flex items-center justify-between p-3 mb-3 bg-accent/5 border border-accent/20 rounded-xl">
                        <span className="text-text text-sm font-medium">
                          {locale === "id" ? "Total Bintang" : "Total Stars"}
                        </span>
                        <span className="text-yellow-400 font-bold text-lg flex items-center gap-1.5">
                          {totalStars} <Star className="w-4 h-4" />
                          {bonusStars > 0 && (
                            <span className="text-green-400 text-sm font-semibold ml-1">
                              +{bonusStars} {locale === "id" ? "BONUS" : "BONUS"}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Bundle Tier Cards — upsell incentive */}
                  {(() => {
                    const totalStars = calculateTotalStars(form.currentRank, currentStar, form.targetRank, targetStar, RANKS_WITH_STARS.includes(form.currentRank) ? currentDivisionStar : 0, currentMythicStars, targetMythicStars);
                    if (totalStars <= 0) return null;
                    const activeTier = [...BUNDLE_TIERS].reverse().find(t => totalStars >= t.minStars) || BUNDLE_TIERS[0];
                    return (
                      <div className="mb-3">
                        <p className="text-text-muted text-xs font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                          {locale === "id" ? "Bonus Bintang Aktif" : "Active Star Bonus"}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {BUNDLE_TIERS.map((tier) => {
                            const isActive = activeTier?.id === tier.id;
                            const isUnlocked = totalStars >= tier.minStars;
                            return (
                              <div
                                key={tier.id}
                                className={`relative p-3 rounded-xl border-2 bg-gradient-to-br ${tier.color} transition-all ${
                                  isActive
                                    ? `${tier.borderColor} shadow-lg scale-105`
                                    : isUnlocked
                                      ? "border-white/10 opacity-60"
                                      : "border-white/5 opacity-50"
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Check className="w-2 h-2" /> AKTIF
                                  </span>
                                )}
                                <div className="text-center">
                                  <span className="text-xl block">{tier.icon}</span>
                                  <p className="text-text text-[11px] font-bold mt-1">{tier.name}</p>
                                  <p className="text-text-muted text-[9px] mt-0.5">
                                    {tier.minStars}★ {locale === "id" ? "minimal" : "min"}
                                  </p>
                                  {tier.bonusStars > 0 ? (
                                    <p className="text-green-400 text-xs font-bold mt-1 flex items-center justify-center gap-0.5">
                                      +{tier.bonusStars}<Star className="w-2.5 h-2.5 fill-current" />
                                    </p>
                                  ) : (
                                    <p className="text-text-muted text-[9px] mt-1">Base</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Upsell hint */}
                        {(() => {
                          const nextTierIdx = BUNDLE_TIERS.findIndex(t => t.minStars > totalStars);
                          if (nextTierIdx < 0) return null;
                          const nextTier = BUNDLE_TIERS[nextTierIdx];
                          const starsNeeded = nextTier.minStars - totalStars;
                          return (
                            <p className="text-center text-xs text-accent/80 mt-2 flex items-center justify-center gap-1.5">
                              <Sparkles className="w-3 h-3" />
                              {locale === "id"
                                ? `Tambah ${starsNeeded} bintang lagi untuk dapat +${nextTier.bonusStars} bonus (${nextTier.name})`
                                : `Add ${starsNeeded} more stars for +${nextTier.bonusStars} bonus (${nextTier.name})`}
                            </p>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  {/* Auto-Calculated Price Card (replaces Hitung Harga button + package cards) */}
                  {autoCalcResult.totalStars > 0 && (
                    <div className="mt-2 p-5 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-text text-sm font-medium flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-accent" />
                          {locale === "id" ? "Estimasi Harga Paket" : "Package Price Estimate"}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-yellow-400 font-bold text-3xl leading-none">
                            {formatRupiah(autoCalcResult.price)}
                          </p>
                          <p className="text-text-muted text-xs mt-2">
                            {autoCalcResult.totalStars} {locale === "id" ? "bintang" : "stars"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-400">
                          <Check className="w-5 h-5" />
                          <span className="text-xs font-medium">{locale === "id" ? "Siap Order" : "Ready to Order"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rush 10 Star Promotional Cards */}
                  <div className="mt-4">
                    <p className="text-text-muted text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      {locale === "id" ? "Rush 10 Star + Bonus" : "Rush 10 Star + Bonus"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {RUSH_PACKAGES.map((pkg) => {
                        const isActive = form.currentRank === pkg.rankId && form.targetRank === pkg.rankId;
                        return (
                          <button
                            key={pkg.id}
                            onClick={() => {
                              // Set current & target rank to same tier
                              updateForm({ currentRank: pkg.rankId as RankTier, targetRank: pkg.rankId as RankTier });
                              // Set divisions for ranks with divisions
                              const cfg = RANK_DIVISION_CONFIG[pkg.rankId];
                              if (cfg) {
                                setCurrentStar(cfg.divisions); // lowest division
                                setTargetStar(1); // highest division
                                setCurrentDivisionStar(1);
                              }
                              // Set mythic stars for same-tier 10-star order
                              const mythicCfg = MYTHIC_STAR_CONFIG[pkg.rankId];
                              if (mythicCfg) {
                                setCurrentMythicStars(mythicCfg.min);
                                setTargetMythicStars(Math.min(mythicCfg.max, mythicCfg.min + 10));
                              }
                            }}
                            className={`relative text-left rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] overflow-hidden flex flex-col ${
                              isActive
                                ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
                                : "border-white/5 hover:border-white/15"
                            }`}
                          >
                            <div className="p-4 bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex-1">
                              <p className="text-white text-xs font-semibold mb-2">
                                {pkg.rankLabel}
                              </p>
                              <div className="flex items-center gap-3">
                                <Image
                                  src={pkg.icon}
                                  alt={pkg.rankLabel}
                                  width={36}
                                  height={36}
                                  className="w-9 h-9 object-contain flex-shrink-0 drop-shadow-lg"
                                />
                                <div>
                                  <p className="text-yellow-400 font-bold text-base leading-tight">
                                    {formatRupiah(pkg.price)}
                                  </p>
                                  <p className="text-red-400/70 text-[10px] line-through">
                                    {formatRupiah(pkg.originalPrice)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="px-3 py-2 bg-slate-800/60 flex items-center justify-between gap-1">
                              <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                                <Star className="w-2 h-2 fill-current" /> +{pkg.bonusStars} BONUS
                              </span>
                              <div className="flex items-center gap-1.5">
                                <TierIconsBadge currentRank={pkg.rankId} targetRank={pkg.rankId} />
                                <span className="bg-teal-600/30 text-teal-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  10★
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                                <Check className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* PER STAR MODE — Rank Tujuan + Summary (like paket) */}
              {orderMode === "perstar" && (
                <>
                  {/* Rank Tujuanmu */}
                  <div className="mb-5 p-4 bg-background rounded-xl border border-white/5">
                    <label className="block text-sm text-text font-bold mb-2">
                      <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-accent" />{locale === "id" ? "Rank Tujuanmu" : "Your Target Rank"}</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <select
                          data-testid="perstar-target-rank"
                          value={form.targetRank}
                          disabled={form.currentRank === ""}
                          onChange={(e) => {
                            const rankId = e.target.value;
                            setPerStarTouched(true);
                            updateForm({ targetRank: rankId as RankTier });
                            const cfg = RANK_DIVISION_CONFIG[rankId];
                            if (cfg) setTargetStar(1);
                            const mythicCfg = MYTHIC_STAR_CONFIG[rankId];
                            if (mythicCfg) setTargetMythicStars(mythicCfg.min);
                          }}
                          className={`w-full bg-surface border rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer focus:outline-none transition-colors pr-10 disabled:opacity-50 disabled:cursor-not-allowed ${
                            form.targetRank === ""
                              ? "border-white/10 text-text-muted"
                              : "border-white/10 text-text focus:border-accent"
                          }`}
                        >
                          <option value="" disabled>{locale === "id" ? "Pilih Rank Tujuan" : "Select Target Rank"}</option>
                          {RANK_LIST.map((rank) => {
                            const ci = RANK_ORDER.indexOf(form.currentRank);
                            const oi = RANK_ORDER.indexOf(rank.id);
                            const isValid = ci >= 0 && (oi > ci || (oi === ci && MYTHIC_STAR_CONFIG[rank.id]));
                            return (
                              <option key={rank.id} value={rank.id} disabled={!isValid}>
                                {rank.label}{!isValid ? " (di bawah rank awal)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        {form.targetRank !== "" && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Image src={rankIcons[form.targetRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.targetRank}`} width={24} height={24} className="w-6 h-6 object-contain" />
                        </div>
                        )}
                      </div>
                      {RANKS_WITH_STARS.includes(form.targetRank) && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-text-muted text-xs whitespace-nowrap font-medium">{locale === "id" ? "Divisi:" : "Division:"}</span>
                          <div className="flex gap-1">
                            {getDivisionOptions(form.targetRank).map((opt) => (
                              <button key={opt.value} onClick={() => setTargetStar(opt.value)}
                                className={`px-3 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${targetStar === opt.value ? "bg-accent/20 border-2 border-accent text-accent" : "bg-surface border border-white/10 text-text-muted hover:border-white/20"}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {MYTHIC_STAR_CONFIG[form.targetRank] && (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setTargetMythicStars(s => Math.max(MYTHIC_STAR_CONFIG[form.targetRank].min, s - 1))} disabled={targetMythicStars <= MYTHIC_STAR_CONFIG[form.targetRank].min} className="w-8 h-8 rounded-lg bg-surface border border-white/10 text-white flex items-center justify-center hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"><Minus className="w-3.5 h-3.5" /></button>
                            <input type="number" value={targetMythicStars} onChange={(e) => { const v = parseInt(e.target.value) || MYTHIC_STAR_CONFIG[form.targetRank].min; const cfg = MYTHIC_STAR_CONFIG[form.targetRank]; setTargetMythicStars(Math.max(cfg.min, Math.min(cfg.max, v))); }} className="w-16 h-10 text-center bg-surface text-text rounded-lg border border-white/10 focus:outline-none focus:border-accent text-sm font-bold" />
                            <button onClick={() => setTargetMythicStars(s => Math.min(MYTHIC_STAR_CONFIG[form.targetRank].max, s + 1))} disabled={targetMythicStars >= MYTHIC_STAR_CONFIG[form.targetRank].max} className="w-8 h-8 rounded-lg bg-surface border border-white/10 text-white flex items-center justify-center hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <span className="text-text-muted text-xs whitespace-nowrap flex items-center gap-1">{MYTHIC_STAR_CONFIG[form.targetRank].label === "Match" ? "Match" : <><Star className="w-3 h-3 text-yellow-400" /> {locale === "id" ? "Bintang Tujuan" : "Target Stars"}</>}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Empty State Placeholder (before user selects both ranks) */}
                  {(!perStarTouched || form.currentRank === "" || form.targetRank === "") && (
                    <div className="flex flex-col items-center justify-center gap-2 mb-4 p-6 bg-background rounded-xl border border-dashed border-white/15 text-center">
                      <Target className="w-8 h-8 text-accent/50" />
                      <p className="text-text-muted text-sm font-medium">
                        {form.currentRank === ""
                          ? (locale === "id" ? "Pilih rank awal & rank tujuan untuk melihat harga" : "Select current rank & target rank to see price")
                          : (locale === "id" ? "Pilih rank tujuan untuk melihat harga" : "Select target rank to see price")}
                      </p>
                    </div>
                  )}

                  {/* Selected Rank Flow Display — only after user picks both ranks */}
                  {perStarTouched && form.currentRank !== "" && form.targetRank !== "" && (
                  <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-background rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <Image src={rankIcons[form.currentRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.currentRank}`} width={28} height={28} className="w-7 h-7 object-contain" />
                      <span className="text-text text-sm font-medium">
                        {RANK_LIST.find(r => r.id === form.currentRank)?.label}
                        {RANKS_WITH_STARS.includes(form.currentRank) && <span className="text-text-muted ml-1">{getDivisionOptions(form.currentRank).find(s => s.value === currentStar)?.label}</span>}
                        {MYTHIC_STAR_CONFIG[form.currentRank] && <span className="text-text-muted ml-1">({currentMythicStars}★)</span>}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <Image src={rankIcons[form.targetRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.targetRank}`} width={28} height={28} className="w-7 h-7 object-contain" />
                      <span className="text-yellow-400 text-sm font-bold">
                        {RANK_LIST.find(r => r.id === form.targetRank)?.label}
                        {RANKS_WITH_STARS.includes(form.targetRank) && <span className="text-yellow-300 ml-1">{getDivisionOptions(form.targetRank).find(s => s.value === targetStar)?.label}</span>}
                        {MYTHIC_STAR_CONFIG[form.targetRank] && <span className="text-yellow-300 ml-1">({targetMythicStars}★)</span>}
                      </span>
                    </div>
                  </div>
                  )}

                  {/* Star Summary + Bonus */}
                  {perStarTouched && autoCalcResult.totalStars > 0 && (() => {
                    const totalStars = autoCalcResult.totalStars;
                    const activeTier = [...BUNDLE_TIERS].reverse().find(t => totalStars >= t.minStars) || BUNDLE_TIERS[0];
                    const bonusStars = activeTier?.bonusStars || 0;
                    return (
                      <div className="flex items-center justify-between p-3 mb-3 bg-accent/5 border border-accent/20 rounded-xl">
                        <span className="text-text text-sm font-medium">{locale === "id" ? "Total Bintang" : "Total Stars"}</span>
                        <span className="text-yellow-400 font-bold text-lg flex items-center gap-1.5">
                          {totalStars} <Star className="w-4 h-4" />
                          {bonusStars > 0 && <span className="text-green-400 text-sm font-semibold ml-1">+{bonusStars} BONUS</span>}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Bundle Tier Cards */}
                  {perStarTouched && autoCalcResult.totalStars > 0 && (() => {
                    const totalStars = autoCalcResult.totalStars;
                    const activeTier = [...BUNDLE_TIERS].reverse().find(t => totalStars >= t.minStars) || BUNDLE_TIERS[0];
                    return (
                      <div className="mb-3">
                        <p className="text-text-muted text-xs font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-yellow-400" />{locale === "id" ? "Bonus Bintang Aktif" : "Active Star Bonus"}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {BUNDLE_TIERS.map((tier) => {
                            const isActive = activeTier?.id === tier.id;
                            const isUnlocked = totalStars >= tier.minStars;
                            return (
                              <div key={tier.id} className={`relative p-3 rounded-xl border-2 bg-gradient-to-br ${tier.color} transition-all ${isActive ? `${tier.borderColor} shadow-lg scale-105` : isUnlocked ? "border-white/10 opacity-60" : "border-white/5 opacity-50"}`}>
                                {isActive && <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Check className="w-2 h-2" /> AKTIF</span>}
                                <div className="text-center">
                                  <span className="text-xl block">{tier.icon}</span>
                                  <p className="text-text text-[11px] font-bold mt-1">{tier.name}</p>
                                  <p className="text-text-muted text-[9px] mt-0.5">{tier.minStars}★ min</p>
                                  {tier.bonusStars > 0 ? <p className="text-green-400 text-xs font-bold mt-1 flex items-center justify-center gap-0.5">+{tier.bonusStars}<Star className="w-2.5 h-2.5 fill-current" /></p> : <p className="text-text-muted text-[9px] mt-1">Base</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Auto-Calculated Price Card */}
                  {perStarTouched && autoCalcResult.totalStars > 0 && (
                    <div className="mt-2 p-5 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-text text-sm font-medium flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-accent" />{locale === "id" ? "Estimasi Harga Per Bintang" : "Per Star Price Estimate"}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-yellow-400 font-bold text-3xl leading-none">{formatRupiah(autoCalcResult.price)}</p>
                          <p className="text-text-muted text-xs mt-2">{autoCalcResult.totalStars} {locale === "id" ? "bintang" : "stars"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-400"><Check className="w-5 h-5" /><span className="text-xs font-medium">{locale === "id" ? "Siap Order" : "Ready to Order"}</span></div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* GENDONG (DUO BOOST) MODE */}
              {orderMode === "gendong" && (
                <>
                  {/* Rank Selection Grid */}
                  <div className="mb-5">
                    <h3 className="text-text font-bold text-base mb-4">{t.selectRank}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {gendongRanks.map((rank) => {
                        const isSelected = selectedGendongRank?.id === rank.id;
                        return (
                          <button
                            key={rank.id}
                            onClick={() => { setSelectedGendongRank(rank); setGendongQuantity(rank.id === "grading" ? 1 : 3); }}
                            className={`relative text-left rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] overflow-hidden flex flex-col ${
                              isSelected
                                ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
                                : "border-white/5 hover:border-white/15"
                            }`}
                          >
                            <div className="p-4 bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex-1">
                              <p className="text-white text-sm font-semibold mb-2">
                                {rank.name}
                              </p>
                              <div className="flex items-center gap-3">
                                <Image
                                  src={rank.icon}
                                  alt={rank.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-contain flex-shrink-0 drop-shadow-lg"
                                />
                                <div>
                                  <p className="text-yellow-400 font-bold text-lg leading-tight">
                                    {formatRupiah(rank.price)}
                                    <span className="text-text-muted text-xs font-normal ml-1">{rank.id === "grading" ? "/ Match" : t.perStar}</span>
                                  </p>
                                  {rank.originalPrice && (
                                    <p className="text-red-400/70 text-xs line-through">
                                      {formatRupiah(rank.originalPrice)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="px-4 py-2.5 bg-slate-800/60 flex items-center justify-between gap-2">
                              {rank.discountPercent ? (
                                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Disc {rank.discountPercent}%
                                </span>
                              ) : <span />}
                              <div className="flex items-center gap-2">
                                <Image src={rank.icon} alt={rank.name} width={20} height={20} className="w-5 h-5 object-contain drop-shadow-md" />
                                <span className="bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                  <Users className="w-2.5 h-2.5" />
                                  Duo Boost
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                                <Check className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Star Quantity Input */}
                  {selectedGendongRank && (
                    <div className="p-4 bg-background rounded-xl border border-accent/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={selectedGendongRank.icon}
                            alt={selectedGendongRank.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-contain drop-shadow-lg"
                          />
                          <div>
                            <p className="text-text font-semibold">{selectedGendongRank.name}</p>
                            <p className="text-text-muted text-sm">
                              {formatRupiah(selectedGendongRank.price)} {selectedGendongRank.id === "grading" ? "/ Match" : t.perStar}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-text-muted text-xs mb-1">{selectedGendongRank.id === "grading" ? "Jumlah Match" : t.starQuantity}</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setGendongQuantity(q => Math.max(gendongMin, q - 1))}
                                disabled={gendongQuantity <= gendongMin}
                                className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={gendongQuantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || gendongMin;
                                  setGendongQuantity(Math.max(gendongMin, Math.min(gendongMax, val)));
                                }}
                                min={gendongMin}
                                max={gendongMax}
                                className="w-16 h-8 text-center bg-slate-800 text-white rounded-lg border border-white/10 focus:outline-none focus:border-accent"
                              />
                              <button
                                onClick={() => setGendongQuantity(q => Math.min(gendongMax, q + 1))}
                                disabled={gendongQuantity >= gendongMax}
                                className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-text-muted text-[10px] mt-1 flex items-center gap-1">Min {gendongMin} &bull; Max {gendongMax} {selectedGendongRank.id === "grading" ? "Match" : <Star className="w-3 h-3 text-yellow-400" />}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-text-muted text-xs">{t.totalPrice}</p>
                            <p className="text-yellow-400 font-bold text-xl">
                              {formatRupiah(selectedGendongRank.price * gendongQuantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* ===== STEP 2: DATA AKUN ===== */}
        {currentStep === 2 && (
          <section className="max-w-4xl mx-auto bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                2
              </span>
              <h2 className="font-bold text-text">{orderMode === "gendong" ? t.gendongDataTitle : t.accountData}</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Gendong info banner */}
              {orderMode === "gendong" && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <Gamepad2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-purple-300 text-xs">{t.gendongNoLoginHint}</p>
                </div>
              )}

              {/* Login Method Dropdown — Hide for Gendong */}
              {orderMode !== "gendong" && (
              <div>
                <label className="block text-sm text-text-muted mb-2 font-medium">
                  {t.loginMethod}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {LOGIN_METHODS.map((method) => {
                    const IconComponent = method.Icon;
                    const isSelected = form.loginMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => updateForm({ loginMethod: method.id })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? "gradient-primary text-white"
                            : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                        }`}
                      >
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{ color: isSelected ? 'white' : method.color }}
                        />
                        <span>{method.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              {/* User ID + Server ID + Cek Akun */}
              <div>
                <label className="block text-sm text-text-muted mb-1.5 font-medium">
                  MASUKKAN ID DAN SERVER
                </label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex flex-1 gap-2 min-w-0">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">(</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.userId}
                          onChange={(e) => {
                            updateForm({ userId: e.target.value.replace(/\D/g, ""), nickname: "" });
                            setAccountCheckResult(null);
                            setAccountCheckError("");
                          }}
                          onBlur={() => markTouched("userId")}
                          placeholder={t.placeholderUserId}
                          className={`w-full bg-background border rounded-xl pl-7 pr-7 py-2.5 text-text text-sm text-center focus:border-accent focus:outline-none transition-colors ${
                            touched.userId && !form.userId ? "border-red-500" : "border-white/10"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">)</span>
                      </div>
                    </div>
                    <div className="w-28 sm:w-36">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">(</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.serverId}
                          onChange={(e) => {
                            updateForm({ serverId: e.target.value.replace(/\D/g, ""), nickname: "" });
                            setAccountCheckResult(null);
                            setAccountCheckError("");
                          }}
                          onBlur={() => markTouched("serverId")}
                          placeholder={t.placeholderServerId}
                          className={`w-full bg-background border rounded-xl pl-7 pr-7 py-2.5 text-text text-sm text-center focus:border-accent focus:outline-none transition-colors ${
                            touched.serverId && !form.serverId ? "border-red-500" : "border-white/10"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckAccount}
                    disabled={accountCheckLoading || !form.userId || !form.serverId}
                    className="w-full sm:w-auto px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    {accountCheckLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {accountCheckLoading ? t.checking : t.checkAccount}
                  </button>
                </div>

                {/* Verification Result */}
                {accountCheckResult?.verified && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-green-400 text-sm font-medium">{accountCheckResult.nickname}</span>
                    <span className="text-green-400/60 text-xs">— {t.accountVerified}</span>
                  </div>
                )}
                {accountCheckError && (
                  <p className="text-red-400 text-xs mt-1.5">{accountCheckError}</p>
                )}
                {!accountCheckResult && !accountCheckError && (
                  <p className="text-text-muted text-xs mt-1.5">{t.checkAccountHint}</p>
                )}
                {touched.userId && !form.userId && (
                  <p className="text-red-400 text-xs mt-1">{t.required}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Nickname */}
                <div>
                  <label htmlFor="order-nickname" className="block text-sm text-text-muted mb-1.5">
                    {t.labelNickname} <span className="text-error">*</span>
                  </label>
                  <input
                    id="order-nickname"
                    type="text"
                    value={form.nickname}
                    onChange={(e) => updateForm({ nickname: e.target.value })}
                    onBlur={() => markTouched("nickname")}
                    placeholder={t.placeholderNickname}
                    className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                      touched.nickname && !form.nickname ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {touched.nickname && !form.nickname && (
                    <p className="text-red-400 text-xs mt-1">{t.required}</p>
                  )}
                </div>
                {/* Email / No HP — Hide for Gendong */}
                {orderMode !== "gendong" && (
                <div>
                  <label htmlFor="order-account-login" className="block text-sm text-text-muted mb-1.5">
                    {t.labelAccountLogin} <span className="text-error">*</span>
                  </label>
                  <input
                    id="order-account-login"
                    type="text"
                    value={form.accountLogin}
                    onChange={(e) =>
                      updateForm({ accountLogin: e.target.value })
                    }
                    onBlur={() => markTouched("accountLogin")}
                    placeholder={t.placeholderAccountLogin}
                    className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                      touched.accountLogin && !form.accountLogin ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {touched.accountLogin && !form.accountLogin && (
                    <p className="text-red-400 text-xs mt-1">{t.required}</p>
                  )}
                </div>
                )}
              </div>

              {/* Password — Hide for Gendong */}
              {orderMode !== "gendong" && (
              <div>
                <label htmlFor="order-password" className="block text-sm text-text-muted mb-1.5">
                  {t.labelPassword} <span className="text-error">*</span>
                </label>
                <input
                  id="order-password"
                  type="password"
                  value={form.accountPassword}
                  onChange={(e) =>
                    updateForm({ accountPassword: e.target.value })
                  }
                  onBlur={() => markTouched("accountPassword")}
                  placeholder={t.placeholderPassword}
                  className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                    touched.accountPassword && !form.accountPassword ? "border-red-500" : "border-white/10"
                  }`}
                />
                {touched.accountPassword && !form.accountPassword && (
                  <p className="text-red-400 text-xs mt-1">{t.required}</p>
                )}
              </div>
              )}

              {/* Gendong-specific: Preferred Role + Play Schedule */}
              {orderMode === "gendong" && (
              <>
                <div>
                  <label className="block text-sm text-text-muted mb-2 font-medium flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-purple-400" />
                    {t.labelPreferredRole} <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {gendongRoles.map((role) => {
                      const isSelected = form.preferredRole === role.id;
                      const isDisabled = role.disabled;
                      return (
                        <button
                          key={role.id}
                          onClick={() => !isDisabled && updateForm({ preferredRole: role.id })}
                          disabled={isDisabled}
                          className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${
                            isDisabled
                              ? "bg-background/50 border border-white/5 text-text-muted/40 cursor-not-allowed opacity-50"
                              : isSelected
                              ? "gradient-primary text-white shadow-lg"
                              : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                          }`}
                        >
                          <span className="text-lg">{ML_ROLE_ICONS[role.id]}</span>
                          <span>{role.name}</span>
                          {isDisabled && <span className="text-[9px] text-red-400/70">Khusus Booster</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-text-muted text-xs mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-text-muted/60" />
                    {t.preferredRoleHint}
                  </p>
                  {touched.preferredRole && !form.preferredRole && (
                    <p className="text-red-400 text-xs mt-1">{t.required}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-text-muted mb-1.5 font-medium flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-purple-400" />
                    {t.labelPlaySchedule} <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.playSchedule}
                      onChange={(e) => updateForm({ playSchedule: e.target.value })}
                      onBlur={() => markTouched("playSchedule")}
                      className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors appearance-none pr-10 ${
                        touched.playSchedule && !form.playSchedule ? "border-red-500" : "border-white/10"
                      } ${!form.playSchedule ? "text-text-muted" : ""}`}
                    >
                      <option value="" disabled>{t.placeholderPlaySchedule}</option>
                      {scheduleOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-text-muted text-xs mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-text-muted/60" />
                    {t.playScheduleHint}
                  </p>
                  {touched.playSchedule && !form.playSchedule && (
                    <p className="text-red-400 text-xs mt-1">{t.required}</p>
                  )}
                </div>
              </>
              )}

              {/* Hero Request */}
              <div>
                <label htmlFor="order-hero" className="block text-sm text-text-muted mb-1.5">
                  {t.labelHero}
                </label>
                <input
                  id="order-hero"
                  type="text"
                  value={form.heroRequest}
                  onChange={(e) =>
                    updateForm({ heroRequest: e.target.value })
                  }
                  placeholder={t.placeholderHero}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="order-notes" className="block text-sm text-text-muted mb-1.5">
                  {t.labelNotes}
                </label>
                <textarea
                  id="order-notes"
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder={t.placeholderNotes}
                  rows={2}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <h3 className="text-text font-bold text-sm mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-accent" />
                  {t.contactPay}
                </h3>
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="order-whatsapp" className="block text-sm text-text-muted mb-1.5">
                  {t.labelWhatsapp} <span className="text-error">*</span>
                </label>
                <div className="flex">
                  <span className="bg-background border border-white/10 border-r-0 rounded-l-xl px-3 py-2.5 text-text-muted text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> +62
                  </span>
                  <input
                    id="order-whatsapp"
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.startsWith("62")) val = val.slice(2);
                      if (val.startsWith("0")) val = val.slice(1);
                      updateForm({ whatsapp: val });
                    }}
                    onBlur={() => markTouched("whatsapp")}
                    placeholder="8123456789"
                    className={`flex-1 bg-background border rounded-r-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                      touched.whatsapp && (!form.whatsapp || form.whatsapp.length < 9 || form.whatsapp.length > 13 || !form.whatsapp.startsWith("8")) ? "border-red-500" : "border-white/10"
                    }`}
                  />
                </div>
                {touched.whatsapp && (!form.whatsapp || form.whatsapp.length < 9 || form.whatsapp.length > 13 || !form.whatsapp.startsWith("8")) && (
                  <p className="text-red-400 text-xs mt-1">
                    {form.whatsapp && !form.whatsapp.startsWith("8") ? "Nomor harus diawali 8 (contoh: 812xxx)" : form.whatsapp && form.whatsapp.length > 13 ? "Nomor terlalu panjang (maks 13 digit)" : t.required}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="order-email" className="block text-sm text-text-muted mb-1.5">
                  {t.labelEmail}
                </label>
                <input
                  id="order-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  onBlur={() => markTouched("email")}
                  placeholder={t.placeholderEmail}
                  className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                    touched.email && form.email && !isValidEmail(form.email) ? "border-red-500" : "border-white/10"
                  }`}
                />
                {touched.email && form.email && !isValidEmail(form.email) && (
                  <p className="text-red-400 text-xs mt-1">{t.invalidEmail}</p>
                )}
                <p className="text-text-muted text-xs mt-1.5">{t.emailDesc}</p>
              </div>
            </div>
          </section>
        )}

        {/* ===== STEP 3: OPSI & PEMBAYARAN ===== */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  3
                </span>
                <h2 className="font-bold text-text">{t.optionsPromo}</h2>
              </div>
              <div className="p-5 space-y-5">
                {/* Add-ons */}
                <div>
                  <p className="text-text-muted text-xs font-semibold mb-3 uppercase tracking-wider">{t.addons}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => updateForm({ isExpress: !form.isExpress })}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                        form.isExpress
                          ? "border-yellow-500/50 bg-yellow-500/10"
                          : "border-white/10 bg-background hover:border-white/20"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                        form.isExpress ? "border-yellow-400 bg-yellow-400" : "border-white/30"
                      }`}>
                        {form.isExpress && <Check className="w-3 h-3 text-background" />}
                      </div>
                      <div>
                        <p className="text-text font-semibold text-sm flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                          {t.express}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5">{t.expressDesc}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => updateForm({ isPremium: !form.isPremium })}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                        form.isPremium
                          ? "border-yellow-500/50 bg-yellow-500/10"
                          : "border-white/10 bg-background hover:border-white/20"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                        form.isPremium ? "border-yellow-400 bg-yellow-400" : "border-white/30"
                      }`}>
                        {form.isPremium && <Check className="w-3 h-3 text-background" />}
                      </div>
                      <div>
                        <p className="text-text font-semibold text-sm flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-yellow-400" />
                          {t.premium}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5">{t.premiumDesc}</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Promo Code */}
                <div>
                  <p className="text-text-muted text-xs font-semibold mb-2 uppercase tracking-wider">{t.promoCode}</p>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={form.promoCode}
                        onChange={(e) => {
                          updateForm({ promoCode: e.target.value.toUpperCase() });
                          setPromoApplied(false);
                          setPromoDiscount(0);
                          setPromoMessage("");
                        }}
                        placeholder={t.promoPlaceholder}
                        className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors font-mono uppercase"
                      />
                    </div>
                    <button
                      onClick={applyPromo}
                      disabled={promoLoading || !form.promoCode.trim()}
                      className="px-5 py-2.5 gradient-primary rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.applyPromo}
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-xs mt-2 ${promoApplied ? "text-green-400" : "text-red-400"}`}>
                      {promoMessage}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="bg-background rounded-xl p-4 border border-white/5">
                  <p className="text-text-muted text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    {t.paymentDetails}
                  </p>
                  <div className="space-y-2 text-sm">
                    {orderMode === "gendong" && selectedGendongRank ? (
                      <div className="flex justify-between text-text-muted">
                        <span>Duo Boost {selectedGendongRank.name} × {gendongQuantity} Bintang</span>
                        <span>{formatRupiah(selectedGendongRank.price * gendongQuantity)}</span>
                      </div>
                    ) : selectedPackage ? (
                      <>
                      <div className="flex justify-between text-text-muted">
                        <span>{orderMode === "perstar"
                          ? `${formatRankWithStars(form.currentRank, currentStar, currentDivisionStar, currentMythicStars)} ~ ${formatRankWithStars(form.targetRank, targetStar, 0, targetMythicStars)}`
                          : t.basePrice}</span>
                        <span>{formatRupiah(selectedPackage.price)}</span>
                      </div>
                      {orderMode === "perstar" && perStarTouched && form.currentRank !== "" && form.targetRank !== "" && (() => {
                        const segments = calculateStarBreakdown(form.currentRank, currentStar, form.targetRank, targetStar, currentDivisionStar, perStarRanks, currentMythicStars, targetMythicStars);
                        if (segments.length <= 1) return null;
                        return (
                          <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                            {segments.map((seg, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] text-text-muted pl-2">
                                <span className="flex items-center gap-1.5">
                                  <Image src={rankIcons[seg.tierId] || "/icons-tier/Mythic.webp"} alt={seg.tierLabel} width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                                  {seg.tierLabel}: {seg.stars}★ × {formatRupiah(seg.pricePerStar)}
                                </span>
                                <span className="font-medium">{formatRupiah(seg.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      </>
                    ) : null}
                    {seasonMultiplier !== 1 && (
                      <div className={`flex justify-between ${seasonMultiplier > 1 ? "text-yellow-400/80" : "text-green-400"}`}>
                        <span>{seasonLabel || "Season"} ({seasonMultiplier > 1 ? `+${Math.round((seasonMultiplier - 1) * 100)}%` : `-${Math.round((1 - seasonMultiplier) * 100)}%`})</span>
                        <span>{seasonMultiplier > 1 ? "+" : "-"}{formatRupiah(Math.abs(Math.round(rawItemPrice * (seasonMultiplier - 1))))}</span>
                      </div>
                    )}
                    {form.isExpress && (
                      <div className="flex justify-between text-yellow-400/80">
                        <span>{t.expressAddon}</span>
                        <span>+{formatRupiah(Math.round(seasonAdjustedPrice * 0.2))}</span>
                      </div>
                    )}
                    {form.isPremium && (
                      <div className="flex justify-between text-yellow-400/80">
                        <span>{t.premiumAddon}</span>
                        <span>+{formatRupiah(Math.round(seasonAdjustedPrice * (form.isExpress ? 1.2 : 1) * 0.3))}</span>
                      </div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>{t.promoDiscount}</span>
                        <span>-{formatRupiah(promoDiscount)}</span>
                      </div>
                    )}
                    {tierDiscountAmount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>{t.tierDiscount} ({customerTier === "platinum" ? "8%" : customerTier === "gold" ? "5%" : "3%"})</span>
                        <span>-{formatRupiah(tierDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-text">
                      <span className="text-lg">{t.total}</span>
                      <span className="gradient-text text-xl">{formatRupiah(finalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment info */}
                <div className="flex items-start gap-2 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
                  <CreditCard className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-text-muted">
                    Pembayaran dilakukan setelah konfirmasi order. Kami mendukung QRIS, Virtual Account, dan Bank Transfer melalui DompetX.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===== STEP 4: KONFIRMASI ===== */}
        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  4
                </span>
                <h2 className="font-bold text-text">{t.confirmOrder}</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Order Type Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    orderMode === "paket" || orderMode === "classic"
                      ? "bg-primary/20 text-primary"
                      : orderMode === "gendong"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {orderMode === "paket" ? (
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        JOKI PAKET
                      </span>
                    ) : orderMode === "classic" ? (
                      <span className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        JOKI CLASSIC
                      </span>
                    ) : orderMode === "gendong" ? (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        JOKI GENDONG
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" />
                        JOKI PER BINTANG
                      </span>
                    )}
                  </span>
                </div>

                {/* Package Summary - For Paket & Classic Mode */}
                {(orderMode === "paket" || orderMode === "classic") && selectedPackage && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-2 uppercase tracking-wider">
                      Paket Dipilih
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Image src={rankIcons[selectedPackage.currentRank] || rankIcons[selectedPackage.rankKey]} alt={`Rank ${selectedPackage.currentRank}`} width={36} height={36} className="w-9 h-9 object-contain drop-shadow-lg" />
                        <ArrowRight className="w-4 h-4 text-accent" />
                        <Image src={rankIcons[selectedPackage.targetRank] || rankIcons[selectedPackage.rankKey]} alt={`Rank ${selectedPackage.targetRank}`} width={36} height={36} className="w-9 h-9 object-contain drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="text-text font-semibold">
                          {selectedPackage.title}
                        </p>
                        <p className="text-text-muted text-xs">
                          {RANK_LIST.find(r => r.id === selectedPackage.currentRank)?.label || selectedPackage.currentRank} → {RANK_LIST.find(r => r.id === selectedPackage.targetRank)?.label || selectedPackage.targetRank}
                        </p>
                        <p className="text-yellow-400 font-bold text-lg">
                          {formatRupiah(selectedPackage.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Per Star Summary - For Per Bintang Mode (now uses selectedPackage like paket) */}
                {orderMode === "perstar" && selectedPackage && (
                  <div className="bg-background rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Image src={rankIcons[form.currentRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.currentRank}`} width={36} height={36} className="w-9 h-9 object-contain drop-shadow-lg" />
                        <ArrowRight className="w-4 h-4 text-accent" />
                        <Image src={rankIcons[form.targetRank] || "/icons-tier/warrior.webp"} alt={`Rank ${form.targetRank}`} width={36} height={36} className="w-9 h-9 object-contain drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="text-text font-semibold">
                          {formatRankWithStars(form.currentRank, currentStar, currentDivisionStar, currentMythicStars)} ~ {formatRankWithStars(form.targetRank, targetStar, 0, targetMythicStars)}
                        </p>
                        <p className="text-text-muted text-xs">
                          {autoCalcResult.totalStars}★
                        </p>
                        <p className="text-yellow-400 font-bold text-lg">
                          {formatRupiah(selectedPackage.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gendong (Duo Boost) Summary */}
                {orderMode === "gendong" && selectedGendongRank && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-2 uppercase tracking-wider">
                      Duo Boost &mdash; Tier & Jumlah {selectedGendongRank.id === "grading" ? "Match" : "Bintang"}
                    </p>
                    <div className="flex items-center gap-3">
                      <Image
                        src={selectedGendongRank.icon}
                        alt={selectedGendongRank.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain flex-shrink-0 drop-shadow-lg"
                      />
                      <div className="flex-1">
                        <p className="text-text font-semibold">
                          {selectedGendongRank.name}
                        </p>
                        <p className="text-text-muted text-xs">
                          {gendongQuantity} {selectedGendongRank.id === "grading" ? "Match" : "Bintang"} × {formatRupiah(selectedGendongRank.price)}/{selectedGendongRank.id === "grading" ? "match" : "star"}
                        </p>
                        <p className="text-yellow-400 font-bold text-lg">
                          {formatRupiah(selectedGendongRank.price * gendongQuantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div className="bg-background rounded-xl p-4 overflow-hidden">
                  <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                    {orderMode === "gendong" ? "Data Akun & Jadwal Mabar" : "Data Akun"}
                  </p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                    <span className="text-text-muted">Nickname</span>
                    <span className="text-text font-medium break-all">{form.nickname || "-"}</span>
                    <span className="text-text-muted">User ID</span>
                    <span className="text-text font-medium">
                      {form.userId || "-"}{form.serverId ? ` (${form.serverId})` : ""}
                      {accountCheckResult?.verified && <Check className="w-3.5 h-3.5 text-green-400 inline ml-1" />}
                    </span>
                    {orderMode !== "gendong" && (
                    <>
                    <span className="text-text-muted">Login Via</span>
                    <span className="text-text font-medium">
                      {LOGIN_METHODS.find(m => m.id === form.loginMethod)?.name || form.loginMethod}
                    </span>
                    </>
                    )}
                    {orderMode === "gendong" && (
                    <>
                    <span className="text-text-muted">Role</span>
                    <span className="text-text font-medium">
                      {ML_ROLE_ICONS[form.preferredRole]} {gendongRoles.find(r => r.id === form.preferredRole)?.name || "-"}
                    </span>
                    <span className="text-text-muted">Jadwal</span>
                    <span className="text-text font-medium break-all">{scheduleOptions.find(s => s.id === form.playSchedule)?.label || form.playSchedule || "-"}</span>
                    </>
                    )}
                    {form.heroRequest && (
                      <>
                        <span className="text-text-muted">Hero Request</span>
                        <span className="text-text font-medium break-all">{form.heroRequest}</span>
                      </>
                    )}
                    {form.notes && (
                      <>
                        <span className="text-text-muted">Catatan</span>
                        <span className="text-text font-medium break-all">{form.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Add-ons */}
                {(form.isExpress || form.isPremium) && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                      Opsi Tambahan
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {form.isExpress && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Express (+20%)
                        </span>
                      )}
                      {form.isPremium && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" /> Premium (+30%)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="bg-background rounded-xl p-4 overflow-hidden">
                  <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                    Kontak
                  </p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                    <span className="text-text-muted">WhatsApp</span>
                    <span className="text-text font-medium truncate">+62{form.whatsapp}</span>
                    <span className="text-text-muted">Email</span>
                    <span className="text-text font-medium break-all">{form.email || "-"}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                {(selectedPackage || (orderMode === "gendong" && selectedGendongRank)) && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                      Rincian Harga
                    </p>
                    <div className="space-y-2 text-sm">
                      {orderMode === "gendong" && selectedGendongRank ? (
                        <div className="flex justify-between text-text-muted">
                          <span>Duo Boost {selectedGendongRank.name} × {gendongQuantity} Bintang</span>
                          <span>{formatRupiah(selectedGendongRank.price * gendongQuantity)}</span>
                        </div>
                      ) : selectedPackage ? (
                        <>
                        <div className="flex justify-between text-text-muted">
                          <span>{orderMode === "perstar"
                            ? `${formatRankWithStars(form.currentRank, currentStar, currentDivisionStar, currentMythicStars)} ~ ${formatRankWithStars(form.targetRank, targetStar, 0, targetMythicStars)}`
                            : "Harga Dasar"}</span>
                          <span>{formatRupiah(selectedPackage.price)}</span>
                        </div>
                        {orderMode === "perstar" && perStarTouched && form.currentRank !== "" && form.targetRank !== "" && (() => {
                          const segments = calculateStarBreakdown(form.currentRank, currentStar, form.targetRank, targetStar, currentDivisionStar, perStarRanks, currentMythicStars, targetMythicStars);
                          if (segments.length <= 1) return null;
                          return (
                            <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                              {segments.map((seg, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] text-text-muted pl-2">
                                  <span className="flex items-center gap-1.5">
                                    <Image src={rankIcons[seg.tierId] || "/icons-tier/Mythic.webp"} alt={seg.tierLabel} width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                                    {seg.tierLabel}: {seg.stars}★ × {formatRupiah(seg.pricePerStar)}
                                  </span>
                                  <span className="font-medium">{formatRupiah(seg.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        </>
                      ) : null}
                      {seasonMultiplier !== 1 && (
                        <div className={`flex justify-between ${seasonMultiplier > 1 ? "text-yellow-400" : "text-green-400"}`}>
                          <span>{seasonLabel || "Season Pricing"} ({seasonMultiplier > 1 ? `+${Math.round((seasonMultiplier - 1) * 100)}%` : `-${Math.round((1 - seasonMultiplier) * 100)}%`})</span>
                          <span>{seasonMultiplier > 1 ? "+" : "-"}{formatRupiah(Math.abs(Math.round(rawItemPrice * (seasonMultiplier - 1))))}</span>
                        </div>
                      )}
                      {form.isExpress && (
                        <div className="flex justify-between text-text-muted">
                          <span>Express (+20%)</span>
                          <span>
                            +{formatRupiah(Math.round(seasonAdjustedPrice * 0.2))}
                          </span>
                        </div>
                      )}
                      {form.isPremium && (
                        <div className="flex justify-between text-text-muted">
                          <span>Premium (+30%)</span>
                          <span>
                            +{formatRupiah(
                              Math.round(seasonAdjustedPrice * (form.isExpress ? 1.2 : 1) * 0.3)
                            )}
                          </span>
                        </div>
                      )}
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Diskon Promo</span>
                          <span>-{formatRupiah(promoDiscount)}</span>
                        </div>
                      )}
                      {tierDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Diskon Member ({customerTier === "platinum" ? "8%" : customerTier === "gold" ? "5%" : "3%"})</span>
                          <span>-{formatRupiah(tierDiscountAmount)}</span>
                        </div>
                      )}
                      <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-text">
                        <span className="text-lg">Total Bayar</span>
                        <span className="gradient-text text-xl">
                          {formatRupiah(finalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="bg-background rounded-xl p-4">
                  <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                    Metode Pembayaran
                  </p>

                  {/* Primary: DompetX Auto-Payment (default & recommended) */}
                  {dompetxEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("dompetx")}
                      className={`relative w-full p-4 rounded-xl border-2 text-left transition-all mb-3 ${
                        paymentMethod === "dompetx"
                          ? "border-green-500 bg-green-500/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      {paymentMethod === "dompetx" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="absolute top-3 right-10 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> REKOMENDASI
                      </span>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-text font-bold text-sm">Bayar Otomatis (DompetX)</p>
                          <p className="text-text-muted text-xs mt-0.5">
                            QRIS • Virtual Account • Bank Transfer — Instan & Otomatis
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-white/5 text-text-muted px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Auto-confirmed</span>
                        <span className="bg-white/5 text-text-muted px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" />Aman</span>
                        <span className="bg-white/5 text-text-muted px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"><Smartphone className="w-2.5 h-2.5" />QRIS Support</span>
                      </div>
                    </button>
                  )}

                  {/* Collapsible: Manual Transfer (secondary option) */}
                  <button
                    type="button"
                    onClick={() => setShowManualTransfer(!showManualTransfer)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted text-xs font-medium transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      {dompetxEnabled ? "Pembayaran Lainnya (Transfer Manual)" : "Pilih Metode Pembayaran"}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showManualTransfer ? "rotate-180" : ""}`} />
                  </button>

                  {showManualTransfer && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("manual_transfer")}
                        className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "manual_transfer"
                            ? "border-accent bg-accent/10"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        {paymentMethod === "manual_transfer" && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <CreditCard className="w-5 h-5 text-yellow-400 mb-2" />
                        <p className="text-text font-semibold text-sm">Transfer Manual</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          Bank (BCA, BRI, BNI, Mandiri, Jago), E-Wallet, QRIS — Konfirmasi manual
                        </p>
                      </button>
                    </div>
                  )}

                  {!dompetxEnabled && !showManualTransfer && (
                    <p className="text-text-muted text-xs mt-2 text-center">
                      Klik tombol di atas untuk memilih metode pembayaran
                    </p>
                  )}
                </div>

                {/* Terms acceptance */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 accent-accent cursor-pointer"
                  />
                  <span className="text-xs text-text-muted">
                    {locale === "id"
                      ? <>Saya menyetujui <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">syarat &amp; ketentuan</Link> layanan ETNYX.</>
                      : <>I agree to the <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">terms &amp; conditions</Link> of ETNYX services.</>}
                  </span>
                </label>

                {/* Trust */}
                <div className="flex items-start gap-2 bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3">
                  <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-text-muted">
                    Data akun dienkripsi dan hanya digunakan untuk proses joki.
                    Kami sarankan ganti password setelah order selesai.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        </div>
        {/* ===== NAVIGATION BUTTONS ===== */}
        <div className="flex items-center justify-between mt-6 gap-4">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-text-muted hover:text-text hover:border-white/20 transition-colors font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.back}
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={!canProceedStep(currentStep)}
              className="flex items-center gap-2 px-6 py-3 gradient-primary rounded-xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {t.next}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitOrder}
              disabled={!canSubmit || isSubmitting}
              className="flex items-center gap-2 px-8 py-3.5 gradient-primary rounded-xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.processing}
                </>
              ) : (
                <>
                  {t.payNow}
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <TermsPopup />
      <OrderPageContent />
    </Suspense>
  );
}
