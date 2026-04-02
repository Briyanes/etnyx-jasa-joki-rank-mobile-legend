"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RankTier } from "@/types";
import {
  formatRupiah,
} from "@/utils/helpers";
import Footer from "@/components/layout/Footer";
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
  User,
  Gamepad2,
  Star,
  Package,
  Minus,
  Plus,
} from "lucide-react";
import { FaFacebook, FaGoogle, FaTiktok, FaVk, FaApple, FaGamepad } from "react-icons/fa";
import type { IconType } from "react-icons";

type LoginMethod = "moonton" | "facebook" | "google" | "tiktok" | "vk" | "apple";

interface OrderForm {
  loginMethod: LoginMethod;
  userId: string;
  nickname: string;
  accountLogin: string;
  accountPassword: string;
  heroRequest: string;
  notes: string;
  currentRank: RankTier;
  targetRank: RankTier;
  isExpress: boolean;
  isPremium: boolean;
  promoCode: string;
  whatsapp: string;
  email: string;
}

// Login method options with brand icons
const LOGIN_METHODS: { id: LoginMethod; name: string; Icon: IconType; color: string }[] = [
  { id: "moonton", name: "Moonton", Icon: FaGamepad, color: "#FF6B35" },
  { id: "facebook", name: "Facebook", Icon: FaFacebook, color: "#1877F2" },
  { id: "google", name: "Google", Icon: FaGoogle, color: "#EA4335" },
  { id: "tiktok", name: "TikTok", Icon: FaTiktok, color: "#000000" },
  { id: "vk", name: "VK", Icon: FaVk, color: "#4A76A8" },
  { id: "apple", name: "Apple ID", Icon: FaApple, color: "#A2AAAD" },
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
}

interface PackageCategory {
  id: string;
  title: string;
  packages: ProductPackage[];
}

