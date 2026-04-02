"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, CheckCircle, Rocket, XCircle, Check, ChevronLeft, Shield, Zap, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ReactNode } from "react";

interface OrderData {
  order_id: string;
  username: string;
  current_rank: string;
  target_rank: string;
  package: string;
  status: string;
  progress: number;
  current_progress_rank: string | null;
  created_at: string;
  updated_at: string;
}

const rankLabels: Record<string, string> = {
  warrior: "Warrior",
  elite: "Elite",
  master: "Master",
  grandmaster: "Grandmaster",
  epic: "Epic",
  legend: "Legend",
  mythic: "Mythic",
  mythicglory: "Mythic Glory",
};

const statusConfig: Record<string, { label: string; color: string; icon: ReactNode }> = {
  pending: { label: "Menunggu Konfirmasi", color: "text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "Dikonfirmasi", color: "text-blue-400", icon: <Check className="w-4 h-4" /> },
  in_progress: { label: "Sedang Dikerjakan", color: "text-accent", icon: <Rocket className="w-4 h-4" /> },
  completed: { label: "Selesai", color: "text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "Dibatalkan", color: "text-red-400", icon: <XCircle className="w-4 h-4" /> },
};

function LangToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <button
      onClick={() => setLocale(locale === "id" ? "en" : "id")}
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-white/10 text-text text-xs hover:bg-white/5 transition-colors"
    >
      <span>{locale === "id" ? "🇮🇩" : "🇺🇸"}</span>
      <span className="font-medium">{locale.toUpperCase()}</span>
    </button>
  );
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-track from URL params (?id= or ?order_id=)
  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("order_id");
    if (idParam) {
      setOrderId(idParam);
      trackOrder(idParam);
    }
  }, [searchParams]);

  const trackOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`/api/track?id=${encodeURIComponent(id.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Order tidak ditemukan");
        return;
      }

      setOrder(data);
    } catch {
      setError("Gagal mengambil data. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError("Masukkan Order ID");
      return;
    }
    trackOrder(orderId);
  };

  const getStatusStep = (status: string): number => {
    const steps = ["pending", "confirmed", "in_progress", "completed"];
    return steps.indexOf(status);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <Image
              src="/logo/circle-landscape.webp"
              alt="ETNYX"
              width={100}
              height={28}
              className="h-6 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <Shield className="w-3.5 h-3.5 text-success" /> Aman
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Cepat
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <MessageCircle className="w-3.5 h-3.5 text-accent" /> 24/7
            </span>
            <LangToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Lacak <span className="text-primary">Order</span> Kamu
          </h1>
          <p className="text-muted max-w-md mx-auto">
            Masukkan Order ID untuk melihat progress joki kamu secara real-time
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleTrack} className="flex gap-3">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="Contoh: ETX-ABC12345"
              className="flex-1 px-4 py-3 bg-surface border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-background font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Mencari...
                </span>
              ) : (
                "Lacak"
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}
        </div>

        {/* Order Result */}
        {order && (
          <div className="max-w-2xl mx-auto">
            {/* Order Card */}
            <div className="bg-surface rounded-2xl p-6 md:p-8 border border-surface/50 shadow-xl">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-surface/50">
                <div>
                  <p className="text-muted text-sm mb-1">Order ID</p>
                  <p className="text-xl font-bold text-primary">{order.order_id}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-surface ${statusConfig[order.status]?.color || "text-muted"}`}>
                  <span>{statusConfig[order.status]?.icon}</span>
                  <span className="font-medium">{statusConfig[order.status]?.label || order.status}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted text-sm">Progress</span>
                  <span className="text-accent font-bold text-lg">{order.progress}%</span>
                </div>
                <div className="h-4 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>
                {order.current_progress_rank && (
                  <p className="text-sm text-muted mt-2">
                    Sedang push di rank: <span className="text-accent font-medium">{rankLabels[order.current_progress_rank] || order.current_progress_rank}</span>
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="mb-8">
                <p className="text-muted text-sm mb-4">Status Timeline</p>
                <div className="space-y-4">
                  {["pending", "confirmed", "in_progress", "completed"].map((step, idx) => {
                    const currentStep = getStatusStep(order.status);
                    const isCompleted = idx < currentStep || (order.status === "completed" && idx === 3);
                    const isCurrent = idx === currentStep && order.status !== "completed";
                    const isCancelled = order.status === "cancelled";

                    return (
                      <div key={step} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCancelled && idx >= currentStep
                            ? "bg-red-500/20 text-red-400"
                            : isCompleted
                            ? "bg-accent/20 text-accent"
                            : isCurrent
                            ? "bg-primary/20 text-primary animate-pulse"
                            : "bg-surface text-muted"
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            isCompleted ? "text-text" : isCurrent ? "text-primary" : "text-muted"
                          }`}>
                            {statusConfig[step]?.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-xl">
                <div>
                  <p className="text-muted text-xs mb-1">Username</p>
                  <p className="text-text font-medium">{order.username}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Paket</p>
                  <p className="text-text font-medium">{order.package}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Rank Awal</p>
                  <p className="text-text font-medium">{rankLabels[order.current_rank] || order.current_rank}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Target Rank</p>
                  <p className="text-accent font-medium">{rankLabels[order.target_rank] || order.target_rank}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Tanggal Order</p>
                  <p className="text-text font-medium">{new Date(order.created_at).toLocaleDateString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Update Terakhir</p>
                  <p className="text-text font-medium">{new Date(order.updated_at).toLocaleDateString("id-ID")}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 text-center">
                <p className="text-muted text-sm mb-3">Ada pertanyaan tentang order ini?</p>
                <a
                  href={`https://wa.me/6281414131321?text=${encodeURIComponent(`Halo kak, saya mau tanya tentang order ${order.order_id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat via WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!order && !loading && (
          <div className="text-center text-muted">
            <p className="mb-2">Order ID ada di chat WhatsApp konfirmasi order kamu</p>
            <p className="text-sm">Format: ETX-XXXXXXXX</p>
          </div>
        )}
      </div>
    </main>
  );
}
