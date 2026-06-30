"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calculator as CalculatorIcon,
  Copy,
  Check,
  MessageCircle,
  Package,
  Star,
  Users,
  ArrowRight,
  ChevronLeft,
  Minus,
  Plus,
  Zap,
  Shield,
  Crown,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Trophy,
  CreditCard,
  MapPin,
  Target,
} from "lucide-react";
import {
  RANK_LIST,
  RANK_ORDER,
  RANKS_WITH_STARS,
  RANK_DIVISION_CONFIG,
  MYTHIC_STAR_CONFIG,
  rankIcons,
  getDivisionOptions,
  getRankDivisionOptions,
  calculateTotalStars,
  calculateExtraMythicCost,
  MYTHIC_PER_STAR_PRICES,
  formatRupiah,
  DEFAULT_PER_STAR_RANKS,
  DEFAULT_GENDONG_RANKS,
  DEFAULT_CATALOG,
  type PackageCategory,
  type ProductPackage,
  type PerStarRank,
} from "@/lib/pricing-utils";
import { WHATSAPP_NUMBER } from "@/lib/constants";

// ===== Helper functions (cloned from order/page.tsx) =====

function getSafePriceForKey(key: string, perStarPrices: PerStarRank[]): number {
  const entry = perStarPrices.find((r) => r.id === key);
  if (entry?.price && entry.price > 0) return entry.price;
  const defaultEntry = DEFAULT_PER_STAR_RANKS.find((r) => r.id === key);
  if (defaultEntry?.price && defaultEntry.price > 0) return defaultEntry.price;
  const gm = perStarPrices.find((r) => r.id === "grandmaster");
  return gm?.price || 6000;
}

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

