"use client";

import { useEffect, useState } from "react";
import { generateOrderId } from "@/utils/helpers";

interface TimelineStep {
  status: "done" | "active" | "pending";
  title: string;
  subtitle: string;
  detail?: string;
}

export default function TrackingSection() {
  const [orderId, setOrderId] = useState("ETX-XXXXXXXX");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setOrderId(generateOrderId());
    // Animate progress on mount
    const timer = setTimeout(() => setProgress(65), 500);
    return () => clearTimeout(timer);
  }, []);

  const timelineSteps: TimelineStep[] = [
    {
      status: "done",
      title: "Order Diterima",
      subtitle: "31 Mar 2026, 10:00 WIB",
    },
    {
      status: "done",
      title: "Login Berhasil",
      subtitle: "31 Mar 2026, 10:15 WIB",
    },
    {
      status: "active",
      title: "Sedang Push Rank",
      subtitle: "Legend II → Legend I",
      detail: "Win 3 match beruntun, winrate 78%",
    },
    {
      status: "pending",
      title: "Selesai",
      subtitle: "Menunggu...",
    },
  ];

  return (
    <section id="tracking" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Order <span className="gradient-text">Tracking</span>
          </h2>
          <p className="text-text-muted text-lg">
            Pantau progress joki secara real-time
          </p>
        </div>

        {/* Tracking Card */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
            <div>
              <p className="text-sm text-text-muted mb-1">Order ID</p>
              <p className="font-mono text-xl font-bold text-accent">
                #{orderId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-warning rounded-full animate-pulse" />
              <span className="text-warning font-semibold">Sedang Diproses</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 mb-10">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Progress Keseluruhan</span>
              <span className="text-accent font-bold">{progress}%</span>
            </div>
            <div className="h-4 bg-background rounded-full overflow-hidden">
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
                      <span className="text-success">✓</span>
                    )}
                    {step.status === "active" && (
                      <>
                        <span className="text-accent">➜</span>
                        <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-30" />
                      </>
                    )}
                    {step.status === "pending" && (
                      <span className="text-text-muted">○</span>
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
                        <span className="text-text-muted">Update terakhir:</span>{" "}
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
      </div>
    </section>
  );
}
