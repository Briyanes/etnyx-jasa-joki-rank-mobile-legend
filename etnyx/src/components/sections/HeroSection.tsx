"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, ArrowRight, Flame } from "lucide-react";

interface HeroSettings {
  headline?: string;
  subheadline?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  isVisible?: boolean;
}

export default function HeroSection() {
  const { locale } = useLanguage();
  const [cms, setCms] = useState<HeroSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings?keys=hero")
      .then((res) => res.json())
      .then((data) => { if (data.hero) setCms(data.hero); })
      .catch(() => {});
  }, []);
  
  const content = {
    id: {
      badge: "100+ Order Minggu Ini",
      headline1: cms?.headline?.split(",")[0]?.trim() || "Push Rank,",
      headline2: cms?.headline?.split(",").slice(1).join(",")?.trim() || "Tanpa Main.",
      subtitle: cms?.subheadline || "Platform joki ML tercepat. Pilih rank, order, selesai. Semua dalam hitungan detik.",
      cta1: cms?.ctaPrimary || "Order Sekarang",
      cta2: cms?.ctaSecondary || "Lihat Paket",
      stat1: "Order Selesai",
      stat2: "Sukses Rate",
      stat3: "Support",
      rankStart: "Rank Awal",
      rankTarget: "Target",
      progress: "Progress",
      status: "Sedang push di Legend II... Win streak 5",
    },
    en: {
      badge: "100+ Orders This Week",
      headline1: "Push Rank,",
      headline2: "Without Playing.",
      subtitle: "Fastest ML boosting platform. Pick rank, order, done. All in seconds.",
      cta1: "Order Now",
      cta2: "View Packages",
      stat1: "Orders Done",
      stat2: "Success Rate",
      stat3: "Support",
      rankStart: "Starting Rank",
      rankTarget: "Target",
      progress: "Progress",
      status: "Pushing at Legend II... Win streak 5",
    },
  };

  const t = content[locale];

  if (cms?.isVisible === false) return null;

  return (
    <section className="pt-36 sm:pt-32 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8 sm:min-h-[85vh] lg:h-screen flex items-start sm:items-center relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/hero-bg.jpg')`,
          }}
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        {/* Animated Particles */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-accent rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          {/* Left Content */}
          <div className="space-y-4 lg:space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1.5 text-xs sm:text-sm">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-accent font-medium">{t.badge}</span>
            </div>

            {/* Headline */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-text">
                {t.headline1}
                <br />
                <span className="gradient-text">{t.headline2}</span>
              </h1>
              <p className="text-text-muted text-sm sm:text-lg max-w-lg">
                {t.subtitle}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/order"
                className="gradient-primary px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-white font-bold text-sm sm:text-base text-center hover:opacity-90 transition-opacity glow-accent">
                {t.cta1}
              </Link>
              <Link
                href="#pricing"
                className="border border-white/10 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base text-center text-text hover:bg-white/5 transition-colors">
                {t.cta2}
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-5 sm:gap-6 pt-1 sm:pt-2">
              <div>
                <p className="text-lg sm:text-xl font-bold text-text">3K+</p>
                <p className="text-text-muted text-xs">{t.stat1}</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-text">99%</p>
                <p className="text-text-muted text-xs">{t.stat2}</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-text">24/7</p>
                <p className="text-text-muted text-xs">{t.stat3}</p>
              </div>
            </div>
          </div>

          {/* Right - Dashboard Preview Card */}
          <div className="hidden lg:block lg:pl-8">
            <div className="bg-surface rounded-2xl p-5 border border-white/5 glow-primary relative">
              {/* Live Badge */}
              <div className="absolute -top-3 -right-3 bg-success/20 border border-success/30 text-success px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                LIVE
              </div>

              {/* User Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">GamerPro_ID</p>
                    <p className="text-sm text-text-muted">ID: 892847192</p>
                  </div>
                </div>
                <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-semibold">
                  PREMIUM
                </span>
              </div>

              {/* Rank Progress */}
              <div className="bg-background/50 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-2">{t.rankStart}</p>
                    <div className="flex flex-col items-center gap-1">
                      <Image src="/icons-tier/Legend.webp" alt="Legend" width={40} height={40} className="drop-shadow-lg" />
                      <span className="text-yellow-400 font-bold text-xs">Legend V</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-[2px] bg-gradient-to-r from-yellow-400 to-primary" />
                      <ArrowRight className="w-5 h-5 text-accent" />
                      <div className="w-8 h-[2px] bg-gradient-to-r from-primary to-accent" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-2">{t.rankTarget}</p>
                    <div className="flex flex-col items-center gap-1">
                      <Image src="/icons-tier/Mythic.webp" alt="Mythic" width={40} height={40} className="drop-shadow-lg" />
                      <span className="text-purple-400 font-bold text-xs">Mythic</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t.progress}</span>
                  <span className="text-accent font-bold">78%</span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full w-[78%] gradient-primary rounded-full relative"
                    style={{
                      boxShadow: "0 0 20px rgba(45, 212, 191, 0.5)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm text-text-muted bg-background/30 rounded-xl px-4 py-3">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                {t.status} <Flame className="w-4 h-4 text-orange-400 inline" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
