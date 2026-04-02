"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Rocket, Shield, Zap } from "lucide-react";

export default function CTASection() {
  const { locale } = useLanguage();

  const t = {
    id: {
      title: "Siap Push Rank?",
      subtitle: "Gabung 3000+ gamer yang sudah naik rank bersama ETNYX. Proses cepat, akun aman, hasil terjamin.",
      cta: "Order Sekarang",
      trust1: "Garansi Aman",
      trust2: "Proses Instan",
    },
    en: {
      title: "Ready to Push Rank?",
      subtitle: "Join 3000+ gamers who've leveled up with ETNYX. Fast process, safe accounts, guaranteed results.",
      cta: "Order Now",
      trust1: "Safe Guarantee",
      trust2: "Instant Process",
    },
  };

  const txt = t[locale];

  return (
    <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-white/[0.03] p-6 sm:p-8 lg:p-10 text-center">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-accent/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-accent/5 rounded-full blur-2xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text mb-3">
              {txt.title}
            </h2>
            <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto mb-6">
              {txt.subtitle}
            </p>

            <Link
              href="/order"
              className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-accent px-6 py-3 rounded-xl font-bold text-base hover:bg-accent/30 transition-all shadow-[0_0_20px_rgba(var(--color-accent-rgb,0,255,200),0.1)]"
            >
              <Rocket className="w-5 h-5" />
              {txt.cta}
            </Link>

            <div className="flex items-center justify-center gap-4 mt-5 text-text-muted text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-accent" /> {txt.trust1}
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-accent" /> {txt.trust2}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
