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
  Trophy,
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
  findBestPackage,
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

export default function CalculatorPage() {
  // Mode: paket / perstar / gendong / classic
  const [mode, setMode] = useState<"paket" | "perstar" | "gendong" | "classic">("paket");

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

  // Classic mode selection
  const [selectedClassicPkgId, setSelectedClassicPkgId] = useState("mythic-10win");

  // Add-ons
  const [isExpress, setIsExpress] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customDiscount, setCustomDiscount] = useState(0);

  // Catalog (fetch from CMS)
  const [catalog, setCatalog] = useState<PackageCategory[]>(DEFAULT_CATALOG);
  const [perStarRanks, setPerStarRanks] = useState<PerStarRank[]>(DEFAULT_PER_STAR_RANKS);
  const [gendongRanks, setGendongRanks] = useState<PerStarRank[]>(DEFAULT_GENDONG_RANKS);

  // UI state
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    totalStars: number;
    basePrice: number;
    extraMythicCost: number;
    matchedPackage: ProductPackage | null;
    isExactMatch: boolean;
    finalPrice: number;
  } | null>(null);

  // Fetch pricing from CMS (all keys at once)
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
        // Merge catalog
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

        // Merge per-star pricing
        if (data.perstar_pricing && Array.isArray(data.perstar_pricing) && data.perstar_pricing.length > 0) {
          setPerStarRanks((prev) =>
            prev.map((r) => {
              const cms = data.perstar_pricing.find((c: PerStarRank) => c.id === r.id);
              return cms ? { ...r, ...cms } : r;
            })
          );
        }

        // Merge gendong pricing
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

  // ===== Calculation =====
  const calculate = useCallback(() => {
    let totalStars = 0;
    let basePrice = 0;
    let extraMythicCost = 0;
    let matchedPackage: ProductPackage | null = null;
    let isExactMatch = false;

    if (mode === "paket") {
      const isMythicTarget = MYTHIC_STAR_CONFIG[targetRank] !== undefined;
      const isMythicCurrent = MYTHIC_STAR_CONFIG[currentRank] !== undefined;
      totalStars = calculateTotalStars(
        currentRank,
        currentDiv,
        targetRank,
        targetDiv,
        RANKS_WITH_STARS.includes(currentRank) ? currentDivisionStar : 0,
        isMythicTarget ? targetDivisionStar : (RANKS_WITH_STARS.includes(targetRank) ? targetDivisionStar : 0),
        isMythicCurrent ? (MYTHIC_STAR_CONFIG[currentRank]?.min || 0) : undefined
      );

      const match = findBestPackage(catalog, currentRank, currentDiv, targetRank, targetDiv);
      if (match) {
        matchedPackage = match.pkg;
        isExactMatch = match.exact;
        basePrice = match.pkg.price;

        if (isMythicTarget && targetDivisionStar > 0) {
          extraMythicCost = calculateExtraMythicCost(targetRank, targetDivisionStar);
          basePrice += extraMythicCost;
        }
      }
    } else if (mode === "perstar") {
      const rank = perStarRanks.find((r) => r.id === selectedStarRankId);
      if (rank) {
        totalStars = starQty;
        // isFlat: Mythic Grading — price is flat, NOT multiplied by qty
        basePrice = rank.isFlat ? rank.price : rank.price * starQty;
      }
    } else if (mode === "gendong") {
      const rank = gendongRanks.find((r) => r.id === selectedGendongRankId);
      if (rank) {
        totalStars = gendongQty;
        basePrice = rank.isFlat ? rank.price : rank.price * gendongQty;
      }
    } else if (mode === "classic") {
      // Find classic package from catalog
      const classicCat = catalog.find((c) => c.id === "classic-10-win");
      const pkg = classicCat?.packages.find((p) => p.id === selectedClassicPkgId);
      if (pkg) {
        totalStars = 10; // 10 WIN package
        basePrice = pkg.price;
        matchedPackage = pkg;
        isExactMatch = true;
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

    setResult({ totalStars, basePrice, extraMythicCost, matchedPackage, isExactMatch, finalPrice });
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
    selectedClassicPkgId,
    isExpress,
    isPremium,
    customDiscount,
    catalog,
    perStarRanks,
    gendongRanks,
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
    currentDivisionStar,
    targetDivisionStar,
    selectedStarRankId,
    starQty,
    selectedGendongRankId,
    gendongQty,
    selectedClassicPkgId,
    isExpress,
    isPremium,
    customDiscount,
  ]);

  // Build WhatsApp message
  const buildMessage = useCallback(() => {
    if (!result) return "";
    const typeLabel =
      mode === "paket"
        ? "Joki Paket"
        : mode === "perstar"
        ? "Joki Per Bintang"
        : mode === "gendong"
        ? "Joki Gendong"
        : "Joki Classic";

    const curLabel =
      mode === "paket"
        ? `${RANK_LIST.find((r) => r.id === currentRank)?.label || ""}${RANKS_WITH_STARS.includes(currentRank) ? ` ${getDivisionOptions(currentRank).find((d) => d.value === currentDiv)?.label || ""}` : ""}`
        : mode === "perstar"
        ? perStarRanks.find((r) => r.id === selectedStarRankId)?.name || ""
        : mode === "gendong"
        ? gendongRanks.find((r) => r.id === selectedGendongRankId)?.name || ""
        : "";

    const tgtLabel =
      mode === "paket"
        ? `${RANK_LIST.find((r) => r.id === targetRank)?.label || ""}${RANKS_WITH_STARS.includes(targetRank) ? ` ${getDivisionOptions(targetRank).find((d) => d.value === targetDiv)?.label || ""}` : ""}${MYTHIC_STAR_CONFIG[targetRank] && targetDivisionStar > 0 ? ` (${targetDivisionStar} ${MYTHIC_STAR_CONFIG[targetRank].label})` : ""}`
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
      lines.push(`Rank Tujuan: ${tgtLabel}`);
    } else if (mode === "classic") {
      lines.push(`Paket: ${result.matchedPackage?.title || "Classic"}`);
    } else {
      lines.push(`Rank: ${curLabel}`);
    }

    lines.push(`Total Bintang/Match: ${result.totalStars}`);

    if (result.extraMythicCost > 0) {
      lines.push(`Extra Mythic: +${formatRupiah(result.extraMythicCost)}`);
    }

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
    perStarRanks,
    gendongRanks,
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

  // Classic packages
  const classicPackages = catalog.find((c) => c.id === "classic-10-win")?.packages || [];

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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setMode("paket")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "paket"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Package className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Paket
                </button>
                <button
                  onClick={() => setMode("perstar")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "perstar"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Star className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Per Bintang
                </button>
                <button
                  onClick={() => setMode("gendong")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "gendong"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Users className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Gendong
                </button>
                <button
                  onClick={() => setMode("classic")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    mode === "classic"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  <Trophy className="w-5 h-5 inline-block mr-1.5 align-middle" />
                  Classic
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
                          setTargetDivisionStar(0);
                        } else {
                          setTargetRank(raw);
                          setTargetDiv(0);
                          setTargetDivisionStar(0);
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

                  {/* Mythic+ Star Selector */}
                  {MYTHIC_STAR_CONFIG[targetRank] && targetRank !== "mythicgrading" && (() => {
                    const cfg = MYTHIC_STAR_CONFIG[targetRank];
                    const pricePerStar = MYTHIC_PER_STAR_PRICES[targetRank] || 0;
                    return (
                      <div className="mt-3 p-3 bg-yellow-400/5 rounded-xl border border-yellow-400/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-yellow-400 text-xs font-bold">
                            {cfg.label === "Match" ? "Jumlah Match" : "Jumlah Bintang"} Tujuan
                          </span>
                          <span className="text-text-muted text-[10px]">
                            Range: {cfg.min}–{cfg.max} • {formatRupiah(pricePerStar)}/{cfg.label === "Match" ? "match" : "star"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setTargetDivisionStar(Math.max(cfg.min, targetDivisionStar - 1))}
                            className="w-9 h-9 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={cfg.min}
                            max={cfg.max}
                            value={targetDivisionStar}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || cfg.min;
                              setTargetDivisionStar(Math.max(cfg.min, Math.min(cfg.max, val)));
                            }}
                            className="w-20 h-9 text-center bg-background text-yellow-400 rounded-lg border border-yellow-400/20 focus:outline-none focus:border-yellow-400 text-sm font-bold"
                          />
                          <button
                            onClick={() => setTargetDivisionStar(Math.min(cfg.max, targetDivisionStar + 1))}
                            className="w-9 h-9 rounded-lg bg-background border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {targetDivisionStar > cfg.min && (
                            <span className="text-green-400 text-xs font-bold ml-1">
                              +{formatRupiah(calculateExtraMythicCost(targetRank, targetDivisionStar))}
                            </span>
                          )}
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
                      {MYTHIC_STAR_CONFIG[targetRank] && targetDivisionStar > 0 ? ` (${targetDivisionStar})` : ""}
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
                    {perStarRanks.map((rank) => (
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
                        <p className="text-text-muted text-[10px]">/ {rank.id === "grading" ? "Match" : "Star"}{rank.isFlat && " (flat)"}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {!perStarRanks.find((r) => r.id === selectedStarRankId)?.isFlat && (
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
                )}
                {perStarRanks.find((r) => r.id === selectedStarRankId)?.isFlat && (
                  <div className="p-3 bg-yellow-400/5 rounded-xl border border-yellow-400/20">
                    <p className="text-yellow-400 text-xs font-bold">Flat Pricing (10 Match)</p>
                    <p className="text-text-muted text-[10px]">Harga tidak dikali jumlah match — sudah paket 10 match</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== GENDONG MODE ===== */}
            {mode === "gendong" && (
              <div className="bg-surface rounded-2xl border border-white/5 p-5 space-y-4">
                <div>
                  <label className="block text-sm text-text font-bold mb-3">Pilih Rank</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {gendongRanks.map((rank) => (
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

            {/* ===== CLASSIC MODE ===== */}
            {mode === "classic" && (
              <div className="bg-surface rounded-2xl border border-white/5 p-5 space-y-4">
                <div>
                  <label className="block text-sm text-text font-bold mb-3">Pilih Paket Classic 10 WIN</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {classicPackages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedClassicPkgId(pkg.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedClassicPkgId === pkg.id
                            ? "border-yellow-400 bg-yellow-400/5"
                            : "border-white/5 bg-background hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="text-text text-xs font-semibold">{pkg.title}</span>
                        </div>
                        <p className="text-yellow-400 text-sm font-bold">{formatRupiah(pkg.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-background rounded-xl border border-white/5">
                  <p className="text-text-muted text-xs">
                    Classic 10 WIN = 10 match dengan minimal 70% win rate. Cocok untuk push star cepat di rank Epic–Immortal.
                  </p>
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
                        <span>Harga Paket</span>
                        <span>{formatRupiah(result.basePrice - result.extraMythicCost)}</span>
                      </div>
                      {result.extraMythicCost > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Extra Mythic Stars</span>
                          <span>+{formatRupiah(result.extraMythicCost)}</span>
                        </div>
                      )}
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