"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/utils/helpers";

interface Customer {
  id: string;
  email: string;
  name: string;
  whatsapp: string | null;
  referral_code: string;
  total_orders: number;
  total_spent: number;
  reward_points: number;
  reward_tier: string;
  lifetime_points: number;
  created_at: string;
}

interface RewardTransaction {
  id: string;
  type: "earn" | "redeem" | "bonus" | "adjust";
  points: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface Order {
  id: string;
  order_id: string;
  username: string;
  game_id: string;
  current_rank: string;
  target_rank: string;
  package: string;
  total_price: number;
  status: string;
  progress: number;
  created_at: string;
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

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400" },
  confirmed: { label: "Confirmed", color: "bg-blue-500/20 text-blue-400" },
  in_progress: { label: "In Progress", color: "bg-accent/20 text-accent" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400" },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400" },
};

export default function CustomerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "rewards" | "referral" | "profile">("orders");
  const [copied, setCopied] = useState(false);
  const [rewardTransactions, setRewardTransactions] = useState<RewardTransaction[]>([]);
  const [rewardLoading, setRewardLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Get customer info
      const userRes = await fetch("/api/customer/auth");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setCustomer(userData.customer);

      // Get orders
      const ordersRes = await fetch("/api/customer/orders");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch("/api/customer/auth", { method: "DELETE" });
    router.push("/");
  };

