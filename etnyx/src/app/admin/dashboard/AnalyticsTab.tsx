"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, DollarSign, Users, ShoppingCart, Loader2,
  BarChart3, Trophy, Target, Crown, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, CalendarDays, Package,
} from "lucide-react";
import { formatRupiah } from "@/utils/helpers";
import dynamic from "next/dynamic";

const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChartRecharts = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const BarRecharts = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });

const ITEMS_PER_PAGE = 10;

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    newCustomers: number;
    days: number;
  };
  revenueTrend: { date: string; orders: number; revenue: number; completed: number }[];
  packageStats: { name: string; count: number; revenue: number }[];
  topCustomers: { id: string; name: string; email: string; total_orders: number; total_spent: number; reward_tier: string }[];
  customerTrend: { date: string; newCustomers: number }[];
  popularRanks: { pair: string; count: number; revenue: number }[];
}

const GRADIENT_COLORS = [
  { from: "#8b5cf6", to: "#6d28d9" },
  { from: "#06b6d4", to: "#0891b2" },
  { from: "#f59e0b", to: "#d97706" },
  { from: "#ef4444", to: "#dc2626" },
  { from: "#10b981", to: "#059669" },
];
const TIER_COLORS: Record<string, string> = {
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-300",
};
const TIER_BG: Record<string, string> = {
  bronze: "bg-orange-500/10 border-orange-500/20",
  silver: "bg-gray-400/10 border-gray-400/20",
  gold: "bg-yellow-500/10 border-yellow-500/20",
  platinum: "bg-cyan-500/10 border-cyan-500/20",
};

const CHART_STYLE = {
  backgroundColor: "rgba(15, 18, 30, 0.95)",
  border: "1px solid rgba(139, 92, 246, 0.2)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  backdropFilter: "blur(8px)",
};

