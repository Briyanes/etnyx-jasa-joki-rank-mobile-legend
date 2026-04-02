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
} from "lucide-react";

type LoginMethod = "userid" | "moonton";

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
      { id: "rush5-honor", title: "Rush 5 Star Honor", price: 105000, originalPrice: 115000, discountPercent: 9, rankKey: "mythicglory", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "rush5-glory", title: "Rush 5 Star Glory", price: 130000, originalPrice: 137000, discountPercent: 5, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
      { id: "rush9-mythic", title: "Rush 9 Star Mythic + Bonus 1", price: 171000, originalPrice: 211000, discountPercent: 19, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "rush9-honor", title: "Rush 9 Star Honor + Bonus 1", price: 189000, originalPrice: 230000, discountPercent: 18, rankKey: "mythicglory", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "rush9-glory", title: "Rush 9 Star Glory + Bonus 1", price: 234000, originalPrice: 275000, discountPercent: 15, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
    ],
  },
  {
    id: "per-star",
    title: "Joki Rank / Star",
    packages: [
      { id: "star-master", title: "Master / Star", price: 3999, rankKey: "master", currentRank: "master", targetRank: "master" },
      { id: "star-gm", title: "GM / Star", price: 4999, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "grandmaster" },
      { id: "star-epic", title: "Epic / Star", price: 7089, rankKey: "epic", currentRank: "epic", targetRank: "epic" },
      { id: "star-legend", title: "Legend / Star", price: 8089, rankKey: "legend", currentRank: "legend", targetRank: "legend" },
      { id: "star-mythic", title: "Mythic / Star", price: 21089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "star-honor", title: "Mythic Honor / Star", price: 23089, rankKey: "mythicglory", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "star-glory", title: "Mythic Glory / Star", price: 27589, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
      { id: "star-immortal", title: "Mythic Immortal / Star", price: 30089, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
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
      { id: "legend5-honor", title: "Legend V - Mythic Honor", price: 620089, rankKey: "legend", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend5-glory", title: "Legend V - Mythic Glory", price: 1195089, rankKey: "legend", currentRank: "legend", targetRank: "mythicglory" },
      { id: "legend5-immortal", title: "Legend V - Mythic Immortal", price: 2570089, rankKey: "legend", currentRank: "legend", targetRank: "mythicglory" },
    ],
  },
  {
    id: "paket-mythic",
    title: "Paket Mythic",
    packages: [
      { id: "mythic-grading", title: "Open Grading (Auto Star 15)", price: 210089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "mythic-honor", title: "Mythic Grading - Mythic Honor (25)", price: 420089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "mythic-glory", title: "Mythic Grading - Mythic Glory (50)", price: 995089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "mythic-immortal", title: "Mythic Grading - Mythic Immortal (100)", price: 2370089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythicglory" },
    ],
  },
  {
    id: "paket-honor",
    title: "Paket Mythic Honor",
    packages: [
      { id: "honor-glory", title: "Mythic Honor (25) - Mythic Glory (50)", price: 575089, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
      { id: "honor-immortal", title: "Mythic Honor (25) - Mythic Immortal (100)", price: 1950089, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
    ],
  },
  {
    id: "paket-glory",
    title: "Paket Mythic Glory",
    packages: [
      { id: "glory-immortal", title: "Mythic Glory (50) - Mythic Immortal (100)", price: 1375089, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
    ],
  },
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
  mythicglory: "/icons-tier/Mythical_Glory.webp",
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

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const isValidEmail = (email: string) =>
    !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const STEPS = [
    { num: 1, title: "Pilih Paket" },
    { num: 2, title: "Data Akun" },
    { num: 3, title: "Opsi & Promo" },
    { num: 4, title: "Kontak & Bayar" },
    { num: 5, title: "Konfirmasi" },
  ];

  const [form, setForm] = useState<OrderForm>({
    loginMethod: "userid",
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

  // Fetch pricing catalog from CMS
  useEffect(() => {
    fetch("/api/settings?keys=pricing_catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing_catalog && Array.isArray(data.pricing_catalog) && data.pricing_catalog.length > 0) {
          setCatalog(data.pricing_catalog);
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

  const basePrice = selectedPackage
    ? (() => {
        let price = selectedPackage.price;
        if (form.isExpress) price *= 1.2;
        if (form.isPremium) price *= 1.3;
        return Math.round(price);
      })()
    : 0;
  const finalPrice = Math.max(0, basePrice - promoDiscount);

  const updateForm = useCallback((updates: Partial<OrderForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

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
          return !!selectedPackage;
        case 2:
          return !!(
            form.nickname &&
            form.accountLogin &&
            form.accountPassword &&
            (form.loginMethod !== "userid" || form.userId)
          );
        case 3:
          return true; // optional step
        case 4:
          return !!(
            form.whatsapp &&
            form.whatsapp.length >= 10 &&
            isValidEmail(form.email)
          );
        default:
          return true;
      }
    },
    [selectedPackage, form]
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
      setSlideDirection("right");
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, canProceedStep]);

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
    form.nickname &&
    form.accountLogin &&
    form.accountPassword &&
    (form.loginMethod !== "userid" || form.userId) &&
    form.whatsapp &&
    form.whatsapp.length >= 10 &&
    isValidEmail(form.email);

  const handleSubmitOrder = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customer/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentRank: form.currentRank,
          targetRank: form.targetRank,
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
            Order Berhasil Dibuat! 🎉
          </h1>
          <p className="text-text-muted mb-6">
            Order kamu sudah masuk. Silakan lakukan pembayaran untuk memulai
            proses joki.
          </p>
          <div className="bg-background rounded-xl p-4 mb-6">
            <p className="text-text-muted text-sm">Order ID</p>
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
                Bayar Sekarang
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
              Kembali ke Home
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
                <Shield className="w-3.5 h-3.5 text-success" /> Aman
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Cepat
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
              <h2 className="font-bold text-text">Pilih Paket Joki</h2>
            </div>
            <div className="p-5">
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
              <h2 className="font-bold text-text">Masukkan Data Akun</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2 font-medium">
                  Login Via
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateForm({ loginMethod: "userid" })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.loginMethod === "userid"
                        ? "gradient-primary text-white"
                        : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-1.5" />
                    User ID & Nickname
                  </button>
                  <button
                    onClick={() => updateForm({ loginMethod: "moonton" })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.loginMethod === "moonton"
                        ? "gradient-primary text-white"
                        : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4 inline mr-1.5" />
                    Email / Moonton ID
                  </button>
                </div>
              </div>

              {form.loginMethod === "userid" && (
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    User ID Game
                  </label>
                  <input
                    type="text"
                    value={form.userId}
                    onChange={(e) => updateForm({ userId: e.target.value })}
                    onBlur={() => markTouched("userId")}
                    placeholder="Contoh: 123456789"
                    className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                      touched.userId && !form.userId ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {touched.userId && !form.userId && (
                    <p className="text-red-400 text-xs mt-1">User ID wajib diisi</p>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    Nickname / IGN <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={(e) => updateForm({ nickname: e.target.value })}
                    onBlur={() => markTouched("nickname")}
                    placeholder="Nickname dalam game"
                    className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                      touched.nickname && !form.nickname ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {touched.nickname && !form.nickname && (
                    <p className="text-red-400 text-xs mt-1">Nickname wajib diisi</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    {form.loginMethod === "moonton"
                      ? "Email / Moonton ID"
                      : "Email / No. HP"}{" "}
                    <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.accountLogin}
                    onChange={(e) =>
                      updateForm({ accountLogin: e.target.value })
                    }
                    onBlur={() => markTouched("accountLogin")}
                    placeholder={
                      form.loginMethod === "moonton"
                        ? "Email atau Moonton ID"
                        : "Email atau No HP terdaftar"
                    }
                    className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                      touched.accountLogin && !form.accountLogin ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {touched.accountLogin && !form.accountLogin && (
                    <p className="text-red-400 text-xs mt-1">Login wajib diisi</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  value={form.accountPassword}
                  onChange={(e) =>
                    updateForm({ accountPassword: e.target.value })
                  }
                  onBlur={() => markTouched("accountPassword")}
                  placeholder="Password akun ML"
                  className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                    touched.accountPassword && !form.accountPassword ? "border-red-500" : "border-white/10"
                  }`}
                />
                {touched.accountPassword && !form.accountPassword && (
                  <p className="text-red-400 text-xs mt-1">Password wajib diisi</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  Request Hero (Min. 3 Hero)
                </label>
                <input
                  type="text"
                  value={form.heroRequest}
                  onChange={(e) =>
                    updateForm({ heroRequest: e.target.value })
                  }
                  placeholder="Contoh: Lancelot, Fanny, Ling"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  Catatan Untuk Penjoki
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder="Catatan khusus (opsional)"
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
                <h2 className="font-bold text-text">Opsi Tambahan</h2>
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
                      <Zap className="w-4 h-4 text-yellow-400" /> Express Mode
                    </span>
                    <p className="text-text-muted text-xs mt-0.5">
                      2x lebih cepat, prioritas booster
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
                      <Crown className="w-4 h-4 text-yellow-400" /> Premium
                      Service
                    </span>
                    <p className="text-text-muted text-xs mt-0.5">
                      Pilih hero bebas, dedicated booster
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
                <h2 className="font-bold text-text">Kode Promo</h2>
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
                      placeholder="Masukkan kode promo/referral"
                      disabled={promoApplied}
                      className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
                    />
                  </div>
                  {promoApplied ? (
                    <button
                      onClick={removePromo}
                      className="px-5 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-medium text-sm"
                    >
                      Hapus
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
                <h2 className="font-bold text-text">Detail Kontak</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    No. WhatsApp <span className="text-error">*</span>
                  </label>
                  <div className="flex">
                    <span className="bg-background border border-white/10 border-r-0 rounded-l-xl px-3 py-2.5 text-text-muted text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> +62
                    </span>
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) =>
                        updateForm({
                          whatsapp: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      onBlur={() => markTouched("whatsapp")}
                      placeholder="8123456789"
                      className={`flex-1 bg-background border rounded-r-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                        touched.whatsapp && (!form.whatsapp || form.whatsapp.length < 10) ? "border-red-500" : "border-white/10"
                      }`}
                    />
                  </div>
                  {touched.whatsapp && (!form.whatsapp || form.whatsapp.length < 10) && (
                    <p className="text-red-400 text-xs mt-1">Nomor WhatsApp minimal 10 digit</p>
                  )}
                  <p className="text-text-muted text-xs mt-1.5">
                    Nomor ini akan dihubungi jika terjadi masalah
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    Email (opsional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    onBlur={() => markTouched("email")}
                    placeholder="email@example.com"
                    className={`w-full bg-background border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none transition-colors ${
                      touched.email && form.email && !isValidEmail(form.email) ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {touched.email && form.email && !isValidEmail(form.email) && (
                    <p className="text-red-400 text-xs mt-1">Format email tidak valid</p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <CreditCard className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-text">Metode Pembayaran</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 bg-background px-4 py-3.5 rounded-xl border-2 border-accent/50">
                  <CreditCard className="w-5 h-5 text-accent" />
                  <div className="flex-1">
                    <p className="text-text font-medium text-sm">
                      Midtrans Payment Gateway
                    </p>
                    <p className="text-text-muted text-xs">
                      QRIS, Bank Transfer, E-wallet, Kartu Kredit
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
                <h2 className="font-bold text-text">Konfirmasi Order</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Package Summary */}
                {selectedPackage && (
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
                        <p className="text-yellow-400 font-bold text-lg">
                          {formatRupiah(selectedPackage.price)}
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
                    <span className="text-text-muted">Login Via</span>
                    <span className="text-text font-medium">
                      {form.loginMethod === "moonton" ? "Moonton" : "User ID"}
                    </span>
                    {form.heroRequest && (
                      <>
                        <span className="text-text-muted">Hero Request</span>
                        <span className="text-text font-medium">{form.heroRequest}</span>
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
                    {form.email && (
                      <>
                        <span className="text-text-muted">Email</span>
                        <span className="text-text font-medium">{form.email}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                {selectedPackage && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-3 uppercase tracking-wider">
                      Rincian Harga
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-text-muted">
                        <span>Harga Dasar</span>
                        <span>{formatRupiah(selectedPackage.price)}</span>
                      </div>
                      {form.isExpress && (
                        <div className="flex justify-between text-text-muted">
                          <span>Express (+20%)</span>
                          <span>
                            +{formatRupiah(Math.round(selectedPackage.price * 0.2))}
                          </span>
                        </div>
                      )}
                      {form.isPremium && (
                        <div className="flex justify-between text-text-muted">
                          <span>Premium (+30%)</span>
                          <span>
                            +{formatRupiah(
                              Math.round(
                                selectedPackage.price *
                                  (form.isExpress ? 1.2 : 1) *
                                  0.3
                              )
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
              Kembali
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
              Lanjutkan
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
                  Memproses...
                </>
              ) : (
                <>
                  Pesan Sekarang!
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
