"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { Zap, Crown, Shield, Star, Trophy, Flame, Check, Users } from "lucide-react";
import CardCarousel from "@/components/CardCarousel";

interface CatalogPackage {
  id: string;
  title: string;
  price: number;
}

interface CatalogCategory {
  id: string;
  title: string;
  packages: CatalogPackage[];
}

function formatPriceLabel(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(price);
}

const defaultHighlights = [
  {
    id: "per-star",
    name: "Per Star",
    priceLabel: "5K",
    priceUnit: "/star",
    description: "Joki per bintang, fleksibel sesuai budget",
    features: [
      "Mulai dari Grand Master - Mythic Immortal",
      "Harga per star transparan",
      "Report progress harian",
      "Support chat 24/7",
    ],
    highlighted: false,
    cta: "/order?mode=perstar",
    icon: "star",
  },
  {
    id: "paket-rank",
    name: "Paket Rank",
    priceLabel: "125K",
    priceUnit: "/paket",
    description: "Langsung naik banyak rank sekaligus",
    features: [
      "Paket GM → Epic sampai Glory → Immortal",
      "Harga bundling lebih hemat",
      "Request 3 hero favoritmu",
      "Dedicated booster",
      "Priority support",
    ],
    highlighted: true,
    badge: "BEST SELLER",
    cta: "/order?mode=paket",
    icon: "trophy",
  },
  {
    id: "promo",
    name: "Rush Promo",
    priceLabel: "32K",
    priceUnit: "/5 star",
    description: "Paket promo terbatas, harga spesial!",
    features: [
      "Rush 5 & 9 star diskon s/d 19%",
      "Epic, Legend, Mythic, Honor, Glory",
      "Bonus star untuk paket 9",
      "Pengiriman INSTAN",
    ],
    highlighted: false,
    cta: "/order?mode=paket",
    icon: "zap",
  },
  {
    id: "gendong",
    name: "Joki Gendong",
    priceLabel: "9K",
    priceUnit: "/star",
    description: "Main bareng booster pro, rank naik bersama!",
    features: [
      "Duo queue dengan booster Mythic Glory",
      "Kamu tetap main, booster carry",
      "Belajar strategi dari pro player",
      "Winrate lebih tinggi",
      "Akun 100% aman di tangan kamu",
    ],
    highlighted: true,
    badge: "BEST SELLER",
    cta: "/order?mode=gendong",
    icon: "users",
  },
];

