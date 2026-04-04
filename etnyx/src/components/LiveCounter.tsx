"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Format number without locale issues
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function LiveCounter() {
  const { locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [counts, setCounts] = useState({
    ordersThisMonth: 0,
    activeNow: 0,
    successRate: 0,
  });

  const t = {
    id: {
      ordersMonth: "Order Bulan Ini",
      activeNow: "Sedang Dikerjakan",
      successRate: "Tingkat Sukses",
    },
    en: {
      ordersMonth: "Orders This Month",
      activeNow: "Active Now",
      successRate: "Success Rate",
    },
  };

  const txt = t[locale];

  useEffect(() => {
    setMounted(true);
    
    const targetCounts = {
      ordersThisMonth: 38,
      activeNow: 3,
      successRate: 96,
    };

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCounts({
        ordersThisMonth: Math.floor(targetCounts.ordersThisMonth * easeOut),
        activeNow: Math.floor(targetCounts.activeNow * easeOut),
        successRate: Math.floor(targetCounts.successRate * easeOut),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounts(targetCounts);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <section className="py-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/3 via-transparent to-accent/3" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0">
            <div className="bg-white/[0.03] rounded-xl p-4 h-24 border border-white/5" />
            <div className="bg-white/[0.03] rounded-xl p-4 h-24 border border-white/5" />
            <div className="bg-white/[0.03] rounded-xl p-4 h-24 border border-white/5" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/3 via-transparent to-accent/3" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-1000 opacity-100 translate-y-0">
          {/* Orders This Month */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-accent/20 text-center group hover:border-accent/30 hover:bg-white/[0.05] transition-all hover:scale-105">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-3 h-3 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-success font-medium uppercase tracking-wider">Live</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-accent mb-1">
              {formatNumber(counts.ordersThisMonth)}+
            </p>
            <p className="text-muted text-sm">{txt.ordersMonth}</p>
          </div>

          {/* Active Now */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-accent/20 text-center group hover:border-accent/30 hover:bg-white/[0.05] transition-all hover:scale-105">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-3 h-3 bg-accent rounded-full animate-bounce" />
              <span className="text-xs text-accent font-medium uppercase tracking-wider">Active</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-accent mb-1">
              {counts.activeNow}
            </p>
            <p className="text-muted text-sm">{txt.activeNow}</p>
          </div>

          {/* Success Rate */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-success/20 text-center group hover:border-success/30 hover:bg-white/[0.05] transition-all hover:scale-105">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-success font-medium uppercase tracking-wider">Verified</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-success mb-1">
              {counts.successRate}%
            </p>
            <p className="text-muted text-sm">{txt.successRate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