function TierIconsBadge({
  currentRank,
  targetRank,
  size = 20,
}: {
  currentRank?: string;
  targetRank?: string;
  size?: number;
}) {
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

// Calculate per-tier star breakdown for Per Star mode
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

// ===== Main Component =====

export default function CalculatorPage() {
  const [mode, setMode] = useState<"paket" | "perstar" | "gendong" | "classic">("paket");

  // Catalog state
  const [catalog, setCatalog] = useState<PackageCategory[]>(DEFAULT_CATALOG);
  const [perStarRanks, setPerStarRanks] = useState<PerStarRank[]>(DEFAULT_PER_STAR_RANKS);
  const [gendongRanks, setGendongRanks] = useState<PerStarRank[]>(DEFAULT_GENDONG_RANKS);

  // Paket/Classic: selected package
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(null);

  // Per Star: rank selections
  const [currentRank, setCurrentRank] = useState("epic");
  const [currentDiv, setCurrentDiv] = useState(5);
  const [currentDivisionStar, setCurrentDivisionStar] = useState(1);
  const [targetRank, setTargetRank] = useState("mythic");
  const [targetDiv, setTargetDiv] = useState(1);
  const [targetDivisionStar, setTargetDivisionStar] = useState(0);
  const [currentMythicStars, setCurrentMythicStars] = useState(0);
  const [targetMythicStars, setTargetMythicStars] = useState(0);

  // Gendong
  const [selectedGendongRankId, setSelectedGendongRankId] = useState("epic");
  const [gendongQty, setGendongQty] = useState(3);

  // Add-ons
  const [isExpress, setIsExpress] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customDiscount, setCustomDiscount] = useState(0);

  // UI
  const [copied, setCopied] = useState(false);

  // ===== Fetch CMS pricing =====
  useEffect(() => {
    const defaultRankKeys: Record<string, string> = {};
    for (const cat of DEFAULT_CATALOG) {
      for (const pkg of cat.packages) {
        defaultRankKeys[pkg.id] = pkg.rankKey;
      }
    }

    fetch("/api/settings?keys=pricing_catalog,perstar_pricing,gendong_pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing_catalog && Array.isArray(data.pricing_catalog) && data.pricing_catalog.length > 0) {
          const merged = data.pricing_catalog.map((cat: PackageCategory) => ({
            ...cat,
            packages: cat.packages.map((pkg: ProductPackage) => ({
              ...pkg,
              rankKey: defaultRankKeys[pkg.id] || pkg.rankKey || pkg.currentRank,
            })),
          }));
          setCatalog(merged);
        }
        if (data.perstar_pricing && Array.isArray(data.perstar_pricing) && data.perstar_pricing.length > 0) {
          setPerStarRanks((prev) =>
            prev.map((r) => {
              const cms = data.perstar_pricing.find((c: PerStarRank) => c.id === r.id);
              return cms ? { ...r, ...cms } : r;
            })
          );
        }
        if (data.gendong_pricing && Array.isArray(data.gendong_pricing) && data.gendong_pricing.length > 0) {
          setGendongRanks((prev) =>
            prev.map((r) => {
              const cms = data.gendong_pricing.find((c: PerStarRank) => c.id === r.id);
              return cms ? { ...r, ...cms } : r;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  // Set default category
  useEffect(() => {
    if (!activeCategory && catalog.length > 0) {
      setActiveCategory(catalog[0].id);
    }
  }, [catalog, activeCategory]);

  // Reset selection when mode changes
  useEffect(() => {
    setSelectedPackage(null);
  }, [mode]);

  // ===== Visible categories (filter by mode) =====
  const visibleCategories = useMemo(() => {
    if (mode === "classic") {
      return catalog.filter((c) => c.id === "classic-10-win");
    }
    if (mode === "paket") {
      return catalog.filter((c) => c.id !== "classic-10-win");
    }
    return catalog;
  }, [catalog, mode]);

  // Auto-set active category when visible changes
  useEffect(() => {
    if (visibleCategories.length > 0 && !visibleCategories.find((c) => c.id === activeCategory)) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [visibleCategories, activeCategory]);

  const activeCat = visibleCategories.find((c) => c.id === activeCategory) || visibleCategories[0];

  // ===== Per Star: Star breakdown =====
  const starBreakdown = useMemo(() => {
    if (mode !== "perstar") return [];
    return calculateStarBreakdown(
      currentRank,
      currentDiv,
      targetRank,
      targetDiv,
      currentDivisionStar,
      perStarRanks,
      MYTHIC_STAR_CONFIG[currentRank] ? currentMythicStars : 0,
      MYTHIC_STAR_CONFIG[targetRank] ? targetMythicStars : 0
    );
  }, [mode, currentRank, currentDiv, targetRank, targetDiv, currentDivisionStar, currentMythicStars, targetMythicStars, perStarRanks]);

  const totalStars = useMemo(() => {
    if (mode === "perstar") {
      return starBreakdown.reduce((sum, s) => sum + s.stars, 0);
    }
    return 0;
  }, [mode, starBreakdown]);

  const basePricePerStar = useMemo(() => {
    if (mode !== "perstar") return 0;
    return starBreakdown.reduce((sum, s) => sum + s.subtotal, 0);
  }, [mode, starBreakdown]);

  // ===== Calculate final price =====
  const { finalPrice, basePrice } = useMemo(() => {
    let bp = 0;

    if (mode === "paket" || mode === "classic") {
      if (selectedPackage) {
        bp = selectedPackage.price;
        // Extra mythic stars for paket mode
        if (MYTHIC_STAR_CONFIG[targetRank] && targetDivisionStar > 0) {
          bp += calculateExtraMythicCost(targetRank, targetDivisionStar);
        }
      }
    } else if (mode === "perstar") {
      bp = basePricePerStar;
    } else if (mode === "gendong") {
      const rank = gendongRanks.find((r) => r.id === selectedGendongRankId);
      if (rank) {
        bp = rank.isFlat ? rank.price : rank.price * gendongQty;
      }
    }

    let fp = bp;
    if (isExpress) fp *= 1.2;
    if (isPremium) fp *= 1.3;
    if (customDiscount > 0) fp *= 1 - customDiscount / 100;
    fp = Math.round(fp);

    return { finalPrice: fp, basePrice: bp };
  }, [
    mode,
    selectedPackage,
    targetRank,
    targetDivisionStar,
    basePricePerStar,
    selectedGendongRankId,
    gendongQty,
    gendongRanks,
    isExpress,
    isPremium,
    customDiscount,
  ]);

  // ===== Handle package selection (paket/classic) =====
  const handleSelectPackage = useCallback(
    (pkg: ProductPackage) => {
      setSelectedPackage((prev) => (prev?.id === pkg.id ? null : pkg));
      // Auto-set rank from package for per-star calc
      if (pkg.currentRank && pkg.currentRank !== "classic") {
        setCurrentRank(pkg.currentRank);
        if (pkg.targetRank) setTargetRank(pkg.targetRank);
      }
    },
    []
  );

  // ===== Build WhatsApp message =====
  const buildMessage = useCallback(() => {
    const typeLabel =
      mode === "paket"
        ? "Joki Paket"
        : mode === "perstar"
        ? "Joki Per Bintang"
        : mode === "gendong"
        ? "Joki Gendong"
        : "Joki Classic";

    const lines = [
      `Halo Kak ETNYX, saya mau order ${typeLabel}`,
      ``,
      `Detail Order:`,
    ];

    if (mode === "paket" && selectedPackage) {
      lines.push(`Paket: ${selectedPackage.title}`);
      if (selectedPackage.currentRank !== "classic") {
        const curLabel = RANK_LIST.find((r) => r.id === selectedPackage.currentRank)?.label || "";
        const tgtLabel = RANK_LIST.find((r) => r.id === selectedPackage.targetRank)?.label || "";
        lines.push(`Rank: ${curLabel} → ${tgtLabel}`);
      }
    } else if (mode === "classic" && selectedPackage) {
      lines.push(`Paket: ${selectedPackage.title}`);
    } else if (mode === "perstar") {
      const curLabel = `${RANK_LIST.find((r) => r.id === currentRank)?.label || ""}${RANKS_WITH_STARS.includes(currentRank) ? ` ${getDivisionOptions(currentRank).find((d) => d.value === currentDiv)?.label || ""}` : ""}${MYTHIC_STAR_CONFIG[currentRank] ? ` (${currentMythicStars}★)` : ""}`;
      const tgtLabel = `${RANK_LIST.find((r) => r.id === targetRank)?.label || ""}${RANKS_WITH_STARS.includes(targetRank) ? ` ${getDivisionOptions(targetRank).find((d) => d.value === targetDiv)?.label || ""}` : ""}${MYTHIC_STAR_CONFIG[targetRank] ? ` (${targetMythicStars}★)` : ""}`;
      lines.push(`Rank Awal: ${curLabel}`);
      lines.push(`Rank Tujuan: ${tgtLabel}`);
      lines.push(`Total Bintang: ${totalStars}`);
    } else if (mode === "gendong") {
      const rank = gendongRanks.find((r) => r.id === selectedGendongRankId);
      lines.push(`Rank: ${rank?.name || ""}`);
      lines.push(`Jumlah: ${gendongQty} ${rank?.id === "grading" ? "match" : "bintang"}`);
    }

    const addons: string[] = [];
    if (isExpress) addons.push("Express (+20%)");
    if (isPremium) addons.push("Premium Pilot (+30%)");
    if (customDiscount > 0) addons.push(`Diskon ${customDiscount}%`);
    if (addons.length > 0) lines.push(`Add-on: ${addons.join(", ")}`);

    lines.push(``);
    lines.push(`Harga: ${formatRupiah(finalPrice)}`);
    lines.push(``);
    lines.push(`Mohon info lanjutan ya Kak`);

    return lines.join("\n");
  }, [
    mode,
    selectedPackage,
    currentRank,
    currentDiv,
    currentMythicStars,
    targetRank,
    targetDiv,
    targetMythicStars,
    totalStars,
    selectedGendongRankId,
    gendongQty,
    gendongRanks,
    isExpress,
    isPremium,
    customDiscount,
    finalPrice,
  ]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildMessage]);

  const handleWhatsApp = useCallback(() => {
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  }, [buildMessage]);

  const handleReset = useCallback(() => {
    setMode("paket");
    setSelectedPackage(null);
    setCurrentRank("epic");
    setCurrentDiv(5);
    setCurrentDivisionStar(1);
    setTargetRank("mythic");
    setTargetDiv(1);
    setTargetDivisionStar(0);
    setCurrentMythicStars(0);
    setTargetMythicStars(0);
    setSelectedGendongRankId("epic");
    setGendongQty(3);
    setIsExpress(false);
    setIsPremium(false);
    setCustomDiscount(0);
  }, []);

  // Show result?
  const hasResult = useMemo(() => {
    if (mode === "paket" || mode === "classic") return selectedPackage !== null;
    if (mode === "perstar") return totalStars > 0;
    if (mode === "gendong") return gendongQty > 0;
    return false;
  }, [mode, selectedPackage, totalStars, gendongQty]);

  // Label helpers
  const getRankLabel = (rankId: string) => RANK_LIST.find((r) => r.id === rankId)?.label || rankId;
  const getDivLabel = (rankId: string, div: number) =>
    getDivisionOptions(rankId).find((d) => d.value === div)?.label || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <Image src="/logo/circle-landscape.webp" alt="ETNYX" width={100} height={28} className="h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="hidden sm:flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-success" /> Admin Tool
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <CalculatorIcon className="w-3.5 h-3.5 text-accent" /> Calculator
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text flex items-center gap-2 mb-1">
            <CalculatorIcon className="w-7 h-7 text-accent" />
            Kalkulator Joki ML
          </h1>
          <p className="text-text-muted text-sm">
            Hitung harga joki untuk customer via WhatsApp — sync dengan pricing admin dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== LEFT: Selection (clone of order page Step 1) ===== */}
          <div className="lg:col-span-2 space-y-5">
            {/* Mode Switcher */}
            <div className="bg-surface rounded-2xl border border-white/5 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setMode("paket")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "paket" ? "gradient-primary text-white shadow-lg" : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Package className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Paket
                </button>
                <button
                  onClick={() => setMode("perstar")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "perstar" ? "gradient-primary text-white shadow-lg" : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Star className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Per Bintang
                </button>
                <button
                  onClick={() => setMode("gendong")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "gendong" ? "gradient-primary text-white shadow-lg" : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Users className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Gendong
                </button>
                <button
                  onClick={() => setMode("classic")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "classic" ? "gradient-primary text-white shadow-lg" : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Trophy className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Classic
                </button>
              </div>
              <p className="text-text-muted text-xs mt-3 px-1">
                {mode === "paket"
                  ? "Pilih paket rank — booster login ke akunmu dan push rank."
                  : mode === "perstar"
                  ? "Bayar per bintang — fleksibel sesuai kebutuhan."
                  : mode === "gendong"
                  ? "Main bareng booster — tanpa share akun, kamu tetap bermain."
                  : "Joki Classic — joki per match dengan harga tetap."}
              </p>
            </div>

            {/* ===== PAKET & CLASSIC: CATEGORY TABS + CATALOG CARDS ===== */}
            {(mode === "paket" || mode === "classic") && (
              <div className="bg-surface rounded-2xl border border-white/5 p-5">
                {/* Category Tabs */}
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

                {/* Package Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeCat?.packages.map((pkg) => {
                    const isClassic = pkg.currentRank === "classic";
                    const iconCur = isClassic ? parseClassicRank(pkg.title) : pkg.currentRank;
                    const iconTgt = isClassic ? parseClassicRank(pkg.title) : pkg.targetRank;
                    const hasDiscount = pkg.discountPercent != null && pkg.discountPercent > 0;
                    const isRush = pkg.id.startsWith("rush");
                    const bonusMatch = pkg.title.match(/\+?\s*Bonus\s*(\d+)/i);
                    const bonusStars = bonusMatch ? parseInt(bonusMatch[1]) : 0;

                    return (
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
                            {pkg.originalPrice && (
                              <p className="text-red-400/70 text-xs line-through">{formatRupiah(pkg.originalPrice)}</p>
                            )}
                          </div>
                        </div>
                        {/* Tier badge row */}
                        <div className="px-4 py-2 bg-slate-800/60 flex items-center justify-between">
                          {isRush ? (
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
                                    Diskon {pkg.discountPercent}%
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              {hasDiscount && (
                                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Diskon {pkg.discountPercent}%
                                </span>
                              )}
                              <TierIconsBadge currentRank={iconCur} targetRank={iconTgt} />
                            </>
                          )}
                        </div>
                        {selectedPackage?.id === pkg.id && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== PER STAR: DAFTAR HARGA + RANK SELECTOR + BREAKDOWN ===== */}
            {mode === "perstar" && (
              <div className="space-y-5">
                {/* Daftar Harga Grid */}
                <div className="bg-surface rounded-2xl border border-white/5 p-5">
                  <h3 className="text-text font-bold text-sm mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-accent" />
                    Daftar Harga Per Bintang
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {perStarRanks.map((rank) => (
                      <div
                        key={rank.id}
                        className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 bg-background rounded-lg border border-white/5 text-center transition-colors hover:border-white/15"
                      >
                        <Image src={rank.icon} alt={rank.name} width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
                        <span className="text-text text-xs font-medium leading-tight">{rank.name}</span>
                        <span className="text-yellow-400 font-bold text-sm">{formatRupiah(rank.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rank Awal */}
                <div className="bg-surface rounded-2xl border border-white/5 p-5">
                  <label className="block text-sm text-text font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-400" />
                      Rank Awal Customer
                    </span>
                  </label>
                  <div className="relative mb-3">
                    <select
                      value={currentRank}
                      onChange={(e) => {
                        const rankId = e.target.value;
                        setCurrentRank(rankId);
                        const cfg = RANK_DIVISION_CONFIG[rankId];
                        if (cfg) setCurrentDiv(cfg.divisions);
                        const mythicCfg = MYTHIC_STAR_CONFIG[rankId];
                        if (mythicCfg) setCurrentMythicStars(mythicCfg.min);
                        else setCurrentMythicStars(0);
                        setCurrentDivisionStar(1);
                      }}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm font-medium appearance-none cursor-pointer focus:border-accent focus:outline-none pr-10"
                    >
                      {RANK_LIST.map((rank) => (
                        <option key={rank.id} value={rank.id}>
                          {rank.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Image
                        src={rankIcons[currentRank] || "/icons-tier/warrior.webp"}
                        alt="Rank"
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                  </div>

                  {/* Division selector */}
                  {RANKS_WITH_STARS.includes(currentRank) && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-text-muted text-xs whitespace-nowrap font-medium">Divisi:</span>
                      <div className="flex gap-1 flex-wrap">
                        {getDivisionOptions(currentRank).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setCurrentDiv(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentDiv === opt.value
                                ? "bg-yellow-400/20 border-2 border-yellow-400 text-yellow-400"
                                : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Division stars */}
                  {RANKS_WITH_STARS.includes(currentRank) && (() => {
                    const starsPerDiv = RANK_DIVISION_CONFIG[currentRank]?.starsPerDiv ?? 5;
                    return (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-text-muted text-xs whitespace-nowrap">Bintang di divisi:</span>
                        <div className="flex gap-1">
                          {Array.from({ length: starsPerDiv }, (_, i) => i + 1).map((s) => (
                            <button
                              key={s}
                              onClick={() => setCurrentDivisionStar(s)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentDivisionStar === s
                                  ? "bg-yellow-400/20 border-2 border-yellow-400 text-yellow-400"
                                  : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mythic star selector for current rank */}
                  {MYTHIC_STAR_CONFIG[currentRank] && (() => {
                    const cfg = MYTHIC_STAR_CONFIG[currentRank];
                    return (
                      <div className="p-3 bg-yellow-400/5 rounded-xl border border-yellow-400/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-yellow-400 text-xs font-bold">
                            {cfg.label === "Match" ? "Jumlah Match" : "Jumlah Bintang"} Saat Ini
                          </span>
                          <span className="text-text-muted text-[10px]">
                            Range: {cfg.min}–{cfg.max}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCurrentMythicStars(Math.max(cfg.min, currentMythicStars - 1))}
                            className="w-9 h-9 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={cfg.min}
                            max={cfg.max}
                            value={currentMythicStars}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || cfg.min;
                              setCurrentMythicStars(Math.max(cfg.min, Math.min(cfg.max, val)));
                            }}
                            className="w-20 h-9 text-center bg-background text-yellow-400 rounded-lg border border-yellow-400/20 focus:outline-none focus:border-yellow-400 text-sm font-bold"
                          />
                          <button
                            onClick={() => setCurrentMythicStars(Math.min(cfg.max, currentMythicStars + 1))}
                            className="w-9 h-9 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Rank Tujuan */}
                <div className="bg-surface rounded-2xl border border-white/5 p-5">
                  <label className="block text-sm text-text font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-green-400" />
                      Rank Tujuan Customer
                    </span>
                  </label>
                  <div className="relative mb-3">
                    <select
                      value={targetRank}
                      onChange={(e) => {
                        const rankId = e.target.value;
                        setTargetRank(rankId);
                        const cfg = RANK_DIVISION_CONFIG[rankId];
                        if (cfg) setTargetDiv(1);
                        const mythicCfg = MYTHIC_STAR_CONFIG[rankId];
                        if (mythicCfg) setTargetMythicStars(mythicCfg.min);
                        else setTargetMythicStars(0);
                      }}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm font-medium appearance-none cursor-pointer focus:border-accent focus:outline-none pr-10"
                    >
                      {RANK_LIST.filter((r) => {
                        const ci = RANK_ORDER.indexOf(currentRank);
                        const oi = RANK_ORDER.indexOf(r.id);
                        return oi > ci;
                      }).map((rank) => (
                        <option key={rank.id} value={rank.id}>
                          {rank.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Image
                        src={rankIcons[targetRank] || "/icons-tier/warrior.webp"}
                        alt="Rank"
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                  </div>

                  {/* Target division selector */}
                  {RANKS_WITH_STARS.includes(targetRank) && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-text-muted text-xs whitespace-nowrap font-medium">Divisi:</span>
                      <div className="flex gap-1 flex-wrap">
                        {getDivisionOptions(targetRank).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setTargetDiv(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              targetDiv === opt.value
                                ? "bg-green-400/20 border-2 border-green-400 text-green-400"
                                : "bg-background border border-white/10 text-text-muted hover:border-white/20"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mythic star selector for target rank */}
                  {MYTHIC_STAR_CONFIG[targetRank] && (() => {
                    const cfg = MYTHIC_STAR_CONFIG[targetRank];
                    const pricePerStar = MYTHIC_PER_STAR_PRICES[targetRank] || 0;
                    return (
                      <div className="p-3 bg-green-400/5 rounded-xl border border-green-400/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-400 text-xs font-bold">
                            {cfg.label === "Match" ? "Jumlah Match" : "Jumlah Bintang"} Tujuan
                          </span>
                          <span className="text-text-muted text-[10px]">
                            Range: {cfg.min}–{cfg.max}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setTargetMythicStars(Math.max(cfg.min, targetMythicStars - 1))}
                            className="w-9 h-9 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={cfg.min}
                            max={cfg.max}
                            value={targetMythicStars}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || cfg.min;
                              setTargetMythicStars(Math.max(cfg.min, Math.min(cfg.max, val)));
                            }}
                            className="w-20 h-9 text-center bg-background text-green-400 rounded-lg border border-green-400/20 focus:outline-none focus:border-green-400 text-sm font-bold"
                          />
                          <button
                            onClick={() => setTargetMythicStars(Math.min(cfg.max, targetMythicStars + 1))}
                            className="w-9 h-9 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Star Breakdown */}
                {starBreakdown.length > 0 && (
                  <div className="bg-surface rounded-2xl border border-white/5 p-5">
                    <h3 className="text-text font-bold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      Rincian Per Tier
                    </h3>
                    {/* Visual flow */}
                    <div className="flex items-center justify-center gap-3 p-3 bg-background rounded-xl border border-white/5 mb-4">
                      <div className="flex items-center gap-2">
                        <Image
                          src={rankIcons[currentRank] || ""}
                          alt="Current"
                          width={28}
                          height={28}
                          className="w-7 h-7 object-contain"
                        />
                        <span className="text-text text-sm font-medium">
                          {getRankLabel(currentRank)} {RANKS_WITH_STARS.includes(currentRank) && getDivLabel(currentRank, currentDiv)}
                          {MYTHIC_STAR_CONFIG[currentRank] && ` (${currentMythicStars}★)`}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0" />
                      <div className="flex items-center gap-2">
                        <Image
                          src={rankIcons[targetRank] || ""}
                          alt="Target"
                          width={28}
                          height={28}
                          className="w-7 h-7 object-contain"
                        />
                        <span className="text-yellow-400 text-sm font-bold">
                          {getRankLabel(targetRank)} {RANKS_WITH_STARS.includes(targetRank) && getDivLabel(targetRank, targetDiv)}
                          {MYTHIC_STAR_CONFIG[targetRank] && ` (${targetMythicStars}★)`}
                        </span>
                      </div>
                    </div>
                    {/* Breakdown table */}
                    <div className="space-y-2">
                      {starBreakdown.map((seg, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg border border-white/5">
                          <div className="flex items-center gap-2">
                            <Image
                              src={rankIcons[seg.tierId] || "/icons-tier/warrior.webp"}
                              alt={seg.tierLabel}
                              width={20}
                              height={20}
                              className="w-5 h-5 object-contain"
                            />
                            <span className="text-text text-xs font-medium">{seg.tierLabel}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-text-muted">
                              {seg.stars} ★ × {formatRupiah(seg.pricePerStar)}
                            </span>
                            <span className="text-yellow-400 font-bold">{formatRupiah(seg.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Total */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-text font-bold text-sm">Total: {totalStars} bintang</span>
                      <span className="text-yellow-400 font-bold text-lg">{formatRupiah(basePricePerStar)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== GENDONG: RANK CARDS + QTY ===== */}
            {mode === "gendong" && (
              <div className="bg-surface rounded-2xl border border-white/5 p-5 space-y-4">
                {/* Daftar Harga */}
                <div>
                  <h3 className="text-text font-bold text-sm mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-accent" />
                    Daftar Harga Gendong
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {gendongRanks.map((rank) => (
                      <button
                        key={rank.id}
                        onClick={() => setSelectedGendongRankId(rank.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-lg border-2 text-center transition-all ${
                          selectedGendongRankId === rank.id
                            ? "border-yellow-400 bg-yellow-400/5"
                            : "border-white/5 bg-background hover:border-white/15"
                        }`}
                      >
                        <Image src={rank.icon} alt={rank.name} width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
                        <span className="text-text text-xs font-medium leading-tight">{rank.name}</span>
                        <span className="text-yellow-400 font-bold text-sm">{formatRupiah(rank.price)}</span>
                        {rank.originalPrice && (
                          <span className="text-red-400/70 text-[10px] line-through">{formatRupiah(rank.originalPrice)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Qty Selector */}
                <div>
                  <label className="block text-sm text-text font-bold mb-2">Jumlah Bintang/Match</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGendongQty((q) => Math.max(selectedGendongRankId === "grading" ? 1 : 3, q - 1))}
                      className="w-10 h-10 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={gendongQty}
                      onChange={(e) =>
                        setGendongQty(Math.max(selectedGendongRankId === "grading" ? 1 : 3, parseInt(e.target.value) || 3))
                      }
                      className="w-20 h-10 text-center bg-background text-text rounded-lg border border-white/10 focus:outline-none focus:border-accent text-sm font-bold"
                    />
                    <button
                      onClick={() => setGendongQty((q) => q + 1)}
                      className="w-10 h-10 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-text-muted text-xs ml-2">
                      Min {selectedGendongRankId === "grading" ? 1 : 3}{" "}
                      {selectedGendongRankId === "grading" ? "match" : "stars"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ADD-ONS (all modes) ===== */}
            <div className="bg-surface rounded-2xl border border-white/5 p-5">
              <h3 className="text-text font-bold text-sm mb-3">Add-ons & Diskon</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-background rounded-xl border border-white/5 cursor-pointer hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={isExpress} onChange={(e) => setIsExpress(e.target.checked)} className="w-4 h-4 accent-yellow-400" />
                    <div>
                      <p className="text-text text-sm font-medium flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Express (1-2 Hari)
                      </p>
                      <p className="text-text-muted text-xs">Prioritas pengerjaan dengan tim senior (+20%)</p>
                    </div>
                  </div>
                  <span className="text-yellow-400 text-xs font-bold">+20%</span>
                </label>
                <label className="flex items-center justify-between p-3 bg-background rounded-xl border border-white/5 cursor-pointer hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="w-4 h-4 accent-purple-400" />
                    <div>
                      <p className="text-text text-sm font-medium flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-purple-400" />
                        Premium Pilot
                      </p>
                      <p className="text-text-muted text-xs">Pilot MG dengan winrate 75%+ (+30%)</p>
                    </div>
                  </div>
                  <span className="text-purple-400 text-xs font-bold">+30%</span>
                </label>
                <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-text text-sm font-medium">Diskon Custom</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                      className="w-16 h-9 text-center bg-surface text-text rounded-lg border border-white/10 focus:outline-none focus:border-accent text-sm font-bold"
                    />
                    <span className="text-text-muted text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-text-muted hover:text-text transition-colors text-sm flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* ===== RIGHT: Result Panel (sticky) ===== */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-bold text-text flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Hasil Kalkulasi
                </h3>
              </div>
              <div className="p-5">
                {hasResult ? (
                  <div className="space-y-4">
                    {/* Total Stars / Package Info */}
                    {mode === "perstar" && (
                      <div className="bg-background rounded-xl p-4 border border-white/5">
                        <p className="text-text-muted text-xs mb-1">Total Bintang</p>
                        <p className="text-yellow-400 font-bold text-2xl flex items-center gap-1.5">
                          {totalStars}
                          <Star className="w-5 h-5" />
                        </p>
                      </div>
                    )}

                    {selectedPackage && (mode === "paket" || mode === "classic") && (
                      <div className="bg-background rounded-xl p-4 border border-white/5">
                        <p className="text-text-muted text-xs mb-1">Paket Terpilih</p>
                        <p className="text-text font-bold text-sm">{selectedPackage.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <TierIconsBadge currentRank={selectedPackage.currentRank === "classic" ? parseClassicRank(selectedPackage.title) : selectedPackage.currentRank} targetRank={selectedPackage.targetRank === "classic" ? parseClassicRank(selectedPackage.title) : selectedPackage.targetRank} />
                        </div>
                      </div>
                    )}

                    {mode === "gendong" && (
                      <div className="bg-background rounded-xl p-4 border border-white/5">
                        <p className="text-text-muted text-xs mb-1">Total Match/Bintang</p>
                        <p className="text-yellow-400 font-bold text-2xl flex items-center gap-1.5">
                          {gendongQty}
                          <Star className="w-5 h-5" />
                        </p>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-text-muted">
                        <span>Harga Dasar</span>
                        <span>{formatRupiah(basePrice)}</span>
                      </div>
                      {isExpress && (
                        <div className="flex justify-between text-yellow-400">
                          <span>Express (+20%)</span>
                          <span>+{formatRupiah(Math.round(basePrice * 0.2))}</span>
                        </div>
                      )}
                      {isPremium && (
                        <div className="flex justify-between text-purple-400">
                          <span>Premium (+30%)</span>
                          <span>+{formatRupiah(Math.round(basePrice * 0.3))}</span>
                        </div>
                      )}
                      {customDiscount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Diskon ({customDiscount}%)</span>
                          <span>-{formatRupiah(Math.round(basePrice * customDiscount / 100))}</span>
                        </div>
                      )}
                    </div>

                    {/* Final Price */}
                    <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-xl p-4 border border-yellow-400/20">
                      <p className="text-text-muted text-xs mb-1">Total Bayar</p>
                      <p className="text-yellow-400 font-bold text-3xl">{formatRupiah(finalPrice)}</p>
                    </div>

                    {/* WhatsApp Output */}
                    <div className="bg-background rounded-xl p-3 border border-white/5">
                      <p className="text-text-muted text-xs mb-2">Pesan WhatsApp siap copy:</p>
                      <pre className="text-text text-xs whitespace-pre-wrap font-mono bg-surface p-3 rounded-lg max-h-40 overflow-y-auto">
                        {buildMessage()}
                      </pre>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={handleWhatsApp}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Buka WhatsApp
                      </button>
                      <button
                        onClick={handleCopy}
                        className="w-full py-3 bg-surface border border-white/10 hover:border-white/20 rounded-xl text-text font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Tersalin!" : "Copy Pesan"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalculatorIcon className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-text-muted text-sm">
                      {mode === "paket"
                        ? "Pilih paket untuk melihat hasil"
                        : mode === "perstar"
                        ? "Pilih rank awal & tujuan untuk melihat hasil"
                        : mode === "gendong"
                        ? "Pilih rank untuk melihat hasil"
                        : "Pilih paket classic untuk melihat hasil"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}