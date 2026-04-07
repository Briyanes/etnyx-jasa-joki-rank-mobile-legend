"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/utils/helpers";
import {
  BarChart3, Zap, Gamepad2, Star, CheckCircle, XCircle, Crown,
  Settings2, Package, Users, Shield, Trophy, Tag, Eye, TrendingUp,
  ShoppingCart, DollarSign, Clock, Activity, Loader2, AlertTriangle,
  Plus, Pencil, Trash2, Save, Search, Filter, RefreshCw, LogOut,
  MessageCircle, Send, BookOpen, Copy, Gift, Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";
import SettingsTab from "./SettingsTab";
import PayrollTab from "./PayrollTab";
import ReportsTab from "./ReportsTab";
import AdsTab from "./AdsTab";

const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const BarChartRecharts = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const BarRecharts = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });

// ---- Types ----
interface Stats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  pending_revenue: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
}

interface Order {
  id: string;
  order_id: string;
  username: string;
  game_id: string;
  current_rank: string;
  target_rank: string;
  current_star: number | null;
  target_star: number | null;
  package: string;
  package_title: string | null;
  is_express: boolean;
  is_premium: boolean;
  total_price: number;
  status: string;
  progress: number;
  created_at: string;
  login_method: string;
  hero_request: string | null;
  customer_email: string | null;
  promo_code: string | null;
  promo_discount: number;
  whatsapp: string | null;
  assigned_worker_id: string | null;
  payment_method: string | null;
  payment_status: string | null;
}

interface Testimonial {
  id: string;
  name: string;
  rank_from: string;
  rank_to: string;
  rating: number;
  comment: string;
  is_featured: boolean;
  is_visible: boolean;
}

interface Portfolio {
  id: string;
  title: string;
  rank_from: string;
  rank_to: string;
  image_after_url: string | null;
  description: string;
  is_visible: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  whatsapp: string;
  total_orders: number;
  total_spent: number;
  referral_code: string;
  reward_points: number;
  reward_tier: string;
  lifetime_points: number;
  created_at: string;
}

interface Booster {
  id: string;
  name: string;
  whatsapp: string;
  rank_specialization: string;
  specialization: string[] | null;
  is_available: boolean;
  total_orders: number;
  rating: number;
  created_at: string;
}

interface PricingPackage {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rankKey: string;
  currentRank: string;
  targetRank: string;
}

interface PricingCategory {
  id: string;
  title: string;
  packages: PricingPackage[];
}

interface PerStarTier {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  icon: string;
}

type TabType = "overview" | "orders" | "boosters" | "testimonials" | "portfolio" | "promo" | "customers" | "rewards" | "pricing" | "staff" | "reviews" | "payroll" | "reports" | "ads" | "settings";

// ---- Tab Config ----
const TAB_CONFIG: { id: TabType; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "boosters", label: "Boosters", icon: Gamepad2 },
  { id: "testimonials", label: "Testi", icon: Star },
  { id: "portfolio", label: "Portfolio", icon: Trophy },
  { id: "promo", label: "Promo", icon: Tag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "staff", label: "Staff", icon: Shield },
  { id: "payroll", label: "Payroll", icon: Wallet },
  { id: "reviews", label: "Reviews", icon: MessageCircle },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "ads", label: "Ads", icon: TrendingUp },
  { id: "settings", label: "Settings", icon: Settings2 },
];

// ---- Rank helpers ----
const RANKS = ["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicglory"];

