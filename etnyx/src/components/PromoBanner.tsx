"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { Flame, X } from "lucide-react";

export default function PromoBanner() {
  const { locale } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [cmsText, setCmsText] = useState<string | null>(null);
  const [cmsLink, setCmsLink] = useState<string>("/order");
  const [cmsEnabled, setCmsEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  const t = {
    id: {
      discount: "DISKON 25%",
      code: "ETNYX25",
      cta: "Klaim",
    },
    en: {
      discount: "25% OFF",
      code: "ETNYX25",
      cta: "Claim",
    },
  };

  const txt = t[locale];

  // Fetch CMS promo banner settings
  useEffect(() => {
    fetch("/api/settings?keys=promo_banner")
      .then((res) => res.json())
      .then((data) => {
        if (data.promo_banner) {
          if (data.promo_banner.text) setCmsText(data.promo_banner.text);
          if (data.promo_banner.link) setCmsLink(data.promo_banner.link);
          if (data.promo_banner.isVisible === false) setCmsEnabled(false);
        }
      })
      .catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Show banner after small delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || isDismissed || !cmsEnabled) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Content — left aligned on desktop, centered on mobile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center sm:justify-center">
            <Flame className="w-3.5 h-3.5 text-background hidden sm:block" />
            {cmsText ? (
              <span className="text-background font-bold text-[10px] sm:text-xs">{cmsText}</span>
            ) : (
              <>
                <span className="bg-background/20 px-1.5 sm:px-2 py-0.5 rounded-full text-background font-bold text-[10px] sm:text-xs">
                  {txt.discount}
                </span>
                <code className="bg-background text-primary px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                  {txt.code}
                </code>
              </>
            )}
            <div className="flex items-center gap-0.5 font-mono text-background font-bold text-[10px] sm:text-xs">
              <span className="bg-background/20 px-1 sm:px-1.5 py-0.5 rounded">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              :
              <span className="bg-background/20 px-1 sm:px-1.5 py-0.5 rounded">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              :
              <span className="bg-background/20 px-1 sm:px-1.5 py-0.5 rounded">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
            <Link
              href={cmsLink}
              className="hidden sm:inline-flex bg-background text-primary px-3 py-1 rounded-full font-bold text-xs hover:bg-background/90 transition-colors whitespace-nowrap"
            >
              {txt.cta} →
            </Link>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="text-background/70 hover:text-background transition-colors p-0.5 flex-shrink-0"
            aria-label="Close promo banner"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
