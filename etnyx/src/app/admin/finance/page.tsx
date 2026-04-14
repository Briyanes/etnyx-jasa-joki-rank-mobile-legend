"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Lock, Eye, EyeOff, ArrowLeft, DollarSign, TrendingUp, TrendingDown,
  Wallet, BarChart3, PieChart, Target, Briefcase, Calculator, ChevronLeft,
  ChevronRight, Loader2, ArrowUpRight, ArrowDownRight, Download, Shield,
  Building2, Users, Package, CreditCard, AlertTriangle, CheckCircle,
  Banknote, PiggyBank, Landmark, CircleDollarSign, Activity,
} from "lucide-react";
import { formatRupiah } from "@/utils/helpers";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const BarChartR = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const BarR = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false });

// ============================================================
//  TYPES
// ============================================================
interface FinanceOverview {
  month: number; year: number;
  totalRevenue: number; totalBasePrice: number; totalPromoDiscount: number;
  totalTierDiscount: number; pendingRevenue: number; avgRevenuePerOrder: number;
  completedOrders: number; totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalCommission: number; paidCommission: number; pendingCommission: number; avgCostPerOrder: number;
  totalSalary: number; paidSalary: number;
  grossProfit: number; grossMargin: number; netProfit: number; netMargin: number;
  avgProfitPerOrder: number; totalExpenses: number;
  contributionMargin: number; breakEvenRevenue: number; breakEvenOrders: number;
  totalCashIn: number; totalCashOut: number; netCashFlow: number; totalPaidOut: number;
  staff: { workers: number; leads: number; admins: number; total: number };
  prevRevenue: number; revenueGrowth: number; prevCommission: number;
  paymentMethods: Record<string, { count: number; amount: number }>;
}

interface TrendData {
  label: string; month: number; year: number;
  revenue: number; commission: number; salary: number;
  expenses: number; grossProfit: number; netProfit: number;
}

interface DailyData {
  date: string; day: number; revenue: number; orders: number;
}

interface Distribution {
  totalRevenue: number; workerRate: number; workerShare: number;
  etnyxShare: number; salaryTotal: number; operationalEst: number;
  afterSalary: number; afterOps: number; expansionFund: number;
  emergencyFund: number; ownerProfit: number;
  pct: Record<string, number>;
}

interface CashflowData {
  cashIn: number; cashOut: number;
  cashOutBreakdown: { commission: number; salary: number; mixed: number };
  netCashFlow: number; pendingObligations: number;
  pendingCommissions: number; pendingSalaries: number;
  runwayMonths: number;
  recentIn: { type: string; amount: number; method: string; date: string }[];
  recentOut: { type: string; amount: number; method: string; code: string; date: string }[];
}

interface OrderProfit {
  id: string; order_id: string; total_price: number; base_price: number;
  package: string; package_title: string; current_rank: string; target_rank: string;
  commission: number; profit: number; margin: number;
  is_express: boolean; is_premium: boolean; created_at: string;
}

interface PackageProfit {
  name: string; count: number; revenue: number; cost: number; profit: number; margin: number;
}

// ============================================================
//  CONSTANTS
// ============================================================
const FINANCE_PIN = "etnyx2026!";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

type TabType = "overview" | "pnl" | "cashflow" | "distribution" | "orders" | "planning" | "coa";

const TABS: { id: TabType; label: string; icon: typeof DollarSign }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "pnl", label: "Laba Rugi", icon: BarChart3 },
  { id: "cashflow", label: "Cashflow", icon: Wallet },
  { id: "distribution", label: "Distribusi", icon: PieChart },
  { id: "orders", label: "Per Order", icon: Package },
  { id: "planning", label: "Planning", icon: Target },
  { id: "coa", label: "COA & SOP", icon: Briefcase },
];

// ============================================================
//  COA (Chart of Accounts)
// ============================================================
const COA_DATA = [
  { code: "1000", name: "ASET", children: [
    { code: "1100", name: "Kas & Bank", children: [
      { code: "1101", name: "Kas Tunai (Petty Cash)" },
      { code: "1102", name: "Bank BCA" },
      { code: "1103", name: "Bank BRI" },
      { code: "1104", name: "Dana / OVO / GoPay" },
      { code: "1105", name: "iPaymu Balance" },
    ]},
    { code: "1200", name: "Piutang", children: [
      { code: "1201", name: "Piutang Order (Pending Payment)" },
    ]},
    { code: "1300", name: "Aset Tetap", children: [
      { code: "1301", name: "Peralatan (PC, HP, Router)" },
      { code: "1302", name: "Furniture Basecamp" },
      { code: "1399", name: "Akumulasi Penyusutan" },
    ]},
  ]},
  { code: "2000", name: "KEWAJIBAN", children: [
    { code: "2100", name: "Hutang Jangka Pendek", children: [
      { code: "2101", name: "Hutang Komisi Worker" },
      { code: "2102", name: "Hutang Gaji Staff" },
      { code: "2103", name: "Hutang Pajak" },
    ]},
  ]},
  { code: "3000", name: "EKUITAS", children: [
    { code: "3100", name: "Modal Pemilik (Owner Equity)" },
    { code: "3200", name: "Laba Ditahan (Retained Earnings)" },
    { code: "3300", name: "Dana Ekspansi" },
    { code: "3400", name: "Dana Darurat" },
  ]},
  { code: "4000", name: "PENDAPATAN", children: [
    { code: "4100", name: "Pendapatan Joki", children: [
      { code: "4101", name: "Joki Paket" },
      { code: "4102", name: "Joki Per Star" },
      { code: "4103", name: "Joki Gendong" },
    ]},
    { code: "4200", name: "Pendapatan Lainnya", children: [
      { code: "4201", name: "Express Fee" },
      { code: "4202", name: "Premium Fee" },
    ]},
    { code: "4900", name: "Diskon & Potongan", children: [
      { code: "4901", name: "Diskon Promo" },
      { code: "4902", name: "Diskon Tier Member" },
    ]},
  ]},
  { code: "5000", name: "HARGA POKOK (COGS)", children: [
    { code: "5100", name: "Biaya Worker / Joki", children: [
      { code: "5101", name: "Komisi Worker (60%)" },
      { code: "5102", name: "Bonus Performance Worker" },
    ]},
  ]},
  { code: "6000", name: "BEBAN OPERASIONAL", children: [
    { code: "6100", name: "Beban Personalia", children: [
      { code: "6101", name: "Gaji Admin / CS" },
      { code: "6102", name: "Gaji Lead" },
      { code: "6103", name: "Gaji Content Editor" },
      { code: "6104", name: "Tunjangan" },
    ]},
    { code: "6200", name: "Beban Teknologi", children: [
      { code: "6201", name: "Hosting & Domain (Vercel)" },
      { code: "6202", name: "Supabase (Database)" },
      { code: "6203", name: "WhatsApp API (Meta)" },
      { code: "6204", name: "Telegram Bot" },
      { code: "6205", name: "iPaymu Fee" },
    ]},
    { code: "6300", name: "Beban Marketing", children: [
      { code: "6301", name: "Meta Ads (Facebook/IG)" },
      { code: "6302", name: "TikTok Ads" },
      { code: "6303", name: "Google Ads" },
      { code: "6304", name: "Referral Reward" },
    ]},
    { code: "6400", name: "Beban Operasional Lainnya", children: [
      { code: "6401", name: "Listrik & Internet (Basecamp)" },
      { code: "6402", name: "Sewa Tempat / Basecamp" },
      { code: "6403", name: "Perlengkapan" },
      { code: "6404", name: "Administrasi & Lain-lain" },
    ]},
  ]},
];

