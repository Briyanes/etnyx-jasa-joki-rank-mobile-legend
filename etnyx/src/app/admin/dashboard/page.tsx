"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/utils/helpers";
import {
  BarChart3, Zap, Gamepad2, Star, Download, CheckCircle, XCircle, Crown,
  Settings2, Package, Users, Shield, Trophy, Tag, Eye, TrendingUp,
  ShoppingCart, DollarSign, Clock, Activity, ChevronRight, Loader2,
  Plus, Pencil, Trash2, Save, Search, Filter, RefreshCw, LogOut,
  EyeOff, GripVertical, Globe, HelpCircle, Layout, Megaphone, Share2, Building,
  CreditCard, Mail, MessageCircle, Send, BookOpen,
} from "lucide-react";
import dynamic from "next/dynamic";

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
  created_at: string;
}

interface Booster {
  id: string;
  name: string;
  whatsapp: string;
  rank_specialization: string;
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

interface HeroSettings { headline: string; subheadline: string; ctaPrimary: string; ctaSecondary: string; isVisible: boolean; }
interface PromoBannerSettings { text: string; link: string; isVisible: boolean; }
interface FAQItem { question: string; answer: string; }
interface TeamMember { name: string; role: string; specialization: string; rank: string; isVisible: boolean; }
interface SectionVisibility { hero: boolean; liveCounter: boolean; howItWorks: boolean; pricing: boolean; whyChooseUs: boolean; teamShowcase: boolean; testimonials: boolean; portfolio: boolean; tracking: boolean; trust: boolean; faq: boolean; cta: boolean; }
interface TrackingPixels { metaPixelId: string; metaAccessToken: string; googleAdsId: string; googleAdsConversionLabel: string; googleAnalyticsId: string; tiktokPixelId: string; isMetaEnabled: boolean; isGoogleAdsEnabled: boolean; isGoogleAnalyticsEnabled: boolean; isTiktokEnabled: boolean; }
interface SocialLinks { instagram: string; facebook: string; tiktok: string; youtube: string; whatsapp: string; }
interface SiteInfo { siteName: string; taglineId: string; taglineEn: string; supportEmail: string; companyName: string; }
interface IntegrationSettings { 
  midtransClientKey: string; 
  midtransServerKey: string; 
  midtransMerchantId: string; 
  midtransIsProduction: boolean;
  resendApiKey: string;
  resendFromEmail: string;
  fonnteApiToken: string;
  fonnteDeviceId: string;
  telegramBotToken: string;
  telegramAdminGroupId: string;
  telegramWorkerGroupId: string;
}

type SettingsSubTab = "cms-sections" | "hero" | "banner" | "faq" | "team" | "social" | "site" | "pixels" | "integrations" | "general";

type TabType = "overview" | "orders" | "boosters" | "testimonials" | "portfolio" | "promo" | "customers" | "pricing" | "settings";

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
  { id: "settings", label: "Settings", icon: Settings2 },
];

// ---- Rank helpers ----
const RANKS = ["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicglory"];

