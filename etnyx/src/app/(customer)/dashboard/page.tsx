"use client";

import { toast } from "@/components/ToastProvider";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/utils/helpers";
import { siteConfig, rankLabels } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { Download, Gem, Medal, Trophy, Award, Bell, ClipboardList, Key, Sparkles, LogIn, Pencil, Lock, ShoppingCart, Gift } from "lucide-react";

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

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  points_cost: number;
  image_url: string | null;
  stock: number | null;
}

interface Redemption {
  id: string;
  catalog_item_id: string;
  points_spent: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  completed_at: string | null;
  reward_catalog: { name: string; category: string; image_url: string | null };
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

interface NotificationPrefs {
  email_order_updates: boolean;
  email_promotions: boolean;
  whatsapp_order_updates: boolean;
  whatsapp_promotions: boolean;
  push_order_updates: boolean;
  push_promotions: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400" },
  confirmed: { label: "Confirmed", color: "bg-blue-500/20 text-blue-400" },
  in_progress: { label: "In Progress", color: "bg-accent/20 text-accent" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400" },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400" },
};

export default function CustomerDashboard() {
  const router = useRouter();
  const { locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "rewards" | "referral" | "profile">("orders");
  const [copied, setCopied] = useState(false);
  const [rewardTransactions, setRewardTransactions] = useState<RewardTransaction[]>([]);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", whatsapp: "", currentPassword: "", newPassword: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs | null>(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState<{ action: string; details: Record<string, unknown>; created_at: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const t = locale === "id" ? {
    hello: "Halo",
    totalOrder: "Total Order",
    totalSpent: "Total Spent",
    inProgress: "In Progress",
    completed: "Completed",
    tabs: { orders: "Order Saya", rewards: "Rewards", referral: "Referral", profile: "Profile" },
    noOrders: "Belum ada order",
    orderNow: "Order Sekarang",
    viewDetail: "Lihat Detail →",
    pointsAvailable: "Poin tersedia",
    totalPoints: "Total poin",
    discountValue: "Nilai diskon",
    nextTier: "Progress tier berikutnya",
    howItWorks: "Cara Kerja",
    howStep1: "Setiap order selesai, kamu dapat",
    howStep1b: "1 poin per Rp 10.000",
    howStep2: "Kumpulkan poin untuk naik tier dan dapat",
    howStep2b: "diskon otomatis",
    howStep3: "Tukar",
    howStep3b: "100 poin = Rp 10.000",
    howStep3c: "diskon di order berikutnya",
    tierBenefits: "Tier Benefits",
    redeemPoints: "Tukar Poin",
    redeemDesc: "Kumpulkan poin, tukar dengan hadiah!",
    noRewards: "Belum ada hadiah tersedia",
    enterGameId: "Masukkan Game ID / User ID kamu:",
    confirmRedeem: (pts: number, name: string) => `Tukar ${pts} poin untuk "${name}"?`,
    redeemFail: "Gagal redeem",
    outOfStock: "Habis",
    redeem: "Tukar",
    notEnough: "Kurang poin",
    myRedemptions: "Penukaran Saya",
    statusDone: "Selesai",
    statusProcessing: "Diproses",
    statusRejected: "Ditolak",
    statusWaiting: "Menunggu",
    pointsHistory: "Riwayat Poin",
    noPointsHistory: "Belum ada riwayat poin",
    referralTitle: "Ajak Teman, Dapat Diskon!",
    referralDesc: "Bagikan kode referral kamu. Teman dapat diskon 10%, kamu dapat Rp 10.000!",
    referralCode: "Kode Referral Kamu",
    shareWa: (code: string) => `Cobain jasa joki ML di ETNYX! Pakai kode referral ${code} untuk dapat diskon 10%. ${siteConfig.url}`,
    name: "Nama",
    email: "Email",
    whatsapp: "WhatsApp",
    memberSince: "Member Sejak",
    editProfile: "Edit Profil",
    save: "Simpan",
    cancel: "Batal",
    currentPassword: "Password Lama",
    newPassword: "Password Baru (opsional)",
    profileUpdated: "Profil berhasil diupdate",
    changePassword: "Ganti Password",
  } : {
    hello: "Hi",
    totalOrder: "Total Orders",
    totalSpent: "Total Spent",
    inProgress: "In Progress",
    completed: "Completed",
    tabs: { orders: "My Orders", rewards: "Rewards", referral: "Referral", profile: "Profile" },
    noOrders: "No orders yet",
    orderNow: "Order Now",
    viewDetail: "View Details →",
    pointsAvailable: "Available points",
    totalPoints: "Total points",
    discountValue: "Discount value",
    nextTier: "Next tier progress",
    howItWorks: "How it Works",
    howStep1: "For every completed order, you earn",
    howStep1b: "1 point per Rp 10,000",
    howStep2: "Collect points to level up tiers and get",
    howStep2b: "automatic discounts",
    howStep3: "Redeem",
    howStep3b: "100 points = Rp 10,000",
    howStep3c: "discount on your next order",
    tierBenefits: "Tier Benefits",
    redeemPoints: "Redeem Points",
    redeemDesc: "Collect points, exchange for rewards!",
    noRewards: "No rewards available",
    enterGameId: "Enter your Game ID / User ID:",
    confirmRedeem: (pts: number, name: string) => `Redeem ${pts} points for "${name}"?`,
    redeemFail: "Redeem failed",
    outOfStock: "Out of stock",
    redeem: "Redeem",
    notEnough: "Not enough",
    myRedemptions: "My Redemptions",
    statusDone: "Done",
    statusProcessing: "Processing",
    statusRejected: "Rejected",
    statusWaiting: "Pending",
    pointsHistory: "Points History",
    noPointsHistory: "No points history yet",
    referralTitle: "Invite Friends, Get Discount!",
    referralDesc: "Share your referral code. Friends get 10% off, you get Rp 10,000!",
    referralCode: "Your Referral Code",
    shareWa: (code: string) => `Try ML boosting at ETNYX! Use referral code ${code} for 10% discount. ${siteConfig.url}`,
    name: "Name",
    email: "Email",
    whatsapp: "WhatsApp",
    memberSince: "Member Since",
    editProfile: "Edit Profile",
    save: "Save",
    cancel: "Cancel",
    currentPassword: "Current Password",
    newPassword: "New Password (optional)",
    profileUpdated: "Profile updated successfully",
    changePassword: "Change Password",
  };

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
      const [txRes, catalogRes] = await Promise.all([
        fetch("/api/customer/rewards"),
        fetch("/api/customer/rewards/catalog"),
      ]);
      if (txRes.ok) {
        const data = await txRes.json();
        setRewardTransactions(data.transactions || []);
      }
      if (catalogRes.ok) {
        const data = await catalogRes.json();
        setCatalogItems(data.items || []);
        setRedemptions(data.redemptions || []);
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
              {t.hello}, <span className="text-primary font-medium">{customer?.name}</span>
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
            <p className="text-muted text-sm">{t.totalOrder}</p>
            <p className="text-2xl font-bold text-text">{orders.filter(o => o.status !== "cancelled").length}</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <p className="text-muted text-sm">{t.totalSpent}</p>
            <p className="text-xl font-bold text-primary">
              {formatRupiah(orders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total_price, 0))}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <p className="text-muted text-sm">{t.inProgress}</p>
            <p className="text-2xl font-bold text-accent">
              {orders.filter(o => o.status === "in_progress").length}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface/50">
            <p className="text-muted text-sm">{t.completed}</p>
            <p className="text-2xl font-bold text-green-400">
              {orders.filter(o => o.status === "completed").length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-surface/50">
          {[
            { id: "orders", label: t.tabs.orders },
            { id: "rewards", label: t.tabs.rewards },
            { id: "referral", label: t.tabs.referral },
            { id: "profile", label: t.tabs.profile },
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
                <p className="text-muted mb-4">{t.noOrders}</p>
                <Link
                  href="/#calculator"
                  className="inline-block px-6 py-3 bg-primary text-background font-semibold rounded-xl"
                >
                  {t.orderNow}
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
                    <div className="mt-4 pt-4 border-t border-surface/50 flex items-center justify-between">
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`/api/invoice?orderId=${order.order_id}&format=pdf`, '_blank'); }}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Invoice
                      </button>
                      <Link
                        href={`/dashboard/order?id=${order.order_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {t.viewDetail}
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
                  {customer?.reward_tier === "platinum" ? <Gem className="w-5 h-5" /> :
                   customer?.reward_tier === "gold" ? <Trophy className="w-5 h-5" /> :
                   customer?.reward_tier === "silver" ? <Medal className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                </span>
                {(customer?.reward_tier || "bronze").charAt(0).toUpperCase() + (customer?.reward_tier || "bronze").slice(1)} Member
              </div>

              <p className="text-4xl font-bold text-primary mb-1">{(customer?.reward_points || 0).toLocaleString("id-ID")}</p>
              <p className="text-muted text-sm mb-4">{t.pointsAvailable}</p>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-background rounded-lg p-3">
                  <p className="text-lg font-bold text-text">{(customer?.lifetime_points || 0).toLocaleString("id-ID")}</p>
                  <p className="text-muted text-xs">{t.totalPoints}</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-lg font-bold text-text">{formatRupiah((customer?.reward_points || 0) * 100)}</p>
                  <p className="text-muted text-xs">{t.discountValue}</p>
                </div>
              </div>

              {/* Tier Progress */}
              {customer?.reward_tier !== "platinum" && (
                <div className="mt-4 text-left">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>{t.nextTier}</span>
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
              <h3 className="font-bold text-text mb-3">{t.howItWorks}</h3>
              <div className="space-y-3 text-sm text-muted">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
                  <p>{t.howStep1} <span className="text-text font-medium">{t.howStep1b}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
                  <p>{t.howStep2} <span className="text-text font-medium">{t.howStep2b}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
                  <p>{t.howStep3} <span className="text-text font-medium">{t.howStep3b}</span> {t.howStep3c}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface/50">
                <p className="text-xs text-muted mb-2">{t.tierBenefits}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2"><Award className="w-3 h-3 text-amber-600" /> Bronze — 0%</div>
                  <div className="flex items-center gap-2"><Medal className="w-3 h-3 text-gray-300" /> Silver — 3%</div>
                  <div className="flex items-center gap-2"><Trophy className="w-3 h-3 text-yellow-400" /> Gold — 5%</div>
                  <div className="flex items-center gap-2"><Gem className="w-3 h-3 text-gray-200" /> Platinum — 8%</div>
                </div>
              </div>
            </div>

            {/* Reward Shop */}
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              <h3 className="font-bold text-text mb-1">{t.redeemPoints}</h3>
              <p className="text-muted text-xs mb-4">{t.redeemDesc}</p>

              {catalogItems.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">{t.noRewards}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {catalogItems.map((item) => {
                    const canAfford = (customer?.reward_points || 0) >= item.points_cost;
                    const outOfStock = item.stock !== null && item.stock <= 0;
                    const categoryEmoji = item.category === "skin" ? "Skin" : item.category === "starlight" ? "Star" : item.category === "diamond" ? "Gem" : item.category === "discount" ? "Tag" : "Gift";

                    return (
                      <div key={item.id} className={`rounded-xl border p-4 transition-all ${
                        outOfStock ? "opacity-50 border-white/5 bg-white/[0.01]" :
                        canAfford ? "border-primary/30 bg-primary/5" : "border-white/10 bg-white/[0.02]"
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{categoryEmoji}</span>
                              <p className="font-semibold text-sm text-text truncate">{item.name}</p>
                            </div>
                            {item.description && <p className="text-xs text-muted mb-2">{item.description}</p>}
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-bold text-sm">{item.points_cost.toLocaleString("id-ID")} poin</span>
                              {item.stock !== null && (
                                <span className="text-xs text-muted">· Stok: {item.stock}</span>
                              )}
                            </div>
                          </div>
                          <button
                            disabled={!canAfford || outOfStock || redeemingId === item.id}
                            onClick={async () => {
                              const gameId = prompt(t.enterGameId);
                              if (!gameId) return;
                              if (!confirm(t.confirmRedeem(item.points_cost, item.name))) return;
                              setRedeemingId(item.id);
                              try {
                                const res = await fetch("/api/customer/rewards/catalog", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ itemId: item.id, gameId }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  toast(data.message);
                                  fetchData();
                                  fetchRewards();
                                } else {
                                  toast(data.error || t.redeemFail);
                                }
                              } catch {
                                toast(t.redeemFail);
                              } finally {
                                setRedeemingId(null);
                              }
                            }}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              outOfStock ? "bg-white/5 text-muted cursor-not-allowed" :
                              canAfford ? "bg-primary text-background hover:opacity-90" :
                              "bg-white/5 text-muted cursor-not-allowed"
                            }`}
                          >
                            {redeemingId === item.id ? "..." : outOfStock ? t.outOfStock : canAfford ? t.redeem : t.notEnough}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Redemptions */}
            {redemptions && redemptions.length > 0 && (
              <div className="bg-surface rounded-xl p-6 border border-surface/50">
                <h3 className="font-bold text-text mb-4">{t.myRedemptions}</h3>
                <div className="space-y-3">
                  {redemptions.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-surface/30 last:border-0">
                      <div>
                        <p className="text-sm text-text">{r.reward_catalog?.name || "Item"}</p>
                        <p className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString("id-ID")}</p>
                        {r.admin_notes && <p className="text-xs text-accent mt-1">{r.admin_notes}</p>}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        r.status === "completed" ? "bg-green-500/20 text-green-400" :
                        r.status === "processing" ? "bg-blue-500/20 text-blue-400" :
                        r.status === "rejected" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {r.status === "completed" ? t.statusDone : r.status === "processing" ? t.statusProcessing : r.status === "rejected" ? t.statusRejected : t.statusWaiting}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              <h3 className="font-bold text-text mb-4">{t.pointsHistory}</h3>
              {rewardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : rewardTransactions.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">{t.noPointsHistory}</p>
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
              <h3 className="text-xl font-bold text-text mb-2">{t.referralTitle}</h3>
              <p className="text-muted text-sm mb-6">
                {t.referralDesc}
              </p>

              <div className="bg-background rounded-xl p-4 mb-4">
                <p className="text-xs text-muted mb-2">{t.referralCode}</p>
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
                href={`https://wa.me/?text=${encodeURIComponent(t.shareWa(customer?.referral_code || ""))}`}
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
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              {!editingProfile ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted mb-1">{t.name}</p>
                      <p className="text-text font-medium">{customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">{t.email}</p>
                      <p className="text-text font-medium">{customer?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">{t.whatsapp}</p>
                      <p className="text-text font-medium">{customer?.whatsapp || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">{t.memberSince}</p>
                      <p className="text-text font-medium">
                        {customer?.created_at ? new Date(customer.created_at).toLocaleDateString("id-ID") : "-"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileForm({
                        name: customer?.name || "",
                        whatsapp: customer?.whatsapp?.replace(/^\+62/, "") || "",
                        currentPassword: "",
                        newPassword: "",
                      });
                      setProfileMsg(null);
                      setEditingProfile(true);
                    }}
                    className="mt-4 w-full px-4 py-2.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors text-sm"
                  >
                    {t.editProfile}
                  </button>
                </>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setProfileSaving(true);
                    setProfileMsg(null);
                    try {
                      const body: Record<string, string> = { name: profileForm.name };
                      if (profileForm.whatsapp) body.whatsapp = profileForm.whatsapp;
                      else body.whatsapp = "";
                      if (profileForm.newPassword) {
                        body.currentPassword = profileForm.currentPassword;
                        body.newPassword = profileForm.newPassword;
                      }
                      const res = await fetch("/api/customer/profile", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setProfileMsg({ type: "success", text: t.profileUpdated });
                        setEditingProfile(false);
                        fetchData();
                      } else {
                        setProfileMsg({ type: "error", text: data.error || "Error" });
                      }
                    } catch {
                      setProfileMsg({ type: "error", text: "Error" });
                    } finally {
                      setProfileSaving(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs text-muted mb-1 block">{t.name}</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-surface/50 text-text text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">{t.whatsapp}</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 bg-background border border-r-0 border-surface/50 rounded-l-lg text-muted text-sm">+62</span>
                      <input
                        type="tel"
                        value={profileForm.whatsapp}
                        onChange={(e) => setProfileForm((p) => ({ ...p, whatsapp: e.target.value.replace(/\D/g, "") }))}
                        placeholder="81234567890"
                        className="w-full px-3 py-2.5 rounded-r-lg bg-background border border-surface/50 text-text text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="border-t border-surface/50 pt-4">
                    <p className="text-xs text-muted mb-3 font-medium">{t.changePassword}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted mb-1 block">{t.currentPassword}</label>
                        <input
                          type="password"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm((p) => ({ ...p, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-lg bg-background border border-surface/50 text-text text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted mb-1 block">{t.newPassword}</label>
                        <input
                          type="password"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm((p) => ({ ...p, newPassword: e.target.value }))}
                          minLength={6}
                          className="w-full px-3 py-2.5 rounded-lg bg-background border border-surface/50 text-text text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                  {profileMsg && (
                    <p className={`text-sm ${profileMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                      {profileMsg.text}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setEditingProfile(false); setProfileMsg(null); }}
                      className="flex-1 px-4 py-2.5 border border-surface/50 text-muted rounded-lg text-sm hover:text-text transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="flex-1 px-4 py-2.5 bg-primary text-background font-medium rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {profileSaving ? "..." : t.save}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              <h3 className="font-bold text-text mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Notifikasi</h3>
              {!notifPrefs ? (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/customer/notification-preferences");
                    if (res.ok) {
                      const data = await res.json();
                      setNotifPrefs(data.preferences);
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors text-sm"
                >
                  Atur Preferensi Notifikasi
                </button>
              ) : (
                <div className="space-y-4">
                  {([
                    { key: "email_order_updates", label: "Email - Update Order", desc: "Status order, pembayaran, selesai" },
                    { key: "email_promotions", label: "Email - Promo", desc: "Diskon & penawaran spesial" },
                    { key: "whatsapp_order_updates", label: "WhatsApp - Update Order", desc: "Notifikasi via WhatsApp" },
                    { key: "whatsapp_promotions", label: "WhatsApp - Promo", desc: "Info promo via WhatsApp" },
                    { key: "push_order_updates", label: "Push - Update Order", desc: "Notifikasi browser" },
                    { key: "push_promotions", label: "Push - Promo", desc: "Promo via browser" },
                  ] as const).map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text">{item.label}</p>
                        <p className="text-xs text-muted">{item.desc}</p>
                      </div>
                      <button
                        disabled={notifSaving}
                        onClick={async () => {
                          setNotifSaving(true);
                          const newVal = !notifPrefs[item.key];
                          setNotifPrefs({ ...notifPrefs, [item.key]: newVal });
                          await fetch("/api/customer/notification-preferences", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ [item.key]: newVal }),
                          });
                          setNotifSaving(false);
                        }}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          notifPrefs[item.key] ? "bg-primary" : "bg-white/10"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifPrefs[item.key] ? "translate-x-4" : ""
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="bg-surface rounded-xl p-6 border border-surface/50">
              <h3 className="font-bold text-text mb-4 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-accent" /> Aktivitas Akun</h3>
              {activityLogs.length === 0 && !activityLoading ? (
                <button
                  onClick={async () => {
                    setActivityLoading(true);
                    const res = await fetch("/api/customer/activity");
                    if (res.ok) {
                      const data = await res.json();
                      setActivityLogs(data.logs || []);
                    }
                    setActivityLoading(false);
                  }}
                  className="w-full px-4 py-2.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors text-sm"
                >
                  Lihat Riwayat Aktivitas
                </button>
              ) : activityLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activityLogs.map((log, i) => {
                    const actionLabels: Record<string, string> = {
                      login: "Login",
                      register: "Registrasi",
                      logout: "Logout",
                      profile_update: "Update Profil",
                      password_change: "Ganti Password",
                      order_created: "Order Dibuat",
                      reward_redeemed: "Redeem Reward",
                    };
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-surface/30 last:border-0">
                        <div>
                          <p className="text-sm text-text">{actionLabels[log.action] || log.action}</p>
                          <p className="text-xs text-muted">
                            {new Date(log.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {activityLogs.length === 0 && <p className="text-sm text-muted text-center py-2">Belum ada aktivitas</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