// ============================================================
//  FIXED COSTS TABLE
// ============================================================
const FIXED_COSTS = [
  { item: "Gaji Admin / CS", monthly: 1500000, notes: "1 orang" },
  { item: "Gaji Lead 1", monthly: 1000000, notes: "Koordinator tim" },
  { item: "Gaji Lead 2", monthly: 1000000, notes: "Koordinator tim" },
  { item: "Gaji Content Editor", monthly: 800000, notes: "1 orang" },
  { item: "Hosting (Vercel Pro)", monthly: 150000, notes: "~$9.5/bulan" },
  { item: "Supabase", monthly: 0, notes: "Free tier" },
  { item: "Domain", monthly: 15000, notes: "~Rp180k/tahun" },
  { item: "WhatsApp API", monthly: 100000, notes: "Meta Cloud API" },
  { item: "Internet", monthly: 350000, notes: "Basecamp" },
];

const EXPANSION_MILESTONES = [
  { target: "Basecamp Setup", cost: 15000000, desc: "Sewa + renovasi + internet dedicated", priority: 1 },
  { target: "5 PC Gaming", cost: 25000000, desc: "5 × Rp5jt (mid-spec)", priority: 2 },
  { target: "Furniture", cost: 5000000, desc: "5 meja + kursi gaming", priority: 3 },
  { target: "Monitor Tambahan", cost: 7500000, desc: "5 × Rp1.5jt", priority: 4 },
  { target: "Hire 3 Worker Baru", cost: 0, desc: "Variable cost (komisi only)", priority: 5 },
  { target: "Marketing Budget Uplift", cost: 3000000, desc: "Rp3jt/bulan ads budget", priority: 6 },
];

// ============================================================
//  HELPER COMPONENTS
// ============================================================
function StatCard({ label, value, sub, icon: Icon, color = "text-accent", trend, trendLabel }: {
  label: string; value: string; sub?: string; icon: typeof DollarSign;
  color?: string; trend?: number; trendLabel?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-accent/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted text-xs">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-text-muted text-[10px] mt-0.5">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-[10px] ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}% {trendLabel || "vs bulan lalu"}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: typeof DollarSign }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-4 h-4 text-accent" />}
      <h3 className="text-text font-semibold text-sm">{children}</h3>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-accent" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-background rounded-full h-2">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ============================================================
