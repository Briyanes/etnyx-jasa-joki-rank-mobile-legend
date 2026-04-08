"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/utils/helpers";
import {
  ArrowLeft, Clock, CheckCircle, Rocket, XCircle, Download, Trophy,
  Star, Swords, Target, Timer, Camera, Crown, Package, CreditCard,
  Calendar, User, Shield, Zap, ChevronDown, ChevronUp,
} from "lucide-react";

interface Submission {
  id: string;
  stars_gained: number;
  mvp_count: number;
  savage_count: number;
  maniac_count: number;
  matches_played: number;
  win_count: number;
  duration_minutes: number;
  screenshots: string[];
  submitted_at: string;
}

interface StatusLog {
  action: string;
  new_value: string;
  created_at: string;
}

interface OrderDetail {
  order_id: string;
  username: string;
  game_id: string;
  current_rank: string;
  target_rank: string;
  current_star: number | null;
  target_star: number | null;
  package: string;
  package_title: string | null;
  total_price: number;
  original_price: number | null;
  discount_amount: number | null;
  promo_code: string | null;
  status: string;
  progress: number;
  current_progress_rank: string | null;
  is_express: boolean;
  is_premium: boolean;
  login_method: string | null;
  hero_request: string | null;
  notes: string | null;
  payment_method: string | null;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  sla_deadline: string | null;
  worker_name: string | null;
  submissions: Submission[];
  status_logs: StatusLog[];
}

const rankLabels: Record<string, string> = {
  warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster",
  epic: "Epic", legend: "Legend", mythic: "Mythic", mythicgrading: "Mythic Grading",
  mythichonor: "Mythic Honor", mythicglory: "Mythic Glory", mythicimmortal: "Mythic Immortal",
};

const STAR_LABELS: Record<number, string> = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };

function rankWithStar(rank: string, star?: number | null): string {
  const label = rankLabels[rank] || rank;
  if (star && STAR_LABELS[star]) return `${label} ${STAR_LABELS[star]}`;
  return label;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Menunggu", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "Dikonfirmasi", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <CheckCircle className="w-4 h-4" /> },
  in_progress: { label: "Dalam Proses", color: "bg-accent/20 text-accent border-accent/30", icon: <Rocket className="w-4 h-4" /> },
  completed: { label: "Selesai", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "Dibatalkan", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-4 h-4" /> },
};

const timelineIcons: Record<string, React.ReactNode> = {
  created: <Package className="w-4 h-4" />,
  status_change: <Rocket className="w-4 h-4" />,
  status_confirmed: <CheckCircle className="w-4 h-4" />,
  status_in_progress: <Rocket className="w-4 h-4" />,
  status_completed: <Trophy className="w-4 h-4" />,
  status_cancelled: <XCircle className="w-4 h-4" />,
  payment_confirmed: <CreditCard className="w-4 h-4" />,
  assigned: <User className="w-4 h-4" />,
};

const timelineLabels: Record<string, string> = {
  created: "Order dibuat",
  status_change: "Status diperbarui",
  status_confirmed: "Order dikonfirmasi",
  status_in_progress: "Proses joki dimulai",
  status_completed: "Order selesai",
  status_cancelled: "Order dibatalkan",
  payment_confirmed: "Pembayaran diterima",
  assigned: "Worker ditugaskan",
};

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Order ID tidak ditemukan");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/customer/order-detail?order_id=${encodeURIComponent(orderId)}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Gagal memuat detail order");
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch {
        setError("Gagal memuat detail order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const handleDownloadInvoice = () => {
    if (!order) return;
    window.open(`/api/invoice?orderId=${order.order_id}&format=pdf`, "_blank");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || "Order tidak ditemukan"}</p>
          <Link href="/dashboard" className="text-primary hover:underline">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const sc = statusConfig[order.status] || statusConfig.pending;
  const totalStats = order.submissions.reduce(
    (acc, s) => ({
      stars: acc.stars + s.stars_gained,
      mvp: acc.mvp + s.mvp_count,
      savage: acc.savage + s.savage_count,
      maniac: acc.maniac + s.maniac_count,
      matches: acc.matches + s.matches_played,
      wins: acc.wins + s.win_count,
      duration: acc.duration + s.duration_minutes,
    }),
    { stars: 0, mvp: 0, savage: 0, maniac: 0, matches: 0, wins: 0, duration: 0 }
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface/50 bg-surface/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-surface rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-primary">{order.order_id}</h1>
              <p className="text-xs text-muted">Detail Order</p>
            </div>
          </div>
          <button
            onClick={handleDownloadInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Invoice
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Status & Progress */}
        <div className="bg-surface rounded-xl p-6 border border-surface/50">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${sc.color}`}>
              {sc.icon}
              {sc.label}
            </div>
            {order.is_express && (
              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                <Zap className="w-3 h-3" /> Express
              </span>
            )}
            {order.is_premium && (
              <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {order.status === "in_progress" && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Progress</span>
                <span className="text-accent font-bold">{order.progress}%</span>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
              {order.current_progress_rank && (
                <p className="text-xs text-muted mt-2">
                  Sedang push di: <span className="text-accent font-medium">{rankLabels[order.current_progress_rank] || order.current_progress_rank}</span>
                </p>
              )}
            </div>
          )}

          {/* Rank Info */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <p className="text-xs text-muted mb-1">Dari</p>
              <p className="text-lg font-bold text-text">{rankWithStar(order.current_rank, order.current_star)}</p>
            </div>
            <div className="text-primary text-2xl">→</div>
            <div className="text-center">
              <p className="text-xs text-muted mb-1">Target</p>
              <p className="text-lg font-bold text-primary">{rankWithStar(order.target_rank, order.target_star)}</p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-surface rounded-xl p-6 border border-surface/50">
          <h3 className="font-bold text-text mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Informasi Order
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted text-xs">Username</p>
              <p className="text-text font-medium">{order.username}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Game ID</p>
              <p className="text-text font-medium">{order.game_id}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Paket</p>
              <p className="text-text font-medium">{order.package_title || order.package}</p>
            </div>
            {order.login_method && (
              <div>
                <p className="text-muted text-xs">Login Method</p>
                <p className="text-text font-medium capitalize">{order.login_method}</p>
              </div>
            )}
            <div>
              <p className="text-muted text-xs">Tanggal Order</p>
              <p className="text-text font-medium">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Update Terakhir</p>
              <p className="text-text font-medium">{new Date(order.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            {order.worker_name && (
              <div>
                <p className="text-muted text-xs">Worker</p>
                <p className="text-text font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-green-400" /> {order.worker_name}
                </p>
              </div>
            )}
            {order.hero_request && (
              <div className="col-span-2">
                <p className="text-muted text-xs">Hero Request</p>
                <p className="text-text font-medium">{order.hero_request}</p>
              </div>
            )}
            {order.notes && (
              <div className="col-span-2">
                <p className="text-muted text-xs">Catatan</p>
                <p className="text-text font-medium">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-surface rounded-xl p-6 border border-surface/50">
          <h3 className="font-bold text-text mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Pembayaran
          </h3>
          <div className="space-y-3">
            {order.original_price && order.discount_amount && order.discount_amount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Harga asli</span>
                  <span className="text-text line-through">{formatRupiah(order.original_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Diskon {order.promo_code && `(${order.promo_code})`}</span>
                  <span className="text-green-400">-{formatRupiah(order.discount_amount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-base font-bold border-t border-surface/50 pt-3">
              <span className="text-text">Total</span>
              <span className="text-primary">{formatRupiah(order.total_price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Metode</span>
              <span className="text-text capitalize">{order.payment_method || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Status Bayar</span>
              <span className={`font-medium ${order.payment_status === "paid" ? "text-green-400" : "text-yellow-400"}`}>
                {order.payment_status === "paid" ? "Lunas" : "Belum Bayar"}
              </span>
            </div>
            {order.paid_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tanggal Bayar</span>
                <span className="text-text">{new Date(order.paid_at).toLocaleDateString("id-ID")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Worker Submissions */}
        {order.submissions.length > 0 && (
          <div className="bg-surface rounded-xl p-6 border border-surface/50">
            <h3 className="font-bold text-text mb-4 flex items-center gap-2">
              <Swords className="w-4 h-4 text-primary" /> Progress Worker
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-background rounded-lg p-3 text-center">
                <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{totalStats.stars}</p>
                <p className="text-xs text-muted">Stars</p>
              </div>
              <div className="bg-background rounded-lg p-3 text-center">
                <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{totalStats.matches}</p>
                <p className="text-xs text-muted">Matches</p>
              </div>
              <div className="bg-background rounded-lg p-3 text-center">
                <Trophy className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{totalStats.matches > 0 ? Math.round((totalStats.wins / totalStats.matches) * 100) : 0}%</p>
                <p className="text-xs text-muted">Win Rate</p>
              </div>
              <div className="bg-background rounded-lg p-3 text-center">
                <Timer className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{Math.round(totalStats.duration / 60)}j</p>
                <p className="text-xs text-muted">Durasi</p>
              </div>
            </div>

            {/* Submission List */}
            <div className="space-y-3">
              {order.submissions.map((sub, i) => (
                <div key={sub.id} className="border border-surface/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted font-mono">#{order.submissions.length - i}</span>
                      <div className="text-left">
                        <p className="text-sm text-text font-medium">
                          +{sub.stars_gained} Stars · {sub.matches_played} Match · {sub.win_count}W
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(sub.submitted_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {expandedSubmission === sub.id ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                  </button>
                  {expandedSubmission === sub.id && (
                    <div className="p-3 pt-0 border-t border-surface/30">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-background rounded p-2 text-center">
                          <p className="text-yellow-400 font-bold">{sub.mvp_count}</p>
                          <p className="text-muted">MVP</p>
                        </div>
                        <div className="bg-background rounded p-2 text-center">
                          <p className="text-red-400 font-bold">{sub.savage_count}</p>
                          <p className="text-muted">Savage</p>
                        </div>
                        <div className="bg-background rounded p-2 text-center">
                          <p className="text-purple-400 font-bold">{sub.maniac_count}</p>
                          <p className="text-muted">Maniac</p>
                        </div>
                      </div>
                      {sub.screenshots && sub.screenshots.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted mb-2 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Screenshots
                          </p>
                          <div className="flex gap-2 overflow-x-auto">
                            {sub.screenshots.map((url, si) => (
                              <a key={si} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                <img src={url} alt={`Screenshot ${si + 1}`} className="w-20 h-20 rounded-lg object-cover border border-surface/50" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {order.status_logs.length > 0 && (
          <div className="bg-surface rounded-xl p-6 border border-surface/50">
            <h3 className="font-bold text-text mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Timeline
            </h3>
            <div className="space-y-0">
              {order.status_logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      i === order.status_logs.length - 1 ? "bg-primary/20 text-primary" : "bg-surface text-muted"
                    }`}>
                      {timelineIcons[log.action] || <Clock className="w-4 h-4" />}
                    </div>
                    {i < order.status_logs.length - 1 && (
                      <div className="w-px h-8 bg-surface/50" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm text-text font-medium">
                      {timelineLabels[log.action] || log.action}
                      {log.new_value && log.action === "status_change" && (
                        <span className="text-muted"> → {statusConfig[log.new_value]?.label || log.new_value}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(log.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLA info */}
        {order.sla_deadline && order.status === "in_progress" && (
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <div className="flex items-center gap-2 text-sm">
              <Timer className="w-4 h-4 text-accent" />
              <span className="text-muted">Estimasi selesai:</span>
              <span className="text-text font-medium">
                {new Date(order.sla_deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </main>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}