export default function PricingSection() {
  const { locale } = useLanguage();
  const [packageHighlights, setPackageHighlights] = useState(defaultHighlights);
  const [seasonLabel, setSeasonLabel] = useState("");

  useEffect(() => {
    fetch("/api/settings?keys=pricing_catalog,perstar_pricing,gendong_pricing,season_pricing")
      .then((res) => res.json())
      .then((data) => {
        // Determine season multiplier
        let sMult = 1;
        if (data.season_pricing && data.season_pricing.isEnabled && Array.isArray(data.season_pricing.phases)) {
          const now = new Date();
          const sorted = [...data.season_pricing.phases]
            .filter((p: { startDate: string }) => p.startDate && new Date(p.startDate) <= now)
            .sort((a: { startDate: string }, b: { startDate: string }) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          if (sorted.length > 0) {
            sMult = sorted[0].multiplier || 1;
            setSeasonLabel(sorted[0].label || "");
          }
        }
        const applyS = (price: number) => Math.round(price * sMult);

        const catalog: CatalogCategory[] = data.pricing_catalog && Array.isArray(data.pricing_catalog) ? data.pricing_catalog : [];
        const perStar = catalog.find((c) => c.id === "per-star");
        const paketGm = catalog.find((c) => c.id === "paket-gm");
        const promo = catalog.find((c) => c.id === "promo");

        const perStarMin = data.perstar_pricing && Array.isArray(data.perstar_pricing) && data.perstar_pricing.length > 0
          ? Math.min(...data.perstar_pricing.map((t: { price: number }) => t.price))
          : perStar?.packages?.length ? Math.min(...perStar.packages.map((p) => p.price)) : null;

        const gendongMin = data.gendong_pricing && Array.isArray(data.gendong_pricing) && data.gendong_pricing.length > 0
          ? Math.min(...data.gendong_pricing.map((t: { price: number }) => t.price))
          : null;

        setPackageHighlights((prev) =>
          prev.map((h) => {
            if (h.id === "per-star" && perStarMin) {
              return { ...h, priceLabel: formatPriceLabel(applyS(perStarMin)) };
            }
            if (h.id === "paket-rank" && paketGm?.packages?.length) {
              const minPrice = Math.min(...paketGm.packages.map((p) => p.price));
              return { ...h, priceLabel: formatPriceLabel(applyS(minPrice)) };
            }
            if (h.id === "promo" && promo?.packages?.length) {
              const minPrice = Math.min(...promo.packages.map((p) => p.price));
              return { ...h, priceLabel: formatPriceLabel(applyS(minPrice)) };
            }
            if (h.id === "gendong" && gendongMin) {
              return { ...h, priceLabel: formatPriceLabel(applyS(gendongMin)) };
            }
            return h;
          })
        );
      })
      .catch(() => {});
  }, []);

  const t = {
    id: {
      title: "Pilih",
      titleHighlight: "Paket",
      subtitle: "Paket joki yang sesuai kebutuhanmu",
      choose: "Lihat Paket",
    },
    en: {
      title: "Choose",
      titleHighlight: "Package",
      subtitle: "Boosting packages that fit your needs",
      choose: "View Packages",
    },
  };

  const txt = t[locale];
  const router = useRouter();

  return (
    <section id="pricing" className="relative py-10 lg:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-3">
            <Crown className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
              {locale === "id" ? "PAKET HARGA" : "PRICING"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            {txt.title}{" "}
            <span className="text-accent">{txt.titleHighlight}</span>
          </h2>
          <p className="text-text-muted text-sm sm:text-base">{txt.subtitle}</p>
          {seasonLabel && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
              <Flame className="w-3 h-3" />
              {seasonLabel} {locale === "id" ? "— Harga spesial berlaku!" : "— Special prices active!"}
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <CardCarousel desktopCols={3} tabletCols={2}>
          {packageHighlights.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl p-5 lg:p-6 border transition-all duration-300 hover:-translate-y-1 relative h-full ${
                tier.highlighted
                  ? "bg-white/[0.06] border-accent/30 shadow-[0_0_30px_rgba(var(--color-accent-rgb,0,255,200),0.08)]"
                  : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="flex justify-center mb-3">
                  <span className="bg-accent/20 border border-accent/30 px-4 py-1.5 rounded-full text-xs font-bold text-accent whitespace-nowrap inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier Info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl text-accent">
                    {tier.icon === "star" && <Star className="w-7 h-7" />}
                    {tier.icon === "trophy" && <Trophy className="w-7 h-7" />}
                    {tier.icon === "zap" && <Zap className="w-7 h-7" />}
                    {tier.icon === "users" && <Users className="w-7 h-7" />}
                  </span>
                  <h3 className="text-lg font-bold text-text">{tier.name}</h3>
                </div>
                <p className="text-text-muted text-sm">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-text-muted text-xs">
                  {locale === "id" ? "Mulai dari" : "Starting at"}
                </span>
                <div>
                  <span
                    className={`text-3xl font-extrabold ${
                      tier.highlighted ? "text-accent" : "text-text"
                    }`}
                  >
                    Rp {tier.priceLabel}
                  </span>
                  <span className="text-text-muted">{tier.priceUnit}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {tier.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-sm text-text"
                  >
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => router.push(tier.cta)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  tier.highlighted
                    ? "bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30"
                    : "border border-white/10 text-text-muted hover:border-accent/30 hover:text-accent"
                }`}
              >
                {txt.choose}
              </button>
            </div>
          ))}
        </CardCarousel>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-success" />{" "}
            {locale === "id" ? "Garansi Aman 100%" : "100% Safe Guarantee"}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-400" />{" "}
            {locale === "id" ? "Pengiriman Instan" : "Instant Delivery"}
          </span>
          <span className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-purple-400" />{" "}
            {locale === "id" ? "Booster Pro Player" : "Pro Player Boosters"}
          </span>
        </div>
      </div>
    </section>
  );
}