const rankLabel = (r: string) => {
  const m: Record<string, string> = { warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster", epic: "Epic", legend: "Legend", mythic: "Mythic", mythicglory: "Mythic Glory" };
  return m[r] || r;
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
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Testimonial | Portfolio | PromoCode | Booster | null>(null);
  const [credentials, setCredentials] = useState<{ order_id: string; account_login: string | null; account_password: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Pricing state
  const [pricingCatalog, setPricingCatalog] = useState<PricingCategory[]>([]);
  const [perStarPricing, setPerStarPricing] = useState<PerStarTier[]>([]);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [activePricingCat, setActivePricingCat] = useState("");
  const [pricingMode, setPricingMode] = useState<"paket" | "perstar">("paket");

  // CMS state
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("cms-sections");
  const [cmsSaving, setCmsSaving] = useState<string | null>(null);
  const [cmsSaved, setCmsSaved] = useState<string | null>(null);
  const [hero, setHero] = useState<HeroSettings>({ headline: "", subheadline: "", ctaPrimary: "", ctaSecondary: "", isVisible: true });
  const [promoBanner, setPromoBanner] = useState<PromoBannerSettings>({ text: "", link: "/order", isVisible: true });
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({ hero: true, liveCounter: true, howItWorks: true, pricing: true, whyChooseUs: true, teamShowcase: true, testimonials: true, portfolio: true, tracking: true, trust: true, faq: true, cta: true });
  const [trackingPixels, setTrackingPixels] = useState<TrackingPixels>({ metaPixelId: "", metaAccessToken: "", googleAdsId: "", googleAdsConversionLabel: "", googleAnalyticsId: "", tiktokPixelId: "", isMetaEnabled: false, isGoogleAdsEnabled: false, isGoogleAnalyticsEnabled: false, isTiktokEnabled: false });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ instagram: "", facebook: "", tiktok: "", youtube: "", whatsapp: "" });
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ siteName: "", taglineId: "", taglineEn: "", supportEmail: "", companyName: "" });
  const [integrations, setIntegrations] = useState<IntegrationSettings>({ 
    midtransClientKey: "", midtransServerKey: "", midtransMerchantId: "", midtransIsProduction: false,
    resendApiKey: "", resendFromEmail: "noreply@etnyx.com",
    fonnteApiToken: "", fonnteDeviceId: "",
    telegramBotToken: "", telegramAdminGroupId: "", telegramWorkerGroupId: ""
  });

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
    try { const res = await fetch(`/api/admin/orders?status=${statusFilter}`); const d = await res.json(); setOrders(d.orders || []); } catch (e) { console.error(e); }
  }, [statusFilter]);
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
    } catch (e) { console.error(e); }
  }, [activePricingCat]);

  const fetchCmsSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return;
      const { settings } = await res.json();
      if (settings.hero) setHero(settings.hero);
      if (settings.promo_banner) setPromoBanner(settings.promo_banner);
      if (settings.faq_items) setFaqItems(settings.faq_items);
      if (settings.team_members) setTeamMembers(settings.team_members);
      if (settings.section_visibility) setSectionVisibility(settings.section_visibility);
      if (settings.tracking_pixels) setTrackingPixels(settings.tracking_pixels);
      if (settings.social_links) setSocialLinks(settings.social_links);
      if (settings.site_info) setSiteInfo(settings.site_info);
      if (settings.integrations) setIntegrations(settings.integrations);
    } catch (err) { console.error("Failed to fetch CMS settings:", err); }
  }, []);

  const handleExport = (type: string) => window.open(`/api/admin/export?type=${type}`, "_blank");

  useEffect(() => {
    (async () => {
      const ok = await checkAuth();
      if (ok) await Promise.all([fetchStats(), fetchOrders(), fetchChartData()]);
      setLoading(false);
    })();
  }, [checkAuth, fetchStats, fetchOrders, fetchChartData]);

  useEffect(() => {
    if (loading) return;
    if (activeTab === "orders") fetchOrders();
    else if (activeTab === "testimonials") fetchTestimonials();
    else if (activeTab === "portfolio") fetchPortfolios();
    else if (activeTab === "promo") fetchPromoCodes();
    else if (activeTab === "customers") fetchCustomers();
    else if (activeTab === "boosters") fetchBoosters();
    else if (activeTab === "pricing") fetchPricing();
    else if (activeTab === "settings") fetchCmsSettings();
  }, [activeTab, statusFilter, loading, fetchOrders, fetchTestimonials, fetchPortfolios, fetchPromoCodes, fetchCustomers, fetchBoosters, fetchPricing, fetchCmsSettings]);

  const handleLogout = async () => { await fetch("/api/admin/auth", { method: "DELETE" }); router.push("/admin"); };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: orderId, status: newStatus }) });
      fetchOrders(); fetchStats();
    } catch (e) { console.error(e); }
  };

  const viewCredentials = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/credentials?id=${orderId}`);
      if (!res.ok) throw new Error("Failed");
      setCredentials(await res.json());
    } catch { alert("Gagal memuat credentials."); }
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
    const newTiers = perStarPricing.map(tier => {
      if (tier.id !== tierId) return tier;
      const price = Math.max(0, parseInt(editPriceValue) || tier.price);
      const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
      const discountPercent = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined;
      return { ...tier, price, originalPrice, discountPercent };
    });
    setPerStarPricing(newTiers);
    setEditingPriceId(null);
    savePerStarPricing(newTiers);
  };

  const saveCmsSetting = async (key: string, value: unknown) => {
    setCmsSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) { setCmsSaved(key); setTimeout(() => setCmsSaved(null), 2000); }
      else alert("Gagal menyimpan. Coba lagi.");
    } catch { alert("Gagal menyimpan. Coba lagi."); }
    finally { setCmsSaving(null); }
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin"></div>
            <Gamepad2 className="absolute inset-0 m-auto w-6 h-6 text-accent" />
          </div>
          <p className="text-text-muted text-sm">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  const SETTINGS_TABS: { id: SettingsSubTab; label: string; icon: typeof Layout }[] = [
    { id: "cms-sections", label: "Visibilitas", icon: Layout },
    { id: "hero", label: "Hero", icon: Megaphone },
    { id: "banner", label: "Banner", icon: Megaphone },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "team", label: "Tim", icon: Users },
    { id: "social", label: "Sosial", icon: Share2 },
    { id: "site", label: "Info Situs", icon: Building },
    { id: "pixels", label: "Pixels", icon: BarChart3 },
    { id: "integrations", label: "Integrasi", icon: Zap },
    { id: "general", label: "General", icon: Settings2 },
  ];

  const SECTION_LABELS: Record<string, string> = {
    hero: "Hero Section", liveCounter: "Live Counter", howItWorks: "Cara Kerja", pricing: "Paket Harga",
    whyChooseUs: "Kenapa Pilih Kami", teamShowcase: "Tim Booster", testimonials: "Testimoni",
    portfolio: "Portfolio", tracking: "Tracking", trust: "Trust & Keamanan", faq: "FAQ", cta: "Call to Action",
  };

  const CMS_RANK_OPTIONS = [
    { value: "master", label: "Master" }, { value: "grandmaster", label: "Grand Master" },
    { value: "epic", label: "Epic" }, { value: "legend", label: "Legend" },
    { value: "mythic", label: "Mythic" }, { value: "mythicglory", label: "Mythic Glory" },
  ];

  const CmsSaveButton = ({ settingKey, value }: { settingKey: string; value: unknown }) => (
    <button onClick={() => saveCmsSetting(settingKey, value)} disabled={cmsSaving === settingKey}
      className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
      {cmsSaving === settingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : cmsSaved === settingKey ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {cmsSaved === settingKey ? "Tersimpan!" : "Simpan"}
    </button>
  );

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
              <div className="flex flex-wrap gap-2">
                {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "gradient-primary text-white shadow-lg shadow-accent/20" : "bg-surface border border-white/5 text-text-muted hover:text-text"}`}>
                    {s === "all" ? "All" : getStatusLabel(s)}
                  </button>
                ))}
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
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Progress</th>
                        <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-text-muted">No orders found</td></tr>
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
                            <span className="text-xs text-text">{o.package_title || `${o.current_rank} → ${o.target_rank}`}</span>
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
                            <div className="flex flex-col gap-1">
                              <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                className="bg-background border border-white/10 rounded-md px-2 py-1 text-[10px] text-text focus:outline-none focus:border-accent">
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button onClick={() => viewCredentials(o.id)} className="text-[10px] text-accent hover:underline text-left">🔑 Credentials</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                  onClick={() => pricingMode === "paket" ? savePricingCatalog(pricingCatalog) : savePerStarPricing(perStarPricing)}
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
              <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Name</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Email</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">WA</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Orders</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Spent</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Referral</th>
                      <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Joined</th>
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
                        <td className="px-4 py-3 font-mono text-purple-400 text-xs">{c.referral_code}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{new Date(c.created_at).toLocaleDateString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {SETTINGS_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setSettingsSubTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      settingsSubTab === tab.id ? "gradient-primary text-white shadow-lg shadow-accent/20" : "bg-surface border border-white/5 text-text-muted hover:text-text"
                    }`}>
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Section Visibility */}
              {settingsSubTab === "cms-sections" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Visibilitas Section</h2>
                      <p className="text-text-muted text-xs mt-1">Kontrol section mana yang tampil di homepage</p>
                    </div>
                    <CmsSaveButton settingKey="section_visibility" value={sectionVisibility} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(sectionVisibility).map(([key, visible]) => (
                      <button key={key} onClick={() => setSectionVisibility((prev) => ({ ...prev, [key]: !visible }))}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          visible ? "bg-accent/10 border-accent/30 text-text" : "bg-surface border-white/5 text-text-muted"
                        }`}>
                        <span className="font-medium text-sm">{SECTION_LABELS[key] || key}</span>
                        {visible ? <Eye className="w-5 h-5 text-accent" /> : <EyeOff className="w-5 h-5 text-text-muted" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hero Settings */}
              {settingsSubTab === "hero" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Hero Section</h2>
                      <p className="text-text-muted text-xs mt-1">Edit headline dan CTA buttons di hero banner</p>
                    </div>
                    <CmsSaveButton settingKey="hero" value={hero} />
                  </div>
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-5">
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Headline</label>
                      <input type="text" value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Sub-headline</label>
                      <textarea value={hero.subheadline} onChange={(e) => setHero({ ...hero, subheadline: e.target.value })} rows={3}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-text-muted mb-1.5">Tombol CTA Utama</label>
                        <input type="text" value={hero.ctaPrimary} onChange={(e) => setHero({ ...hero, ctaPrimary: e.target.value })}
                          className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-text-muted mb-1.5">Tombol CTA Sekunder</label>
                        <input type="text" value={hero.ctaSecondary} onChange={(e) => setHero({ ...hero, ctaSecondary: e.target.value })}
                          className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Promo Banner */}
              {settingsSubTab === "banner" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Promo Banner</h2>
                      <p className="text-text-muted text-xs mt-1">Banner promo yang tampil di atas navbar</p>
                    </div>
                    <CmsSaveButton settingKey="promo_banner" value={promoBanner} />
                  </div>
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-text font-medium">Tampilkan Banner</label>
                      <button onClick={() => setPromoBanner({ ...promoBanner, isVisible: !promoBanner.isVisible })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${promoBanner.isVisible ? "bg-accent" : "bg-white/10"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${promoBanner.isVisible ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Teks Banner</label>
                      <input type="text" value={promoBanner.text} onChange={(e) => setPromoBanner({ ...promoBanner, text: e.target.value })}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Link Tujuan</label>
                      <input type="text" value={promoBanner.link} onChange={(e) => setPromoBanner({ ...promoBanner, link: e.target.value })}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ Manager */}
              {settingsSubTab === "faq" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">FAQ Manager</h2>
                      <p className="text-text-muted text-xs mt-1">Kelola pertanyaan yang sering ditanyakan</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setFaqItems([...faqItems, { question: "", answer: "" }])}
                        className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-white/10 rounded-lg text-text text-sm hover:border-white/20 transition-colors">
                        <Plus className="w-4 h-4" /> Tambah FAQ
                      </button>
                      <CmsSaveButton settingKey="faq_items" value={faqItems} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {faqItems.map((item, i) => (
                      <div key={i} className="bg-surface rounded-xl border border-white/5 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-4 h-4 text-text-muted mt-3 flex-shrink-0 cursor-grab" />
                          <div className="flex-1 space-y-3">
                            <input type="text" value={item.question} onChange={(e) => { const next = [...faqItems]; next[i] = { ...next[i], question: e.target.value }; setFaqItems(next); }}
                              placeholder="Pertanyaan..." className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                            <textarea value={item.answer} onChange={(e) => { const next = [...faqItems]; next[i] = { ...next[i], answer: e.target.value }; setFaqItems(next); }}
                              placeholder="Jawaban..." rows={2} className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
                          </div>
                          <button onClick={() => setFaqItems(faqItems.filter((_, idx) => idx !== i))}
                            className="mt-3 text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Manager */}
              {settingsSubTab === "team" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Tim Booster</h2>
                      <p className="text-text-muted text-xs mt-1">Kelola anggota tim yang tampil di homepage</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setTeamMembers([...teamMembers, { name: "", role: "", specialization: "", rank: "mythicglory", isVisible: true }])}
                        className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-white/10 rounded-lg text-text text-sm hover:border-white/20 transition-colors">
                        <Plus className="w-4 h-4" /> Tambah Anggota
                      </button>
                      <CmsSaveButton settingKey="team_members" value={teamMembers} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teamMembers.map((member, i) => (
                      <div key={i} className="bg-surface rounded-xl border border-white/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted">Anggota #{i + 1}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { const next = [...teamMembers]; next[i] = { ...next[i], isVisible: !next[i].isVisible }; setTeamMembers(next); }}
                              className={`p-1 rounded ${member.isVisible ? "text-accent" : "text-text-muted"}`}>
                              {member.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setTeamMembers(teamMembers.filter((_, idx) => idx !== i))}
                              className="text-text-muted hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <input type="text" value={member.name} onChange={(e) => { const next = [...teamMembers]; next[i] = { ...next[i], name: e.target.value }; setTeamMembers(next); }}
                          placeholder="Nama" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                        <input type="text" value={member.role} onChange={(e) => { const next = [...teamMembers]; next[i] = { ...next[i], role: e.target.value }; setTeamMembers(next); }}
                          placeholder="Role (e.g. Mythic Glory Booster)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" value={member.specialization} onChange={(e) => { const next = [...teamMembers]; next[i] = { ...next[i], specialization: e.target.value }; setTeamMembers(next); }}
                            placeholder="Spesialisasi" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                          <select value={member.rank} onChange={(e) => { const next = [...teamMembers]; next[i] = { ...next[i], rank: e.target.value }; setTeamMembers(next); }}
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none">
                            {CMS_RANK_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              {settingsSubTab === "social" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Sosial Media</h2>
                      <p className="text-text-muted text-xs mt-1">Link sosial media yang tampil di footer</p>
                    </div>
                    <CmsSaveButton settingKey="social_links" value={socialLinks} />
                  </div>
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    {(["instagram", "facebook", "tiktok", "youtube", "whatsapp"] as const).map((platform) => (
                      <div key={platform}>
                        <label className="block text-sm text-text-muted mb-1.5 capitalize">{platform === "whatsapp" ? "WhatsApp Number" : platform}</label>
                        <input type="text" value={socialLinks[platform]} onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                          placeholder={platform === "whatsapp" ? "6281234567890" : `https://${platform}.com/...`}
                          className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Site Info */}
              {settingsSubTab === "site" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Informasi Situs</h2>
                      <p className="text-text-muted text-xs mt-1">Nama bisnis, tagline, dan informasi kontak</p>
                    </div>
                    <CmsSaveButton settingKey="site_info" value={siteInfo} />
                  </div>
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-text-muted mb-1.5">Nama Situs</label>
                        <input type="text" value={siteInfo.siteName} onChange={(e) => setSiteInfo({ ...siteInfo, siteName: e.target.value })}
                          className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-text-muted mb-1.5">Nama Perusahaan</label>
                        <input type="text" value={siteInfo.companyName} onChange={(e) => setSiteInfo({ ...siteInfo, companyName: e.target.value })}
                          className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Email Support</label>
                      <input type="email" value={siteInfo.supportEmail} onChange={(e) => setSiteInfo({ ...siteInfo, supportEmail: e.target.value })}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Tagline (Bahasa Indonesia)</label>
                      <textarea value={siteInfo.taglineId} onChange={(e) => setSiteInfo({ ...siteInfo, taglineId: e.target.value })} rows={2}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Tagline (English)</label>
                      <textarea value={siteInfo.taglineEn} onChange={(e) => setSiteInfo({ ...siteInfo, taglineEn: e.target.value })} rows={2}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking Pixels */}
              {settingsSubTab === "pixels" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Tracking Pixels</h2>
                      <p className="text-text-muted text-xs mt-1">Setup pixel untuk Meta Ads, Google Ads, GA4, dan TikTok Ads</p>
                    </div>
                    <CmsSaveButton settingKey="tracking_pixels" value={trackingPixels} />
                  </div>

                  {/* Meta Pixel */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-text font-bold text-sm">Meta (Facebook) Pixel</h3>
                        <p className="text-text-muted text-xs mt-0.5">Tracking konversi Meta & Instagram Ads</p>
                      </div>
                      <button onClick={() => setTrackingPixels({ ...trackingPixels, isMetaEnabled: !trackingPixels.isMetaEnabled })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${trackingPixels.isMetaEnabled ? "bg-accent" : "bg-white/10"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${trackingPixels.isMetaEnabled ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Pixel ID</label>
                      <input type="text" value={trackingPixels.metaPixelId} onChange={(e) => setTrackingPixels({ ...trackingPixels, metaPixelId: e.target.value })}
                        placeholder="123456789012345" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Access Token (opsional)</label>
                      <input type="text" value={trackingPixels.metaAccessToken} onChange={(e) => setTrackingPixels({ ...trackingPixels, metaAccessToken: e.target.value })}
                        placeholder="EAAxxxxxxx..." className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                  </div>

                  {/* Google Ads */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-text font-bold text-sm">Google Ads</h3>
                        <p className="text-text-muted text-xs mt-0.5">Tracking konversi Google Ads</p>
                      </div>
                      <button onClick={() => setTrackingPixels({ ...trackingPixels, isGoogleAdsEnabled: !trackingPixels.isGoogleAdsEnabled })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${trackingPixels.isGoogleAdsEnabled ? "bg-accent" : "bg-white/10"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${trackingPixels.isGoogleAdsEnabled ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Google Ads ID (gtag)</label>
                      <input type="text" value={trackingPixels.googleAdsId} onChange={(e) => setTrackingPixels({ ...trackingPixels, googleAdsId: e.target.value })}
                        placeholder="AW-123456789" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Conversion Label</label>
                      <input type="text" value={trackingPixels.googleAdsConversionLabel} onChange={(e) => setTrackingPixels({ ...trackingPixels, googleAdsConversionLabel: e.target.value })}
                        placeholder="AbCdEfGh123" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                  </div>

                  {/* Google Analytics */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-text font-bold text-sm">Google Analytics 4</h3>
                        <p className="text-text-muted text-xs mt-0.5">Analytics & audience website</p>
                      </div>
                      <button onClick={() => setTrackingPixels({ ...trackingPixels, isGoogleAnalyticsEnabled: !trackingPixels.isGoogleAnalyticsEnabled })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${trackingPixels.isGoogleAnalyticsEnabled ? "bg-accent" : "bg-white/10"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${trackingPixels.isGoogleAnalyticsEnabled ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Measurement ID</label>
                      <input type="text" value={trackingPixels.googleAnalyticsId} onChange={(e) => setTrackingPixels({ ...trackingPixels, googleAnalyticsId: e.target.value })}
                        placeholder="G-XXXXXXXXXX" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                  </div>

                  {/* TikTok Pixel */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-text font-bold text-sm">TikTok Pixel</h3>
                        <p className="text-text-muted text-xs mt-0.5">Tracking konversi TikTok Ads</p>
                      </div>
                      <button onClick={() => setTrackingPixels({ ...trackingPixels, isTiktokEnabled: !trackingPixels.isTiktokEnabled })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${trackingPixels.isTiktokEnabled ? "bg-accent" : "bg-white/10"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${trackingPixels.isTiktokEnabled ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Pixel ID</label>
                      <input type="text" value={trackingPixels.tiktokPixelId} onChange={(e) => setTrackingPixels({ ...trackingPixels, tiktokPixelId: e.target.value })}
                        placeholder="CXXXXXXXXXXXXXXX" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations (Payment, Email, WhatsApp) */}
              {settingsSubTab === "integrations" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">Integrasi API</h2>
                      <p className="text-text-muted text-xs mt-1">Setup Payment Gateway, Email, dan WhatsApp API</p>
                    </div>
                    <CmsSaveButton settingKey="integrations" value={integrations} />
                  </div>

                  {/* Midtrans */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-text font-bold text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-accent" /> Midtrans Payment Gateway</h3>
                        <p className="text-text-muted text-xs mt-0.5">Terima pembayaran via QRIS, VA, E-Wallet, dll</p>
                      </div>
                      <button onClick={() => setIntegrations({ ...integrations, midtransIsProduction: !integrations.midtransIsProduction })}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${integrations.midtransIsProduction ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        {integrations.midtransIsProduction ? "PRODUCTION" : "SANDBOX"}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Client Key</label>
                      <input type="text" value={integrations.midtransClientKey} onChange={(e) => setIntegrations({ ...integrations, midtransClientKey: e.target.value })}
                        placeholder="SB-Mid-client-xxx atau Mid-client-xxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Server Key</label>
                      <input type="password" value={integrations.midtransServerKey} onChange={(e) => setIntegrations({ ...integrations, midtransServerKey: e.target.value })}
                        placeholder="SB-Mid-server-xxx atau Mid-server-xxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Merchant ID</label>
                      <input type="text" value={integrations.midtransMerchantId} onChange={(e) => setIntegrations({ ...integrations, midtransMerchantId: e.target.value })}
                        placeholder="G123456789" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <p className="text-text-muted text-xs">
                      <BookOpen className="w-3 h-3 inline mr-1" /> Dapatkan credentials di <a href="https://dashboard.midtrans.com" target="_blank" rel="noopener" className="text-accent hover:underline">dashboard.midtrans.com</a> → Settings → Access Keys
                    </p>
                  </div>

                  {/* Resend Email */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div>
                      <h3 className="text-text font-bold text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-accent" /> Resend (Email API)</h3>
                      <p className="text-text-muted text-xs mt-0.5">Kirim email konfirmasi order ke customer</p>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">API Key</label>
                      <input type="password" value={integrations.resendApiKey} onChange={(e) => setIntegrations({ ...integrations, resendApiKey: e.target.value })}
                        placeholder="re_xxxxxxxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">From Email</label>
                      <input type="email" value={integrations.resendFromEmail} onChange={(e) => setIntegrations({ ...integrations, resendFromEmail: e.target.value })}
                        placeholder="noreply@etnyx.com" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                    </div>
                    <p className="text-text-muted text-xs">
                      <BookOpen className="w-3 h-3 inline mr-1" /> Dapatkan API Key di <a href="https://resend.com/api-keys" target="_blank" rel="noopener" className="text-accent hover:underline">resend.com/api-keys</a>
                    </p>
                  </div>

                  {/* Fonnte WhatsApp */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div>
                      <h3 className="text-text font-bold text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4 text-accent" /> Fonnte (WhatsApp API)</h3>
                      <p className="text-text-muted text-xs mt-0.5">Kirim notifikasi order via WhatsApp</p>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">API Token</label>
                      <input type="password" value={integrations.fonnteApiToken} onChange={(e) => setIntegrations({ ...integrations, fonnteApiToken: e.target.value })}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Device ID (opsional)</label>
                      <input type="text" value={integrations.fonnteDeviceId} onChange={(e) => setIntegrations({ ...integrations, fonnteDeviceId: e.target.value })}
                        placeholder="628xxxxxxxxxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <p className="text-text-muted text-xs">
                      <BookOpen className="w-3 h-3 inline mr-1" /> Dapatkan Token di <a href="https://md.fonnte.com/api" target="_blank" rel="noopener" className="text-accent hover:underline">md.fonnte.com</a> → API → Token
                    </p>
                  </div>

                  {/* Telegram */}
                  <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
                    <div>
                      <h3 className="text-text font-bold text-sm flex items-center gap-2"><Send className="w-4 h-4 text-accent" /> Telegram Bot</h3>
                      <p className="text-text-muted text-xs mt-0.5">Notifikasi order ke grup Admin & Worker</p>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Bot Token</label>
                      <input type="password" value={integrations.telegramBotToken} onChange={(e) => setIntegrations({ ...integrations, telegramBotToken: e.target.value })}
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Admin Group Chat ID</label>
                      <input type="text" value={integrations.telegramAdminGroupId} onChange={(e) => setIntegrations({ ...integrations, telegramAdminGroupId: e.target.value })}
                        placeholder="-1001234567890" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                      <p className="text-text-muted text-xs mt-1">Notifikasi order baru untuk konfirmasi admin</p>
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">Worker Group Chat ID</label>
                      <input type="text" value={integrations.telegramWorkerGroupId} onChange={(e) => setIntegrations({ ...integrations, telegramWorkerGroupId: e.target.value })}
                        placeholder="-1001234567890" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                      <p className="text-text-muted text-xs mt-1">Notifikasi order yang sudah dikonfirmasi untuk dikerjakan</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-xs text-text-muted space-y-1">
                      <p><BookOpen className="w-3 h-3 inline mr-1" /> <strong>Cara mendapatkan Bot Token:</strong></p>
                      <p>1. Chat @BotFather di Telegram → /newbot → ikuti instruksi</p>
                      <p>2. Copy token yang diberikan</p>
                      <p className="mt-2"><BookOpen className="w-3 h-3 inline mr-1" /> <strong>Cara mendapatkan Group Chat ID:</strong></p>
                      <p>1. Tambahkan bot ke grup</p>
                      <p>2. Kirim pesan di grup</p>
                      <p>3. Buka: api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</p>
                      <p>4. Cari &quot;chat&quot;:{`{`}&quot;id&quot;: -100xxx...{`}`}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* General (Env + Export) */}
              {settingsSubTab === "general" && (
                <div className="max-w-2xl space-y-4">
                  <div className="bg-surface rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-text mb-1">Site Configuration</h3>
                    <p className="text-text-muted text-xs mb-4">Dikelola via environment variables.</p>
                    <div className="space-y-2">
                      {["NEXT_PUBLIC_WHATSAPP_NUMBER", "ADMIN_EMAIL", "ENCRYPTION_KEY", "MIDTRANS_SERVER_KEY"].map((key) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                          <span className="text-xs text-text-muted font-mono">{key}</span>
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2"><Download className="w-4 h-4" /> Export Data (CSV)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {["orders", "customers", "boosters", "testimonials", "promo_codes"].map((t) => (
                        <button key={t} onClick={() => handleExport(t)} className="px-3 py-2 bg-background border border-white/10 rounded-lg text-text text-xs hover:bg-white/5 transition capitalize">{t.replace("_", " ")}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
  const [form, setForm] = useState({
    name: item?.name || "", whatsapp: item?.whatsapp || "", rank_specialization: item?.rank_specialization || "Mythic",
    is_available: item?.is_available ?? true, rating: item?.rating || 5,
  });
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
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm">
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star</option>)}
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