  const copyReferralCode = () => {
    if (customer?.referral_code) {
      navigator.clipboard.writeText(customer.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchRewards = useCallback(async () => {
    setRewardLoading(true);
    try {
      const res = await fetch("/api/customer/rewards");
      if (res.ok) {
        const data = await res.json();
        setRewardTransactions(data.transactions || []);
      }
    } catch {
      // ignore
    } finally {
      setRewardLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface/50 bg-surface/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            ETNYX
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-text hidden sm:block">
              Halo, <span className="text-primary font-medium">{customer?.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-muted hover:text-text border border-surface/50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <p className="text-muted text-sm">Total Order</p>
            <p className="text-2xl font-bold text-text">{orders.length}</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <p className="text-muted text-sm">Total Spent</p>
            <p className="text-xl font-bold text-primary">
              {formatRupiah(orders.reduce((sum, o) => sum + o.total_price, 0))}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <p className="text-muted text-sm">In Progress</p>
            <p className="text-2xl font-bold text-accent">
              {orders.filter(o => o.status === "in_progress").length}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <p className="text-muted text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">
              {orders.filter(o => o.status === "completed").length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-surface/50">
          {[
            { id: "orders", label: "Order Saya" },
            { id: "rewards", label: "Rewards" },
            { id: "referral", label: "Referral" },
            { id: "profile", label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                if (tab.id === "rewards" && rewardTransactions.length === 0) fetchRewards();
              }}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? "text-primary" : "text-muted hover:text-text"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted mb-4">Belum ada order</p>
                <Link
                  href="/#calculator"
                  className="inline-block px-6 py-3 bg-primary text-background font-semibold rounded-xl"
                >
                  Order Sekarang
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-surface rounded-xl p-4 md:p-6 border border-surface/50"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-primary">{order.order_id}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${statusConfig[order.status]?.color}`}>
                            {statusConfig[order.status]?.label}
                          </span>
                        </div>
                        <p className="text-muted text-sm">
                          {rankLabels[order.current_rank]} → {rankLabels[order.target_rank]}
                        </p>
                        <p className="text-muted text-xs mt-1">
                          {new Date(order.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-text">{formatRupiah(order.total_price)}</p>
                        {order.status === "in_progress" && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-accent rounded-full"
                                  style={{ width: `${order.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-accent">{order.progress}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface/50 flex justify-end">
                      <Link
                        href={`/track?id=${order.order_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Lihat Detail →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === "rewards" && (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Tier & Points Card */}
            <div className="bg-surface rounded-xl p-6 border border-surface/50 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4 ${
                customer?.reward_tier === "platinum" ? "bg-gray-200/20 text-gray-200" :
                customer?.reward_tier === "gold" ? "bg-yellow-500/20 text-yellow-400" :
                customer?.reward_tier === "silver" ? "bg-gray-400/20 text-gray-300" :
                "bg-amber-700/20 text-amber-600"
              }`}>
                <span className="text-lg">
                  {customer?.reward_tier === "platinum" ? "💎" :
                   customer?.reward_tier === "gold" ? "🥇" :
                   customer?.reward_tier === "silver" ? "🥈" : "🥉"}
                </span>
                {(customer?.reward_tier || "bronze").charAt(0).toUpperCase() + (customer?.reward_tier || "bronze").slice(1)} Member
              </div>

              <p className="text-4xl font-bold text-primary mb-1">{(customer?.reward_points || 0).toLocaleString("id-ID")}</p>
              <p className="text-muted text-sm mb-4">Poin tersedia</p>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-background rounded-lg p-3">
                  <p className="text-lg font-bold text-text">{(customer?.lifetime_points || 0).toLocaleString("id-ID")}</p>
                  <p className="text-muted text-xs">Total poin</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-lg font-bold text-text">{formatRupiah((customer?.reward_points || 0) * 100)}</p>
                  <p className="text-muted text-xs">Nilai diskon</p>
                </div>
              </div>

              {/* Tier Progress */}
              {customer?.reward_tier !== "platinum" && (
                <div className="mt-4 text-left">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>Progress tier berikutnya</span>
                    <span>
                      {customer?.reward_tier === "gold" ? `${customer?.lifetime_points || 0}/2500 (Platinum)` :
                       customer?.reward_tier === "silver" ? `${customer?.lifetime_points || 0}/1000 (Gold)` :
                       `${customer?.lifetime_points || 0}/500 (Silver)`}
                    </span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((customer?.lifetime_points || 0) / (
                          customer?.reward_tier === "gold" ? 2500 :
                          customer?.reward_tier === "silver" ? 1000 : 500
                        )) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              <h3 className="font-bold text-text mb-3">Cara Kerja</h3>
              <div className="space-y-3 text-sm text-muted">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
                  <p>Setiap order selesai, kamu dapat <span className="text-text font-medium">1 poin per Rp 10.000</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
                  <p>Kumpulkan poin untuk naik tier dan dapat <span className="text-text font-medium">diskon otomatis</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
                  <p>Tukar <span className="text-text font-medium">100 poin = Rp 10.000</span> diskon di order berikutnya</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface/50">
                <p className="text-xs text-muted mb-2">Tier Benefits</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2"><span>🥉</span> Bronze — 0%</div>
                  <div className="flex items-center gap-2"><span>🥈</span> Silver — 3%</div>
                  <div className="flex items-center gap-2"><span>🥇</span> Gold — 5%</div>
                  <div className="flex items-center gap-2"><span>💎</span> Platinum — 8%</div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              <h3 className="font-bold text-text mb-4">Riwayat Poin</h3>
              {rewardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : rewardTransactions.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">Belum ada riwayat poin</p>
              ) : (
                <div className="space-y-3">
                  {rewardTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-surface/30 last:border-0">
                      <div>
                        <p className="text-sm text-text">{tx.description}</p>
                        <p className="text-xs text-muted">{new Date(tx.created_at).toLocaleDateString("id-ID")}</p>
                      </div>
                      <span className={`font-bold text-sm ${tx.points > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.points > 0 ? "+" : ""}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Referral Tab */}
        {activeTab === "referral" && (
          <div className="max-w-lg mx-auto">
            <div className="bg-surface rounded-xl p-6 border border-surface/50 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Ajak Teman, Dapat Diskon!</h3>
              <p className="text-muted text-sm mb-6">
                Bagikan kode referral kamu. Teman dapat diskon 10%, kamu dapat Rp 10.000!
              </p>

              <div className="bg-background rounded-xl p-4 mb-4">
                <p className="text-xs text-muted mb-2">Kode Referral Kamu</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-bold text-primary tracking-wider">
                    {customer?.referral_code || "REF-XXXXXX"}
                  </span>
                  <button
                    onClick={copyReferralCode}
                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Cobain jasa joki ML di ETNYX! Pakai kode referral ${customer?.referral_code} untuk dapat diskon 10%. https://etnyx.vercel.app`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share via WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-lg mx-auto">
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted mb-1">Nama</p>
                  <p className="text-text font-medium">{customer?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Email</p>
                  <p className="text-text font-medium">{customer?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">WhatsApp</p>
                  <p className="text-text font-medium">{customer?.whatsapp || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Member Sejak</p>
                  <p className="text-text font-medium">
                    {customer?.created_at ? new Date(customer.created_at).toLocaleDateString("id-ID") : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