const rankLabel = (r: string) => {
  const m: Record<string, string> = { warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster", epic: "Epic", legend: "Legend", mythic: "Mythic", mythicgrading: "Mythic Grading", mythichonor: "Mythic Honor", mythicglory: "Mythic Glory", mythicimmortal: "Mythic Immortal" };
  return m[r] || r;
};

const STAR_LABELS: Record<number, string> = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
const rankWithStar = (r: string, star?: number | null) => {
  const label = rankLabel(r);
  if (star && STAR_LABELS[star]) return `${label} ${STAR_LABELS[star]}`;
  return label;
};

// ---- Component ----
export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [chartData, setChartData] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const ORDERS_PER_PAGE = 25;
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Testimonial | Portfolio | PromoCode | Booster | null>(null);
  const [credentials, setCredentials] = useState<{ order_id: string; account_login: string | null; account_password: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [followUpLoading, setFollowUpLoading] = useState<string | null>(null);
  const [statusActionLoading, setStatusActionLoading] = useState<string | null>(null);

  // Payment proof review state
  interface PaymentProof { id: string; order_id: string; image_url: string; sender_name: string | null; sender_bank: string | null; amount: number | null; status: string; created_at: string; reject_reason?: string | null }
  const [proofModal, setProofModal] = useState<{ orderId: string; orderDisplayId: string } | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(false);
  const [proofActionLoading, setProofActionLoading] = useState<string | null>(null);

  // Pricing state
  const [pricingCatalog, setPricingCatalog] = useState<PricingCategory[]>([]);
  const [perStarPricing, setPerStarPricing] = useState<PerStarTier[]>([]);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [activePricingCat, setActivePricingCat] = useState("");
  const [pricingMode, setPricingMode] = useState<"paket" | "perstar" | "gendong">("paket");
  const [gendongPricing, setGendongPricing] = useState<PerStarTier[]>([]);

  // Staff state
  interface StaffUser { id: string; email: string; name: string; role: string; phone: string | null; is_active: boolean; last_login_at: string | null; created_at: string; lead_id: string | null }
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffModal, setStaffModal] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffUser | null>(null);

  // Rewards catalog state
  interface CatalogItem { id: string; name: string; description: string | null; category: string; points_cost: number; image_url: string | null; stock: number | null; is_active: boolean; sort_order: number }
  interface RewardRedemption { id: string; points_spent: number; status: string; admin_notes: string | null; game_id: string | null; created_at: string; completed_at: string | null; customers: { name: string; email: string; whatsapp: string } | null; reward_catalog: { name: string; category: string } | null }
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemption[]>([]);
  const [rewardsSubTab, setRewardsSubTab] = useState<"catalog" | "redemptions">("catalog");
  const [catalogModal, setCatalogModal] = useState(false);
  const [editCatalogItem, setEditCatalogItem] = useState<CatalogItem | null>(null);
  const [catalogForm, setCatalogForm] = useState({ name: "", description: "", category: "skin", pointsCost: 500, stock: "" as string, imageUrl: "" });
  const [staffForm, setStaffForm] = useState({ email: "", name: "", password: "", role: "worker", phone: "", lead_id: "" });
  const [staffSaving, setStaffSaving] = useState(false);

  // Reviews state
  interface Review { id: string; order_id: string; service_rating: number; service_comment: string | null; worker_id: string | null; worker_rating: number | null; worker_comment: string | null; has_worker_report: boolean; report_type: string | null; report_detail: string | null; report_status: string | null; customer_name: string | null; customer_whatsapp: string | null; rank_from: string | null; rank_to: string | null; is_visible: boolean; is_featured: boolean; google_reviewed: boolean; admin_notes: string | null; created_at: string }
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsSubTab, setReviewsSubTab] = useState<"all" | "reports">("all");

  // Auth
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth");
      if (!res.ok) { router.push("/admin"); return false; }
      return true;
    } catch { router.push("/admin"); return false; }
  }, [router]);

  // Fetchers
  const fetchStats = useCallback(async () => {
    try { const res = await fetch("/api/admin/stats"); setStats(await res.json()); } catch (e) { console.error(e); }
  }, []);
  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: statusFilter, page: String(ordersPage), limit: String(ORDERS_PER_PAGE) });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await fetch(`/api/admin/orders?${params}`);
      const d = await res.json();
      setOrders(d.orders || []);
      if (d.total !== undefined) setOrdersTotal(d.total);
    } catch (e) { console.error(e); }
  }, [statusFilter, searchQuery, ordersPage]);
  const fetchChartData = useCallback(async () => {
    try { const res = await fetch("/api/admin/chart-data"); const d = await res.json(); setChartData(d.chartData || []); } catch (e) { console.error(e); }
  }, []);
  const fetchTestimonials = useCallback(async () => {
    try { const res = await fetch("/api/admin/testimonials"); const d = await res.json(); setTestimonials(d.testimonials || []); } catch (e) { console.error(e); }
  }, []);
  const fetchPortfolios = useCallback(async () => {
    try { const res = await fetch("/api/admin/portfolio"); const d = await res.json(); setPortfolios(d.portfolios || []); } catch (e) { console.error(e); }
  }, []);
  const fetchPromoCodes = useCallback(async () => {
    try { const res = await fetch("/api/admin/promo-codes"); const d = await res.json(); setPromoCodes(d.promoCodes || []); } catch (e) { console.error(e); }
  }, []);
  const fetchCustomers = useCallback(async () => {
    try { const res = await fetch("/api/admin/customers"); const d = await res.json(); setCustomers(d.customers || []); } catch (e) { console.error(e); }
  }, []);
  const fetchRewardsCatalog = useCallback(async () => {
    try { const res = await fetch("/api/admin/rewards/catalog"); const d = await res.json(); setCatalogItems(d.items || []); } catch (e) { console.error(e); }
  }, []);
  const fetchRedemptions = useCallback(async () => {
    try { const res = await fetch("/api/admin/rewards/catalog?view=redemptions"); const d = await res.json(); setRewardRedemptions(d.redemptions || []); } catch (e) { console.error(e); }
  }, []);
  const fetchBoosters = useCallback(async () => {
    try { const res = await fetch("/api/admin/boosters"); const d = await res.json(); setBoosters(d.boosters || []); } catch (e) { console.error(e); }
  }, []);
  const fetchPricing = useCallback(async () => {
    try {
      // Fetch package pricing
      const res = await fetch("/api/admin/settings?key=pricing_catalog");
      const d = await res.json();
      if (d.value && Array.isArray(d.value)) {
        setPricingCatalog(d.value);
        if (d.value.length > 0 && !activePricingCat) setActivePricingCat(d.value[0].id);
      }
      // Fetch per star pricing
      const res2 = await fetch("/api/admin/settings?key=perstar_pricing");
      const d2 = await res2.json();
      if (d2.value && Array.isArray(d2.value)) {
        setPerStarPricing(d2.value);
      } else {
        // Set default if not in DB
        setPerStarPricing([
          { id: "grandmaster", name: "Grand Master", price: 5000, originalPrice: 6000, discountPercent: 17, icon: "/icons-tier/Grandmaster.webp" },
          { id: "epic", name: "Epic", price: 7000, originalPrice: 8000, discountPercent: 13, icon: "/icons-tier/Epic.webp" },
          { id: "legend", name: "Legend", price: 8000, originalPrice: 9000, discountPercent: 11, icon: "/icons-tier/Legend.webp" },
          { id: "mythic", name: "Mythic", price: 18000, originalPrice: 20000, discountPercent: 10, icon: "/icons-tier/Mythic.webp" },
          { id: "grading", name: "Mythic Grading", price: 20000, originalPrice: 22000, discountPercent: 9, icon: "/icons-tier/Mythic.webp" },
          { id: "honor", name: "Mythic Honor", price: 21000, originalPrice: 22000, discountPercent: 5, icon: "/icons-tier/Mythical_Honor.webp" },
          { id: "glory", name: "Mythic Glory", price: 26000, originalPrice: 28000, discountPercent: 7, icon: "/icons-tier/Mythical_Glory.webp" },
          { id: "immortal", name: "Mythic Immortal", price: 31000, originalPrice: 33000, discountPercent: 6, icon: "/icons-tier/Mythical_Immortal.webp" },
        ]);
      }
      // Fetch gendong (duo boost) pricing
      const res3 = await fetch("/api/admin/settings?key=gendong_pricing");
      const d3 = await res3.json();
      if (d3.value && Array.isArray(d3.value)) {
        setGendongPricing(d3.value);
      } else {
        setGendongPricing([
          { id: "grandmaster", name: "Grand Master", price: 9000, icon: "/icons-tier/Grandmaster.webp" },
          { id: "epic", name: "Epic", price: 10000, icon: "/icons-tier/Epic.webp" },
          { id: "legend", name: "Legend", price: 11000, icon: "/icons-tier/Legend.webp" },
          { id: "mythic", name: "Mythic", price: 21000, icon: "/icons-tier/Mythic.webp" },
          { id: "grading", name: "Mythic Grading", price: 23000, icon: "/icons-tier/Mythic.webp" },
          { id: "honor", name: "Mythic Honor", price: 25000, icon: "/icons-tier/Mythical_Honor.webp" },
          { id: "glory", name: "Mythic Glory", price: 30000, icon: "/icons-tier/Mythical_Glory.webp" },
          { id: "immortal", name: "Mythic Immortal", price: 35000, icon: "/icons-tier/Mythical_Immortal.webp" },
        ]);
      }
    } catch (e) { console.error(e); }
  }, [activePricingCat]);

  const fetchStaffUsers = useCallback(async () => {
    try { const res = await fetch("/api/staff/users"); const d = await res.json(); setStaffUsers(d.users || []); } catch (e) { console.error(e); }
  }, []);

  const fetchReviews = useCallback(async () => {
    try { const res = await fetch("/api/admin/reviews"); const d = await res.json(); setReviews(d.reviews || []); } catch (e) { console.error(e); }
  }, []);


  // Staff handlers
  const handleSaveStaff = async () => {
    setStaffSaving(true);
    try {
      const method = editStaff ? "PUT" : "POST";
      const body = editStaff
        ? { id: editStaff.id, name: staffForm.name, role: staffForm.role, phone: staffForm.phone || undefined, password: staffForm.password || undefined, lead_id: staffForm.role === "worker" ? (staffForm.lead_id || null) : null }
        : { email: staffForm.email, name: staffForm.name, password: staffForm.password, role: staffForm.role, phone: staffForm.phone || undefined, lead_id: staffForm.role === "worker" ? (staffForm.lead_id || null) : null };
      const res = await fetch("/api/staff/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Gagal simpan staff"); return; }
      setStaffModal(false); setEditStaff(null); setStaffForm({ email: "", name: "", password: "", role: "worker", phone: "", lead_id: "" });
      fetchStaffUsers();
    } catch { alert("Network error"); }
    setStaffSaving(false);
  };
  const handleDeactivateStaff = async (id: string) => {
    if (!confirm("Nonaktifkan staff ini?")) return;
    await fetch("/api/staff/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchStaffUsers();
  };

  useEffect(() => {
    (async () => {
      const ok = await checkAuth();
      if (ok) await Promise.all([fetchStats(), fetchOrders(), fetchChartData()]);
      setLoading(false);
    })();
  }, [checkAuth, fetchStats, fetchOrders, fetchChartData]);

  useEffect(() => {
    if (loading) return;
    if (activeTab === "orders") { fetchOrders(); fetchStaffUsers(); }
    else if (activeTab === "testimonials") fetchTestimonials();
    else if (activeTab === "portfolio") fetchPortfolios();
    else if (activeTab === "promo") fetchPromoCodes();
    else if (activeTab === "customers") fetchCustomers();
    else if (activeTab === "rewards") { fetchRewardsCatalog(); fetchRedemptions(); }
    else if (activeTab === "boosters") fetchBoosters();
    else if (activeTab === "pricing") fetchPricing();
    else if (activeTab === "staff") fetchStaffUsers();
    else if (activeTab === "reviews") fetchReviews();
  }, [activeTab, statusFilter, loading, fetchOrders, fetchTestimonials, fetchPortfolios, fetchPromoCodes, fetchCustomers, fetchBoosters, fetchPricing, fetchStaffUsers, fetchRewardsCatalog, fetchRedemptions, fetchReviews]);

  const handleLogout = async () => { await fetch("/api/admin/auth", { method: "DELETE" }); router.push("/admin"); };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setStatusActionLoading(`${orderId}-${newStatus}`);
    try {
      await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: orderId, status: newStatus }) });
      fetchOrders(); fetchStats();
    } catch (e) { console.error(e); }
    setStatusActionLoading(null);
  };

  const viewCredentials = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/credentials?id=${orderId}`);
      if (!res.ok) throw new Error("Failed");
      setCredentials(await res.json());
    } catch { alert("Gagal memuat credentials."); }
  };

  const sendFollowUp = async (orderId: string, action: string) => {
    setFollowUpLoading(`${orderId}-${action}`);
    try {
      const res = await fetch("/api/admin/orders/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ " + data.message);
      } else {
        alert("⚠️ " + (data.message || data.error || "Gagal mengirim"));
      }
    } catch { alert("Network error"); }
    setFollowUpLoading(null);
  };

  const openWhatsApp = (phone: string, message: string) => {
    const normalized = phone.replace(/\D/g, "").replace(/^0/, "62");
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Payment proof functions
  const openProofModal = async (orderId: string, orderDisplayId: string) => {
    setProofModal({ orderId, orderDisplayId });
    setProofsLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-proof?order_id=${orderId}`);
      const data = await res.json();
      setProofs(data.proofs || []);
    } catch { setProofs([]); }
    setProofsLoading(false);
  };

  const handleProofAction = async (proofId: string, action: "approve" | "reject") => {
    const rejectReason = action === "reject" ? prompt("Alasan reject (opsional):") : null;
    if (action === "reject" && rejectReason === null) return; // cancelled

    setProofActionLoading(proofId);
    try {
      const res = await fetch("/api/admin/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId, action, rejectReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Bukti transfer ${action === "approve" ? "diapprove" : "direject"}`);
        // Refresh proofs
        setProofs(proofs.map(p => p.id === proofId ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p));
        if (action === "approve") fetchOrders();
      } else {
        alert("⚠️ " + (data.error || "Gagal"));
      }
    } catch { alert("Network error"); }
    setProofActionLoading(null);
  };

  const copyOrderInfo = (o: Order) => {
    const text = `Order: ${o.order_id}\nCustomer: ${o.username}\nGame ID: ${o.game_id}\nRank: ${o.current_rank} → ${o.target_rank}\nStatus: ${o.status}\nProgress: ${o.progress}%\nWA: ${o.whatsapp || "-"}\nHarga: ${formatRupiah(o.total_price)}`;
    navigator.clipboard.writeText(text);
    alert("📋 Info order disalin!");
  };

  // CRUD handlers
  const handleSaveTestimonial = async (data: Partial<Testimonial>) => {
    const method = editItem ? "PUT" : "POST";
    const body = editItem ? { ...data, id: editItem.id } : data;
    await fetch("/api/admin/testimonials", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchTestimonials(); setShowModal(null); setEditItem(null);
  };
  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Hapus testimonial ini?")) return;
    await fetch("/api/admin/testimonials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchTestimonials();
  };
  const handleSavePortfolio = async (data: Partial<Portfolio>) => {
    const method = editItem ? "PUT" : "POST";
    const body = editItem ? { ...data, id: editItem.id } : data;
    await fetch("/api/admin/portfolio", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchPortfolios(); setShowModal(null); setEditItem(null);
  };
  const handleDeletePortfolio = async (id: string) => {
    if (!confirm("Hapus portfolio ini?")) return;
    await fetch("/api/admin/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchPortfolios();
  };
  const handleSavePromoCode = async (data: Partial<PromoCode>) => {
    const method = editItem ? "PUT" : "POST";
    const body = editItem ? { ...data, id: editItem.id } : data;
    await fetch("/api/admin/promo-codes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchPromoCodes(); setShowModal(null); setEditItem(null);
  };
  const handleDeletePromoCode = async (id: string) => {
    if (!confirm("Hapus promo code ini?")) return;
    await fetch("/api/admin/promo-codes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchPromoCodes();
  };
  const handleSaveBooster = async (data: Partial<Booster>) => {
    const method = editItem ? "PUT" : "POST";
    const body = editItem ? { ...data, id: editItem.id } : data;
    await fetch("/api/admin/boosters", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchBoosters(); setShowModal(null); setEditItem(null);
  };
  const handleDeleteBooster = async (id: string) => {
    if (!confirm("Hapus booster ini?")) return;
    await fetch("/api/admin/boosters", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchBoosters();
  };

  // Pricing handlers
  const savePricingCatalog = async (catalog: PricingCategory[]) => {
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing_catalog", value: catalog }),
      });
      if (res.ok) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000); }
      else alert("Gagal menyimpan pricing.");
    } catch { alert("Gagal menyimpan pricing."); }
    finally { setPricingSaving(false); }
  };

  const savePerStarPricing = async (tiers: PerStarTier[]) => {
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "perstar_pricing", value: tiers }),
      });
      if (res.ok) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000); }
      else alert("Gagal menyimpan per star pricing.");
    } catch { alert("Gagal menyimpan per star pricing."); }
    finally { setPricingSaving(false); }
  };

  const startEditPerStar = (tier: PerStarTier) => {
    setEditingPriceId(tier.id);
    setEditPriceValue(String(tier.price));
    setEditOriginalPrice(String(tier.originalPrice || ""));
  };

  const saveEditPerStar = (tierId: string) => {
    const price = Math.max(1, parseInt(editPriceValue) || 0);
    const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
    if (price <= 0) { alert("Harga harus lebih dari 0"); return; }
    if (originalPrice && originalPrice < price) { alert("Harga asli harus lebih besar dari harga diskon"); return; }
    const newTiers = perStarPricing.map(tier => {
      if (tier.id !== tierId) return tier;
      const discountPercent = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined;
      return { ...tier, price, originalPrice, discountPercent };
    });
    setPerStarPricing(newTiers);
    setEditingPriceId(null);
    savePerStarPricing(newTiers);
  };

  const saveGendongPricing = async (tiers: PerStarTier[]) => {
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "gendong_pricing", value: tiers }),
      });
      if (res.ok) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000); }
      else alert("Gagal menyimpan gendong pricing.");
    } catch { alert("Gagal menyimpan gendong pricing."); }
    finally { setPricingSaving(false); }
  };

  const saveEditGendong = (tierId: string) => {
    const newTiers = gendongPricing.map(tier => {
      if (tier.id !== tierId) return tier;
      const price = Math.max(0, parseInt(editPriceValue) || tier.price);
      const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
      const discountPercent = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined;
      return { ...tier, price, originalPrice, discountPercent };
    });
    setGendongPricing(newTiers);
    setEditingPriceId(null);
    saveGendongPricing(newTiers);
  };

  const startEditPrice = (pkg: PricingPackage) => {
    setEditingPriceId(pkg.id);
    setEditPriceValue(String(pkg.price));
    setEditOriginalPrice(String(pkg.originalPrice || ""));
  };

  const saveEditPrice = (catId: string, pkgId: string) => {
    const newCatalog = pricingCatalog.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        packages: cat.packages.map(pkg => {
          if (pkg.id !== pkgId) return pkg;
          const price = Math.max(0, parseInt(editPriceValue) || pkg.price);
          const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
          const discountPercent = originalPrice && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : undefined;
          return { ...pkg, price, originalPrice, discountPercent };
        }),
      };
    });
    setPricingCatalog(newCatalog);
    setEditingPriceId(null);
    savePricingCatalog(newCatalog);
  };

  // Helpers
  const getStatusColor = (s: string) => {
    const c: Record<string, string> = { pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30", in_progress: "bg-purple-500/20 text-purple-400 border-purple-500/30", completed: "bg-green-500/20 text-green-400 border-green-500/30", cancelled: "bg-red-500/20 text-red-400 border-red-500/30" };
    return c[s] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };
  const getStatusLabel = (s: string) => {
    const l: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" };
    return l[s] || s;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo/circle-landscape.webp"
            alt="ETNYX"
            width={200}
            height={50}
            className="h-12 w-auto animate-pulse"
            priority
          />
        </div>

        {/* Loading bar */}
        <div className="relative w-48 h-1 bg-surface rounded-full overflow-hidden mb-4">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full animate-loading-bar" />
        </div>

        {/* Loading text */}
        <p className="text-text-muted text-sm animate-pulse">
          Loading Command Center...
        </p>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>

        <style jsx>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          .animate-loading-bar {
            animation: loading-bar 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ===== SIDEBAR ===== */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16"} bg-surface border-r border-white/5 flex flex-col transition-all duration-200 fixed h-screen z-30`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-3 w-full">
            {sidebarOpen ? (
              <Image
                src="/logo/circle-landscape.webp"
                alt="ETNYX"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            ) : (
              <Image
                src="/logo/logo-circle.webp"
                alt="ETNYX"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                activeTab === tab.id
                  ? "text-accent bg-accent/10 border-r-2 border-accent"
                  : "text-text-muted hover:text-text hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <Link
            href="/admin/docs"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-white/5 transition-colors w-full ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Docs</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className={`flex-1 ${sidebarOpen ? "ml-56" : "ml-16"} transition-all duration-200`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-text capitalize">{activeTab === "overview" ? "Dashboard" : activeTab}</h1>
              <p className="text-xs text-text-muted">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" target="_blank" className="text-xs text-text-muted hover:text-accent flex items-center gap-1 transition-colors">
                <Eye className="w-3.5 h-3.5" /> Lihat Website
              </Link>
              {activeTab === "orders" && (
                <button onClick={() => fetchOrders()} className="p-2 rounded-lg bg-surface hover:bg-white/10 text-text-muted transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface rounded-xl p-4 border border-white/5 group hover:border-accent/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-xs text-green-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> today</span>
                  </div>
                  <p className="text-2xl font-bold text-text">{stats.total_orders}</p>
                  <p className="text-xs text-text-muted mt-0.5">Total Orders</p>
                </div>
                <div className="bg-surface rounded-xl p-4 border border-white/5 group hover:border-green-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold gradient-text">{formatRupiah(stats.total_revenue)}</p>
                  <p className="text-xs text-text-muted mt-0.5">Total Revenue</p>
                </div>
                <div className="bg-surface rounded-xl p-4 border border-white/5 group hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-xs text-yellow-400">{stats.orders_today} hari ini</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending_orders}</p>
                  <p className="text-xs text-text-muted mt-0.5">Pending Orders</p>
                </div>
                <div className="bg-surface rounded-xl p-4 border border-white/5 group hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{stats.in_progress_orders}</p>
                  <p className="text-xs text-text-muted mt-0.5">In Progress</p>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-surface rounded-xl p-5 border border-white/5">
                <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" /> Order Status Breakdown
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: "Pending", count: stats.pending_orders, bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
                    { label: "Confirmed", count: stats.confirmed_orders, bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
                    { label: "In Progress", count: stats.in_progress_orders, bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
                    { label: "Completed", count: stats.completed_orders, bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
                    { label: "Cancelled", count: stats.cancelled_orders, bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
                  ].map(({ label, count, bg, border, text }) => (
                    <div key={label} className={`text-center p-3 rounded-lg ${bg} border ${border}`}>
                      <p className={`text-xl font-bold ${text}`}>{count}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-surface rounded-xl p-5 border border-white/5">
                  <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" /> Revenue (7 Hari)
                  </h3>
                  <div className="h-52">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                          <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                          <Tooltip contentStyle={{ backgroundColor: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
                          <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <p className="text-text-muted text-sm flex items-center justify-center h-full">No data yet</p>}
                  </div>
                </div>
                <div className="bg-surface rounded-xl p-5 border border-white/5">
                  <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" /> Orders / Hari
                  </h3>
                  <div className="h-52">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChartRecharts data={chartData}>
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                          <YAxis stroke="#6b7280" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
                          <BarRecharts dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChartRecharts>
                      </ResponsiveContainer>
                    ) : <p className="text-text-muted text-sm flex items-center justify-center h-full">No data yet</p>}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface rounded-xl p-5 border border-white/5">
                  <p className="text-xs text-text-muted mb-1">Minggu Ini</p>
                  <p className="text-3xl font-bold gradient-text">{stats.orders_this_week}</p>
                  <p className="text-xs text-text-muted">orders</p>
                </div>
                <div className="bg-surface rounded-xl p-5 border border-white/5">
                  <p className="text-xs text-text-muted mb-1">Bulan Ini</p>
                  <p className="text-3xl font-bold gradient-text">{stats.orders_this_month}</p>
                  <p className="text-xs text-text-muted">orders</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Cari order ID, username, game ID, WhatsApp..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setOrdersPage(1); }}
                    className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
                    <button key={s} onClick={() => { setStatusFilter(s); setOrdersPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "gradient-primary text-white shadow-lg shadow-accent/20" : "bg-surface border border-white/5 text-text-muted hover:text-text"}`}>
                      {s === "all" ? "All" : getStatusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Order</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Customer</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Package</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Price</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Worker</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Progress</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12 text-text-muted">No orders found</td></tr>
                      ) : orders.map((o) => (
                        <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono text-accent text-xs">{o.order_id}</span>
                            <p className="text-text-muted text-[10px]">{new Date(o.created_at).toLocaleDateString("id-ID")}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-text text-xs font-medium">{o.username}</p>
                            <p className="text-text-muted text-[10px]">{o.login_method === "moonton" ? "Moonton" : `ID: ${o.game_id}`}</p>
                            {o.whatsapp && <p className="text-text-muted text-[10px]">{o.whatsapp}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-text">{o.package_title || `${rankWithStar(o.current_rank, o.current_star)} → ${rankWithStar(o.target_rank, o.target_star)}`}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {o.is_express && <Zap className="w-3 h-3 text-yellow-400" />}
                              {o.is_premium && <Crown className="w-3 h-3 text-purple-400" />}
                              {o.hero_request && <Gamepad2 className="w-3 h-3 text-cyan-400" />}
                            </div>
                            {o.promo_code && <span className="text-[10px] text-purple-400 font-mono">{o.promo_code}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-text">{formatRupiah(o.total_price)}</span>
                            {o.promo_discount > 0 && <p className="text-[10px] text-green-400">-{formatRupiah(o.promo_discount)}</p>}
                            {o.payment_method === "manual_transfer" && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Manual</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {o.assigned_worker_id ? (
                              <span className="text-xs text-text">{staffUsers.find(s => s.id === o.assigned_worker_id)?.name || "Unknown"}</span>
                            ) : (
                              <span className="text-[10px] text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-medium border ${getStatusColor(o.status)}`}>
                              {getStatusLabel(o.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-16">
                              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${o.progress}%` }} />
                              </div>
                              <span className="text-[10px] text-text-muted">{o.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 min-w-[150px]">
                              {/* === PENDING === */}
                              {o.status === "pending" && (<>
                                {o.payment_method === "manual_transfer" && (
                                  <button onClick={() => openProofModal(o.id, o.order_id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors w-full">
                                    <Eye className="w-3 h-3" /> Lihat Bukti
                                  </button>
                                )}
                                <button onClick={() => updateOrderStatus(o.id, "confirmed")}
                                  disabled={statusActionLoading === `${o.id}-confirmed`}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors w-full disabled:opacity-50">
                                  {statusActionLoading === `${o.id}-confirmed` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Konfirmasi Bayar
                                </button>
                                <div className="flex gap-1">
                                  {o.whatsapp && (
                                    <button onClick={() => sendFollowUp(o.id, "follow_up_payment")}
                                      disabled={followUpLoading === `${o.id}-follow_up_payment`}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                      {followUpLoading === `${o.id}-follow_up_payment` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MessageCircle className="w-2.5 h-2.5" />} Follow Up
                                    </button>
                                  )}
                                  <button onClick={() => updateOrderStatus(o.id, "cancelled")}
                                    disabled={statusActionLoading === `${o.id}-cancelled`}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                    {statusActionLoading === `${o.id}-cancelled` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <XCircle className="w-2.5 h-2.5" />} Cancel
                                  </button>
                                </div>
                              </>)}

                              {/* === CONFIRMED === */}
                              {o.status === "confirmed" && (<>
                                <button onClick={() => updateOrderStatus(o.id, "in_progress")}
                                  disabled={statusActionLoading === `${o.id}-in_progress`}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors w-full disabled:opacity-50">
                                  {statusActionLoading === `${o.id}-in_progress` ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />} Mulai Kerjakan
                                </button>
                                <button onClick={() => viewCredentials(o.id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors w-full">
                                  🔑 Credentials
                                </button>
                                {o.whatsapp && (
                                  <button onClick={() => sendFollowUp(o.id, "follow_up_credentials")}
                                    disabled={followUpLoading === `${o.id}-follow_up_credentials`}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors w-full disabled:opacity-50">
                                    {followUpLoading === `${o.id}-follow_up_credentials` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MessageCircle className="w-2.5 h-2.5" />} Minta Credentials
                                  </button>
                                )}
                              </>)}

                              {/* === IN PROGRESS === */}
                              {o.status === "in_progress" && (<>
                                <button onClick={() => updateOrderStatus(o.id, "completed")}
                                  disabled={statusActionLoading === `${o.id}-completed`}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors w-full disabled:opacity-50">
                                  {statusActionLoading === `${o.id}-completed` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Selesaikan
                                </button>
                                <button onClick={() => viewCredentials(o.id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors w-full">
                                  🔑 Credentials
                                </button>
                                {o.whatsapp && (
                                  <button onClick={() => sendFollowUp(o.id, "follow_up_progress")}
                                    disabled={followUpLoading === `${o.id}-follow_up_progress`}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors w-full disabled:opacity-50">
                                    {followUpLoading === `${o.id}-follow_up_progress` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />} Update Progress WA
                                  </button>
                                )}
                              </>)}

                              {/* === COMPLETED === */}
                              {o.status === "completed" && (<>
                                {o.whatsapp && (
                                  <div className="flex gap-1">
                                    <button onClick={() => sendFollowUp(o.id, "request_review")}
                                      disabled={followUpLoading === `${o.id}-request_review`}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50">
                                      {followUpLoading === `${o.id}-request_review` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Star className="w-2.5 h-2.5" />} Review
                                    </button>
                                    <button onClick={() => sendFollowUp(o.id, "notify_completed")}
                                      disabled={followUpLoading === `${o.id}-notify_completed`}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                      {followUpLoading === `${o.id}-notify_completed` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />} Notif
                                    </button>
                                  </div>
                                )}
                                <button onClick={() => updateOrderStatus(o.id, "in_progress")}
                                  disabled={statusActionLoading === `${o.id}-in_progress`}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors w-full disabled:opacity-50">
                                  {statusActionLoading === `${o.id}-in_progress` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Reopen
                                </button>
                              </>)}

                              {/* === CANCELLED === */}
                              {o.status === "cancelled" && (<>
                                <button onClick={() => updateOrderStatus(o.id, "pending")}
                                  disabled={statusActionLoading === `${o.id}-pending`}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors w-full disabled:opacity-50">
                                  {statusActionLoading === `${o.id}-pending` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Reaktivasi
                                </button>
                                {o.whatsapp && (
                                  <button onClick={() => sendFollowUp(o.id, "reactivation")}
                                    disabled={followUpLoading === `${o.id}-reactivation`}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors w-full disabled:opacity-50">
                                    {followUpLoading === `${o.id}-reactivation` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MessageCircle className="w-2.5 h-2.5" />} Follow Up WA
                                  </button>
                                )}
                              </>)}

                              {/* Universal: WA + Copy */}
                              <div className="flex gap-1 pt-1 border-t border-white/5">
                                {o.whatsapp && (
                                  <button onClick={() => openWhatsApp(o.whatsapp!, `Halo kak, ini dari ETNYX terkait order ${o.order_id}. `)}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Chat WA Manual">
                                    <MessageCircle className="w-2.5 h-2.5" /> WA
                                  </button>
                                )}
                                <button onClick={() => copyOrderInfo(o)}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] bg-surface text-text-muted hover:text-text transition-colors" title="Copy Info">
                                  <Copy className="w-2.5 h-2.5" /> Copy
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {ordersTotal > ORDERS_PER_PAGE && (
                <div className="flex items-center justify-between bg-surface rounded-xl border border-white/5 px-4 py-3">
                  <p className="text-text-muted text-xs">
                    Menampilkan {(ordersPage - 1) * ORDERS_PER_PAGE + 1}–{Math.min(ordersPage * ORDERS_PER_PAGE, ordersTotal)} dari {ordersTotal} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                      disabled={ordersPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs bg-background border border-white/10 text-text-muted hover:text-text disabled:opacity-30 transition-colors"
                    >
                      ← Prev
                    </button>
                    <span className="text-text text-xs font-medium">
                      {ordersPage} / {Math.ceil(ordersTotal / ORDERS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setOrdersPage(p => p + 1)}
                      disabled={ordersPage >= Math.ceil(ordersTotal / ORDERS_PER_PAGE)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-background border border-white/10 text-text-muted hover:text-text disabled:opacity-30 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== PRICING TAB ===== */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">Edit harga paket dan per bintang yang tampil di halaman order</p>
                </div>
                <button
                  onClick={() => pricingMode === "paket" ? savePricingCatalog(pricingCatalog) : pricingMode === "perstar" ? savePerStarPricing(perStarPricing) : saveGendongPricing(gendongPricing)}
                  disabled={pricingSaving}
                  className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {pricingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : pricingSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {pricingSaved ? "Tersimpan!" : "Simpan Semua"}
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="flex gap-2 p-1 bg-surface rounded-xl border border-white/5">
                <button
                  onClick={() => setPricingMode("paket")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    pricingMode === "paket"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Package className="w-4 h-4 inline-block mr-2" />
                  Joki Paket
                </button>
                <button
                  onClick={() => setPricingMode("perstar")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    pricingMode === "perstar"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Star className="w-4 h-4 inline-block mr-2" />
                  Joki Per Bintang
                </button>
                <button
                  onClick={() => setPricingMode("gendong")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    pricingMode === "gendong"
                      ? "gradient-primary text-white shadow-lg"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Users className="w-4 h-4 inline-block mr-2" />
                  Joki Gendong
                </button>
              </div>

              {/* PAKET MODE */}
              {pricingMode === "paket" && (
                <>
                  {pricingCatalog.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-white/5 p-12 text-center">
                      <Package className="w-10 h-10 text-text-muted mx-auto mb-3" />
                      <p className="text-text-muted text-sm mb-3">Belum ada data pricing di database.</p>
                      <p className="text-text-muted text-xs mb-4">Klik tombol di bawah untuk mengimpor pricing dari order page ke database agar bisa diedit via dashboard.</p>
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/admin/settings?key=pricing_catalog");
                          const d = await res.json();
                          if (!d.value) {
                            alert("Jalankan supabase-schema-v7.sql yang berisi default pricing_catalog terlebih dahulu, atau klik 'Import Default' di bawah.");
                          }
                        }}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm hover:bg-accent/20 transition"
                      >
                        Refresh Data
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Category tabs */}
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {pricingCatalog.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setActivePricingCat(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                              activePricingCat === cat.id
                                ? "gradient-primary text-white shadow-lg shadow-accent/20"
                                : "bg-surface border border-white/5 text-text-muted hover:text-text"
                            }`}
                          >
                            {cat.title}
                            <span className="ml-1.5 opacity-60">({cat.packages.length})</span>
                          </button>
                        ))}
                      </div>

                      {/* Package list */}
                      {pricingCatalog.filter(c => c.id === activePricingCat).map((cat) => (
                        <div key={cat.id} className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-text">{cat.title}</h3>
                            <span className="text-xs text-text-muted">{cat.packages.length} paket</span>
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/5">
                                <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Paket</th>
                                <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Rank</th>
                                <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga</th>
                                <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga Coret</th>
                                <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Diskon</th>
                                <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cat.packages.map((pkg) => (
                                <tr key={pkg.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                  <td className="px-4 py-2.5">
                                    <span className="text-text text-xs font-medium">{pkg.title}</span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className="text-accent text-xs">{rankLabel(pkg.currentRank)} → {rankLabel(pkg.targetRank)}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {editingPriceId === pkg.id ? (
                                      <input
                                        type="number"
                                        value={editPriceValue}
                                        onChange={(e) => setEditPriceValue(e.target.value)}
                                        className="w-28 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text text-right focus:outline-none"
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="text-text text-xs font-medium font-mono">{formatRupiah(pkg.price)}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {editingPriceId === pkg.id ? (
                                      <input
                                        type="number"
                                        value={editOriginalPrice}
                                        onChange={(e) => setEditOriginalPrice(e.target.value)}
                                        placeholder="Opsional"
                                        className="w-28 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-right focus:outline-none"
                                      />
                                    ) : (
                                      <span className="text-text-muted text-xs line-through font-mono">{pkg.originalPrice ? formatRupiah(pkg.originalPrice) : "-"}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {pkg.discountPercent ? (
                                      <span className="text-green-400 text-xs font-medium">-{pkg.discountPercent}%</span>
                                    ) : <span className="text-text-muted text-xs">-</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    {editingPriceId === pkg.id ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => saveEditPrice(cat.id, pkg.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setEditingPriceId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                          <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button onClick={() => startEditPrice(pkg)} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* PER STAR MODE */}
              {pricingMode === "perstar" && (
                <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text">Harga Per Bintang</h3>
                    <span className="text-xs text-text-muted">{perStarPricing.length} tier</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Tier Rank</th>
                        <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga/Star</th>
                        <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga Coret</th>
                        <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Diskon</th>
                        <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perStarPricing.map((tier) => (
                        <tr key={tier.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Image src={tier.icon} alt={tier.name} width={24} height={24} className="w-6 h-6 object-contain" />
                              <span className="text-text text-xs font-medium">{tier.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {editingPriceId === tier.id ? (
                              <input
                                type="number"
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(e.target.value)}
                                className="w-28 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text text-right focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <span className="text-text text-xs font-medium font-mono">{formatRupiah(tier.price)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {editingPriceId === tier.id ? (
                              <input
                                type="number"
                                value={editOriginalPrice}
                                onChange={(e) => setEditOriginalPrice(e.target.value)}
                                placeholder="Opsional"
                                className="w-28 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-right focus:outline-none"
                              />
                            ) : (
                              <span className="text-text-muted text-xs line-through font-mono">{tier.originalPrice ? formatRupiah(tier.originalPrice) : "-"}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {tier.discountPercent ? (
                              <span className="text-green-400 text-xs font-medium">-{tier.discountPercent}%</span>
                            ) : <span className="text-text-muted text-xs">-</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {editingPriceId === tier.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => saveEditPerStar(tier.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingPriceId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => startEditPerStar(tier)} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* GENDONG (DUO BOOST) MODE */}
              {pricingMode === "gendong" && (
                <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text">Harga Joki Gendong (Duo Boost)</h3>
                    <span className="text-xs text-text-muted">{gendongPricing.length} tier</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Tier Rank</th>
                        <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga/Star</th>
                        <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga Coret</th>
                        <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Diskon</th>
                        <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gendongPricing.map((tier) => (
                        <tr key={tier.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Image src={tier.icon} alt={tier.name} width={24} height={24} className="w-6 h-6 object-contain" />
                              <span className="text-text text-xs font-medium">{tier.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {editingPriceId === `gendong-${tier.id}` ? (
                              <input
                                type="number"
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(e.target.value)}
                                className="w-28 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text text-right focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <span className="text-text text-xs font-medium font-mono">{formatRupiah(tier.price)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {editingPriceId === `gendong-${tier.id}` ? (
                              <input
                                type="number"
                                value={editOriginalPrice}
                                onChange={(e) => setEditOriginalPrice(e.target.value)}
                                placeholder="Opsional"
                                className="w-28 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-right focus:outline-none"
                              />
                            ) : (
                              <span className="text-text-muted text-xs line-through font-mono">{tier.originalPrice ? formatRupiah(tier.originalPrice) : "-"}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {tier.discountPercent ? (
                              <span className="text-green-400 text-xs font-medium">-{tier.discountPercent}%</span>
                            ) : <span className="text-text-muted text-xs">-</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {editingPriceId === `gendong-${tier.id}` ? (
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => saveEditGendong(tier.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingPriceId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingPriceId(`gendong-${tier.id}`); setEditPriceValue(String(tier.price)); setEditOriginalPrice(String(tier.originalPrice || "")); }} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== BOOSTERS TAB ===== */}
          {activeTab === "boosters" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-text-muted">{boosters.length} boosters</p>
                <button onClick={() => { setEditItem(null); setShowModal("booster"); }}
                  className="flex items-center gap-1.5 gradient-primary px-3 py-2 rounded-lg text-white text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Booster
                </button>
              </div>
              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Name</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">WA</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Spec</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Orders</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Rating</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boosters.map((b) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-text text-xs font-medium">{b.name}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{b.whatsapp}</td>
                        <td className="px-4 py-3 text-accent text-xs">{b.rank_specialization}</td>
                        <td className="px-4 py-3 text-text text-xs font-medium">{b.total_orders}</td>
                        <td className="px-4 py-3">{Array.from({ length: Math.round(b.rating || 5) }).map((_, i) => <Star key={i} className="w-3 h-3 inline text-yellow-400 fill-yellow-400" />)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${b.is_available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {b.is_available ? "Online" : "Busy"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setEditItem(b); setShowModal("booster"); }} className="text-accent text-xs mr-2 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteBooster(b.id)} className="text-red-400 text-xs hover:underline">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== TESTIMONIALS TAB ===== */}
          {activeTab === "testimonials" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-text-muted">{testimonials.length} testimonials</p>
                <button onClick={() => { setEditItem(null); setShowModal("testimonial"); }}
                  className="flex items-center gap-1.5 gradient-primary px-3 py-2 rounded-lg text-white text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Testimonial
                </button>
              </div>
              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Name</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Rank</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Rating</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Comment</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonials.map((t) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-text text-xs font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-accent text-xs">{t.rank_from} → {t.rank_to}</td>
                        <td className="px-4 py-3">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-3 h-3 inline text-yellow-400 fill-yellow-400" />)}</td>
                        <td className="px-4 py-3 text-text-muted text-xs max-w-[200px] truncate">{t.comment}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${t.is_visible ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{t.is_visible ? "Visible" : "Hidden"}</span>
                          {t.is_featured && <span className="ml-1 px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400">★</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setEditItem(t); setShowModal("testimonial"); }} className="text-accent text-xs mr-2 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteTestimonial(t.id)} className="text-red-400 text-xs hover:underline">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== PORTFOLIO TAB ===== */}
          {activeTab === "portfolio" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-text-muted">{portfolios.length} items</p>
                <button onClick={() => { setEditItem(null); setShowModal("portfolio"); }}
                  className="flex items-center gap-1.5 gradient-primary px-3 py-2 rounded-lg text-white text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Portfolio
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {portfolios.map((p) => (
                  <div key={p.id} className="bg-surface rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
                    {/* Image preview */}
                    {p.image_after_url ? (
                      <div className="aspect-video relative">
                        <img src={p.image_after_url} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <span className="text-text-muted text-xs">No Image</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-text text-sm font-semibold mb-1">{p.title}</h3>
                      <p className="text-accent text-xs mb-2">{p.rank_from} → {p.rank_to}</p>
                      <p className="text-text-muted text-xs mb-3 line-clamp-2">{p.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${p.is_visible ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{p.is_visible ? "Visible" : "Hidden"}</span>
                        <div>
                          <button onClick={() => { setEditItem(p); setShowModal("portfolio"); }} className="text-accent text-xs mr-2 hover:underline">Edit</button>
                          <button onClick={() => handleDeletePortfolio(p.id)} className="text-red-400 text-xs hover:underline">Hapus</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== PROMO TAB ===== */}
          {activeTab === "promo" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-text-muted">{promoCodes.length} promo codes</p>
                <button onClick={() => { setEditItem(null); setShowModal("promo"); }}
                  className="flex items-center gap-1.5 gradient-primary px-3 py-2 rounded-lg text-white text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Promo Code
                </button>
              </div>
              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Code</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Discount</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Usage</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Expires</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-accent text-xs font-medium">{p.code}</td>
                        <td className="px-4 py-3 text-text text-xs">
                          {p.discount_type === "percentage" ? `${p.discount_value}%` : formatRupiah(p.discount_value)}
                          {p.max_discount && <span className="text-text-muted text-[10px] ml-1">(max {formatRupiah(p.max_discount)})</span>}
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">{p.used_count}/{p.max_uses || "∞"}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{p.expires_at ? new Date(p.expires_at).toLocaleDateString("id-ID") : "Never"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${p.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{p.is_active ? "Active" : "Inactive"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setEditItem(p); setShowModal("promo"); }} className="text-accent text-xs mr-2 hover:underline">Edit</button>
                          <button onClick={() => handleDeletePromoCode(p.id)} className="text-red-400 text-xs hover:underline">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== CUSTOMERS TAB ===== */}
          {activeTab === "customers" && (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">{customers.length} customers</p>
              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Name</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Email</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">WA</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Orders</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Spent</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Tier</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Points</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Referral</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-text text-xs font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{c.email}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{c.whatsapp || "-"}</td>
                        <td className="px-4 py-3 text-accent text-xs font-medium">{c.total_orders}</td>
                        <td className="px-4 py-3 text-text text-xs">{formatRupiah(c.total_spent)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            c.reward_tier === "platinum" ? "bg-gray-200/10 text-gray-200" :
                            c.reward_tier === "gold" ? "bg-yellow-500/10 text-yellow-400" :
                            c.reward_tier === "silver" ? "bg-gray-400/10 text-gray-300" :
                            "bg-amber-700/10 text-amber-600"
                          }`}>
                            {c.reward_tier === "platinum" ? "💎" : c.reward_tier === "gold" ? "🥇" : c.reward_tier === "silver" ? "🥈" : "🥉"} {(c.reward_tier || "bronze").charAt(0).toUpperCase() + (c.reward_tier || "bronze").slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text text-xs font-medium">{c.reward_points?.toLocaleString("id-ID") || 0}</td>
                        <td className="px-4 py-3 font-mono text-purple-400 text-xs">{c.referral_code}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              const input = prompt(`Adjust poin untuk ${c.name}\nCurrent: ${c.reward_points} pts\n\nMasukkan jumlah (positif = tambah, negatif = kurangi):`);
                              if (!input) return;
                              const pts = parseInt(input);
                              if (isNaN(pts) || pts === 0) return;
                              const desc = prompt("Alasan:") || (pts > 0 ? "Bonus dari admin" : "Pengurangan oleh admin");
                              fetch("/api/admin/rewards", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ customerId: c.id, points: pts, description: desc }),
                              }).then(r => r.json()).then(d => {
                                if (d.success) {
                                  setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, reward_points: d.newBalance, reward_tier: d.newTier } : x));
                                  alert(`Berhasil! Saldo baru: ${d.newBalance} poin (${d.newTier})`);
                                } else alert("Gagal: " + (d.error || "Unknown error"));
                              }).catch(() => alert("Gagal adjust poin"));
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-accent transition-colors"
                            title="Adjust Points"
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== REWARDS TAB ===== */}
          {activeTab === "rewards" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setRewardsSubTab("catalog")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${rewardsSubTab === "catalog" ? "gradient-primary text-white" : "text-text-muted hover:text-text"}`}>Katalog Hadiah</button>
                <button onClick={() => setRewardsSubTab("redemptions")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${rewardsSubTab === "redemptions" ? "gradient-primary text-white" : "text-text-muted hover:text-text"}`}>
                  Penukaran {rewardRedemptions.filter(r => r.status === "pending").length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{rewardRedemptions.filter(r => r.status === "pending").length}</span>}
                </button>
              </div>

              {rewardsSubTab === "catalog" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-muted">{catalogItems.length} items</p>
                    <button onClick={() => { setEditCatalogItem(null); setCatalogForm({ name: "", description: "", category: "skin", pointsCost: 500, stock: "", imageUrl: "" }); setCatalogModal(true); }}
                      className="flex items-center gap-2 gradient-primary px-4 py-2 rounded-xl text-white text-sm font-medium">
                      <Plus className="w-4 h-4" /> Tambah Hadiah
                    </button>
                  </div>
                  <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Nama</th>
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Kategori</th>
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Poin</th>
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Stok</th>
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalogItems.map((item) => (
                          <tr key={item.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${!item.is_active ? "opacity-50" : ""}`}>
                            <td className="px-4 py-3 text-text text-xs font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                item.category === "skin" ? "bg-purple-500/10 text-purple-400" :
                                item.category === "diamond" ? "bg-cyan-500/10 text-cyan-400" :
                                item.category === "starlight" ? "bg-yellow-500/10 text-yellow-400" :
                                item.category === "discount" ? "bg-green-500/10 text-green-400" :
                                "bg-pink-500/10 text-pink-400"
                              }`}>{item.category}</span>
                            </td>
                            <td className="px-4 py-3 text-accent text-xs font-bold">{item.points_cost.toLocaleString("id-ID")}</td>
                            <td className="px-4 py-3 text-text-muted text-xs">{item.stock ?? "∞"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs ${item.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                {item.is_active ? "Active" : "Hidden"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => {
                                  setEditCatalogItem(item);
                                  setCatalogForm({ name: item.name, description: item.description || "", category: item.category, pointsCost: item.points_cost, stock: item.stock?.toString() || "", imageUrl: item.image_url || "" });
                                  setCatalogModal(true);
                                }} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-accent"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={async () => {
                                  if (!confirm(`Hapus "${item.name}"?`)) return;
                                  await fetch("/api/admin/rewards/catalog", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
                                  fetchRewardsCatalog();
                                }} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {rewardsSubTab === "redemptions" && (
                <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Customer</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Item</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Game ID</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Poin</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Tanggal</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewardRedemptions.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="text-text text-xs font-medium">{r.customers?.name || "-"}</p>
                            <p className="text-text-muted text-[10px]">{r.customers?.whatsapp || ""}</p>
                          </td>
                          <td className="px-4 py-3 text-text text-xs">{r.reward_catalog?.name || "-"}</td>
                          <td className="px-4 py-3 text-accent text-xs font-mono">{r.game_id || "-"}</td>
                          <td className="px-4 py-3 text-text text-xs font-bold">{r.points_spent}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              r.status === "completed" ? "bg-green-500/10 text-green-400" :
                              r.status === "processing" ? "bg-blue-500/10 text-blue-400" :
                              r.status === "rejected" ? "bg-red-500/10 text-red-400" :
                              "bg-yellow-500/10 text-yellow-400"
                            }`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                          <td className="px-4 py-3">
                            {r.status === "pending" && (
                              <div className="flex items-center gap-1">
                                <button onClick={async () => {
                                  await fetch("/api/admin/rewards/catalog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redemptionId: r.id, status: "processing" }) });
                                  fetchRedemptions();
                                }} className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Proses</button>
                                <button onClick={async () => {
                                  if (!confirm("Tolak dan refund poin?")) return;
                                  await fetch("/api/admin/rewards/catalog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redemptionId: r.id, status: "rejected", adminNotes: "Ditolak oleh admin" }) });
                                  fetchRedemptions();
                                }} className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20">Tolak</button>
                              </div>
                            )}
                            {r.status === "processing" && (
                              <button onClick={async () => {
                                const notes = prompt("Catatan (opsional, contoh: Skin sudah dikirim):");
                                await fetch("/api/admin/rewards/catalog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redemptionId: r.id, status: "completed", adminNotes: notes || "Hadiah sudah dikirim" }) });
                                fetchRedemptions();
                              }} className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20">Selesai</button>
                            )}
                            {(r.status === "completed" || r.status === "rejected") && (
                              <span className="text-text-muted text-xs">{r.admin_notes || "-"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {rewardRedemptions.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">Belum ada penukaran</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== STAFF TAB ===== */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text">Staff Management</h2>
                <button onClick={() => { setEditStaff(null); setStaffForm({ email: "", name: "", password: "", role: "worker", phone: "", lead_id: "" }); setStaffModal(true); }}
                  className="flex items-center gap-2 gradient-primary px-4 py-2 rounded-xl text-white text-sm font-medium">
                  <Plus className="w-4 h-4" /> Tambah Staff
                </button>
              </div>

              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-background/50">
                    <tr className="text-text-muted text-xs">
                      <th className="px-4 py-3 text-left">Nama</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-center">Role</th>
                      <th className="px-4 py-3 text-center">Lead</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Last Login</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staffUsers.map(u => (
                      <tr key={u.id} className={`hover:bg-white/[0.02] ${!u.is_active ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3 text-text font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-text-muted">{u.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === "admin" ? "bg-red-500/10 text-red-400" :
                            u.role === "lead" ? "bg-blue-500/10 text-blue-400" :
                            "bg-green-500/10 text-green-400"
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-text-muted text-xs">
                          {u.role === "worker" && u.lead_id ? staffUsers.find(s => s.id === u.lead_id)?.name || "-" : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${u.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-text-muted text-xs">
                          {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { setEditStaff(u); setStaffForm({ email: u.email, name: u.name, password: "", role: u.role, phone: u.phone || "", lead_id: u.lead_id || "" }); setStaffModal(true); }}
                              className="p-1.5 text-text-muted hover:text-accent transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            {u.is_active && u.role !== "admin" && (
                              <button onClick={() => handleDeactivateStaff(u.id)}
                                className="p-1.5 text-text-muted hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {staffUsers.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">Belum ada staff</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Staff Modal */}
              {staffModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setStaffModal(false)}>
                  <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-white/10 space-y-4" onClick={e => e.stopPropagation()}>
                    <h3 className="text-text font-semibold">{editStaff ? "Edit Staff" : "Tambah Staff Baru"}</h3>
                    {!editStaff && (
                      <input placeholder="Email" type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none" />
                    )}
                    <input placeholder="Nama" value={staffForm.name} onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none" />
                    <input placeholder={editStaff ? "Password baru (kosongkan jika tidak diubah)" : "Password"} type="password" value={staffForm.password} onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none" />
                    <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value, lead_id: e.target.value !== "worker" ? "" : p.lead_id }))}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none">
                      <option value="worker">Worker</option>
                      <option value="lead">Lead</option>
                      <option value="admin">Admin</option>
                    </select>
                    {staffForm.role === "worker" && (
                      <select value={staffForm.lead_id} onChange={e => setStaffForm(p => ({ ...p, lead_id: e.target.value }))}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none">
                        <option value="">-- Pilih Lead (opsional) --</option>
                        {staffUsers.filter(s => s.role === "lead" && s.is_active).map(lead => (
                          <option key={lead.id} value={lead.id}>{lead.name}</option>
                        ))}
                      </select>
                    )}
                    <input placeholder="Phone / WhatsApp (opsional)" value={staffForm.phone} onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none" />
                    <div className="flex gap-3">
                      <button onClick={() => setStaffModal(false)} className="flex-1 px-3 py-2.5 border border-white/10 rounded-xl text-text-muted text-sm">Batal</button>
                      <button onClick={handleSaveStaff} disabled={staffSaving} className="flex-1 gradient-primary px-3 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50">
                        {staffSaving ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== REVIEWS TAB ===== */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setReviewsSubTab("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${reviewsSubTab === "all" ? "bg-accent/20 text-accent" : "bg-white/5 text-text-muted hover:bg-white/10"}`}>
                    Semua ({reviews.length})
                  </button>
                  <button onClick={() => setReviewsSubTab("reports")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${reviewsSubTab === "reports" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-text-muted hover:bg-white/10"}`}>
                    ⚠️ Reports ({reviews.filter(r => r.has_worker_report).length})
                  </button>
                </div>
                <button onClick={fetchReviews} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-text-muted text-xs hover:bg-white/10">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-surface rounded-xl border border-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-text">{reviews.length}</p>
                  <p className="text-xs text-text-muted mt-1">Total Reviews</p>
                </div>
                <div className="bg-surface rounded-xl border border-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{reviews.length > 0 ? (reviews.reduce((s, r) => s + r.service_rating, 0) / reviews.length).toFixed(1) : "0"}</p>
                  <p className="text-xs text-text-muted mt-1">Avg Rating</p>
                </div>
                <div className="bg-surface rounded-xl border border-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{reviews.filter(r => r.has_worker_report).length}</p>
                  <p className="text-xs text-text-muted mt-1">Worker Reports</p>
                </div>
                <div className="bg-surface rounded-xl border border-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-accent">{reviews.filter(r => r.service_rating >= 4).length}</p>
                  <p className="text-xs text-text-muted mt-1">Rating 4-5</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Order</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Customer</th>
                      <th className="text-center text-text-muted text-xs font-medium px-4 py-3">Service</th>
                      <th className="text-center text-text-muted text-xs font-medium px-4 py-3">Worker</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Comment</th>
                      <th className="text-center text-text-muted text-xs font-medium px-4 py-3">Report</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Date</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reviewsSubTab === "reports" ? reviews.filter(r => r.has_worker_report) : reviews).map((r) => (
                      <tr key={r.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${r.has_worker_report ? "bg-red-500/[0.03]" : ""}`}>
                        <td className="px-4 py-3 font-mono text-xs text-accent">{r.order_id}</td>
                        <td className="px-4 py-3">
                          <p className="text-text text-xs">{r.customer_name || "-"}</p>
                          {r.customer_whatsapp && <p className="text-text-muted text-[10px]">{r.customer_whatsapp}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-yellow-400 font-bold">{r.service_rating}</span>
                          <Star className="w-3 h-3 inline ml-0.5 text-yellow-400 fill-yellow-400" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.worker_rating ? (
                            <><span className="text-yellow-400 font-bold">{r.worker_rating}</span><Star className="w-3 h-3 inline ml-0.5 text-yellow-400 fill-yellow-400" /></>
                          ) : <span className="text-text-muted text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-text text-xs truncate">{r.service_comment || "-"}</p>
                          {r.worker_comment && <p className="text-text-muted text-[10px] truncate mt-0.5">Worker: {r.worker_comment}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.has_worker_report ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              ⚠️ {r.report_type?.replace(/_/g, " ")}
                            </span>
                          ) : <span className="text-text-muted text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={async () => {
                                await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, is_visible: !r.is_visible }) });
                                fetchReviews();
                              }}
                              className={`text-xs px-2 py-1 rounded ${r.is_visible ? "text-accent" : "text-text-muted"} hover:underline`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {r.has_worker_report && r.report_status === "pending" && (
                              <button
                                onClick={async () => {
                                  await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, report_status: "reviewed" }) });
                                  fetchReviews();
                                }}
                                className="text-xs px-2 py-1 rounded text-yellow-400 hover:underline"
                              >
                                Reviewed
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(reviewsSubTab === "reports" ? reviews.filter(r => r.has_worker_report) : reviews).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted text-sm">Belum ada review</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Report detail modal - shown via click */}
              {reviewsSubTab === "reports" && reviews.filter(r => r.has_worker_report && r.report_detail).length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-red-400">📋 Report Details</h4>
                  {reviews.filter(r => r.has_worker_report && r.report_detail).map(r => (
                    <div key={r.id} className="border-b border-red-500/10 pb-3 last:border-0">
                      <p className="text-xs text-text-muted">
                        <span className="font-mono text-accent">{r.order_id}</span> — <span className="text-red-400">{r.report_type?.replace(/_/g, " ")}</span>
                        {r.report_status && <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${r.report_status === "pending" ? "bg-yellow-500/10 text-yellow-400" : r.report_status === "reviewed" ? "bg-blue-500/10 text-blue-400" : r.report_status === "resolved" ? "bg-green-500/10 text-green-400" : "bg-white/5 text-text-muted"}`}>{r.report_status}</span>}
                      </p>
                      <p className="text-sm text-text mt-1">{r.report_detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PAYROLL TAB ===== */}
          {activeTab === "payroll" && (
            <PayrollTab />
          )}

          {/* ===== REPORTS TAB ===== */}
          {activeTab === "reports" && (
            <ReportsTab />
          )}

          {/* ===== ADS PERFORMANCE TAB ===== */}
          {activeTab === "ads" && (
            <AdsTab />
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === "settings" && (
            <SettingsTab onSwitchTab={setActiveTab} />
          )}

        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-white/5">
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-text-muted/40 text-[10px] tracking-wide">PT Sumber Arto Moro Abadi Kreatif</p>
            <div className="flex items-center gap-4">
              <p className="text-text-muted/50 text-[10px]">© 2026 ETNYX. All rights reserved.</p>
              <span className="text-text-muted/20">•</span>
              <p className="text-text-muted/30 text-[10px]">Designed &amp; Developed by <span className="text-text-muted/50 hover:text-accent transition-colors cursor-default">Briyanes</span></p>
            </div>
          </div>
        </footer>
      </div>

      {/* ===== CREDENTIALS MODAL ===== */}
      {credentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCredentials(null)}>
          <div className="bg-surface rounded-xl border border-white/10 p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-text mb-0.5">Account Credentials</h3>
            <p className="text-text-muted text-xs mb-4">Order: <span className="font-mono text-accent">{credentials.order_id}</span></p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-text-muted">Login / Email</label>
                <div className="bg-background rounded-lg px-3 py-2 font-mono text-xs text-text break-all">{credentials.account_login || <span className="text-text-muted italic">N/A</span>}</div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted">Password</label>
                <div className="bg-background rounded-lg px-3 py-2 font-mono text-xs text-text break-all">{credentials.account_password || <span className="text-text-muted italic">N/A</span>}</div>
              </div>
            </div>
            <p className="text-[10px] text-yellow-400/80 mt-3">⚠️ Jangan bagikan data ini.</p>
            <button onClick={() => setCredentials(null)} className="w-full mt-3 px-3 py-2 border border-white/10 rounded-lg text-text-muted text-xs hover:bg-white/5 transition">Tutup</button>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}
      {showModal === "testimonial" && (
        <TestimonialModal item={editItem as Testimonial | null} onSave={handleSaveTestimonial} onClose={() => { setShowModal(null); setEditItem(null); }} />
      )}
      {showModal === "portfolio" && (
        <PortfolioModal item={editItem as Portfolio | null} onSave={handleSavePortfolio} onClose={() => { setShowModal(null); setEditItem(null); }} />
      )}
      {showModal === "promo" && (
        <PromoModal item={editItem as PromoCode | null} onSave={handleSavePromoCode} onClose={() => { setShowModal(null); setEditItem(null); }} />
      )}
      {showModal === "booster" && (
        <BoosterModal item={editItem as Booster | null} onSave={handleSaveBooster} onClose={() => { setShowModal(null); setEditItem(null); }} />
      )}

      {/* Catalog Item Modal */}
      {catalogModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCatalogModal(false)}>
          <div className="bg-surface rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-text mb-4">{editCatalogItem ? "Edit" : "Tambah"} Hadiah</h3>
            <div className="space-y-3">
              <input placeholder="Nama hadiah" value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
              <textarea placeholder="Deskripsi (opsional)" value={catalogForm.description} onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm resize-none" rows={2} />
              <div>
                <label className="text-text text-xs mb-1 block">Kategori</label>
                <select value={catalogForm.category} onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
                  <option value="skin">Skin</option>
                  <option value="starlight">Starlight</option>
                  <option value="diamond">Diamond</option>
                  <option value="discount">Diskon</option>
                  <option value="merchandise">Merchandise</option>
                </select>
              </div>
              <div>
                <label className="text-text text-xs mb-1 block">Poin Diperlukan</label>
                <input type="number" min={1} value={catalogForm.pointsCost} onChange={(e) => setCatalogForm({ ...catalogForm, pointsCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
              </div>
              <div>
                <label className="text-text text-xs mb-1 block">Stok (kosongkan untuk unlimited)</label>
                <input type="number" min={0} placeholder="∞" value={catalogForm.stock} onChange={(e) => setCatalogForm({ ...catalogForm, stock: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
              </div>
              <div>
                <label className="text-text text-xs mb-1 block">URL Gambar (opsional)</label>
                <input placeholder="https://..." value={catalogForm.imageUrl} onChange={(e) => setCatalogForm({ ...catalogForm, imageUrl: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCatalogModal(false)} className="flex-1 px-3 py-2 border border-white/10 rounded-lg text-text-muted text-sm">Batal</button>
              <button onClick={async () => {
                if (!catalogForm.name.trim()) return alert("Nama hadiah wajib diisi");
                if (catalogForm.pointsCost < 1) return alert("Poin harus minimal 1");
                const body = {
                  name: catalogForm.name.trim(),
                  description: catalogForm.description.trim() || null,
                  category: catalogForm.category,
                  points_cost: catalogForm.pointsCost,
                  stock: catalogForm.stock ? parseInt(catalogForm.stock) : null,
                  image_url: catalogForm.imageUrl.trim() || null,
                  ...(editCatalogItem ? { id: editCatalogItem.id } : {}),
                };
                const method = editCatalogItem ? "PUT" : "POST";
                const res = await fetch("/api/admin/rewards/catalog", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                if (res.ok) { fetchRewardsCatalog(); setCatalogModal(false); } else { const d = await res.json(); alert(d.error || "Gagal menyimpan"); }
              }} className="flex-1 gradient-primary px-3 py-2 rounded-lg text-white text-sm font-medium">
                <Save className="w-4 h-4 inline mr-1" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {proofModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProofModal(null)}>
          <div className="bg-surface rounded-xl p-5 w-full max-w-lg border border-white/10 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text">Bukti Transfer — {proofModal.orderDisplayId}</h3>
              <button onClick={() => setProofModal(null)} className="text-text-muted hover:text-text text-lg">×</button>
            </div>

            {proofsLoading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" /></div>
            ) : proofs.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-text-muted text-sm">Belum ada bukti transfer yang diupload customer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proofs.map((proof) => (
                  <div key={proof.id} className="bg-background rounded-xl p-4 border border-white/5 space-y-3">
                    {/* Proof Image */}
                    <a href={proof.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={proof.image_url} alt="Bukti Transfer" className="w-full max-h-72 object-contain rounded-lg bg-white/5 cursor-pointer hover:opacity-90 transition-opacity" />
                    </a>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-text-muted">Pengirim:</span>
                        <p className="text-text font-medium">{proof.sender_name || "-"}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Bank:</span>
                        <p className="text-text font-medium">{proof.sender_bank || "-"}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Nominal:</span>
                        <p className="text-text font-medium">{proof.amount ? formatRupiah(proof.amount) : "-"}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Waktu:</span>
                        <p className="text-text font-medium">{new Date(proof.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        proof.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        proof.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>
                        {proof.status === "approved" ? "✅ Approved" : proof.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                      </span>

                      {/* Actions */}
                      {proof.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProofAction(proof.id, "approve")}
                            disabled={proofActionLoading === proof.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                          >
                            {proofActionLoading === proof.id ? "..." : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => handleProofAction(proof.id, "reject")}
                            disabled={proofActionLoading === proof.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                    {proof.reject_reason && (
                      <p className="text-xs text-red-400/70">Alasan: {proof.reject_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MODAL COMPONENTS =====

function TestimonialModal({ item, onSave, onClose }: { item: Testimonial | null; onSave: (data: Partial<Testimonial>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || "", rank_from: item?.rank_from || "warrior", rank_to: item?.rank_to || "mythic",
    rating: item?.rating || 5, comment: item?.comment || "", is_featured: item?.is_featured || false, is_visible: item?.is_visible ?? true,
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-text mb-4">{item ? "Edit" : "Tambah"} Testimonial</h3>
        <div className="space-y-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.rank_from} onChange={(e) => setForm({ ...form, rank_from: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
              {RANKS.map((r) => <option key={r} value={r}>{rankLabel(r)}</option>)}
            </select>
            <select value={form.rank_to} onChange={(e) => setForm({ ...form, rank_to: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
              {RANKS.map((r) => <option key={r} value={r}>{rankLabel(r)}</option>)}
            </select>
          </div>
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star</option>)}
          </select>
          <textarea placeholder="Comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm h-20 resize-none" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-text text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
            <label className="flex items-center gap-2 text-text text-sm"><input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} /> Visible</label>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 border border-white/10 rounded-lg text-text-muted text-sm">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 gradient-primary px-3 py-2 rounded-lg text-white text-sm font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function PortfolioModal({ item, onSave, onClose }: { item: Portfolio | null; onSave: (data: Partial<Portfolio>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: item?.title || "", rank_from: item?.rank_from || "epic", rank_to: item?.rank_to || "mythic",
    description: item?.description || "", is_visible: item?.is_visible ?? true, image_after_url: item?.image_after_url || "",
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "portfolio");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, image_after_url: data.url }));
      } else {
        alert(data.error || "Upload gagal");
      }
    } catch {
      alert("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl p-5 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-text mb-4">{item ? "Edit" : "Tambah"} Portfolio</h3>
        <div className="space-y-3">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.rank_from} onChange={(e) => setForm({ ...form, rank_from: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
              {RANKS.map((r) => <option key={r} value={r}>{rankLabel(r)}</option>)}
            </select>
            <select value={form.rank_to} onChange={(e) => setForm({ ...form, rank_to: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
              {RANKS.map((r) => <option key={r} value={r}>{rankLabel(r)}</option>)}
            </select>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm h-20 resize-none" />

          {/* Image Upload */}
          <div>
            <label className="block text-text text-xs font-medium mb-1.5">Screenshot Hasil Push Rank</label>
            {form.image_after_url && (
              <div className="relative mb-2 rounded-lg overflow-hidden border border-white/10">
                <img src={form.image_after_url} alt="Preview" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_after_url: "" })}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
            <label className={`flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-accent/40 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-text-muted text-xs">{uploading ? "Uploading..." : "Upload Gambar (max 5MB)"}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <label className="flex items-center gap-2 text-text text-sm"><input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} /> Visible</label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 border border-white/10 rounded-lg text-text-muted text-sm">Cancel</button>
          <button onClick={() => onSave(form)} disabled={uploading} className="flex-1 gradient-primary px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}

function PromoModal({ item, onSave, onClose }: { item: PromoCode | null; onSave: (data: Partial<PromoCode>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: item?.code || "", discount_type: item?.discount_type || "percentage" as "percentage" | "fixed",
    discount_value: item?.discount_value || 10, max_discount: item?.max_discount || null as number | null,
    max_uses: item?.max_uses || null as number | null, is_active: item?.is_active ?? true,
    expires_at: item?.expires_at ? item.expires_at.split("T")[0] : "",
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl p-5 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-text mb-4">{item ? "Edit" : "Tambah"} Promo Code</h3>
        <div className="space-y-3">
          <input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm font-mono" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (Rp)</option>
            </select>
            <input type="number" placeholder="Value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseInt(e.target.value) || 0 })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          </div>
          {form.discount_type === "percentage" && (
            <input type="number" placeholder="Max Discount (Rp)" value={form.max_discount || ""} onChange={(e) => setForm({ ...form, max_discount: parseInt(e.target.value) || null })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          )}
          <input type="number" placeholder="Max Uses (empty = unlimited)" value={form.max_uses || ""} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || null })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          <label className="flex items-center gap-2 text-text text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 border border-white/10 rounded-lg text-text-muted text-sm">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 gradient-primary px-3 py-2 rounded-lg text-white text-sm font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function BoosterModal({ item, onSave, onClose }: { item: Booster | null; onSave: (data: Partial<Booster>) => void; onClose: () => void }) {
  const specOptions = ["tank", "fighter", "assassin", "mage", "marksman", "support"];
  const [form, setForm] = useState({
    name: item?.name || "", whatsapp: item?.whatsapp || "", rank_specialization: item?.rank_specialization || "Mythic",
    is_available: item?.is_available ?? true, rating: item?.rating || 5,
    specialization: (item?.specialization as string[] | null) || [],
    total_orders: item?.total_orders || 0,
  });
  const toggleSpec = (s: string) => {
    setForm((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(s) ? prev.specialization.filter((x) => x !== s) : [...prev.specialization, s],
    }));
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl p-5 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-text mb-4">{item ? "Edit" : "Tambah"} Booster</h3>
        <div className="space-y-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          <input placeholder="WhatsApp (628xxx)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          <select value={form.rank_specialization} onChange={(e) => setForm({ ...form, rank_specialization: e.target.value })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
            <option value="Epic - Legend">Epic - Legend</option>
            <option value="Legend - Mythic">Legend - Mythic</option>
            <option value="Mythic">Mythic</option>
            <option value="Mythic Glory">Mythic Glory</option>
            <option value="All Ranks">All Ranks</option>
          </select>
          <div>
            <label className="text-text text-xs mb-1 block">Spesialisasi Hero</label>
            <div className="flex flex-wrap gap-2">
              {specOptions.map((s) => (
                <button key={s} type="button" onClick={() => toggleSpec(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${form.specialization.includes(s) ? "bg-accent/20 border-accent/40 text-accent" : "bg-background border-white/10 text-text-muted hover:border-white/20"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <input type="number" placeholder="Total Orders" value={form.total_orders} onChange={(e) => setForm({ ...form, total_orders: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm" />
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
            {[5, 4.9, 4.8, 4.7, 4.5, 4, 3].map((r) => <option key={r} value={r}>{r} Star</option>)}
          </select>
          <label className="flex items-center gap-2 text-text text-sm"><input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> Available</label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 border border-white/10 rounded-lg text-text-muted text-sm">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 gradient-primary px-3 py-2 rounded-lg text-white text-sm font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}
