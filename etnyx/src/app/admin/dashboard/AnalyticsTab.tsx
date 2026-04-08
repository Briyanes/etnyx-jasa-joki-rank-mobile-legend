"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, DollarSign, Users, ShoppingCart, Loader2,
  Trophy, Target, Crown, ChevronLeft, ChevronRight,
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

const BAR_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"];
const TIER_COLORS: Record<string, string> = {
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-300",
};

const CHART_STYLE = {
  backgroundColor: "#1a1f2e",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  fontSize: "12px",
};

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
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-text-muted text-center py-8">Gagal memuat data analytics</p>;
  }

  const { summary, revenueTrend, packageStats, topCustomers, customerTrend, popularRanks } = data;
  const completedOrders = revenueTrend.reduce((s, d) => s + d.completed, 0);
  const completionRate = summary.totalOrders > 0 ? Math.round((completedOrders / summary.totalOrders) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-end">
        <div className="flex gap-1 bg-surface rounded-lg p-1 border border-white/5">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => { setDays(d); setPkgPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                days === d ? "bg-accent text-white" : "text-text-muted hover:text-text"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatRupiah(summary.totalRevenue), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Total Order", value: summary.totalOrders.toString(), icon: ShoppingCart, color: "text-accent", bg: "bg-accent/10" },
          { label: "Rata-rata Order", value: formatRupiah(summary.avgOrderValue), icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Customer Baru", value: summary.newCustomers.toString(), icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface rounded-xl p-4 border border-white/5 hover:border-accent/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-xs text-green-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {summary.days}d
              </span>
            </div>
            <p className="text-2xl font-bold text-text">{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="bg-surface rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text">Completion Rate</span>
          <span className="text-xs text-text-muted">{completedOrders}/{summary.totalOrders} order</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500 transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-right text-xs font-semibold text-accent mt-1">{completionRate}%</p>
      </div>

      {/* Revenue + Orders Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" /> Revenue Trend
          </h3>
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
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} interval={Math.max(0, Math.floor(revenueTrend.length / 8))} />
                  <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={CHART_STYLE} formatter={(v) => formatRupiah(Number(v))} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm flex items-center justify-center h-full">Belum ada data</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-cyan-400" /> Orders / Hari
          </h3>
          <div className="h-64">
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChartRecharts data={revenueTrend}>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} interval={Math.max(0, Math.floor(revenueTrend.length / 8))} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={CHART_STYLE} />
                  <BarRecharts dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
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
        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" /> Revenue by Package
            </h3>
            {packageStats.length > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPkgPage(Math.max(1, pkgPage - 1))}
                  disabled={pkgPage === 1}
                  className="p-1 rounded text-text-muted hover:text-text disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-text-muted px-1">
                  {pkgPage}/{Math.ceil(packageStats.length / ITEMS_PER_PAGE)}
                </span>
                <button
                  onClick={() => setPkgPage(Math.min(Math.ceil(packageStats.length / ITEMS_PER_PAGE), pkgPage + 1))}
                  disabled={pkgPage >= Math.ceil(packageStats.length / ITEMS_PER_PAGE)}
                  className="p-1 rounded text-text-muted hover:text-text disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {packageStats.length > 0 ? (
            <div className="space-y-2">
              {packageStats
                .slice((pkgPage - 1) * ITEMS_PER_PAGE, pkgPage * ITEMS_PER_PAGE)
                .map((pkg, i) => {
                  const maxRev = packageStats[0]?.revenue || 1;
                  const globalIdx = (pkgPage - 1) * ITEMS_PER_PAGE + i;
                  return (
                    <div key={pkg.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BAR_COLORS[globalIdx % BAR_COLORS.length] }} />
                          <p className="text-xs text-text font-medium truncate max-w-[200px]">{pkg.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-green-400 font-semibold">{formatRupiah(pkg.revenue)}</span>
                          <span className="text-[10px] text-text-muted ml-2">{pkg.count}×</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${(pkg.revenue / maxRev) * 100}%`, backgroundColor: BAR_COLORS[globalIdx % BAR_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              <p className="text-[10px] text-text-muted text-right pt-1">
                {(pkgPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(pkgPage * ITEMS_PER_PAGE, packageStats.length)} dari {packageStats.length}
              </p>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">Belum ada data</p>
          )}
        </div>

        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Customer Growth
          </h3>
          <div className="h-52">
            {customerTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChartRecharts data={customerTrend}>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} interval={Math.max(0, Math.floor(customerTrend.length / 8))} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={CHART_STYLE} />
                  <BarRecharts dataKey="newCustomers" fill="#a78bfa" radius={[4, 4, 0, 0]} name="New Customers" />
                </BarChartRecharts>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm flex items-center justify-center h-full">Belum ada data</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers + Popular Ranks */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" /> Top Customers
          </h3>
          <div className="space-y-3">
            {topCustomers.slice(0, 5).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  i === 1 ? "bg-gray-400/20 text-gray-300" :
                  i === 2 ? "bg-orange-500/20 text-orange-400" :
                  "bg-white/5 text-text-muted"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text font-medium truncate">{c.name || c.email}</p>
                  <p className="text-[10px] text-text-muted">
                    {c.total_orders} orders •{" "}
                    <span className={TIER_COLORS[c.reward_tier] || "text-text-muted"}>{c.reward_tier}</span>
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-400">{formatRupiah(c.total_spent)}</p>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="text-text-muted text-sm text-center py-4">Belum ada data</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" /> Popular Rank Push
          </h3>
          <div className="space-y-2">
            {popularRanks.slice(0, 7).map((r, i) => {
              const maxCount = popularRanks[0]?.count || 1;
              return (
                <div key={r.pair}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-text capitalize">{r.pair}</p>
                    <p className="text-[10px] text-text-muted">{r.count}× • {formatRupiah(r.revenue)}</p>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-accent to-purple-500 transition-all"
                      style={{ width: `${(r.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {popularRanks.length === 0 && (
              <p className="text-text-muted text-sm text-center py-4">Belum ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