const DEFAULT_CATALOG: PackageCategory[] = [
  {
    id: "promo",
    title: "Post-Holiday Catch Up",
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
    id: "paket-gm",
    title: "Paket Grand Master",
    packages: [
      { id: "gm5-epic5", title: "GM V - Epic V", price: 125000, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "epic" },
      { id: "gm5-legend5", title: "GM V - Legend V", price: 312589, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "legend" },
      { id: "gm1-mythic", title: "GM I - Mythic", price: 425089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm2-mythic", title: "GM II - Mythic", price: 450089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm3-mythic", title: "GM III - Mythic", price: 475089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm4-mythic", title: "GM IV - Mythic", price: 500089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
      { id: "gm5-mythic", title: "GM V - Mythic", price: 525089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
    ],
  },
  {
    id: "paket-epic",
    title: "Paket Epic",
    packages: [
      { id: "epic5-legend5", title: "Epic V - Legend V", price: 175089, rankKey: "epic", currentRank: "epic", targetRank: "legend" },
      { id: "epic1-mythic", title: "Epic I - Mythic", price: 235089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic2-mythic", title: "Epic II - Mythic", price: 270089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic3-mythic", title: "Epic III - Mythic", price: 305089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic4-mythic", title: "Epic IV - Mythic", price: 340089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
      { id: "epic5-mythic", title: "Epic V - Mythic", price: 375089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
    ],
  },
  {
    id: "paket-legend",
    title: "Paket Legend",
    packages: [
      { id: "legend5-mythic", title: "Legend V - Mythic", price: 200089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
      { id: "legend5-honor", title: "Legend V - Mythic Honor", price: 620089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
      { id: "legend5-glory", title: "Legend V - Mythic Glory", price: 1195089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend5-immortal", title: "Legend V - Mythic Immortal", price: 2570089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-mythic",
    title: "Paket Mythic",
    packages: [
      { id: "mythic-grading", title: "Open Grading (Auto Star 15)", price: 210089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "mythic-honor", title: "Mythic Grading - Mythic Honor (25)", price: 420089, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
      { id: "mythic-glory", title: "Mythic Grading - Mythic Glory (50)", price: 995089, rankKey: "mythicglory", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "mythic-immortal", title: "Mythic Grading - Mythic Immortal (100)", price: 2370089, rankKey: "mythicimmortal", currentRank: "mythic", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-honor",
    title: "Paket Mythic Honor",
    packages: [
      { id: "honor-glory", title: "Mythic Honor (25) - Mythic Glory (50)", price: 575089, rankKey: "mythicglory", currentRank: "mythichonor", targetRank: "mythicglory" },
      { id: "honor-immortal", title: "Mythic Honor (25) - Mythic Immortal (100)", price: 1950089, rankKey: "mythicimmortal", currentRank: "mythichonor", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-glory",
    title: "Paket Mythic Glory",
    packages: [
      { id: "glory-immortal", title: "Mythic Glory (50) - Mythic Immortal (100)", price: 1375089, rankKey: "mythicimmortal", currentRank: "mythicglory", targetRank: "mythicimmortal" },
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
}

const PER_STAR_RANKS: PerStarRank[] = [
  { id: "grandmaster", name: "Grand Master", price: 5000, originalPrice: 6000, discountPercent: 17, icon: "/icons-tier/Grandmaster.webp" },
  { id: "epic", name: "Epic", price: 7000, originalPrice: 8000, discountPercent: 13, icon: "/icons-tier/Epic.webp" },
  { id: "legend", name: "Legend", price: 8000, originalPrice: 9000, discountPercent: 11, icon: "/icons-tier/Legend.webp" },
  { id: "mythic", name: "Mythic", price: 18000, originalPrice: 20000, discountPercent: 10, icon: "/icons-tier/Mythic.webp" },
  { id: "grading", name: "Mythic Grading", price: 20000, originalPrice: 22000, discountPercent: 9, icon: "/icons-tier/Mythic.webp" },
  { id: "honor", name: "Mythic Honor", price: 21000, originalPrice: 22000, discountPercent: 5, icon: "/icons-tier/Mythical_Honor.webp" },
  { id: "glory", name: "Mythic Glory", price: 26000, originalPrice: 28000, discountPercent: 7, icon: "/icons-tier/Mythical_Glory.webp" },
  { id: "immortal", name: "Mythic Immortal", price: 31000, originalPrice: 33000, discountPercent: 6, icon: "/icons-tier/Mythical_Immortal.webp" },
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
  mythichonor: "/icons-tier/Mythical_Honor.webp",
  mythicglory: "/icons-tier/Mythical_Glory.webp",
  mythicimmortal: "/icons-tier/Mythical_Immortal.webp",
};

// Translations
const translations = {
  id: {
    // Header
    safe: "Aman",
    fast: "Cepat",
    // Steps
    steps: [
      { num: 1, title: "Pilih Paket" },
      { num: 2, title: "Data Akun" },
      { num: 3, title: "Opsi & Promo" },
      { num: 4, title: "Kontak & Bayar" },
      { num: 5, title: "Konfirmasi" },
    ],
    // Step 1
    selectPackage: "Pilih Paket Joki",
    selectPackageDesc: "Pilih paket yang sesuai dengan kebutuhanmu",
    perStar: "/ Star",
    discount: "HEMAT",
    // Order mode
    modePackage: "Joki Paket",
    modePerStar: "Joki Per Bintang",
    selectRank: "Pilih Rank",
    starQuantity: "Jumlah Bintang",
    minStars: "Minimal 3 bintang",
    totalPrice: "Total Harga",
    perStarPrice: "Harga per bintang",
    // Step 2
    accountData: "Data Akun Game",
    loginMethod: "Metode Login",
    selectLoginMethod: "Pilih metode login akun ML kamu",
    labelUserId: "User ID Game",
    placeholderUserId: "Contoh: 123456789(1234)",
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
      { num: 2, title: "Account Data" },
      { num: 3, title: "Options & Promo" },
      { num: 4, title: "Contact & Pay" },
      { num: 5, title: "Confirm" },
    ],
    // Step 1
    selectPackage: "Select Boosting Package",
    selectPackageDesc: "Choose a package that fits your needs",
    perStar: "/ Star",
    discount: "SAVE",
    // Order mode
    modePackage: "Package Boost",
    modePerStar: "Per Star Boost",
    selectRank: "Select Rank",
    starQuantity: "Star Quantity",
    minStars: "Minimum 3 stars",
    totalPrice: "Total Price",
    perStarPrice: "Price per star",
    // Step 2
    accountData: "Game Account Data",
    loginMethod: "Login Method",
    selectLoginMethod: "Select your ML account login method",
    labelUserId: "Game User ID",
    placeholderUserId: "Example: 123456789(1234)",
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
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    paymentUrl?: string;
  } | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<string>("promo");
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Order mode: "paket" or "perstar"
  const [orderMode, setOrderMode] = useState<"paket" | "perstar">("paket");
  const [selectedStarRank, setSelectedStarRank] = useState<PerStarRank | null>(null);
  const [starQuantity, setStarQuantity] = useState(3); // minimum 3 stars

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const isValidEmail = (email: string) =>
    !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const STEPS = t.steps;

  const [form, setForm] = useState<OrderForm>({
    loginMethod: "moonton",
    userId: "",
    nickname: "",
    accountLogin: "",
    accountPassword: "",
    heroRequest: "",
    notes: "",
    currentRank: "epic",
    targetRank: "mythic",
    isExpress: false,
    isPremium: false,
    promoCode: "",
    whatsapp: "",
    email: "",
  });

  // Fetch pricing catalog from CMS, merge rankKey from defaults
  useEffect(() => {
    // Build lookup: package id -> rankKey from DEFAULT_CATALOG
    const defaultRankKeys: Record<string, string> = {};
    for (const cat of DEFAULT_CATALOG) {
      for (const pkg of cat.packages) {
        defaultRankKeys[pkg.id] = pkg.rankKey;
      }
    }

    fetch("/api/settings?keys=pricing_catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing_catalog && Array.isArray(data.pricing_catalog) && data.pricing_catalog.length > 0) {
          // Ensure rankKey is always from DEFAULT_CATALOG (code is source of truth for icons)
          const merged = data.pricing_catalog.map((cat: PackageCategory) => ({
            ...cat,
            packages: cat.packages.map((pkg: ProductPackage) => ({
              ...pkg,
              rankKey: defaultRankKeys[pkg.id] || pkg.rankKey,
            })),
          }));
          setCatalog(merged);
        }
      })
      .catch(() => {/* keep default catalog */});
  }, []);

  // Pre-fill from query params
  useEffect(() => {
    const packageId = searchParams.get("package");
    if (packageId) {
      for (const cat of catalog) {
        const found = cat.packages.find((p) => p.id === packageId);
        if (found) {
          setSelectedPackage(found);
          setActiveCategory(cat.id);
          setForm((prev) => ({
            ...prev,
            currentRank: found.currentRank as RankTier,
            targetRank: found.targetRank as RankTier,
            isExpress: searchParams.get("express") === "1",
            isPremium: searchParams.get("premium") === "1",
          }));
          break;
        }
      }
    } else {
      // Support legacy from/to params from calculator
      const fromRank = searchParams.get("from");
      const toRank = searchParams.get("to");
      if (fromRank && toRank) {
        // Find best matching package
        let bestMatch: { pkg: ProductPackage; cat: PackageCategory } | null = null;
        for (const cat of catalog) {
          for (const pkg of cat.packages) {
            if (pkg.currentRank === fromRank && pkg.targetRank === toRank) {
              // Prefer non-per-star packages
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
            isExpress: searchParams.get("express") === "1",
            isPremium: searchParams.get("premium") === "1",
          }));
        } else {
          // If no exact match, navigate to the relevant category
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
            isExpress: searchParams.get("express") === "1",
            isPremium: searchParams.get("premium") === "1",
          }));
        }
      }
    }
  }, [searchParams, catalog]);

  // Calculate base price based on order mode
  const basePrice = (() => {
    let price = 0;
    if (orderMode === "paket" && selectedPackage) {
      price = selectedPackage.price;
    } else if (orderMode === "perstar" && selectedStarRank) {
      price = selectedStarRank.price * starQuantity;
    }
    if (form.isExpress) price *= 1.2;
    if (form.isPremium) price *= 1.3;
    return Math.round(price);
  })();
  const finalPrice = Math.max(0, basePrice - promoDiscount);

  const updateForm = useCallback((updates: Partial<OrderForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle per-star rank selection
  const handleSelectStarRank = useCallback((rank: PerStarRank) => {
    setSelectedStarRank(rank);
    setStarQuantity(3); // Reset to minimum
  }, []);

  // Proceed from per-star selection
  const handleProceedPerStar = useCallback(() => {
    if (selectedStarRank && starQuantity >= 3) {
      // Create a virtual package for the order flow
      setSelectedPackage({
        id: `perstar-${selectedStarRank.id}-${starQuantity}`,
        title: `${selectedStarRank.name} × ${starQuantity} Star`,
        price: selectedStarRank.price * starQuantity,
        rankKey: selectedStarRank.id,
        currentRank: selectedStarRank.id,
        targetRank: selectedStarRank.id,
      });
      setTimeout(() => {
        setSlideDirection("right");
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 400);
    }
  }, [selectedStarRank, starQuantity]);

  const handleSelectPackage = useCallback(
    (pkg: ProductPackage) => {
      setSelectedPackage(pkg);
      updateForm({
        currentRank: pkg.currentRank as RankTier,
        targetRank: pkg.targetRank as RankTier,
      });
      // Auto-advance to step 2 after 400ms
      setTimeout(() => {
        setSlideDirection("right");
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 400);
    },
    [updateForm]
  );

  const canProceedStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          // For paket mode, need selected package
          // For perstar mode, need selected rank AND quantity >= 3
          if (orderMode === "paket") {
            return !!selectedPackage;
          } else {
            return !!(selectedStarRank && starQuantity >= 3);
          }
        case 2:
          return !!(
            form.userId &&
            form.nickname &&
            form.accountLogin &&
            form.accountPassword
          );
        case 3:
          return true; // optional step
        case 4:
          return !!(
            form.whatsapp &&
            form.whatsapp.length >= 9 &&
            form.whatsapp.startsWith("8") &&
            isValidEmail(form.email)
          );
        default:
          return true;
      }
    },
    [selectedPackage, selectedStarRank, starQuantity, orderMode, form]
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
    if (canProceedStep(currentStep) && currentStep < 5) {
      // For per-star mode on step 1, create virtual package first
      if (currentStep === 1 && orderMode === "perstar" && selectedStarRank) {
        setSelectedPackage({
          id: `perstar-${selectedStarRank.id}-${starQuantity}`,
          title: `${selectedStarRank.name} × ${starQuantity} Star`,
          price: selectedStarRank.price * starQuantity,
          rankKey: selectedStarRank.id,
          currentRank: selectedStarRank.id,
          targetRank: selectedStarRank.id,
        });
      }
      setSlideDirection("right");
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, canProceedStep, orderMode, selectedStarRank, starQuantity]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setSlideDirection("left");
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        body: JSON.stringify({ code: form.promoCode }),
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
  }, [form.promoCode, basePrice]);

  const removePromo = useCallback(() => {
    updateForm({ promoCode: "" });
    setPromoDiscount(0);
    setPromoApplied(false);
    setPromoMessage("");
  }, [updateForm]);

  const canSubmit =
    selectedPackage &&
    form.userId &&
    form.nickname &&
    form.accountLogin &&
    form.accountPassword &&
    form.whatsapp &&
    form.whatsapp.length >= 9 &&
    form.whatsapp.startsWith("8") &&
    isValidEmail(form.email);

  const handleSubmitOrder = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customer/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentRank: selectedPackage?.currentRank || form.currentRank,
          targetRank: selectedPackage?.targetRank || form.targetRank,
          packageTitle: selectedPackage?.title,
          loginMethod: form.loginMethod,
          userId: form.userId,
          nickname: form.nickname,
          accountLogin: form.accountLogin,
          accountPassword: form.accountPassword,
          heroRequest: form.heroRequest,
          notes: form.notes,
          isExpress: form.isExpress,
          isPremium: form.isPremium,
          promoCode: promoApplied ? form.promoCode : undefined,
          promoDiscount,
          whatsapp: form.whatsapp,
          email: form.email,
          totalPrice: finalPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal membuat order");
        return;
      }

      setOrderResult({
        orderId: data.orderId,
        paymentUrl: data.paymentUrl,
      });
    } catch {
      alert("Terjadi kesalahan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, selectedPackage, canSubmit, promoApplied, promoDiscount, finalPrice]);

  // === SUCCESS PAGE ===
  if (orderResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">
            {t.orderSuccess} 🎉
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
            {orderResult.paymentUrl && (
              <a
                href={orderResult.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {t.continuePayment}
              </a>
            )}
            <Link
              href={`/track?order_id=${orderResult.orderId}`}
              className="block w-full px-6 py-3.5 rounded-xl border border-white/10 text-text font-medium hover:bg-white/5 transition-colors"
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
              <div className="flex gap-2 mb-5 p-1 bg-background rounded-xl">
                <button
                  onClick={() => {
                    setOrderMode("paket");
                    setSelectedStarRank(null);
                    setStarQuantity(3);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    orderMode === "paket"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Package className="w-4 h-4 inline-block mr-2" />
                  {t.modePackage}
                </button>
                <button
                  onClick={() => {
                    setOrderMode("perstar");
                    setSelectedPackage(null);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    orderMode === "perstar"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Star className="w-4 h-4 inline-block mr-2" />
                  {t.modePerStar}
                </button>
              </div>

              {/* PAKET MODE */}
              {orderMode === "paket" && (
                <>
                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {catalog.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeCategory === cat.id
                            ? "gradient-primary text-white shadow-lg"
                            : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                        }`}
                      >
                        {cat.title}
                      </button>
                    ))}
                  </div>

                  {/* Package Cards */}
                  {catalog.filter((cat) => cat.id === activeCategory).map(
                    (cat) => (
                      <div key={cat.id}>
                        <h3 className="text-text font-bold text-base mb-4">
                          {cat.title}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {cat.packages.map((pkg) => {
                            const isSelected = selectedPackage?.id === pkg.id;
                            return (
                              <button
                                key={pkg.id}
                                onClick={() => handleSelectPackage(pkg)}
                                className={`relative text-left rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] overflow-hidden flex flex-col ${
                                  isSelected
                                    ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
                                    : "border-white/5 hover:border-white/15"
                                }`}
                              >
                                <div className="p-4 bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex-1">
                                  <p className="text-white text-sm font-semibold mb-2">
                                    {pkg.title}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <Image
                                      src={rankIcons[pkg.rankKey]}
                                      alt={pkg.rankKey}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 object-contain flex-shrink-0 drop-shadow-lg"
                                    />
                                    <div>
                                      <p className="text-yellow-400 font-bold text-lg leading-tight">
                                        {formatRupiah(pkg.price)}
                                      </p>
                                      {pkg.originalPrice && (
                                        <p className="text-red-400/70 text-xs line-through">
                                          {formatRupiah(pkg.originalPrice)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="px-4 py-2.5 bg-slate-800/60 flex items-center justify-end gap-2">
                                  {pkg.discountPercent && (
                                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                      Disc {pkg.discountPercent}%
                                    </span>
                                  )}
                                  <span className="bg-teal-600/30 text-teal-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5" />
                                    Pengiriman INSTAN
                                  </span>
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
                    )
                  )}

                  {/* Selected summary */}
                  {selectedPackage && (
                    <div className="mt-5 p-4 bg-background rounded-xl border border-accent/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image
                          src={rankIcons[selectedPackage.rankKey]}
                          alt={selectedPackage.rankKey}
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain drop-shadow-lg"
                        />
                        <div>
                          <p className="text-text font-semibold text-sm">
                            {selectedPackage.title}
                          </p>
                          <p className="text-yellow-400 font-bold">
                            {formatRupiah(selectedPackage.price)}
                          </p>
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                  )}
                </>
              )}

              {/* PER STAR MODE */}
              {orderMode === "perstar" && (
                <>
                  {/* Rank Selection Grid */}
                  <div className="mb-5">
                    <h3 className="text-text font-bold text-base mb-4">{t.selectRank}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {PER_STAR_RANKS.map((rank) => {
                        const isSelected = selectedStarRank?.id === rank.id;
                        return (
                          <button
                            key={rank.id}
                            onClick={() => setSelectedStarRank(rank)}
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
                                    <span className="text-text-muted text-xs font-normal ml-1">{t.perStar}</span>
                                  </p>
                                  {rank.originalPrice && (
                                    <p className="text-red-400/70 text-xs line-through">
                                      {formatRupiah(rank.originalPrice)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="px-4 py-2.5 bg-slate-800/60 flex items-center justify-end gap-2">
                              {rank.discountPercent && (
                                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Disc {rank.discountPercent}%
                                </span>
                              )}
                              <span className="bg-teal-600/30 text-teal-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" />
                                Pengiriman INSTAN
                              </span>
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
                  {selectedStarRank && (
                    <div className="p-4 bg-background rounded-xl border border-accent/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={selectedStarRank.icon}
                            alt={selectedStarRank.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-contain drop-shadow-lg"
                          />
                          <div>
                            <p className="text-text font-semibold">{selectedStarRank.name}</p>
                            <p className="text-text-muted text-sm">
                              {formatRupiah(selectedStarRank.price)} {t.perStar}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-text-muted text-xs mb-1">{t.starQuantity}</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setStarQuantity(q => Math.max(3, q - 1))}
                                disabled={starQuantity <= 3}
                                className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={starQuantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 3;
                                  setStarQuantity(Math.max(3, Math.min(100, val)));
                                }}
                                min={3}
                                max={100}
                                className="w-16 h-8 text-center bg-slate-800 text-white rounded-lg border border-white/10 focus:outline-none focus:border-accent"
                              />
                              <button
                                onClick={() => setStarQuantity(q => Math.min(100, q + 1))}
                                disabled={starQuantity >= 100}
                                className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-text-muted text-[10px] mt-1">{t.minStars}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-text-muted text-xs">{t.totalPrice}</p>
                            <p className="text-yellow-400 font-bold text-xl">
                              {formatRupiah(selectedStarRank.price * starQuantity)}
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
              <h2 className="font-bold text-text">{t.accountData}</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Login Method Dropdown */}
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

              {/* User ID Game */}
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  {t.labelUserId} <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => updateForm({ userId: e.target.value })}
                  onBlur={() => markTouched("userId")}
                  placeholder={t.placeholderUserId}
                  className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                    touched.userId && !form.userId ? "border-red-500" : "border-white/10"
                  }`}
                />
                {touched.userId && !form.userId && (
                  <p className="text-red-400 text-xs mt-1">{t.required}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Nickname */}
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    {t.labelNickname} <span className="text-error">*</span>
                  </label>
                  <input
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
                {/* Email / No HP */}
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    {t.labelAccountLogin} <span className="text-error">*</span>
                  </label>
                  <input
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
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  {t.labelPassword} <span className="text-error">*</span>
                </label>
                <input
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

              {/* Hero Request */}
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  {t.labelHero}
                </label>
                <input
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
                <label className="block text-sm text-text-muted mb-1.5">
                  {t.labelNotes}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder={t.placeholderNotes}
                  rows={2}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </section>
        )}

        {/* ===== STEP 3: OPSI & PROMO ===== */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  3
                </span>
                <h2 className="font-bold text-text">{t.addons}</h2>
              </div>
              <div className="p-5 space-y-3">
                <label className="flex items-center gap-3 bg-background px-4 py-3.5 rounded-xl cursor-pointer hover:bg-background/80 transition-colors border border-white/5 hover:border-white/10">
                  <input
                    type="checkbox"
                    checked={form.isExpress}
                    onChange={(e) =>
                      updateForm({ isExpress: e.target.checked })
                    }
                    className="w-5 h-5 rounded accent-accent cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-text flex items-center gap-2 font-medium text-sm">
                      <Zap className="w-4 h-4 text-yellow-400" /> {t.express}
                    </span>
                    <p className="text-text-muted text-xs mt-0.5">
                      {t.expressDesc}
                    </p>
                  </div>
                  <span className="text-accent font-semibold text-sm">
                    +20%
                  </span>
                </label>

                <label className="flex items-center gap-3 bg-background px-4 py-3.5 rounded-xl cursor-pointer hover:bg-background/80 transition-colors border border-white/5 hover:border-white/10">
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) =>
                      updateForm({ isPremium: e.target.checked })
                    }
                    className="w-5 h-5 rounded accent-accent cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-text flex items-center gap-2 font-medium text-sm">
                      <Crown className="w-4 h-4 text-yellow-400" /> {t.premium}
                    </span>
                    <p className="text-text-muted text-xs mt-0.5">
                      {t.premiumDesc}
                    </p>
                  </div>
                  <span className="text-accent font-semibold text-sm">
                    +30%
                  </span>
                </label>
              </div>
            </section>

            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <Tag className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-text">{t.promoCode}</h2>
              </div>
              <div className="p-5">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={form.promoCode}
                      onChange={(e) =>
                        updateForm({
                          promoCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder={t.promoPlaceholder}
                      disabled={promoApplied}
                      className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
                    />
                  </div>
                  {promoApplied ? (
                    <button
                      onClick={removePromo}
                      className="px-5 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-medium text-sm"
                    >
                      {locale === "id" ? "Hapus" : "Remove"}
                    </button>
                  ) : (
                    <button
                      onClick={applyPromo}
                      disabled={promoLoading || !form.promoCode.trim()}
                      className="px-5 py-2.5 gradient-primary text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 text-sm"
                    >
                      {promoLoading ? "..." : "Gunakan"}
                    </button>
                  )}
                </div>
                {promoMessage && (
                  <p
                    className={`mt-2 text-sm ${
                      promoApplied ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {promoMessage}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ===== STEP 4: KONTAK & PEMBAYARAN ===== */}
        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  4
                </span>
                <h2 className="font-bold text-text">{t.contactPay}</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    {t.labelWhatsapp} <span className="text-error">*</span>
                  </label>
                  <div className="flex">
                    <span className="bg-background border border-white/10 border-r-0 rounded-l-xl px-3 py-2.5 text-text-muted text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> +62
                    </span>
                    <input
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
                        touched.whatsapp && (!form.whatsapp || form.whatsapp.length < 9 || !form.whatsapp.startsWith("8")) ? "border-red-500" : "border-white/10"
                      }`}
                    />
                  </div>
                  {touched.whatsapp && (!form.whatsapp || form.whatsapp.length < 9 || !form.whatsapp.startsWith("8")) && (
                    <p className="text-red-400 text-xs mt-1">
                      {form.whatsapp && !form.whatsapp.startsWith("8") ? "Nomor harus diawali 8 (contoh: 812xxx)" : t.required}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    {t.labelEmail}
                  </label>
                  <input
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

            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <CreditCard className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-text">{locale === "id" ? "Metode Pembayaran" : "Payment Method"}</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 bg-background px-4 py-3.5 rounded-xl border-2 border-accent/50">
                  <CreditCard className="w-5 h-5 text-accent" />
                  <div className="flex-1">
                    <p className="text-text font-medium text-sm">
                      Midtrans Payment Gateway
                    </p>
                    <p className="text-text-muted text-xs">
                      QRIS, Bank Transfer, E-wallet, {locale === "id" ? "Kartu Kredit" : "Credit Card"}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===== STEP 5: KONFIRMASI ===== */}
        {currentStep === 5 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  5
                </span>
                <h2 className="font-bold text-text">{t.confirmOrder}</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Order Type Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    orderMode === "paket" 
                      ? "bg-primary/20 text-primary" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {orderMode === "paket" ? (
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        JOKI PAKET
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" />
                        JOKI PER BINTANG
                      </span>
                    )}
                  </span>
                </div>

                {/* Package Summary - For Paket Mode */}
                {orderMode === "paket" && selectedPackage && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-2 uppercase tracking-wider">
                      Paket Dipilih
                    </p>
                    <div className="flex items-center gap-3">
                      <Image
                        src={rankIcons[selectedPackage.rankKey]}
                        alt={selectedPackage.rankKey}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain flex-shrink-0 drop-shadow-lg"
                      />
                      <div className="flex-1">
                        <p className="text-text font-semibold">
                          {selectedPackage.title}
                        </p>
                        <p className="text-text-muted text-xs">
                          {selectedPackage.currentRank} → {selectedPackage.targetRank}
                        </p>
                        <p className="text-yellow-400 font-bold text-lg">
                          {formatRupiah(selectedPackage.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Per Star Summary - For Per Bintang Mode */}
                {orderMode === "perstar" && selectedStarRank && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-2 uppercase tracking-wider">
                      Tier & Jumlah Bintang
                    </p>
                    <div className="flex items-center gap-3">
                      <Image
                        src={selectedStarRank.icon}
                        alt={selectedStarRank.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain flex-shrink-0 drop-shadow-lg"
                      />
                      <div className="flex-1">
                        <p className="text-text font-semibold">
                          {selectedStarRank.name}
                        </p>
                        <p className="text-text-muted text-xs">
                          {starQuantity} Bintang × {formatRupiah(selectedStarRank.price)}/star
                        </p>
                        <p className="text-yellow-400 font-bold text-lg">
                          {formatRupiah(selectedStarRank.price * starQuantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div className="bg-background rounded-xl p-4">
                  <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                    Data Akun
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-text-muted">Nickname</span>
                    <span className="text-text font-medium">{form.nickname || "-"}</span>
                    <span className="text-text-muted">User ID</span>
                    <span className="text-text font-medium">{form.userId || "-"}</span>
                    <span className="text-text-muted">Login Via</span>
                    <span className="text-text font-medium">
                      {LOGIN_METHODS.find(m => m.id === form.loginMethod)?.name || form.loginMethod}
                    </span>
                    {form.heroRequest && (
                      <>
                        <span className="text-text-muted">Hero Request</span>
                        <span className="text-text font-medium">{form.heroRequest}</span>
                      </>
                    )}
                    {form.notes && (
                      <>
                        <span className="text-text-muted">Catatan</span>
                        <span className="text-text font-medium">{form.notes}</span>
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
                <div className="bg-background rounded-xl p-4">
                  <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                    Kontak
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-text-muted">WhatsApp</span>
                    <span className="text-text font-medium">+62{form.whatsapp}</span>
                    <span className="text-text-muted">Email</span>
                    <span className="text-text font-medium">{form.email || "-"}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                {(selectedPackage || (orderMode === "perstar" && selectedStarRank)) && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                      Rincian Harga
                    </p>
                    <div className="space-y-2 text-sm">
                      {orderMode === "perstar" && selectedStarRank ? (
                        <div className="flex justify-between text-text-muted">
                          <span>{selectedStarRank.name} × {starQuantity} Bintang</span>
                          <span>{formatRupiah(selectedStarRank.price * starQuantity)}</span>
                        </div>
                      ) : selectedPackage ? (
                        <div className="flex justify-between text-text-muted">
                          <span>Harga Dasar</span>
                          <span>{formatRupiah(selectedPackage.price)}</span>
                        </div>
                      ) : null}
                      {form.isExpress && (
                        <div className="flex justify-between text-text-muted">
                          <span>Express (+20%)</span>
                          <span>
                            +{formatRupiah(Math.round(basePrice * 0.2))}
                          </span>
                        </div>
                      )}
                      {form.isPremium && (
                        <div className="flex justify-between text-text-muted">
                          <span>Premium (+30%)</span>
                          <span>
                            +{formatRupiah(
                              Math.round(basePrice * (form.isExpress ? 1.2 : 1) * 0.3)
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
                      <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-text">
                        <span className="text-lg">Total Bayar</span>
                        <span className="gradient-text text-xl">
                          {formatRupiah(finalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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

          {currentStep < 5 ? (
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
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#0D0D1A] via-[#1A1A2E] to-[#0D0D1A] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
      <OrderPageContent />
    </Suspense>
  );
}