function SectionTitle({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-text flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [pkgPage, setPkgPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();
      if (!json.error) setData(json);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-accent/20" />
          <Loader2 className="w-12 h-12 animate-spin text-accent absolute inset-0" />
        </div>
        <p className="text-sm text-text-muted">Memuat analytics...</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-text-muted text-center py-8">Gagal memuat data analytics</p>;
  }

  const { summary, revenueTrend, packageStats, topCustomers, customerTrend, popularRanks } = data;
  const completedOrders = revenueTrend.reduce((s, d) => s + d.completed, 0);
  const completionRate = summary.totalOrders > 0 ? Math.round((completedOrders / summary.totalOrders) * 100) : 0;

  const summaryCards = [
    {
      label: "Total Revenue",
      value: formatRupiah(summary.totalRevenue),
      icon: DollarSign,
      gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/10 hover:border-emerald-500/30",
      trend: summary.totalRevenue > 0,
    },
    {
      label: "Total Order",
      value: summary.totalOrders.toString(),
      icon: ShoppingCart,
      gradient: "from-accent/20 via-accent/5 to-transparent",
      iconBg: "bg-accent/15",
      iconColor: "text-accent",
      borderColor: "border-accent/10 hover:border-accent/30",
      trend: summary.totalOrders > 0,
    },
    {
      label: "Rata-rata Order",
      value: formatRupiah(summary.avgOrderValue),
      icon: TrendingUp,
      gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      iconBg: "bg-cyan-500/15",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/10 hover:border-cyan-500/30",
      trend: summary.avgOrderValue > 0,
    },
    {
      label: "Customer Baru",
      value: summary.newCustomers.toString(),
      icon: Users,
      gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/10 hover:border-purple-500/30",
      trend: summary.newCustomers > 0,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header + Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-accent" />
            </div>
            Analytics
          </h2>
          <p className="text-xs text-text-muted mt-1 ml-[42px] flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" />
            {new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5 backdrop-blur-sm">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => { setDays(d); setPkgPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                days === d
                  ? "bg-accent text-white shadow-lg shadow-accent/25"
                  : "text-text-muted hover:text-text hover:bg-white/5"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, gradient, iconBg, iconColor, borderColor, trend }) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-surface transition-all duration-300 group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                {trend ? (
                  <div className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">aktif</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 text-text-muted bg-white/5 px-1.5 py-0.5 rounded-md">
                    <ArrowDownRight className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">0</span>
                  </div>
                )}
              </div>
              <p className="text-xl lg:text-2xl font-bold text-text tracking-tight">{value}</p>
              <p className="text-[11px] text-text-muted mt-1 font-medium">{label} • {summary.days} hari</p>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Rate Mini Banner */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-accent/10 via-purple-500/5 to-transparent rounded-xl px-5 py-3 border border-accent/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold text-text">Completion Rate</span>
        </div>
        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <span className="text-sm font-bold text-accent">{completionRate}%</span>
        <span className="text-[10px] text-text-muted">{completedOrders}/{summary.totalOrders}</span>
      </div>

      {/* Revenue + Orders Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-white/5 hover:border-accent/10 transition-colors">
          <SectionTitle icon={TrendingUp} title="Revenue Trend" color="bg-emerald-500/15 text-emerald-400" />
          <div className="h-64">
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(revenueTrend.length / 7))} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={CHART_STYLE} formatter={(v) => formatRupiah(Number(v))} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm flex items-center justify-center h-full">Belum ada data</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/5 hover:border-cyan-500/10 transition-colors">
          <SectionTitle icon={ShoppingCart} title="Orders / Hari" color="bg-cyan-500/15 text-cyan-400" />
          <div className="h-64">
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChartRecharts data={revenueTrend}>
                  <defs>
                    <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(revenueTrend.length / 7))} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_STYLE} />
                  <BarRecharts dataKey="orders" fill="url(#orderGrad)" radius={[6, 6, 0, 0]} />
                </BarChartRecharts>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm flex items-center justify-center h-full">Belum ada data</p>
            )}
          </div>
        </div>
      </div>

      {/* Package Breakdown + Customer Growth */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-white/5 hover:border-yellow-500/10 transition-colors">
          <SectionTitle icon={Package} title="Revenue by Package" color="bg-yellow-500/15 text-yellow-400">
            {packageStats.length > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2 py-1 border border-white/5">
                <button
                  onClick={() => setPkgPage(Math.max(1, pkgPage - 1))}
                  disabled={pkgPage === 1}
                  className="p-0.5 rounded text-text-muted hover:text-text disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-text-muted font-medium tabular-nums min-w-[28px] text-center">
                  {pkgPage}/{Math.ceil(packageStats.length / ITEMS_PER_PAGE)}
                </span>
                <button
                  onClick={() => setPkgPage(Math.min(Math.ceil(packageStats.length / ITEMS_PER_PAGE), pkgPage + 1))}
                  disabled={pkgPage >= Math.ceil(packageStats.length / ITEMS_PER_PAGE)}
                  className="p-0.5 rounded text-text-muted hover:text-text disabled:opacity-20 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </SectionTitle>
          {packageStats.length > 0 ? (
            <div className="space-y-2.5">
              {packageStats
                .slice((pkgPage - 1) * ITEMS_PER_PAGE, pkgPage * ITEMS_PER_PAGE)
                .map((pkg, i) => {
                  const maxRev = packageStats[0]?.revenue || 1;
                  const globalIdx = (pkgPage - 1) * ITEMS_PER_PAGE + i;
                  const colors = GRADIENT_COLORS[globalIdx % GRADIENT_COLORS.length];
                  return (
                    <div key={pkg.name} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold text-text-muted w-5 text-right tabular-nums">{globalIdx + 1}.</span>
                          <p className="text-xs text-text font-medium truncate max-w-[200px] group-hover:text-white transition-colors">{pkg.name}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400">{formatRupiah(pkg.revenue)}</span>
                          <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded-md font-medium">{pkg.count}×</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/[0.03] rounded-full h-1.5 overflow-hidden ml-[30px]" style={{ width: "calc(100% - 30px)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(pkg.revenue / maxRev) * 100}%`,
                            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              <p className="text-[10px] text-text-muted text-right pt-2 font-medium">
                {(pkgPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(pkgPage * ITEMS_PER_PAGE, packageStats.length)} dari {packageStats.length} paket
              </p>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">Belum ada data</p>
          )}
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/5 hover:border-purple-500/10 transition-colors">
          <SectionTitle icon={Users} title="Customer Growth" color="bg-purple-500/15 text-purple-400" />
          <div className="h-[280px]">
            {customerTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerTrend}>
                  <defs>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(customerTrend.length / 7))} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_STYLE} />
                  <Area type="monotone" dataKey="newCustomers" stroke="#a78bfa" strokeWidth={2} fill="url(#custGrad)" name="New Customers" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm flex items-center justify-center h-full">Belum ada data</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers + Popular Ranks */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-white/5 hover:border-yellow-500/10 transition-colors">
          <SectionTitle icon={Crown} title="Top Customers" color="bg-yellow-500/15 text-yellow-400" />
          <div className="space-y-2">
            {topCustomers.slice(0, 5).map((c, i) => {
              const initials = (c.name || c.email).slice(0, 2).toUpperCase();
              const medalColors = [
                "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-yellow-500/30",
                "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-gray-400/20",
                "bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-orange-500/20",
              ];
              return (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors group">
                  <div className="relative">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shadow-lg ${
                      i < 3 ? medalColors[i] : "bg-white/5 text-text-muted"
                    }`}>
                      {i < 3 ? (
                        <span className="drop-shadow-sm">{["🥇", "🥈", "🥉"][i]}</span>
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    {i < 3 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-text">{i + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text font-semibold truncate group-hover:text-white transition-colors">{c.name || c.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-text-muted">{c.total_orders} orders</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TIER_BG[c.reward_tier] || "bg-white/5 border-white/10"} ${TIER_COLORS[c.reward_tier] || "text-text-muted"}`}>
                        {c.reward_tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">{formatRupiah(c.total_spent)}</p>
                </div>
              );
            })}
            {topCustomers.length === 0 && (
              <p className="text-text-muted text-sm text-center py-6">Belum ada data</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/5 hover:border-purple-500/10 transition-colors">
          <SectionTitle icon={Trophy} title="Popular Rank Push" color="bg-purple-500/15 text-purple-400" />
          <div className="space-y-2.5">
            {popularRanks.slice(0, 7).map((r, i) => {
              const maxCount = popularRanks[0]?.count || 1;
              return (
                <div key={r.pair} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? "bg-yellow-500/15 text-yellow-400" :
                        i === 1 ? "bg-gray-400/15 text-gray-300" :
                        i === 2 ? "bg-orange-500/15 text-orange-400" :
                        "bg-white/5 text-text-muted"
                      }`}>
                        {i + 1}
                      </div>
                      <p className="text-xs text-text font-medium capitalize group-hover:text-white transition-colors">{r.pair}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded-md font-medium">{r.count}×</span>
                      <span className="text-xs font-bold text-emerald-400">{formatRupiah(r.revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/[0.03] rounded-full h-1.5 overflow-hidden ml-[34px]" style={{ width: "calc(100% - 34px)" }}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${(r.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {popularRanks.length === 0 && (
              <p className="text-text-muted text-sm text-center py-6">Belum ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