//  PASSWORD GATE
// ============================================================
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    if (pin === FINANCE_PIN) {
      sessionStorage.setItem("finance_unlocked", "true");
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`PIN salah (${newAttempts}/5)`);
      setPin("");
      if (newAttempts >= 5) {
        setLocked(true);
        setError("Terlalu banyak percobaan. Coba lagi dalam 5 menit.");
        setTimeout(() => { setLocked(false); setAttempts(0); setError(""); }, 300000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl p-8 border border-accent/20 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-text text-xl font-bold">Finance Dashboard</h1>
            <p className="text-text-muted text-sm mt-1">Masukkan PIN untuk mengakses</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pin}
                onChange={e => { setPin(e.target.value); setError(""); }}
                placeholder="Masukkan PIN..."
                className="w-full bg-background text-text rounded-lg px-4 py-3 pr-10 border border-accent/20 focus:border-accent focus:outline-none text-center tracking-widest"
                disabled={locked}
                autoFocus
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!pin || locked}
              className="w-full bg-accent text-white rounded-lg py-3 font-medium hover:bg-accent/90 transition disabled:opacity-50"
            >
              {locked ? "Terkunci" : "Buka Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  MAIN FINANCE PAGE
// ============================================================
export default function FinancePage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Data
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [cashflow, setCashflow] = useState<CashflowData | null>(null);
  const [orderProfits, setOrderProfits] = useState<OrderProfit[]>([]);
  const [packageProfits, setPackageProfits] = useState<PackageProfit[]>([]);

  // Check session
  useEffect(() => {
    const isUnlocked = sessionStorage.getItem("finance_unlocked") === "true";
    setUnlocked(isUnlocked);
    setChecking(false);
  }, []);

  // Navigation
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  // Fetchers
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/finance?type=overview&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.overview) setOverview(data.overview);
    } catch (err) { console.error(err); }
  }, [month, year]);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/finance?type=trend&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.trends) setTrends(data.trends);
    } catch (err) { console.error(err); }
  }, [month, year]);

  const fetchDaily = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/finance?type=daily&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.daily) setDaily(data.daily);
    } catch (err) { console.error(err); }
  }, [month, year]);

  const fetchDistribution = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/finance?type=distribution&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.distribution) setDistribution(data.distribution);
    } catch (err) { console.error(err); }
  }, [month, year]);

  const fetchCashflow = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/finance?type=cashflow&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.cashflow) setCashflow(data.cashflow);
    } catch (err) { console.error(err); }
  }, [month, year]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/finance?type=orders&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.orders) setOrderProfits(data.orders);
      if (data.packageProfitability) setPackageProfits(data.packageProfitability);
    } catch (err) { console.error(err); }
  }, [month, year]);

  // Main data load
  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    const loadAll = async () => {
      await Promise.all([fetchOverview(), fetchTrends(), fetchDaily()]);
      setLoading(false);
    };
    loadAll();
  }, [unlocked, fetchOverview, fetchTrends, fetchDaily]);

  // Tab-specific data
  useEffect(() => {
    if (!unlocked) return;
    if (activeTab === "distribution" && !distribution) fetchDistribution();
    if (activeTab === "cashflow" && !cashflow) fetchCashflow();
    if (activeTab === "orders" && orderProfits.length === 0) fetchOrders();
  }, [activeTab, unlocked, distribution, cashflow, orderProfits.length, fetchDistribution, fetchCashflow, fetchOrders]);

  // Reset on month change
  useEffect(() => {
    setDistribution(null);
    setCashflow(null);
    setOrderProfits([]);
    setPackageProfits([]);
  }, [month, year]);

  if (checking) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-accent/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin/dashboard")} className="text-text-muted hover:text-text">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-text font-bold text-lg flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-accent" /> Pembukuan & Keuangan
              </h1>
              <p className="text-text-muted text-[10px]">Owner Only • Financial Operating System</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-background hover:bg-accent/10 text-text-muted hover:text-text">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-text text-sm font-medium min-w-[130px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-background hover:bg-accent/10 text-text-muted hover:text-text">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 bg-card/90 backdrop-blur border-b border-accent/5 px-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition
                ${activeTab === tab.id ? "bg-accent text-white" : "text-text-muted hover:bg-accent/10 hover:text-text"}`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-text-muted text-sm ml-2">Memuat data keuangan...</span>
          </div>
        ) : (
          <>
            {activeTab === "overview" && overview && <OverviewTab overview={overview} trends={trends} daily={daily} />}
            {activeTab === "pnl" && overview && <PnLTab overview={overview} trends={trends} />}
            {activeTab === "cashflow" && <CashflowTab cashflow={cashflow} overview={overview} />}
            {activeTab === "distribution" && <DistributionTab distribution={distribution} />}
            {activeTab === "orders" && <OrdersTab orders={orderProfits} packages={packageProfits} />}
            {activeTab === "planning" && overview && <PlanningTab overview={overview} trends={trends} />}
            {activeTab === "coa" && <COATab />}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  TAB: OVERVIEW
// ============================================================
function OverviewTab({ overview: o, trends, daily }: { overview: FinanceOverview; trends: TrendData[]; daily: DailyData[] }) {
  const totalFixedCost = FIXED_COSTS.reduce((s, c) => s + c.monthly, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={formatRupiah(o.totalRevenue)} icon={DollarSign} trend={o.revenueGrowth} sub={`${o.completedOrders} order selesai`} />
        <StatCard label="Gross Profit (40%)" value={formatRupiah(o.grossProfit)} icon={TrendingUp} color="text-green-400" sub={`Margin: ${o.grossMargin}%`} />
        <StatCard label="Net Profit" value={formatRupiah(o.netProfit)} icon={Banknote} color={o.netProfit >= 0 ? "text-green-400" : "text-red-400"} sub={`Margin: ${o.netMargin}%`} />
        <StatCard label="Pending Revenue" value={formatRupiah(o.pendingRevenue)} icon={Wallet} color="text-yellow-400" sub={`${o.totalOrders - o.completedOrders} order aktif`} />
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={Calculator}>Biaya Variable (COGS)</SectionTitle>
          <p className="text-xl font-bold text-red-400">{formatRupiah(o.totalCommission)}</p>
          <p className="text-text-muted text-[10px]">Komisi worker • {o.completedOrders} order</p>
          <div className="mt-2 flex justify-between text-[10px]">
            <span className="text-text-muted">Dibayar</span>
            <span className="text-green-400">{formatRupiah(o.paidCommission)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-muted">Pending</span>
            <span className="text-yellow-400">{formatRupiah(o.pendingCommission)}</span>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={Users}>Biaya Tetap (Fixed)</SectionTitle>
          <p className="text-xl font-bold text-orange-400">{formatRupiah(o.totalSalary || totalFixedCost)}</p>
          <p className="text-text-muted text-[10px]">Gaji + tunjangan staff</p>
          <div className="mt-2 space-y-0.5">
            {FIXED_COSTS.slice(0, 4).map(c => (
              <div key={c.item} className="flex justify-between text-[10px]">
                <span className="text-text-muted">{c.item}</span>
                <span className="text-text">{formatRupiah(c.monthly)}</span>
              </div>
            ))}
            <p className="text-text-muted text-[10px]">+ {FIXED_COSTS.length - 4} item lainnya</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={Target}>Break-Even Analysis</SectionTitle>
          <p className="text-xl font-bold text-accent">{formatRupiah(o.breakEvenRevenue)}</p>
          <p className="text-text-muted text-[10px]">BEP Revenue / bulan</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-text-muted">BEP Orders</span>
              <span className="text-text">{o.breakEvenOrders} order</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-text-muted">Contribution Margin</span>
              <span className="text-text">{o.contributionMargin}%</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-text-muted">Avg Revenue/Order</span>
              <span className="text-text">{formatRupiah(o.avgRevenuePerOrder)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Order KPI */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg Revenue / Order" value={formatRupiah(o.avgRevenuePerOrder)} icon={Package} />
        <StatCard label="Avg Cost / Order" value={formatRupiah(o.avgCostPerOrder)} icon={Calculator} color="text-red-400" />
        <StatCard label="Avg Profit / Order" value={formatRupiah(o.avgProfitPerOrder)} icon={TrendingUp} color="text-green-400" />
      </div>

      {/* Daily Revenue Chart */}
      {daily.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={BarChart3}>Revenue Harian</SectionTitle>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChartR data={daily}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}jt`} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} labelFormatter={(l) => `Tanggal ${l}`} contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                <BarR dataKey="revenue" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Revenue" />
              </BarChartR>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 12-Month Trend */}
      {trends.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={TrendingUp}>Trend 12 Bulan</SectionTitle>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" name="Revenue" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="grossProfit" stroke="#22c55e" name="Gross Profit" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="netProfit" stroke="#3b82f6" name="Net Profit" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Team & Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={Users}>Tim Aktif</SectionTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Admin</span>
              <span className="text-text font-medium">{o.staff.admins} orang</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Lead</span>
              <span className="text-text font-medium">{o.staff.leads} orang</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Worker</span>
              <span className="text-text font-medium">{o.staff.workers} orang</span>
            </div>
            <hr className="border-accent/10" />
            <div className="flex justify-between text-sm font-medium">
              <span className="text-text">Total Staff</span>
              <span className="text-accent">{o.staff.total} orang</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={CreditCard}>Metode Pembayaran</SectionTitle>
          <div className="space-y-2">
            {Object.entries(o.paymentMethods).map(([method, data]) => (
              <div key={method} className="flex justify-between text-sm">
                <span className="text-text-muted capitalize">{method.replace("_", " ")}</span>
                <span className="text-text">{data.count}× • {formatRupiah(data.amount)}</span>
              </div>
            ))}
            {Object.keys(o.paymentMethods).length === 0 && (
              <p className="text-text-muted text-xs">Belum ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAB: P&L (Laba Rugi)
// ============================================================
function PnLTab({ overview: o, trends }: { overview: FinanceOverview; trends: TrendData[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-5 border border-accent/10">
        <SectionTitle icon={BarChart3}>Laporan Laba Rugi (Income Statement)</SectionTitle>

        <div className="space-y-1 text-sm">
          {/* Revenue */}
          <div className="flex justify-between py-2 border-b border-accent/10 font-semibold">
            <span className="text-text">PENDAPATAN</span>
            <span className="text-accent">{formatRupiah(o.totalRevenue)}</span>
          </div>
          <div className="flex justify-between py-1 pl-4">
            <span className="text-text-muted">Pendapatan Joki ({o.completedOrders} order)</span>
            <span className="text-text">{formatRupiah(o.totalBasePrice)}</span>
          </div>
          <div className="flex justify-between py-1 pl-4">
            <span className="text-text-muted">Express & Premium Fee</span>
            <span className="text-text">{formatRupiah(o.totalRevenue - o.totalBasePrice + o.totalPromoDiscount + o.totalTierDiscount)}</span>
          </div>
          <div className="flex justify-between py-1 pl-4 text-red-400">
            <span>(-) Diskon Promo</span>
            <span>({formatRupiah(o.totalPromoDiscount)})</span>
          </div>
          <div className="flex justify-between py-1 pl-4 text-red-400">
            <span>(-) Diskon Tier Member</span>
            <span>({formatRupiah(o.totalTierDiscount)})</span>
          </div>

          {/* COGS */}
          <div className="flex justify-between py-2 border-t border-b border-accent/10 font-semibold mt-2">
            <span className="text-text">HARGA POKOK (COGS)</span>
            <span className="text-red-400">({formatRupiah(o.totalCommission)})</span>
          </div>
          <div className="flex justify-between py-1 pl-4">
            <span className="text-text-muted">Komisi Worker (60%)</span>
            <span className="text-text">{formatRupiah(o.totalCommission)}</span>
          </div>

          {/* Gross Profit */}
          <div className="flex justify-between py-2 border-t border-accent/10 font-bold text-base mt-2 bg-green-500/5 rounded px-2">
            <span className="text-green-400">LABA KOTOR (Gross Profit)</span>
            <span className="text-green-400">{formatRupiah(o.grossProfit)} ({o.grossMargin}%)</span>
          </div>

          {/* Operating Expenses */}
          <div className="flex justify-between py-2 border-b border-accent/10 font-semibold mt-4">
            <span className="text-text">BEBAN OPERASIONAL</span>
            <span className="text-orange-400">({formatRupiah(o.totalSalary)})</span>
          </div>
          <div className="flex justify-between py-1 pl-4">
            <span className="text-text-muted">Gaji & Tunjangan Staff</span>
            <span className="text-text">{formatRupiah(o.totalSalary)}</span>
          </div>
          {FIXED_COSTS.filter(c => !c.item.startsWith("Gaji")).map(c => (
            <div key={c.item} className="flex justify-between py-1 pl-4">
              <span className="text-text-muted">{c.item}</span>
              <span className="text-text">{formatRupiah(c.monthly)}</span>
            </div>
          ))}

          {/* Net Profit */}
          <div className={`flex justify-between py-3 border-t-2 border-accent/20 font-bold text-lg mt-4 rounded px-2 ${o.netProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <span className={o.netProfit >= 0 ? "text-green-400" : "text-red-400"}>LABA BERSIH (Net Profit)</span>
            <span className={o.netProfit >= 0 ? "text-green-400" : "text-red-400"}>{formatRupiah(o.netProfit)} ({o.netMargin}%)</span>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {trends.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={TrendingUp}>Trend Revenue vs Expenses (12 Bulan)</SectionTitle>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChartR data={trends}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <BarR dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[2, 2, 0, 0]} />
                <BarR dataKey="commission" fill="#ef4444" name="COGS" radius={[2, 2, 0, 0]} />
                <BarR dataKey="salary" fill="#f97316" name="Gaji" radius={[2, 2, 0, 0]} />
              </BarChartR>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Financial Ratios */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Calculator}>Rasio Keuangan</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Gross Margin", value: `${o.grossMargin}%`, target: "40%", met: o.grossMargin >= 38 },
            { label: "Net Margin", value: `${o.netMargin}%`, target: ">20%", met: o.netMargin >= 20 },
            { label: "COGS Ratio", value: `${(100 - o.grossMargin).toFixed(1)}%`, target: "<62%", met: (100 - o.grossMargin) <= 62 },
            { label: "OpEx Ratio", value: `${o.totalRevenue > 0 ? ((o.totalSalary / o.totalRevenue) * 100).toFixed(1) : 0}%`, target: "<15%", met: o.totalRevenue > 0 && (o.totalSalary / o.totalRevenue) * 100 <= 15 },
          ].map(r => (
            <div key={r.label} className="text-center">
              <p className="text-text-muted text-[10px] mb-1">{r.label}</p>
              <p className={`text-lg font-bold ${r.met ? "text-green-400" : "text-yellow-400"}`}>{r.value}</p>
              <p className="text-text-muted text-[10px]">Target: {r.target} {r.met ? <CheckCircle className="w-3 h-3 inline text-green-400" /> : <AlertTriangle className="w-3 h-3 inline text-yellow-400" />}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAB: CASHFLOW
// ============================================================
function CashflowTab({ cashflow: cf, overview: o }: { cashflow: CashflowData | null; overview: FinanceOverview | null }) {
  if (!cf) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-accent" /><span className="text-text-muted text-sm ml-2">Memuat cashflow...</span></div>;

  return (
    <div className="space-y-6">
      {/* Cash Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Cash In" value={formatRupiah(cf.cashIn)} icon={ArrowUpRight} color="text-green-400" sub="Pembayaran masuk" />
        <StatCard label="Cash Out" value={formatRupiah(cf.cashOut)} icon={ArrowDownRight} color="text-red-400" sub="Payout keluar" />
        <StatCard label="Net Cash Flow" value={formatRupiah(cf.netCashFlow)} icon={Wallet} color={cf.netCashFlow >= 0 ? "text-green-400" : "text-red-400"} />
        <StatCard label="Kewajiban Pending" value={formatRupiah(cf.pendingObligations)} icon={AlertTriangle} color="text-yellow-400" sub="Belum dibayar" />
      </div>

      {/* Cash Out Breakdown */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Wallet}>Breakdown Cash Out</SectionTitle>
        <div className="space-y-3">
          {[
            { label: "Komisi Worker", amount: cf.cashOutBreakdown.commission, color: "bg-red-400" },
            { label: "Gaji Staff", amount: cf.cashOutBreakdown.salary, color: "bg-orange-400" },
            { label: "Mixed Payout", amount: cf.cashOutBreakdown.mixed, color: "bg-yellow-400" },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-muted">{item.label}</span>
                <span className="text-text">{formatRupiah(item.amount)}</span>
              </div>
              <ProgressBar value={item.amount} max={cf.cashOut || 1} color={item.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Pending Obligations */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={AlertTriangle}>Kewajiban yang Belum Dibayar</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background rounded-lg">
            <p className="text-text-muted text-xs">Komisi Pending</p>
            <p className="text-xl font-bold text-yellow-400">{formatRupiah(cf.pendingCommissions)}</p>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <p className="text-text-muted text-xs">Gaji Pending</p>
            <p className="text-xl font-bold text-yellow-400">{formatRupiah(cf.pendingSalaries)}</p>
          </div>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Shield}>Indikator Kesehatan Keuangan</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-background rounded-lg text-center">
            <p className="text-text-muted text-xs mb-1">Cash Ratio</p>
            <p className={`text-2xl font-bold ${cf.netCashFlow >= 0 ? "text-green-400" : "text-red-400"}`}>
              {cf.cashOut > 0 ? (cf.cashIn / cf.cashOut).toFixed(2) : "∞"}x
            </p>
            <p className="text-text-muted text-[10px]">Target: &gt; 1.5x</p>
          </div>
          <div className="p-3 bg-background rounded-lg text-center">
            <p className="text-text-muted text-xs mb-1">Burn Rate</p>
            <p className="text-2xl font-bold text-orange-400">{formatRupiah(cf.cashOut)}</p>
            <p className="text-text-muted text-[10px]">/bulan pengeluaran</p>
          </div>
          <div className="p-3 bg-background rounded-lg text-center">
            <p className="text-text-muted text-xs mb-1">Runway</p>
            <p className={`text-2xl font-bold ${cf.runwayMonths >= 3 ? "text-green-400" : "text-red-400"}`}>
              {cf.runwayMonths > 0 ? `${cf.runwayMonths} bulan` : "N/A"}
            </p>
            <p className="text-text-muted text-[10px]">Target: &gt; 3 bulan reserve</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAB: DISTRIBUTION
// ============================================================
function DistributionTab({ distribution: d }: { distribution: Distribution | null }) {
  if (!d) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-accent" /><span className="text-text-muted text-sm ml-2">Memuat distribusi...</span></div>;

  const slices = [
    { label: "Worker (Komisi)", amount: d.workerShare, pct: d.pct.worker, color: "bg-red-400", icon: Users },
    { label: "Gaji Staff", amount: d.salaryTotal, pct: d.pct.salary, color: "bg-orange-400", icon: Briefcase },
    { label: "Operasional", amount: d.operationalEst, pct: d.pct.operational, color: "bg-yellow-400", icon: Building2 },
    { label: "Dana Ekspansi (10%)", amount: d.expansionFund, pct: d.pct.expansion, color: "bg-blue-400", icon: Target },
    { label: "Dana Darurat (5%)", amount: d.emergencyFund, pct: d.pct.emergency, color: "bg-purple-400", icon: Shield },
    { label: "Profit Owner", amount: d.ownerProfit, pct: d.pct.owner, color: "bg-green-400", icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-5 border border-accent/10">
        <SectionTitle icon={PieChart}>Model Distribusi Pendapatan</SectionTitle>

        {/* Revenue Flow */}
        <div className="mb-6 p-4 bg-background rounded-lg text-center">
          <p className="text-text-muted text-xs">Total Revenue Bulan Ini</p>
          <p className="text-3xl font-bold text-accent mt-1">{formatRupiah(d.totalRevenue)}</p>
        </div>

        {/* Waterfall */}
        <div className="space-y-3">
          {slices.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${s.color}/20 flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color.replace("bg-", "text-")}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text">{s.label}</span>
                  <span className="text-text font-medium">{formatRupiah(s.amount)} <span className="text-text-muted text-[10px]">({s.pct}%)</span></span>
                </div>
                <ProgressBar value={s.amount} max={d.totalRevenue || 1} color={s.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="p-3 bg-background rounded-lg text-center">
            <p className="text-text-muted text-xs">ETNYX Share (40%)</p>
            <p className="text-xl font-bold text-accent">{formatRupiah(d.etnyxShare)}</p>
          </div>
          <div className="p-3 bg-background rounded-lg text-center">
            <p className="text-text-muted text-xs">Setelah Semua Biaya</p>
            <p className={`text-xl font-bold ${d.ownerProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatRupiah(d.ownerProfit)}</p>
          </div>
        </div>
      </div>

      {/* Allocation Guide */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Landmark}>Panduan Alokasi Berdasarkan Revenue</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 text-text-muted">Revenue/Bulan</th>
                <th className="text-right py-2 text-text-muted">Worker</th>
                <th className="text-right py-2 text-text-muted">Gaji</th>
                <th className="text-right py-2 text-text-muted">Ops</th>
                <th className="text-right py-2 text-text-muted">Ekspansi</th>
                <th className="text-right py-2 text-text-muted">Owner</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rev: "< 10jt", worker: "60%", gaji: "20%", ops: "5%", ekspansi: "5%", owner: "10%" },
                { rev: "10-30jt", worker: "60%", gaji: "15%", ops: "3%", ekspansi: "7%", owner: "15%" },
                { rev: "30-50jt", worker: "60%", gaji: "10%", ops: "3%", ekspansi: "10%", owner: "17%" },
                { rev: "50-100jt", worker: "58%", gaji: "8%", ops: "2%", ekspansi: "12%", owner: "20%" },
                { rev: "> 100jt", worker: "55%", gaji: "7%", ops: "2%", ekspansi: "15%", owner: "21%" },
              ].map(row => (
                <tr key={row.rev} className="border-b border-accent/5">
                  <td className="py-2 text-text font-medium">{row.rev}</td>
                  <td className="py-2 text-right text-red-400">{row.worker}</td>
                  <td className="py-2 text-right text-orange-400">{row.gaji}</td>
                  <td className="py-2 text-right text-yellow-400">{row.ops}</td>
                  <td className="py-2 text-right text-blue-400">{row.ekspansi}</td>
                  <td className="py-2 text-right text-green-400">{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAB: ORDERS PROFITABILITY
// ============================================================
function OrdersTab({ orders, packages }: { orders: OrderProfit[]; packages: PackageProfit[] }) {
  if (orders.length === 0) return <div className="text-center py-20 text-text-muted text-sm">Belum ada data order bulan ini</div>;

  return (
    <div className="space-y-6">
      {/* Package Profitability */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Package}>Profitabilitas per Paket</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 text-text-muted">Paket</th>
                <th className="text-right py-2 text-text-muted">Order</th>
                <th className="text-right py-2 text-text-muted">Revenue</th>
                <th className="text-right py-2 text-text-muted">COGS</th>
                <th className="text-right py-2 text-text-muted">Profit</th>
                <th className="text-right py-2 text-text-muted">Margin</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(p => (
                <tr key={p.name} className="border-b border-accent/5 hover:bg-accent/5">
                  <td className="py-2 text-text max-w-[200px] truncate">{p.name}</td>
                  <td className="py-2 text-right text-text-muted">{p.count}</td>
                  <td className="py-2 text-right text-text">{formatRupiah(p.revenue)}</td>
                  <td className="py-2 text-right text-red-400">{formatRupiah(p.cost)}</td>
                  <td className="py-2 text-right text-green-400">{formatRupiah(p.profit)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.margin >= 35 ? "bg-green-500/20 text-green-400" : p.margin >= 25 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                      {p.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Orders */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={DollarSign}>Detail Per Order (Terbaru)</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 text-text-muted">Order ID</th>
                <th className="text-left py-2 text-text-muted">Paket</th>
                <th className="text-right py-2 text-text-muted">Revenue</th>
                <th className="text-right py-2 text-text-muted">Komisi</th>
                <th className="text-right py-2 text-text-muted">Profit</th>
                <th className="text-right py-2 text-text-muted">Margin</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 50).map(o => (
                <tr key={o.id} className="border-b border-accent/5 hover:bg-accent/5">
                  <td className="py-2 text-text font-mono text-[10px]">{o.order_id?.substring(0, 12)}...</td>
                  <td className="py-2 text-text-muted max-w-[180px] truncate">{o.package_title || o.package}</td>
                  <td className="py-2 text-right text-text">{formatRupiah(o.total_price)}</td>
                  <td className="py-2 text-right text-red-400">{formatRupiah(o.commission)}</td>
                  <td className="py-2 text-right text-green-400">{formatRupiah(o.profit)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${o.margin >= 35 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {o.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAB: EXPANSION PLANNING
// ============================================================
function PlanningTab({ overview: o, trends }: { overview: FinanceOverview; trends: TrendData[] }) {
  const monthlyExpansionBudget = o.netProfit > 0 ? o.netProfit * 0.10 : 0;
  const totalExpansionCost = EXPANSION_MILESTONES.reduce((s, m) => s + m.cost, 0);

  // Revenue projection
  const avgGrowth = trends.length >= 2
    ? trends.slice(1).reduce((s, t, i) => {
        const prev = trends[i].revenue;
        return s + (prev > 0 ? (t.revenue - prev) / prev : 0);
      }, 0) / (trends.length - 1)
    : 0;

  const projections = [];
  let projRev = o.totalRevenue;
  for (let i = 1; i <= 12; i++) {
    projRev = projRev * (1 + avgGrowth);
    const projWorker = projRev * 0.60;
    const projNet = projRev - projWorker - (o.totalSalary || FIXED_COSTS.reduce((s, c) => s + c.monthly, 0));
    projections.push({ month: i, revenue: Math.round(projRev), netProfit: Math.round(projNet) });
  }

  // Target 100M
  const target100M = 100000000;
  const monthsTo100M = projections.findIndex(p => p.revenue >= target100M);

  return (
    <div className="space-y-6">
      {/* Expansion Fund */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={PiggyBank}>Dana Ekspansi</SectionTitle>
          <p className="text-2xl font-bold text-blue-400">{formatRupiah(monthlyExpansionBudget)}</p>
          <p className="text-text-muted text-[10px]">10% dari net profit / bulan</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Progress ke total target</span>
              <span className="text-text">{formatRupiah(monthlyExpansionBudget)} / {formatRupiah(totalExpansionCost)}</span>
            </div>
            <ProgressBar value={monthlyExpansionBudget} max={totalExpansionCost} color="bg-blue-400" />
            {monthlyExpansionBudget > 0 && (
              <p className="text-text-muted text-[10px] mt-1">
                Estimasi tercapai: ~{Math.ceil(totalExpansionCost / monthlyExpansionBudget)} bulan
              </p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={Target}>Target Revenue 100jt/bulan</SectionTitle>
          <div className="text-center py-3">
            {monthsTo100M > 0 ? (
              <>
                <p className="text-3xl font-bold text-accent">{monthsTo100M} bulan</p>
                <p className="text-text-muted text-xs">estimasi dengan growth rate {(avgGrowth * 100).toFixed(1)}%/bulan</p>
              </>
            ) : o.totalRevenue >= target100M ? (
              <>
                <p className="text-3xl font-bold text-green-400">Tercapai!</p>
                <p className="text-text-muted text-xs">Revenue sudah di atas 100jt</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-yellow-400">Data kurang</p>
                <p className="text-text-muted text-xs">Butuh growth rate positif konsisten</p>
              </>
            )}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Progress</span>
              <span className="text-text">{formatRupiah(o.totalRevenue)} / {formatRupiah(target100M)}</span>
            </div>
            <ProgressBar value={o.totalRevenue} max={target100M} color="bg-accent" />
          </div>
        </div>
      </div>

      {/* Expansion Milestones */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Building2}>Roadmap Ekspansi</SectionTitle>
        <div className="space-y-3">
          {EXPANSION_MILESTONES.map((m, i) => {
            const accumulated = monthlyExpansionBudget > 0
              ? Math.ceil(EXPANSION_MILESTONES.slice(0, i + 1).reduce((s, x) => s + x.cost, 0) / monthlyExpansionBudget)
              : 0;
            return (
              <div key={m.target} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent text-xs font-bold">{m.priority}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-text text-sm font-medium">{m.target}</p>
                    <p className="text-accent text-sm font-bold">{m.cost > 0 ? formatRupiah(m.cost) : "Variable"}</p>
                  </div>
                  <p className="text-text-muted text-[10px]">{m.desc}</p>
                  {m.cost > 0 && monthlyExpansionBudget > 0 && (
                    <p className="text-blue-400 text-[10px] mt-0.5">Target bulan ke-{accumulated}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Projection */}
      {projections.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-accent/10">
          <SectionTitle icon={TrendingUp}>Proyeksi Revenue 12 Bulan (Growth: {(avgGrowth * 100).toFixed(1)}%/bulan)</SectionTitle>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projections}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#888" }} label={{ value: "Bulan", fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" name="Revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="netProfit" stroke="#22c55e" name="Net Profit" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-accent/10">
                  <th className="text-left py-1 text-text-muted">Bulan ke-</th>
                  {projections.map(p => <th key={p.month} className="text-right py-1 text-text-muted">{p.month}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-accent/5">
                  <td className="py-1 text-text-muted">Revenue</td>
                  {projections.map(p => <td key={p.month} className="py-1 text-right text-text">{(p.revenue / 1000000).toFixed(1)}jt</td>)}
                </tr>
                <tr>
                  <td className="py-1 text-text-muted">Net Profit</td>
                  {projections.map(p => <td key={p.month} className={`py-1 text-right ${p.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{(p.netProfit / 1000000).toFixed(1)}jt</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scaling Decision Framework */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Briefcase}>Framework Keputusan Scaling</SectionTitle>
        <div className="space-y-2 text-xs">
          {[
            { condition: "Net Margin > 25%", action: "Alokasi 15% ke ekspansi, mulai cari talent", met: o.netMargin > 25 },
            { condition: "Orders > 50/bulan", action: "Hire worker ke-3, pertimbangkan basecamp", met: o.completedOrders > 50 },
            { condition: "Revenue > 30jt/bulan", action: "Setup basecamp, hire admin tambahan", met: o.totalRevenue > 30000000 },
            { condition: "Revenue > 50jt/bulan", action: "Beli equipment, scale ads budget 2x", met: o.totalRevenue > 50000000 },
            { condition: "Revenue > 100jt/bulan", action: "Buka cabang, hire content team, franchise model", met: o.totalRevenue > 100000000 },
          ].map(item => (
            <div key={item.condition} className={`flex items-start gap-2 p-2 rounded-lg ${item.met ? "bg-green-500/10" : "bg-background"}`}>
              {item.met ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> : <Target className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />}
              <div>
                <p className={`font-medium ${item.met ? "text-green-400" : "text-text"}`}>{item.condition}</p>
                <p className="text-text-muted">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAB: COA & SOP
// ============================================================
function COATab() {
  return (
    <div className="space-y-6">
      {/* Chart of Accounts */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Briefcase}>Chart of Accounts (COA)</SectionTitle>
        <p className="text-text-muted text-xs mb-4">Struktur akun keuangan ETNYX — acuan pembukuan harian</p>

        <div className="space-y-4">
          {COA_DATA.map(group => (
            <div key={group.code} className="border border-accent/10 rounded-lg overflow-hidden">
              <div className="bg-accent/10 px-3 py-2 flex items-center gap-2">
                <span className="text-accent font-mono text-xs font-bold">{group.code}</span>
                <span className="text-text font-semibold text-sm">{group.name}</span>
              </div>
              <div className="p-3 space-y-2">
                {group.children?.map(sub => (
                  <div key={sub.code}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-muted font-mono text-[10px]">{sub.code}</span>
                      <span className="text-text text-xs font-medium">{sub.name}</span>
                    </div>
                    {sub.children && (
                      <div className="ml-6 space-y-0.5">
                        {sub.children.map(acc => (
                          <div key={acc.code} className="flex items-center gap-2">
                            <span className="text-text-muted font-mono text-[10px]">{acc.code}</span>
                            <span className="text-text-muted text-[11px]">{acc.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Costs */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Calculator}>Struktur Biaya Tetap (Monthly)</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 text-text-muted">Item</th>
                <th className="text-right py-2 text-text-muted">Biaya/Bulan</th>
                <th className="text-left py-2 text-text-muted pl-4">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {FIXED_COSTS.map(c => (
                <tr key={c.item} className="border-b border-accent/5">
                  <td className="py-2 text-text">{c.item}</td>
                  <td className="py-2 text-right text-accent font-medium">{formatRupiah(c.monthly)}</td>
                  <td className="py-2 text-text-muted pl-4">{c.notes}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-accent/20 font-bold">
                <td className="py-2 text-text">TOTAL FIXED COST</td>
                <td className="py-2 text-right text-accent">{formatRupiah(FIXED_COSTS.reduce((s, c) => s + c.monthly, 0))}</td>
                <td className="py-2 text-text-muted pl-4">/bulan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookkeeping SOP */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Landmark}>SOP Pembukuan Harian</SectionTitle>
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-background rounded-lg">
            <h4 className="text-text font-medium mb-2">Setiap Hari</h4>
            <ol className="space-y-1.5 text-text-muted list-decimal ml-4">
              <li>Cek Dashboard → Overview → catat total revenue hari ini</li>
              <li>Cek order masuk → pastikan payment_status = paid</li>
              <li>Catat transaksi masuk per metode pembayaran (iPaymu / manual transfer)</li>
              <li>Jika ada payout ke worker → catat sebagai expense (5101 - Komisi Worker)</li>
              <li>Screenshot/export bukti transaksi</li>
            </ol>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <h4 className="text-text font-medium mb-2">Setiap Minggu</h4>
            <ol className="space-y-1.5 text-text-muted list-decimal ml-4">
              <li>Review total order & revenue mingguan di tab Overview</li>
              <li>Generate komisi di Payroll → Commissions</li>
              <li>Proses payout pending (approve + bayar)</li>
              <li>Rekonsiliasi saldo bank vs catatan pembukuan</li>
            </ol>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <h4 className="text-text font-medium mb-2">Setiap Bulan</h4>
            <ol className="space-y-1.5 text-text-muted list-decimal ml-4">
              <li>Generate laporan Laba Rugi bulan ini (tab Laba Rugi)</li>
              <li>Hitung net profit & margin</li>
              <li>Generate salary records → bayar gaji staf</li>
              <li>Alokasikan profit: 10% ekspansi, 5% darurat, sisanya owner</li>
              <li>Review tab Planning → update target & milestone</li>
              <li>Bandingkan vs bulan lalu → analisis trend</li>
              <li>Backup / export semua data keuangan bulan ini</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Journal Entry Template */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Briefcase}>Template Jurnal Umum</SectionTitle>
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-background rounded-lg">
            <p className="text-text font-medium mb-2">Order Masuk & Dibayar</p>
            <table className="w-full">
              <thead><tr className="border-b border-accent/10"><th className="text-left py-1 text-text-muted">Akun</th><th className="text-right py-1 text-text-muted">Debit</th><th className="text-right py-1 text-text-muted">Kredit</th></tr></thead>
              <tbody>
                <tr><td className="py-1 text-text">1102 Bank BCA</td><td className="py-1 text-right text-green-400">Rp xxx</td><td className="py-1 text-right">-</td></tr>
                <tr><td className="py-1 text-text ml-4">&nbsp;&nbsp;4101 Pendapatan Joki Paket</td><td className="py-1 text-right">-</td><td className="py-1 text-right text-green-400">Rp xxx</td></tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <p className="text-text font-medium mb-2">Bayar Komisi Worker</p>
            <table className="w-full">
              <thead><tr className="border-b border-accent/10"><th className="text-left py-1 text-text-muted">Akun</th><th className="text-right py-1 text-text-muted">Debit</th><th className="text-right py-1 text-text-muted">Kredit</th></tr></thead>
              <tbody>
                <tr><td className="py-1 text-text">5101 Komisi Worker</td><td className="py-1 text-right text-red-400">Rp xxx</td><td className="py-1 text-right">-</td></tr>
                <tr><td className="py-1 text-text">&nbsp;&nbsp;1104 Dana / OVO / GoPay</td><td className="py-1 text-right">-</td><td className="py-1 text-right text-red-400">Rp xxx</td></tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <p className="text-text font-medium mb-2">Bayar Gaji Staff</p>
            <table className="w-full">
              <thead><tr className="border-b border-accent/10"><th className="text-left py-1 text-text-muted">Akun</th><th className="text-right py-1 text-text-muted">Debit</th><th className="text-right py-1 text-text-muted">Kredit</th></tr></thead>
              <tbody>
                <tr><td className="py-1 text-text">6101 Gaji Admin</td><td className="py-1 text-right text-red-400">Rp xxx</td><td className="py-1 text-right">-</td></tr>
                <tr><td className="py-1 text-text">&nbsp;&nbsp;1102 Bank BCA</td><td className="py-1 text-right">-</td><td className="py-1 text-right text-red-400">Rp xxx</td></tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <p className="text-text font-medium mb-2">Alokasi Dana Ekspansi</p>
            <table className="w-full">
              <thead><tr className="border-b border-accent/10"><th className="text-left py-1 text-text-muted">Akun</th><th className="text-right py-1 text-text-muted">Debit</th><th className="text-right py-1 text-text-muted">Kredit</th></tr></thead>
              <tbody>
                <tr><td className="py-1 text-text">3300 Dana Ekspansi</td><td className="py-1 text-right text-blue-400">Rp xxx</td><td className="py-1 text-right">-</td></tr>
                <tr><td className="py-1 text-text">&nbsp;&nbsp;3200 Laba Ditahan</td><td className="py-1 text-right">-</td><td className="py-1 text-right text-blue-400">Rp xxx</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* KPI Dashboard Guide */}
      <div className="bg-card rounded-xl p-4 border border-accent/10">
        <SectionTitle icon={Activity}>KPI Keuangan — Cara Monitoring</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 text-text-muted">Metrik</th>
                <th className="text-left py-2 text-text-muted">Formula</th>
                <th className="text-left py-2 text-text-muted">Target</th>
                <th className="text-left py-2 text-text-muted">Cek di</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: "Revenue/bulan", formula: "Σ total_price (completed)", target: "> 30jt (short), > 100jt (long)", where: "Tab Overview" },
                { metric: "Net Profit", formula: "Revenue - COGS - Fixed", target: "> 20% margin", where: "Tab Laba Rugi" },
                { metric: "Gross Margin", formula: "(Revenue - COGS) / Revenue", target: "~40%", where: "Tab Laba Rugi → Rasio" },
                { metric: "Cost per Order", formula: "Total Commission / Orders", target: "Konsisten ≤ 60%", where: "Tab Overview" },
                { metric: "Profit per Order", formula: "Gross Profit / Orders", target: "Naik trend", where: "Tab Per Order" },
                { metric: "Burn Rate", formula: "Total cash out / bulan", target: "< 80% cash in", where: "Tab Cashflow" },
                { metric: "Break-Even", formula: "Fixed Cost / CM Ratio", target: "< revenue aktual", where: "Tab Overview" },
                { metric: "Revenue Growth", formula: "(N - N-1) / N-1 × 100", target: "> 10%/bulan", where: "Tab Overview" },
              ].map(k => (
                <tr key={k.metric} className="border-b border-accent/5">
                  <td className="py-2 text-text font-medium">{k.metric}</td>
                  <td className="py-2 text-text-muted font-mono">{k.formula}</td>
                  <td className="py-2 text-accent">{k.target}</td>
                  <td className="py-2 text-text-muted">{k.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
