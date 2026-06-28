"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  RANK_LIST,
  RANK_ORDER,
  RANKS_WITH_STARS,
  RANK_DIVISION_CONFIG,
  rankIcons,
  getDivisionOptions,
  getRankDivisionOptions,
  calculateTotalStars,
  findBestPackage,
  formatRupiah,
  type PackageCategory,
  type ProductPackage,
  type PerStarRank,
} from "@/lib/pricing-utils";
import { WHATSAPP_NUMBER } from "@/lib/constants";

// ===== Default Catalog (same as order page) =====
const DEFAULT_CATALOG: PackageCategory[] = [
  {
    id: "paket-warrior",
    title: "Paket Warrior",
    packages: [
      { id: "warrior3-elite3", title: "Warrior III - Elite III", price: 25089, rankKey: "warrior", currentRank: "warrior", targetRank: "elite", currentDivision: 3, targetDivision: 3 },
      { id: "warrior3-master4", title: "Warrior III - Master IV", price: 70089, rankKey: "warrior", currentRank: "warrior", targetRank: "master", currentDivision: 3, targetDivision: 4 },
      { id: "warrior3-gm5", title: "Warrior III - GM V", price: 149089, rankKey: "warrior", currentRank: "warrior", targetRank: "grandmaster", currentDivision: 3, targetDivision: 5 },
      { id: "warrior3-epic5", title: "Warrior III - Epic V", price: 282089, rankKey: "warrior", currentRank: "warrior", targetRank: "epic", currentDivision: 3, targetDivision: 5 },
      { id: "warrior3-legend5", title: "Warrior III - Legend V", price: 459089, rankKey: "warrior", currentRank: "warrior", targetRank: "legend", currentDivision: 3, targetDivision: 5 },
      { id: "warrior1-mythic", title: "Warrior I - Mythic", price: 645089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic", currentDivision: 1 },
      { id: "warrior2-mythic", title: "Warrior II - Mythic", price: 653089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic", currentDivision: 2 },
      { id: "warrior3-mythic", title: "Warrior III - Mythic", price: 660089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic", currentDivision: 3 },
    ],
  },
  {
    id: "paket-elite",
    title: "Paket Elite",
    packages: [
      { id: "elite3-master4", title: "Elite III - Master IV", price: 45089, rankKey: "elite", currentRank: "elite", targetRank: "master", currentDivision: 3, targetDivision: 4 },
      { id: "elite3-gm5", title: "Elite III - GM V", price: 123089, rankKey: "elite", currentRank: "elite", targetRank: "grandmaster", currentDivision: 3, targetDivision: 5 },
      { id: "elite3-epic5", title: "Elite III - Epic V", price: 259089, rankKey: "elite", currentRank: "elite", targetRank: "epic", currentDivision: 3, targetDivision: 5 },
      { id: "elite3-legend5", title: "Elite III - Legend V", price: 435089, rankKey: "elite", currentRank: "elite", targetRank: "legend", currentDivision: 3, targetDivision: 5 },
      { id: "elite1-mythic", title: "Elite I - Mythic", price: 605089, rankKey: "elite", currentRank: "elite", targetRank: "mythic", currentDivision: 1 },
      { id: "elite2-mythic", title: "Elite II - Mythic", price: 620089, rankKey: "elite", currentRank: "elite", targetRank: "mythic", currentDivision: 2 },
      { id: "elite3-mythic", title: "Elite III - Mythic", price: 635089, rankKey: "elite", currentRank: "elite", targetRank: "mythic", currentDivision: 3 },
    ],
  },
  {
    id: "paket-master",
    title: "Paket Master",
    packages: [
      { id: "master4-gm5", title: "Master IV - GM V", price: 78089, rankKey: "master", currentRank: "master", targetRank: "grandmaster", currentDivision: 4, targetDivision: 5 },
      { id: "master4-epic5", title: "Master IV - Epic V", price: 213089, rankKey: "master", currentRank: "master", targetRank: "epic", currentDivision: 4, targetDivision: 5 },
      { id: "master4-legend5", title: "Master IV - Legend V", price: 389089, rankKey: "master", currentRank: "master", targetRank: "legend", currentDivision: 4, targetDivision: 5 },
      { id: "master1-mythic", title: "Master I - Mythic", price: 533089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 1 },
      { id: "master2-mythic", title: "Master II - Mythic", price: 550089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 2 },
      { id: "master3-mythic", title: "Master III - Mythic", price: 570089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 3 },
      { id: "master4-mythic", title: "Master IV - Mythic", price: 590089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 4 },
    ],
  },
  {
    id: "paket-gm",
    title: "Paket Grand Master",
    packages: [
      { id: "gm5-epic5", title: "GM V - Epic V", price: 113089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "epic", currentDivision: 5, targetDivision: 5 },
      { id: "gm5-legend5", title: "GM V - Legend V", price: 259089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "legend", currentDivision: 5, targetDivision: 5 },
      { id: "gm1-mythic", title: "GM I - Mythic", price: 338089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 1 },
      { id: "gm2-mythic", title: "GM II - Mythic", price: 360089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 2 },
      { id: "gm3-mythic", title: "GM III - Mythic", price: 383089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 3 },
      { id: "gm4-mythic", title: "GM IV - Mythic", price: 405089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 4 },
      { id: "gm5-mythic", title: "GM V - Mythic", price: 428089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 5 },
      { id: "gm1-honor", title: "GM I - Mythic Honor", price: 511089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 1 },
      { id: "gm2-honor", title: "GM II - Mythic Honor", price: 533089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 2 },
      { id: "gm3-honor", title: "GM III - Mythic Honor", price: 556089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 3 },
      { id: "gm4-honor", title: "GM IV - Mythic Honor", price: 578089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 4 },
      { id: "gm5-honor", title: "GM V - Mythic Honor", price: 601089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 5 },
    ],
  },
  {
    id: "paket-epic",
    title: "Paket Epic",
    packages: [
      { id: "epic5-legend5", title: "Epic V - Legend V", price: 146089, rankKey: "epic", currentRank: "epic", targetRank: "legend", currentDivision: 5, targetDivision: 5 },
      { id: "epic1-mythic", title: "Epic I - Mythic", price: 198089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 1 },
      { id: "epic2-mythic", title: "Epic II - Mythic", price: 227089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 2 },
      { id: "epic3-mythic", title: "Epic III - Mythic", price: 257089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 3 },
      { id: "epic4-mythic", title: "Epic IV - Mythic", price: 286089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 4 },
      { id: "epic5-mythic", title: "Epic V - Mythic", price: 315089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 5 },
      { id: "epic1-honor", title: "Epic I - Mythic Honor", price: 371089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 1 },
      { id: "epic2-honor", title: "Epic II - Mythic Honor", price: 401089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 2 },
      { id: "epic3-honor", title: "Epic III - Mythic Honor", price: 430089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 3 },
      { id: "epic4-honor", title: "Epic IV - Mythic Honor", price: 459089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 4 },
      { id: "epic5-honor", title: "Epic V - Mythic Honor", price: 488089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 5 },
    ],
  },
  {
    id: "paket-legend",
    title: "Paket Legend",
    packages: [
      { id: "legend1-mythic", title: "Legend I - Mythic", price: 34089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 1 },
      { id: "legend2-mythic", title: "Legend II - Mythic", price: 68089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 2 },
      { id: "legend3-mythic", title: "Legend III - Mythic", price: 101089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 3 },
      { id: "legend4-mythic", title: "Legend IV - Mythic", price: 135089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 4 },
      { id: "legend5-mythic", title: "Legend V - Mythic", price: 169089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 5 },
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
];

// Per-star pricing
const PER_STAR_RANKS: PerStarRank[] = [
  { id: "grandmaster", name: "Grand Master", price: 5000, originalPrice: 6000, discountPercent: 17, icon: "/icons-tier/Grandmaster.webp", maxStars: 25 },
  { id: "epic", name: "Epic", price: 6500, originalPrice: 8000, discountPercent: 19, icon: "/icons-tier/Epic.webp", maxStars: 25 },
  { id: "legend", name: "Legend", price: 7500, originalPrice: 9000, discountPercent: 17, icon: "/icons-tier/Legend.webp", maxStars: 25 },
  { id: "grading", name: "Mythic Grading", price: 20000, originalPrice: 22000, discountPercent: 9, icon: "/icons-tier/Mythic.webp", maxStars: 10 },
  { id: "mythic", name: "Mythic", price: 18000, originalPrice: 20000, discountPercent: 10, icon: "/icons-tier/Mythic.webp", maxStars: 25 },
  { id: "honor", name: "Mythic Honor", price: 21000, originalPrice: 23000, discountPercent: 9, icon: "/icons-tier/Mythical_Honor.webp", maxStars: 25 },
  { id: "glory", name: "Mythic Glory", price: 26000, originalPrice: 28000, discountPercent: 7, icon: "/icons-tier/Mythical_Glory.webp", maxStars: 50 },
  { id: "immortal", name: "Mythic Immortal", price: 31000, originalPrice: 33000, discountPercent: 6, icon: "/icons-tier/Mythical_Immortal.webp", maxStars: 100 },
];

// Gendong per-star pricing
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

export default function CalculatorPage() {
  // Mode: paket / perstar / gendong
  const [mode, setMode] = useState<"paket" | "perstar" | "gendong">("paket");

  // Rank selection (paket mode)
  const [currentRank, setCurrentRank] = useState("epic");
  const [currentDiv, setCurrentDiv] = useState(3);
  const [currentDivisionStar, setCurrentDivisionStar] = useState(1);
  const [targetRank, setTargetRank] = useState("mythic");
  const [targetDiv, setTargetDiv] = useState(1);
  const [targetDivisionStar, setTargetDivisionStar] = useState(0);

  // Per-star mode selection
  const [selectedStarRankId, setSelectedStarRankId] = useState("epic");
  const [starQty, setStarQty] = useState(3);

  // Gendong mode selection
  const [selectedGendongRankId, setSelectedGendongRankId] = useState("epic");
  const [gendongQty, setGendongQty] = useState(3);

  // Add-ons
  const [isExpress, setIsExpress] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customDiscount, setCustomDiscount] = useState(0);

  // Catalog (fetch from CMS)
  const [catalog, setCatalog] = useState<PackageCategory[]>(DEFAULT_CATALOG);

  // UI state
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    totalStars: number;
    basePrice: number;
    matchedPackage: ProductPackage | null;
    isExactMatch: boolean;
    finalPrice: number;
  } | null>(null);

  // Fetch pricing from CMS
  useEffect(() => {
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
          const merged = data.pricing_catalog.map((cat: PackageCategory) => ({
            ...cat,
            packages: cat.packages.map((pkg: ProductPackage) => ({
              ...pkg,
              rankKey: defaultRankKeys[pkg.id] || pkg.rankKey || pkg.currentRank,
            })),
          }));
          setCatalog(merged);
        }
      })
      .catch(() => {});
  }, []);

  // ===== Calculation =====
  const calculate = useCallback(() => {
    let totalStars = 0;
    let basePrice = 0;
    let matchedPackage: ProductPackage | null = null;
    let isExactMatch = false;

    if (mode === "paket") {
      totalStars = calculateTotalStars(
        currentRank,
        currentDiv,
        targetRank,
        targetDiv,
        RANKS_WITH_STARS.includes(currentRank) ? currentDivisionStar : 0,
        RANKS_WITH_STARS.includes(targetRank) ? targetDivisionStar : 0
      );

      const match = findBestPackage(catalog, currentRank, currentDiv, targetRank, targetDiv);
      if (match) {
        matchedPackage = match.pkg;
        isExactMatch = match.exact;
        basePrice = match.pkg.price;
      }
    } else if (mode === "perstar") {
      const rank = PER_STAR_RANKS.find((r) => r.id === selectedStarRankId);
      if (rank) {
        totalStars = starQty;
        basePrice = rank.price * starQty;
      }
    } else if (mode === "gendong") {
      const rank = GENDONG_RANKS.find((r) => r.id === selectedGendongRankId);
      if (rank) {
        totalStars = gendongQty;
        basePrice = rank.price * gendongQty;
      }
    }

    // Apply add-ons
    let finalPrice = basePrice;
    if (isExpress) finalPrice *= 1.2;
    if (isPremium) finalPrice *= 1.3;

    // Apply custom discount
    if (customDiscount > 0) {
      finalPrice = finalPrice * (1 - customDiscount / 100);
    }

    finalPrice = Math.round(finalPrice);

    setResult({ totalStars, basePrice, matchedPackage, isExactMatch, finalPrice });
    setCopied(false);
  }, [
    mode,
    currentRank,
    currentDiv,
    targetRank,
    targetDiv,
    currentDivisionStar,
    targetDivisionStar,
    selectedStarRankId,
    starQty,
    selectedGendongRankId,
    gendongQty,
    isExpress,
    isPremium,
    customDiscount,
    catalog,
  ]);

  // Reset result when inputs change
  useEffect(() => {
    setResult(null);
  }, [
    mode,
    currentRank,
    currentDiv,
    targetRank,
    targetDiv,
    selectedStarRankId,
    starQty,
    selectedGendongRankId,
    gendongQty,
    isExpress,
    isPremium,
    customDiscount,
  ]);

  // Build WhatsApp message
  const buildMessage = useCallback(() => {
    if (!result) return "";
    const typeLabel = mode === "paket" ? "Joki Paket" : mode === "perstar" ? "Joki Per Bintang" : "Joki Gendong";

    const curLabel = mode === "paket"
      ? `${RANK_LIST.find((r) => r.id === currentRank)?.label || ""}${RANKS_WITH_STARS.includes(currentRank) ? ` ${getDivisionOptions(currentRank).find((d) => d.value === currentDiv)?.label || ""}` : ""}`
      : mode === "perstar"
      ? PER_STAR_RANKS.find((r) => r.id === selectedStarRankId)?.name || ""
      : GENDONG_RANKS.find((r) => r.id === selectedGendongRankId)?.name || "";

    const tgtLabel = mode === "paket"
      ? `${RANK_LIST.find((r) => r.id === targetRank)?.label || ""}${RANKS_WITH_STARS.includes(targetRank) ? ` ${getDivisionOptions(targetRank).find((d) => d.value === targetDiv)?.label || ""}` : ""}`
      : "";

    const addons: string[] = [];
    if (isExpress) addons.push("Express (+20%)");
    if (isPremium) addons.push("Premium Pilot (+30%)");
    if (customDiscount > 0) addons.push(`Diskon ${customDiscount}%`);

    const lines = [
      `Halo Kak ETNYX, saya mau order ${typeLabel}`,
      ``,
      `Detail Order:`,
    ];

    if (mode === "paket") {
      lines.push(`Rank Awal: ${curLabel} (${currentDivisionStar} bintang)`);
      lines.push(`Rank Tujuan: ${tgtLabel} (${targetDivisionStar} bintang)`);
    } else {
      lines.push(`Rank: ${curLabel}`);
    }

    lines.push(`Total Bintang/Match: ${result.totalStars}`);

    if (addons.length > 0) {
      lines.push(`Add-on: ${addons.join(", ")}`);
    }

    lines.push(``);
    lines.push(`Harga: ${formatRupiah(result.finalPrice)}`);
    if (result.matchedPackage && mode === "paket") {
      lines.push(`Paket: ${result.matchedPackage.title}`);
      if (!result.isExactMatch) {
        lines.push(`(Paket terdekat — bukan match exact)`);
      }
    }
    lines.push(``);
    lines.push(`Mohon info lanjutan ya Kak`);

    return lines.join("\n");
  }, [
    result,
    mode,
    currentRank,
    currentDiv,
    targetRank,
    targetDiv,
    currentDivisionStar,
    targetDivisionStar,
    selectedStarRankId,
    selectedGendongRankId,
    isExpress,
    isPremium,
    customDiscount,
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
    setCurrentRank("epic");
    setCurrentDiv(3);
    setCurrentDivisionStar(1);
    setTargetRank("mythic");
    setTargetDiv(1);
    setTargetDivisionStar(0);
    setIsExpress(false);
    setIsPremium(false);
    setCustomDiscount(0);
    setResult(null);
  }, []);

  // Label builders
  const getRankLabel = (rankId: string) => RANK_LIST.find((r) => r.id === rankId)?.label || rankId;
  const getDivLabel = (rankId: string, div: number) => getDivisionOptions(rankId).find((d) => d.value === div)?.label || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-text-muted hover:text-text transition-colors">
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
          {/* ===== LEFT: Input Form ===== */}
          <div className="lg:col-span-2 space-y-5">
            {/* Mode Switcher */}
            <div className="bg-surface rounded-2xl border border-white/5 p-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setMode("paket")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "paket"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Package className="w-5 h-5 inline-block mr-2 align-middle" />
                  Joki Paket
                </button>
                <button
                  onClick={() => setMode("perstar")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "perstar"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Star className="w-5 h-5 inline-block mr-2 align-middle" />
                  Per Bintang
                </button>
                <button
                  onClick={() => setMode("gendong")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "gendong"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Users className="w-5 h-5 inline-block mr-2 align-middle" />
                  Joki Gendong
                </button>
              </div>
            </div>

            {/* ===== PAKET MODE ===== */}
            {mode === "paket" && (
              <div className="bg-surface rounded-2xl border border-white/5 p-5 space-y-5">
                {/* Rank Awal */}
                <div>
                  <label className="block text-sm text-text font-bold mb-2">
                    Rank Awal Customer
                  </label>
                  <div className="relative mb-3">
                    <select
                      value={RANKS_WITH_STARS.includes(currentRank) ? `${currentRank}:${currentDiv}` : currentRank}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw.includes(":")) {
                          const [rankId, div] = raw.split(":");
                          setCurrentRank(rankId);
                          setCurrentDiv(parseInt(div));
                        } else {
                          setCurrentRank(raw);
                          setCurrentDiv(0);
                        }
                      }}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm font-medium appearance-none cursor-pointer focus:border-accent focus:outline-none pr-10"
                    >
                      {getRankDivisionOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Image src={rankIcons[currentRank] || "/icons-tier/warrior.webp"} alt="Rank" width={24} height={24} className="w-6 h-6 object-contain" />
                    </div>
                  </div>

                  {/* Division stars */}
                  {RANKS_WITH_STARS.includes(currentRank) && (() => {
                    const starsPerDiv = RANK_DIVISION_CONFIG[currentRank]?.starsPerDiv ?? 5;
                    return (
                      <div className="flex items-center gap-3">
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
                </div>

                {/* Rank Tujuan */}
                <div>
                  <label className="block text-sm text-text font-bold mb-2">
                    Rank Tujuan Customer
                  </label>
                  <div className="relative mb-3">
                    <select
                      value={RANKS_WITH_STARS.includes(targetRank) ? `${targetRank}:${targetDiv}` : targetRank}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw.includes(":")) {
                          const [rankId, div] = raw.split(":");
                          setTargetRank(rankId);
                          setTargetDiv(parseInt(div));
                        } else {
                          setTargetRank(raw);
                          setTargetDiv(0);
                        }
                      }}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm font-medium appearance-none cursor-pointer focus:border-accent focus:outline-none pr-10"
                    >
                      {getRankDivisionOptions()
                        .filter((opt) => {
                          const ci = RANK_ORDER.indexOf(currentRank);
                          const oi = RANK_ORDER.indexOf(opt.rankId);
                          if (oi > ci) return true;
                          if (oi === ci && RANKS_WITH_STARS.includes(opt.rankId) && opt.division < currentDiv) return true;
                          return false;
                        })
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Image src={rankIcons[targetRank] || "/icons-tier/warrior.webp"} alt="Rank" width={24} height={24} className="w-6 h-6 object-contain" />
                    </div>
                  </div>

                  {/* Target division stars */}
                  {RANKS_WITH_STARS.includes(targetRank) && (() => {
                    const starsPerDiv = RANK_DIVISION_CONFIG[targetRank]?.starsPerDiv ?? 5;
                    return (
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted text-xs whitespace-nowrap">Bintang di divisi:</span>
                        <div className="flex gap-1">
                          {Array.from({ length: starsPerDiv }, (_, i) => i + 1).map((s) => (
                            <button
                              key={s}
                              onClick={() => setTargetDivisionStar(s)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                targetDivisionStar === s
                                  ? "bg-green-400/20 border-2 border-green-400 text-green-400"
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
                </div>

                {/* Visual flow */}
                <div className="flex items-center justify-center gap-3 p-3 bg-background rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Image src={rankIcons[currentRank] || ""} alt="Current" width={28} height={28} className="w-7 h-7 object-contain" />
                    <span className="text-text text-sm font-medium">
                      {getRankLabel(currentRank)} {RANKS_WITH_STARS.includes(currentRank) && getDivLabel(currentRank, currentDiv)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <Image src={rankIcons[targetRank] || ""} alt="Target" width={28} height={28} className="w-7 h-7 object-contain" />
                    <span className="text-yellow-400 text-sm font-bold">
                      {getRankLabel(targetRank)} {RANKS_WITH_STARS.includes(targetRank) && getDivLabel(targetRank, targetDiv)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PER STAR MODE ===== */}
            {mode === "perstar" && (
              <div className="bg-surface rounded-2xl border border-white/5 p-5 space-y-4">
                <div>
                  <label className="block text-sm text-text font-bold mb-3">Pilih Rank</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PER_STAR_RANKS.map((rank) => (
                      <button
                        key={rank.id}
                        onClick={() => setSelectedStarRankId(rank.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedStarRankId === rank.id
                            ? "border-yellow-400 bg-yellow-400/5"
                            : "border-white/5 bg-background hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Image src={rank.icon} alt={rank.name} width={24} height={24} className="w-6 h-6 object-contain" />
                          <span className="text-text text-xs font-semibold">{rank.name}</span>
                        </div>
                        <p className="text-yellow-400 text-sm font-bold">{formatRupiah(rank.price)}</p>
                        <p className="text-text-muted text-[10px]">/ {rank.id === "grading" ? "Match" : "Star"}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text font-bold mb-2">Jumlah Bintang/Match</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStarQty((q) => Math.max(selectedStarRankId === "grading" ? 1 : 3, q - 1))}
                      className="w-10 h-10 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={starQty}
                      onChange={(e) => setStarQty(Math.max(selectedStarRankId === "grading" ? 1 : 3, parseInt(e.target.value) || 3))}
                      className="w-20 h-10 text-center bg-background text-text rounded-lg border border-white/10 focus:outline-none focus:border-accent text-sm font-bold"
                    />
                    <button
                      onClick={() => setStarQty((q) => q + 1)}
                      className="w-10 h-10 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-text-muted text-xs ml-2">
                      Min {selectedStarRankId === "grading" ? 1 : 3} {selectedStarRankId === "grading" ? "match" : "stars"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ===== GENDONG MODE ===== */}
            {mode === "gendong" && (
              <div className="bg-surface rounded-2xl border border-white/5 p-5 space-y-4">
                <div>
                  <label className="block text-sm text-text font-bold mb-3">Pilih Rank</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GENDONG_RANKS.map((rank) => (
                      <button
                        key={rank.id}
                        onClick={() => setSelectedGendongRankId(rank.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedGendongRankId === rank.id
                            ? "border-yellow-400 bg-yellow-400/5"
                            : "border-white/5 bg-background hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Image src={rank.icon} alt={rank.name} width={24} height={24} className="w-6 h-6 object-contain" />
                          <span className="text-text text-xs font-semibold">{rank.name}</span>
                        </div>
                        <p className="text-yellow-400 text-sm font-bold">{formatRupiah(rank.price)}</p>
                        <p className="text-text-muted text-[10px]">/ {rank.id === "grading" ? "Match" : "Star"}</p>
                      </button>
                    ))}
                  </div>
                </div>
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
                      onChange={(e) => setGendongQty(Math.max(selectedGendongRankId === "grading" ? 1 : 3, parseInt(e.target.value) || 3))}
                      className="w-20 h-10 text-center bg-background text-text rounded-lg border border-white/10 focus:outline-none focus:border-accent text-sm font-bold"
                    />
                    <button
                      onClick={() => setGendongQty((q) => q + 1)}
                      className="w-10 h-10 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-text-muted text-xs ml-2">
                      Min {selectedGendongRankId === "grading" ? 1 : 3} {selectedGendongRankId === "grading" ? "match" : "stars"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Add-ons */}
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

            {/* Calculate Button */}
            <div className="flex gap-3">
              <button
                onClick={calculate}
                className="flex-1 py-4 gradient-primary rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <CalculatorIcon className="w-5 h-5" />
                Hitung Harga
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-4 bg-surface border border-white/10 rounded-xl text-text-muted hover:text-text transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ===== RIGHT: Result Panel ===== */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-bold text-text flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Hasil Kalkulasi
                </h3>
              </div>
              <div className="p-5">
                {result ? (
                  <div className="space-y-4">
                    {/* Total Stars */}
                    <div className="bg-background rounded-xl p-4 border border-white/5">
                      <p className="text-text-muted text-xs mb-1">Total Bintang/Match</p>
                      <p className="text-yellow-400 font-bold text-2xl flex items-center gap-1.5">
                        {result.totalStars}
                        <Star className="w-5 h-5" />
                      </p>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-text-muted">
                        <span>Harga Dasar</span>
                        <span>{formatRupiah(result.basePrice)}</span>
                      </div>
                      {isExpress && (
                        <div className="flex justify-between text-yellow-400">
                          <span>Express (+20%)</span>
                          <span>+{formatRupiah(Math.round(result.basePrice * 0.2))}</span>
                        </div>
                      )}
                      {isPremium && (
                        <div className="flex justify-between text-purple-400">
                          <span>Premium (+30%)</span>
                          <span>+{formatRupiah(Math.round(result.basePrice * 0.3))}</span>
                        </div>
                      )}
                      {customDiscount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Diskon ({customDiscount}%)</span>
                          <span>-{formatRupiah(Math.round(result.basePrice * customDiscount / 100))}</span>
                        </div>
                      )}
                    </div>

                    {/* Final Price */}
                    <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-xl p-4 border border-yellow-400/20">
                      <p className="text-text-muted text-xs mb-1">Total Bayar</p>
                      <p className="text-yellow-400 font-bold text-3xl">{formatRupiah(result.finalPrice)}</p>
                    </div>

                    {/* Matched Package */}
                    {result.matchedPackage && (
                      <div className="bg-background rounded-xl p-3 border border-white/5">
                        <p className="text-text-muted text-xs mb-1">Paket Match</p>
                        <p className="text-text text-sm font-medium">{result.matchedPackage.title}</p>
                        {!result.isExactMatch && (
                          <p className="text-orange-400 text-[10px] mt-1">Paket terdekat (bukan exact match)</p>
                        )}
                      </div>
                    )}

                    {/* WhatsApp Output */}
                    <div className="bg-background rounded-xl p-3 border border-white/5">
                      <p className="text-text-muted text-xs mb-2">Pesan WhatsApp siap copy:</p>
                      <pre className="text-text text-xs whitespace-pre-wrap font-mono bg-surface p-3 rounded-lg max-h-32 overflow-y-auto">
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
                      Pilih rank dan klik <span className="text-accent font-medium">Hitung Harga</span> untuk melihat hasil
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