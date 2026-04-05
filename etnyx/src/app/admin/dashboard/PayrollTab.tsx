"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign, Users, Clock, CheckCircle, Loader2, RefreshCw,
  Plus, ArrowRight, Ban, Receipt, Wallet, TrendingUp, Calendar,
  ChevronDown, Search, Filter, Save,
} from "lucide-react";
import { formatRupiah } from "@/utils/helpers";

// ---- Types ----
interface PayrollOverview {
  pendingCommissions: number;
  pendingCommissionCount: number;
  monthCommissionTotal: number;
  monthCommissionPaid: number;
  pendingPayouts: number;
  pendingPayoutCount: number;
  activeStaffWithSalary: number;
  totalPaidThisMonth: number;
}

interface Commission {
  id: string;
  order_id: string;
  order_code: string;
  worker_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  bonus_amount: number;
  total_amount: number;
  status: string;
  period_start: string;
  period_end: string;
  payout_id: string | null;
  created_at: string;
  staff_users?: { name: string; email: string };
}

interface SalaryConfig {
  id: string;
  staff_id: string;
  base_salary: number;
  allowances: { name: string; amount: number }[];
  effective_from: string;
  notes: string | null;
  staff_users?: { name: string; email: string; role: string };
}

interface SalaryRecord {
  id: string;
  staff_id: string;
  period_month: number;
  period_year: number;
  base_salary: number;
  allowances_total: number;
  deductions: number;
  deduction_notes: string | null;
  bonus_amount: number;
  bonus_notes: string | null;
  total_amount: number;
  status: string;
  staff_users?: { name: string; email: string; role: string };
}

interface Payout {
  id: string;
  payout_code: string;
  type: string;
  period_label: string;
  total_amount: number;
  total_items: number;
  status: string;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
}

interface PayrollSettings {
  commission?: {
    worker_rate: number;
    company_rate: number;
    base_on: string;
    bonus_tiers: { name: string; condition: string; bonus_rate?: number; bonus_amount?: number }[];
  };
  payout_cycle?: {
    worker: string;
    staff: string;
    biweekly_days: number[];
    monthly_day: number;
  };
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

type SubTab = "overview" | "commissions" | "salaries" | "payouts" | "settings";

const SUB_TABS: { id: SubTab; label: string; icon: typeof DollarSign }[] = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "commissions", label: "Komisi", icon: Receipt },
  { id: "salaries", label: "Gaji", icon: Wallet },
  { id: "payouts", label: "Payouts", icon: DollarSign },
  { id: "settings", label: "Settings", icon: Calendar },
];

