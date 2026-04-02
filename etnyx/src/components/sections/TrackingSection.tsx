"use client";

import { useEffect, useState } from "react";
import { generateOrderId } from "@/utils/helpers";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, ArrowRight, Circle, MapPin, Search, Package, Shield, Headphones } from "lucide-react";
import Link from "next/link";

interface TimelineStep {
  status: "done" | "active" | "pending";
  title: string;
  subtitle: string;
  detail?: string;
}

export default function TrackingSection() {
  const { locale } = useLanguage();
  const [orderId, setOrderId] = useState("ETX-XXXXXXXX");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setOrderId(generateOrderId());
    const timer = setTimeout(() => setProgress(65), 500);
    return () => clearTimeout(timer);
  }, []);

  const t = {
    id: {
      title: "Order",
      titleHighlight: "Tracking",
      subtitle: "Pantau progress joki secara real-time",
      orderId: "Order ID",
      processing: "Sedang Diproses",
      overallProgress: "Progress Keseluruhan",
      lastUpdate: "Update terakhir:",
      ctaTitle: "Lacak Order Kamu",
      ctaDesc: "Masukkan Order ID untuk memantau progress joki rank kamu secara real-time.",
      ctaButton: "Track Order Sekarang",
      ctaFeatures: ["Real-time update", "100% Transparan", "Support 24/7"],
      steps: [
        { title: "Order Diterima", subtitle: "31 Mar 2026, 10:00 WIB" },
        { title: "Login Berhasil", subtitle: "31 Mar 2026, 10:15 WIB" },
        { title: "Sedang Push Rank", subtitle: "Legend II → Legend I", detail: "Win 3 match beruntun, winrate 78%" },
        { title: "Selesai", subtitle: "Menunggu..." },
      ],
    },
    en: {
      title: "Order",
      titleHighlight: "Tracking",
      subtitle: "Track your boosting progress in real-time",
      orderId: "Order ID",
      processing: "Processing",
      overallProgress: "Overall Progress",
      lastUpdate: "Last update:",
      ctaTitle: "Track Your Order",
      ctaDesc: "Enter your Order ID to monitor your rank boosting progress in real-time.",
      ctaButton: "Track Order Now",
      ctaFeatures: ["Real-time updates", "100% Transparent", "24/7 Support"],
      steps: [
        { title: "Order Received", subtitle: "Mar 31, 2026, 10:00 AM" },
        { title: "Login Success", subtitle: "Mar 31, 2026, 10:15 AM" },
        { title: "Pushing Rank", subtitle: "Legend II → Legend I", detail: "Won 3 matches in a row, 78% winrate" },
        { title: "Completed", subtitle: "Waiting..." },
      ],
    },
  };

  const txt = t[locale];

  const timelineSteps: TimelineStep[] = [
    { status: "done", title: txt.steps[0].title, subtitle: txt.steps[0].subtitle },
    { status: "done", title: txt.steps[1].title, subtitle: txt.steps[1].subtitle },
    { status: "active", title: txt.steps[2].title, subtitle: txt.steps[2].subtitle, detail: txt.steps[2].detail },
    { status: "pending", title: txt.steps[3].title, subtitle: txt.steps[3].subtitle },
  ];

  return (
    <section id="tracking" className="relative py-10 lg:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">TRACKING</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            {txt.title} <span className="text-accent">{txt.titleHighlight}</span>
          </h2>
          <p className="text-text-muted text-sm sm:text-base">
            {txt.subtitle}
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracking Card */}
        <div className="bg-white/[0.03] rounded-xl p-4 sm:p-6 border border-white/5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
            <div>
              <p className="text-sm text-text-muted mb-1">{txt.orderId}</p>
              <p className="font-mono text-lg font-bold text-accent">
                #{orderId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-warning rounded-full animate-pulse" />
              <span className="text-warning font-semibold">{txt.processing}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{txt.overallProgress}</span>
              <span className="text-accent font-bold">{progress}%</span>
            </div>
            <div className="h-3 bg-background rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary rounded-full relative transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {timelineSteps.map((step, index) => (
              <div key={index}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                      step.status === "done"
                        ? "bg-success/20"
                        : step.status === "active"
                        ? "bg-accent/20"
                        : "bg-white/5"
                    }`}
                  >
                    {step.status === "done" && (
                      <Check className="w-4 h-4 text-success" />
                    )}
                    {step.status === "active" && (
                      <>
                        <ArrowRight className="w-4 h-4 text-accent" />
                        <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-30" />
                      </>
                    )}
                    {step.status === "pending" && (
                      <Circle className="w-4 h-4 text-text-muted" />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 ${
                      step.status === "pending" ? "opacity-50" : ""
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        step.status === "active" ? "text-accent" : "text-text"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-text-muted">{step.subtitle}</p>
                    {step.detail && (
                      <div className="mt-2 bg-background/50 rounded-xl px-4 py-2 text-sm text-text-muted">
                        <span className="text-text-muted">{txt.lastUpdate}</span>{" "}
                        {step.detail}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`w-[2px] h-6 ml-4 ${
                      step.status === "done" ? "bg-success/30" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Column */}
        <div className="bg-white/[0.03] rounded-xl p-4 sm:p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
              <Search className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
              {txt.ctaTitle}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              {txt.ctaDesc}
            </p>

            <div className="space-y-3 mb-8">
              {[
                { icon: Package, text: txt.ctaFeatures[0] },
                { icon: Shield, text: txt.ctaFeatures[1] },
                { icon: Headphones, text: txt.ctaFeatures[2] },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-text text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/track"
            className="block w-full text-center gradient-primary px-6 py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
          >
            {txt.ctaButton}
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}
