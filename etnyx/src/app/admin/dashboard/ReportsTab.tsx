"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, BarChart3,
  Download, Loader2, Calendar, ArrowUpRight, ArrowDownRight,
  Star, Trophy, Briefcase, ChevronLeft, ChevronRight,
} from "lucide-react";
import { formatRupiah } from "@/utils/helpers";

// ---- Types ----
interface PnLReport {
  month: number;
  year: number;
  totalRevenue: number;
  totalBasePrice: number;
  totalExpressPremium: number;
  totalPromoDiscount: number;
  completedOrders: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  commissionCount: number;
  totalSalary: number;
  paidSalary: number;
  salaryCount: number;
  totalExpenses: number;
  totalPaidOut: number;
  payoutCount: number;
  netProfit: number;
  profitMargin: number;
  prevMonthRevenue: number;
  revenueGrowth: number;
}

interface PnLTrend {
  label: string;
  month: number;
  year: number;
  revenue: number;
  commission: number;
  salary: number;
  expenses: number;
  profit: number;
}

interface WorkerPerf {
  id: string;
  name: string;
  email: string;
  monthCompleted: number;
  monthTotal: number;
  monthWinrate: number;
  monthRevenue: number;
  monthEarnings: number;
  paidEarnings: number;
  allTimeCompleted: number;
  allTimeTotal: number;
  allTimeWinrate: number;
  avgRating: number;
  totalReviews: number;
}