export default function PayrollTab() {
  const [subTab, setSubTab] = useState<SubTab>("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Data
  const [overview, setOverview] = useState<PayrollOverview | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [settings, setSettings] = useState<PayrollSettings>({});
  const [staffList, setStaffList] = useState<StaffUser[]>([]);

  // Filters
  const [commissionStatus, setCommissionStatus] = useState("all");
  const [payoutStatus, setPayoutStatus] = useState("all");

  // Forms
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ staffId: "", baseSalary: 0, notes: "" });
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [selectedSalaryRecords, setSelectedSalaryRecords] = useState<string[]>([]);

  // ---- Fetchers ----
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payroll");
      const data = await res.json();
      if (data.overview) setOverview(data.overview);
    } catch (err) {
      console.error("Fetch overview error:", err);
    }
  }, []);

  const fetchCommissions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (commissionStatus !== "all") params.set("status", commissionStatus);
      const res = await fetch(`/api/admin/payroll/commissions?${params}`);
      const data = await res.json();
      setCommissions(data.commissions || []);
    } catch (err) {
      console.error("Fetch commissions error:", err);
    }
  }, [commissionStatus]);

  const fetchSalaryConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payroll/salaries?view=configs");
      const data = await res.json();
      setSalaryConfigs(data.configs || []);
    } catch (err) {
      console.error("Fetch salary configs error:", err);
    }
  }, []);

  const fetchSalaryRecords = useCallback(async () => {
    try {
      const now = new Date();
      const res = await fetch(`/api/admin/payroll/salaries?view=records&month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      const data = await res.json();
      setSalaryRecords(data.records || []);
    } catch (err) {
      console.error("Fetch salary records error:", err);
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (payoutStatus !== "all") params.set("status", payoutStatus);
      const res = await fetch(`/api/admin/payroll/payouts?${params}`);
      const data = await res.json();
      setPayouts(data.payouts || []);
    } catch (err) {
      console.error("Fetch payouts error:", err);
    }
  }, [payoutStatus]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payroll/settings");
      const data = await res.json();
      setSettings(data.settings || {});
    } catch (err) {
      console.error("Fetch settings error:", err);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/users");
      const data = await res.json();
      setStaffList(data.users || []);
    } catch (err) {
      console.error("Fetch staff error:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchStaff()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOverview, fetchStaff]);

  useEffect(() => {
    if (subTab === "commissions") fetchCommissions();
    if (subTab === "salaries") { fetchSalaryConfigs(); fetchSalaryRecords(); }
    if (subTab === "payouts") fetchPayouts();
    if (subTab === "settings") fetchSettings();
  }, [subTab, fetchCommissions, fetchSalaryConfigs, fetchSalaryRecords, fetchPayouts, fetchSettings]);

  // ---- Actions ----
  const generateCommissions = async () => {
    setActionLoading(true);
    try {
      const now = new Date();
      const day = now.getDate();
      const periodStart = day <= 15
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), now.getMonth(), 16);
      const periodEnd = day <= 15
        ? new Date(now.getFullYear(), now.getMonth(), 15)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const res = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_commissions",
          periodStart: periodStart.toISOString().split("T")[0],
          periodEnd: periodEnd.toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      alert(data.message || `Generated ${data.generated} commissions`);
      fetchCommissions();
      fetchOverview();
    } catch {
      alert("Gagal generate komisi");
    }
    setActionLoading(false);
  };

  const generateSalaries = async () => {
    setActionLoading(true);
    try {
      const now = new Date();
      const res = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_salaries",
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      });
      const data = await res.json();
      alert(data.message || `Generated ${data.generated} salary records`);
      fetchSalaryRecords();
    } catch {
      alert("Gagal generate gaji");
    }
    setActionLoading(false);
  };

  const saveSalaryConfig = async () => {
    if (!salaryForm.staffId || salaryForm.baseSalary <= 0) return alert("Isi data lengkap");
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payroll/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: salaryForm.staffId,
          baseSalary: salaryForm.baseSalary,
          notes: salaryForm.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setShowSalaryForm(false);
      setSalaryForm({ staffId: "", baseSalary: 0, notes: "" });
      fetchSalaryConfigs();
    } catch {
      alert("Gagal simpan gaji");
    }
    setActionLoading(false);
  };

  const createPayout = async () => {
    if (selectedCommissions.length === 0 && selectedSalaryRecords.length === 0) {
      return alert("Pilih minimal 1 item");
    }
    setActionLoading(true);
    try {
      const now = new Date();
      const day = now.getDate();
      const periodLabel = day <= 15
        ? `1-15 ${now.toLocaleString("id-ID", { month: "short", year: "numeric" })}`
        : `16-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()} ${now.toLocaleString("id-ID", { month: "short", year: "numeric" })}`;

      const type = selectedCommissions.length > 0 && selectedSalaryRecords.length > 0
        ? "mixed"
        : selectedCommissions.length > 0 ? "commission" : "salary";

      const res = await fetch("/api/admin/payroll/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          periodLabel,
          commissionIds: selectedCommissions,
          salaryRecordIds: selectedSalaryRecords,
        }),
      });
      if (!res.ok) throw new Error();
      setShowPayoutForm(false);
      setSelectedCommissions([]);
      setSelectedSalaryRecords([]);
      fetchPayouts();
      fetchCommissions();
      fetchOverview();
      alert("Payout created!");
    } catch {
      alert("Gagal buat payout");
    }
    setActionLoading(false);
  };

  const updatePayoutStatus = async (payoutId: string, action: string) => {
    if (!confirm(`${action} payout ini?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payroll/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payoutId, action }),
      });
      if (!res.ok) throw new Error();
      fetchPayouts();
      fetchOverview();
    } catch {
      alert(`Gagal ${action} payout`);
    }
    setActionLoading(false);
  };

  const saveSettings = async (key: string, value: unknown) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payroll/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
      fetchSettings();
      alert("Saved!");
    } catch {
      alert("Gagal simpan");
    }
    setActionLoading(false);
  };

  // ---- Helpers ----
  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      pending_approval: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>{status.replace("_", " ")}</span>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
        {SUB_TABS.map((tab) => (
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

      {/* ============ OVERVIEW ============ */}
      {subTab === "overview" && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Komisi Pending</div>
              <div className="text-xl font-bold mt-1">{formatRupiah(overview.pendingCommissions)}</div>
              <div className="text-xs text-gray-400 mt-1">{overview.pendingCommissionCount} items</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Komisi Bulan Ini</div>
              <div className="text-xl font-bold mt-1">{formatRupiah(overview.monthCommissionTotal)}</div>
              <div className="text-xs text-green-500 mt-1">{formatRupiah(overview.monthCommissionPaid)} paid</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Payout Pending</div>
              <div className="text-xl font-bold mt-1">{formatRupiah(overview.pendingPayouts)}</div>
              <div className="text-xs text-gray-400 mt-1">{overview.pendingPayoutCount} batches</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Dibayar Bulan Ini</div>
              <div className="text-xl font-bold mt-1 text-green-600">{formatRupiah(overview.totalPaidThisMonth)}</div>
              <div className="text-xs text-gray-400 mt-1">{overview.activeStaffWithSalary} staff aktif</div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generateCommissions}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Generate Komisi Periode Ini
            </button>
            <button
              onClick={generateSalaries}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              <Calendar className="w-4 h-4" /> Generate Gaji Bulan Ini
            </button>
          </div>
        </div>
      )}

      {/* ============ COMMISSIONS ============ */}
      {subTab === "commissions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {["all", "pending", "approved", "paid"].map((s) => (
                <button
                  key={s}
                  onClick={() => setCommissionStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${commissionStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                >
                  {s === "all" ? "Semua" : s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPayoutForm(true)}
                disabled={selectedCommissions.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Create Payout ({selectedCommissions.length})
              </button>
              <button onClick={generateCommissions} disabled={actionLoading} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Generate
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-3 text-left w-8">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCommissions(commissions.filter(c => c.status === "pending").map(c => c.id));
                        } else {
                          setSelectedCommissions([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left">Order</th>
                  <th className="p-3 text-left">Worker</th>
                  <th className="p-3 text-right">Order Total</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Komisi</th>
                  <th className="p-3 text-right">Bonus</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Period</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-400">Belum ada komisi. Klik Generate untuk membuat dari order completed.</td></tr>
                ) : commissions.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-3">
                      {c.status === "pending" && (
                        <input
                          type="checkbox"
                          checked={selectedCommissions.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCommissions([...selectedCommissions, c.id]);
                            } else {
                              setSelectedCommissions(selectedCommissions.filter(id => id !== c.id));
                            }
                          }}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs">{c.order_code}</td>
                    <td className="p-3">{c.staff_users?.name || "—"}</td>
                    <td className="p-3 text-right">{formatRupiah(c.order_total)}</td>
                    <td className="p-3 text-right">{(c.commission_rate * 100).toFixed(0)}%</td>
                    <td className="p-3 text-right">{formatRupiah(c.commission_amount)}</td>
                    <td className="p-3 text-right">{c.bonus_amount > 0 ? formatRupiah(c.bonus_amount) : "—"}</td>
                    <td className="p-3 text-right font-semibold">{formatRupiah(c.total_amount)}</td>
                    <td className="p-3 text-center">{statusBadge(c.status)}</td>
                    <td className="p-3 text-xs text-gray-500">{c.period_start} ~ {c.period_end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ SALARIES ============ */}
      {subTab === "salaries" && (
        <div className="space-y-6">
          {/* Salary Configs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Konfigurasi Gaji</h3>
              <button
                onClick={() => setShowSalaryForm(!showSalaryForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" /> Set Gaji
              </button>
            </div>

            {showSalaryForm && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Staff</label>
                    <select
                      value={salaryForm.staffId}
                      onChange={(e) => setSalaryForm({ ...salaryForm, staffId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <option value="">Pilih staff...</option>
                      {staffList.filter(s => s.role !== "worker").map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gaji Pokok</label>
                    <input
                      type="number"
                      value={salaryForm.baseSalary || ""}
                      onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 2000000"
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Catatan</label>
                    <input
                      type="text"
                      value={salaryForm.notes}
                      onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                      placeholder="Opsional"
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={saveSalaryConfig} disabled={actionLoading} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                  <button onClick={() => setShowSalaryForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">Batal</button>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3 text-left">Nama</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-right">Gaji Pokok</th>
                    <th className="p-3 text-left">Berlaku Sejak</th>
                    <th className="p-3 text-left">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryConfigs.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Belum ada konfigurasi gaji</td></tr>
                  ) : salaryConfigs.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="p-3 font-medium">{c.staff_users?.name || "—"}</td>
                      <td className="p-3">{c.staff_users?.role || "—"}</td>
                      <td className="p-3 text-right font-semibold">{formatRupiah(c.base_salary)}</td>
                      <td className="p-3 text-sm">{c.effective_from}</td>
                      <td className="p-3 text-sm text-gray-500">{c.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Salary Records */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Record Gaji Bulan Ini</h3>
              <button
                onClick={generateSalaries}
                disabled={actionLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" /> Generate
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3 text-left w-8">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSalaryRecords(salaryRecords.filter(s => s.status === "pending").map(s => s.id));
                          } else {
                            setSelectedSalaryRecords([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left">Nama</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-right">Gaji Pokok</th>
                    <th className="p-3 text-right">Tunjangan</th>
                    <th className="p-3 text-right">Potongan</th>
                    <th className="p-3 text-right">Bonus</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryRecords.length === 0 ? (
                    <tr><td colSpan={9} className="p-8 text-center text-gray-400">Belum ada record. Klik Generate.</td></tr>
                  ) : salaryRecords.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="p-3">
                        {r.status === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedSalaryRecords.includes(r.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSalaryRecords([...selectedSalaryRecords, r.id]);
                              } else {
                                setSelectedSalaryRecords(selectedSalaryRecords.filter(id => id !== r.id));
                              }
                            }}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="p-3 font-medium">{r.staff_users?.name || "—"}</td>
                      <td className="p-3">{r.staff_users?.role || "—"}</td>
                      <td className="p-3 text-right">{formatRupiah(r.base_salary)}</td>
                      <td className="p-3 text-right">{r.allowances_total > 0 ? formatRupiah(r.allowances_total) : "—"}</td>
                      <td className="p-3 text-right text-red-500">{r.deductions > 0 ? `-${formatRupiah(r.deductions)}` : "—"}</td>
                      <td className="p-3 text-right text-green-500">{r.bonus_amount > 0 ? `+${formatRupiah(r.bonus_amount)}` : "—"}</td>
                      <td className="p-3 text-right font-semibold">{formatRupiah(r.total_amount)}</td>
                      <td className="p-3 text-center">{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(selectedSalaryRecords.length > 0 || selectedCommissions.length > 0) && (
              <div className="mt-3">
                <button
                  onClick={() => setShowPayoutForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Payout ({selectedCommissions.length + selectedSalaryRecords.length} items)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ PAYOUTS ============ */}
      {subTab === "payouts" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["all", "draft", "pending_approval", "approved", "paid"].map((s) => (
              <button
                key={s}
                onClick={() => setPayoutStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm ${payoutStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
              >
                {s === "all" ? "Semua" : s.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {payouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border border-gray-200 dark:border-gray-700">
                Belum ada payout. Pilih komisi/gaji lalu create payout.
              </div>
            ) : payouts.map((p) => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{p.payout_code}</span>
                      {statusBadge(p.status)}
                      <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{p.type}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {p.period_label} · {p.total_items} items · Created by {p.created_by}
                    </div>
                    {p.approved_by && <div className="text-xs text-gray-400 mt-0.5">Approved by {p.approved_by} at {new Date(p.approved_at!).toLocaleString("id-ID")}</div>}
                    {p.paid_at && <div className="text-xs text-green-500 mt-0.5">Paid at {new Date(p.paid_at).toLocaleString("id-ID")} by {p.paid_by}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{formatRupiah(p.total_amount)}</div>
                    <div className="flex gap-2 mt-2">
                      {p.status === "pending_approval" && (
                        <button onClick={() => updatePayoutStatus(p.id, "approve")} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {p.status === "approved" && (
                        <button onClick={() => updatePayoutStatus(p.id, "mark_paid")} className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs">
                          <DollarSign className="w-3 h-3" /> Mark Paid
                        </button>
                      )}
                      {p.status !== "paid" && p.status !== "cancelled" && (
                        <button onClick={() => updatePayoutStatus(p.id, "cancel")} className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs">
                          <Ban className="w-3 h-3" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ SETTINGS ============ */}
      {subTab === "settings" && (
        <div className="space-y-6">
          {/* Commission Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" /> Pengaturan Komisi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Worker Rate (%)</label>
                <input
                  type="number"
                  min={10} max={90} step={5}
                  value={(settings.commission?.worker_rate ?? 0.6) * 100}
                  onChange={(e) => {
                    const rate = parseInt(e.target.value) / 100;
                    setSettings({
                      ...settings,
                      commission: {
                        ...settings.commission!,
                        worker_rate: rate,
                        company_rate: parseFloat((1 - rate).toFixed(2)),
                      },
                    });
                  }}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Worker: {((settings.commission?.worker_rate ?? 0.6) * 100).toFixed(0)}% | ETNYX: {((settings.commission?.company_rate ?? 0.4) * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dihitung dari</label>
                <select
                  value={settings.commission?.base_on || "total_price"}
                  onChange={(e) => setSettings({ ...settings, commission: { ...settings.commission!, base_on: e.target.value } })}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                >
                  <option value="total_price">Total Price (termasuk express/premium)</option>
                  <option value="base_price">Base Price (sebelum surcharge)</option>
                </select>
              </div>
            </div>

            {/* Bonus Tiers */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Bonus Performance</h4>
              <div className="space-y-2">
                {(settings.commission?.bonus_tiers || []).map((tier, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                    <span className="font-medium">{tier.name}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-600 font-medium">
                      {tier.bonus_rate ? `+${(tier.bonus_rate * 100).toFixed(0)}%` : `+${formatRupiah(tier.bonus_amount || 0)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveSettings("commission", settings.commission)}
              disabled={actionLoading}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan Komisi
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2">Alur Payroll</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">Order Completed</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">Auto Commission</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">Create Payout</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">Pending Approval</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">Approved</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Paid ✓</span>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              <p>• <strong>Worker:</strong> Komisi per order ({((settings.commission?.worker_rate ?? 0.6) * 100).toFixed(0)}%) — payout setiap 2 minggu (tgl 1 & 16)</p>
              <p>• <strong>Staff (Lead/Admin):</strong> Gaji bulanan — payout tgl 28</p>
              <p>• Komisi otomatis dibuat saat order di-complete</p>
            </div>
          </div>
        </div>
      )}

      {/* ============ PAYOUT CREATION MODAL ============ */}
      {showPayoutForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Payout Batch</h3>
            <div className="space-y-3 text-sm">
              {selectedCommissions.length > 0 && (
                <div className="flex justify-between">
                  <span>Komisi ({selectedCommissions.length} items)</span>
                  <span className="font-semibold">
                    {formatRupiah(commissions.filter(c => selectedCommissions.includes(c.id)).reduce((s, c) => s + c.total_amount, 0))}
                  </span>
                </div>
              )}
              {selectedSalaryRecords.length > 0 && (
                <div className="flex justify-between">
                  <span>Gaji ({selectedSalaryRecords.length} items)</span>
                  <span className="font-semibold">
                    {formatRupiah(salaryRecords.filter(s => selectedSalaryRecords.includes(s.id)).reduce((sum, s) => sum + s.total_amount, 0))}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {formatRupiah(
                    commissions.filter(c => selectedCommissions.includes(c.id)).reduce((s, c) => s + c.total_amount, 0) +
                    salaryRecords.filter(s => selectedSalaryRecords.includes(s.id)).reduce((sum, s) => sum + s.total_amount, 0)
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={createPayout}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Submit for Approval
              </button>
              <button
                onClick={() => setShowPayoutForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