type SubTab = "pnl" | "workers" | "export";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function ReportsTab() {
  const [subTab, setSubTab] = useState<SubTab>("pnl");
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Data
  const [pnl, setPnl] = useState<PnLReport | null>(null);
  const [trends, setTrends] = useState<PnLTrend[]>([]);
  const [workers, setWorkers] = useState<WorkerPerf[]>([]);

  // ---- Navigation ----
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // ---- Fetchers ----
  const fetchPnL = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reports?type=pnl&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.report) setPnl(data.report);
    } catch (err) {
      console.error("Fetch PnL error:", err);
    }
  }, [month, year]);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reports?type=pnl_trend&month=${month}&year=${year}`);
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (err) {
      console.error("Fetch trends error:", err);
    }
  }, [month, year]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reports?type=workers&month=${month}&year=${year}`);
      const data = await res.json();
      setWorkers(data.workers || []);
    } catch (err) {
      console.error("Fetch workers error:", err);
    }
  }, [month, year]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (subTab === "pnl") await Promise.all([fetchPnL(), fetchTrends()]);
      if (subTab === "workers") await fetchWorkers();
      setLoading(false);
    };
    load();
  }, [subTab, fetchPnL, fetchTrends, fetchWorkers]);

  // ---- Export ----
  const exportCSV = (type: string) => {
    const params = new URLSearchParams({ type, month: String(month), year: String(year) });
    window.open(`/api/admin/export?${params}`, "_blank");
  };

  // ---- Helpers ----
  const maxTrendValue = Math.max(...trends.map(t => Math.max(t.revenue, t.expenses)), 1);

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {([
            { id: "pnl" as SubTab, label: "Profit & Loss", icon: TrendingUp },
            { id: "workers" as SubTab, label: "Worker Performance", icon: Users },
            { id: "export" as SubTab, label: "Export Data", icon: Download },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                subTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Month Navigator */}
        {subTab !== "export" && (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============ PROFIT & LOSS ============ */}
      {subTab === "pnl" && pnl && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">Revenue</div>
                {pnl.revenueGrowth !== 0 && (
                  <span className={`flex items-center text-xs font-medium ${pnl.revenueGrowth > 0 ? "text-green-600" : "text-red-600"}`}>
                    {pnl.revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(pnl.revenueGrowth)}%
                  </span>
                )}
              </div>
              <div className="text-xl font-bold mt-1 text-green-600">{formatRupiah(pnl.totalRevenue)}</div>
              <div className="text-xs text-gray-400 mt-1">{pnl.completedOrders} orders completed</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</div>
              <div className="text-xl font-bold mt-1 text-red-600">{formatRupiah(pnl.totalExpenses)}</div>
              <div className="text-xs text-gray-400 mt-1">Komisi + Gaji</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Net Profit</div>
              <div className={`text-xl font-bold mt-1 ${pnl.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatRupiah(pnl.netProfit)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Margin: {pnl.profitMargin}%</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Sudah Dibayar</div>
              <div className="text-xl font-bold mt-1">{formatRupiah(pnl.totalPaidOut)}</div>
              <div className="text-xs text-gray-400 mt-1">{pnl.payoutCount} payouts</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" /> Revenue Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Harga Dasar (Base Price)</span>
                  <span className="font-medium">{formatRupiah(pnl.totalBasePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Express + Premium Surcharge</span>
                  <span className="font-medium text-blue-600">+{formatRupiah(pnl.totalExpressPremium)}</span>
                </div>
                {pnl.totalPromoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Diskon Promo</span>
                    <span className="font-medium text-red-600">-{formatRupiah(pnl.totalPromoDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                  <span>Total Revenue</span>
                  <span className="text-green-600">{formatRupiah(pnl.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" /> Expense Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Komisi Worker ({pnl.commissionCount} records)</span>
                  <span className="font-medium">{formatRupiah(pnl.totalCommission)}</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Sudah dibayar</span>
                    <span className="text-green-500">{formatRupiah(pnl.paidCommission)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Belum dibayar</span>
                    <span className="text-yellow-500">{formatRupiah(pnl.pendingCommission)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gaji Staff ({pnl.salaryCount} records)</span>
                  <span className="font-medium">{formatRupiah(pnl.totalSalary)}</span>
                </div>
                <div className="pl-4">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Sudah dibayar</span>
                    <span className="text-green-500">{formatRupiah(pnl.paidSalary)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                  <span>Total Expenses</span>
                  <span className="text-red-600">{formatRupiah(pnl.totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* P&L Trend (last 6 months) - Simple bar chart */}
          {trends.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Tren 6 Bulan Terakhir
              </h3>
              <div className="space-y-3">
                {trends.map((t) => (
                  <div key={t.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 w-20">{t.label}</span>
                      <div className="flex-1 mx-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 bg-green-500/80 rounded-sm transition-all"
                            style={{ width: `${Math.max((t.revenue / maxTrendValue) * 100, 2)}%` }}
                          />
                          <span className="text-xs text-green-600 whitespace-nowrap">{formatRupiah(t.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 bg-red-400/80 rounded-sm transition-all"
                            style={{ width: `${Math.max((t.expenses / maxTrendValue) * 100, 2)}%` }}
                          />
                          <span className="text-xs text-red-500 whitespace-nowrap">{formatRupiah(t.expenses)}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold w-28 text-right ${t.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatRupiah(t.profit)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/80 rounded-sm" /> Revenue</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400/80 rounded-sm" /> Expenses</span>
                  <span className="ml-auto">Angka kanan = Net Profit</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Export */}
          <div className="flex gap-2">
            <button onClick={() => exportCSV("commissions")} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
              <Download className="w-4 h-4" /> Export Komisi
            </button>
            <button onClick={() => exportCSV("salaries")} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
              <Download className="w-4 h-4" /> Export Gaji
            </button>
            <button onClick={() => exportCSV("payouts")} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
              <Download className="w-4 h-4" /> Export Payouts
            </button>
          </div>
        </div>
      )}

      {/* ============ WORKER PERFORMANCE ============ */}
      {subTab === "workers" && (
        <div className="space-y-4">
          {workers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border border-gray-200 dark:border-gray-700">
              Tidak ada worker aktif.
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Total Workers</div>
                  <div className="text-2xl font-bold mt-1">{workers.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Total Orders (Bulan Ini)</div>
                  <div className="text-2xl font-bold mt-1">{workers.reduce((s, w) => s + w.monthCompleted, 0)}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Total Earnings (Bulan Ini)</div>
                  <div className="text-2xl font-bold mt-1">{formatRupiah(workers.reduce((s, w) => s + w.monthEarnings, 0))}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Avg Winrate</div>
                  <div className="text-2xl font-bold mt-1">
                    {workers.length > 0 ? (workers.reduce((s, w) => s + w.monthWinrate, 0) / workers.length).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              {/* Worker Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="p-3 text-left">#</th>
                      <th className="p-3 text-left">Worker</th>
                      <th className="p-3 text-center">Orders</th>
                      <th className="p-3 text-center">Winrate</th>
                      <th className="p-3 text-right">Revenue</th>
                      <th className="p-3 text-right">Earnings</th>
                      <th className="p-3 text-right">Dibayar</th>
                      <th className="p-3 text-center">Rating</th>
                      <th className="p-3 text-center">All-time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w, i) => (
                      <tr key={w.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="p-3">
                          {i === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                          {i === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                          {i === 2 && <Trophy className="w-4 h-4 text-amber-700" />}
                          {i > 2 && <span className="text-gray-400">{i + 1}</span>}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{w.name}</div>
                          <div className="text-xs text-gray-400">{w.email}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold">{w.monthCompleted}</span>
                          <span className="text-gray-400">/{w.monthTotal}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            w.monthWinrate >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                            w.monthWinrate >= 70 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {w.monthWinrate}%
                          </span>
                        </td>
                        <td className="p-3 text-right">{formatRupiah(w.monthRevenue)}</td>
                        <td className="p-3 text-right font-semibold">{formatRupiah(w.monthEarnings)}</td>
                        <td className="p-3 text-right text-green-600">{formatRupiah(w.paidEarnings)}</td>
                        <td className="p-3 text-center">
                          {w.avgRating > 0 ? (
                            <span className="flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{w.avgRating}</span>
                              <span className="text-xs text-gray-400">({w.totalReviews})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-xs">
                          <div>{w.allTimeCompleted} orders</div>
                          <div className="text-gray-400">{w.allTimeWinrate}% WR</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Per-Worker Earnings Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold mb-4">Earnings Bulan Ini</h3>
                <div className="space-y-3">
                  {workers.map((w) => {
                    const maxEarning = Math.max(...workers.map(x => x.monthEarnings), 1);
                    return (
                      <div key={w.id} className="flex items-center gap-3">
                        <span className="text-sm w-24 truncate">{w.name}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                            style={{ width: `${Math.max((w.monthEarnings / maxEarning) * 100, 5)}%` }}
                          >
                            {w.monthEarnings > 0 && (
                              <span className="text-xs text-white font-medium">{formatRupiah(w.monthEarnings)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ EXPORT DATA ============ */}
      {subTab === "export" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: "orders", label: "Orders", desc: "Semua data order", icon: Briefcase, color: "blue" },
              { type: "customers", label: "Customers", desc: "Data pelanggan", icon: Users, color: "purple" },
              { type: "commissions", label: "Komisi", desc: `Komisi bulan ${MONTHS[month - 1]} ${year}`, icon: DollarSign, color: "green", hasMonth: true },
              { type: "salaries", label: "Gaji", desc: `Gaji bulan ${MONTHS[month - 1]} ${year}`, icon: Briefcase, color: "orange", hasMonth: true },
              { type: "payouts", label: "Payouts", desc: "Semua data payout", icon: DollarSign, color: "teal" },
              { type: "boosters", label: "Boosters", desc: "Data booster", icon: Trophy, color: "yellow" },
              { type: "testimonials", label: "Testimonials", desc: "Data testimonial", icon: Star, color: "pink" },
              { type: "promo_codes", label: "Promo Codes", desc: "Semua promo", icon: Calendar, color: "indigo" },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => {
                  const params = new URLSearchParams({ type: item.type });
                  if (item.hasMonth) {
                    params.set("month", String(month));
                    params.set("year", String(year));
                  }
                  window.open(`/api/admin/export?${params}`, "_blank");
                }}
                className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                  <div className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download CSV
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Month selector for payroll exports */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Export Komisi dan Gaji menggunakan periode <strong>{MONTHS[month - 1]} {year}</strong>.
              Gunakan navigator bulan di atas untuk mengubah periode.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
