"use client";

import { toast, toastSuccess, toastError } from "@/components/ToastProvider";
import { useEffect, useState, useCallback } from "react";
import {
  DollarSign, CheckCircle, Loader2, RefreshCw,
  Plus, ArrowRight, Ban, Receipt, Wallet, TrendingUp, Calendar,
  Save, CreditCard, Building2, Banknote,
  Smartphone, Trash2, Star,
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
  payment_method: string | null;
  payment_method_label: string | null;
  payment_reference: string | null;
  recipient_info: { name?: string; method?: string; account?: string } | null;
  notes: string | null;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  type: string;
}

interface PaymentAccount {
  id: string;
  staff_id: string;
  method: string;
  label: string;
  account_name: string;
  account_number: string;
  is_primary: boolean;
  staff_users?: { name: string; email: string; role: string };
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
  payment_methods?: PaymentMethod[];
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

  // Payment
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null); // payout ID
  const [paymentForm, setPaymentForm] = useState({ method: "", methodLabel: "", reference: "", accountId: "" });
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({ staffId: "", method: "", label: "", accountName: "", accountNumber: "", isPrimary: false });

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

  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payroll/payment-accounts");
      const data = await res.json();
      setPaymentAccounts(data.accounts || []);
    } catch (err) {
      console.error("Fetch payment accounts error:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchStaff(), fetchPaymentAccounts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOverview, fetchStaff, fetchPaymentAccounts]);

  useEffect(() => {
    if (subTab === "commissions") fetchCommissions();
    if (subTab === "salaries") { fetchSalaryConfigs(); fetchSalaryRecords(); }
    if (subTab === "payouts") { fetchPayouts(); fetchPaymentAccounts(); }
    if (subTab === "settings") { fetchSettings(); fetchPaymentAccounts(); }
  }, [subTab, fetchCommissions, fetchSalaryConfigs, fetchSalaryRecords, fetchPayouts, fetchSettings, fetchPaymentAccounts]);

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
      toast(data.message || `Generated ${data.generated} commissions`);
      fetchCommissions();
      fetchOverview();
    } catch {
      toastError("Gagal generate komisi");
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
      toast(data.message || `Generated ${data.generated} salary records`);
      fetchSalaryRecords();
    } catch {
      toastError("Gagal generate gaji");
    }
    setActionLoading(false);
  };

  const saveSalaryConfig = async () => {
    if (!salaryForm.staffId || salaryForm.baseSalary <= 0) return toast("Isi data lengkap");
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
      toastError("Gagal simpan gaji");
    }
    setActionLoading(false);
  };

  const createPayout = async () => {
    if (selectedCommissions.length === 0 && selectedSalaryRecords.length === 0) {
      return toast("Pilih minimal 1 item");
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
      toastSuccess("Payout created!");
    } catch {
      toastError("Gagal buat payout");
    }
    setActionLoading(false);
  };

  const updatePayoutStatus = async (payoutId: string, action: string, paymentData?: {
    paymentMethod?: string; paymentMethodLabel?: string; paymentReference?: string;
    recipientAccountId?: string; recipientInfo?: Record<string, string>;
  }) => {
    if (action !== "mark_paid" && !confirm(`${action} payout ini?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payroll/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payoutId, action, ...paymentData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      setShowPaymentModal(null);
      setPaymentForm({ method: "", methodLabel: "", reference: "", accountId: "" });
      fetchPayouts();
      fetchOverview();
    } catch (err) {
      toast(`Gagal ${action} payout: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    setActionLoading(false);
  };

  const markPaidWithDetails = async () => {
    if (!showPaymentModal || !paymentForm.method) {
      return toast("Pilih metode pembayaran");
    }
    const selectedAccount = paymentAccounts.find(a => a.id === paymentForm.accountId);
    await updatePayoutStatus(showPaymentModal, "mark_paid", {
      paymentMethod: paymentForm.method,
      paymentMethodLabel: paymentForm.methodLabel,
      paymentReference: paymentForm.reference || undefined,
      recipientAccountId: paymentForm.accountId || undefined,
      recipientInfo: selectedAccount ? {
        name: selectedAccount.account_name,
        method: selectedAccount.label,
        account: selectedAccount.account_number,
      } : undefined,
    });
  };

  const savePaymentAccount = async () => {
    if (!accountForm.staffId || !accountForm.method || !accountForm.accountName || !accountForm.accountNumber) {
      return toast("Isi semua field");
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payroll/payment-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: accountForm.staffId,
          method: accountForm.method,
          label: accountForm.label,
          accountName: accountForm.accountName,
          accountNumber: accountForm.accountNumber,
          isPrimary: accountForm.isPrimary,
        }),
      });
      if (!res.ok) throw new Error();
      setShowAddAccountForm(false);
      setAccountForm({ staffId: "", method: "", label: "", accountName: "", accountNumber: "", isPrimary: false });
      fetchPaymentAccounts();
    } catch {
      toastError("Gagal simpan akun pembayaran");
    }
    setActionLoading(false);
  };

  const deletePaymentAccount = async (accountId: string) => {
    if (!confirm("Hapus akun pembayaran ini?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payroll/payment-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accountId, action: "deactivate" }),
      });
      if (!res.ok) throw new Error();
      fetchPaymentAccounts();
    } catch {
      toastError("Gagal hapus akun");
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
      toastSuccess("Saved!");
    } catch {
      toastError("Gagal simpan");
    }
    setActionLoading(false);
  };

  // ---- Helpers ----
  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-400",
      pending_approval: "bg-orange-500/10 text-orange-400",
      approved: "bg-accent/10 text-accent",
      paid: "bg-green-500/10 text-green-400",
      cancelled: "bg-red-500/10 text-red-400",
      draft: "bg-white/10 text-text-muted border border-white/10",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>{status.replace("_", " ")}</span>;
  };

  const paymentMethodIcon = (type?: string) => {
    if (type === "bank") return <Building2 className="w-4 h-4" />;
    if (type === "cash") return <Banknote className="w-4 h-4" />;
    return <Smartphone className="w-4 h-4" />;
  };

  const availablePaymentMethods: PaymentMethod[] = settings.payment_methods || [
    { id: "dana", label: "Dana", icon: "wallet", type: "ewallet" },
    { id: "ovo", label: "OVO", icon: "wallet", type: "ewallet" },
    { id: "gopay", label: "GoPay", icon: "wallet", type: "ewallet" },
    { id: "shopeepay", label: "ShopeePay", icon: "wallet", type: "ewallet" },
    { id: "bank_bca", label: "BCA", icon: "building", type: "bank" },
    { id: "bank_bri", label: "BRI", icon: "building", type: "bank" },
    { id: "bank_mandiri", label: "Mandiri", icon: "building", type: "bank" },
    { id: "bank_bni", label: "BNI", icon: "building", type: "bank" },
    { id: "bank_jago", label: "Bank Jago", icon: "building", type: "bank" },
    { id: "bank_seabank", label: "SeaBank", icon: "building", type: "bank" },
    { id: "cash", label: "Cash", icon: "banknote", type: "cash" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6 text-text">
      {/* Sub-tabs — surface tokens so text always matches dashboard theme */}
      <div className="flex gap-1 bg-background rounded-lg p-1 border border-white/10 overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              subTab === tab.id
                ? "bg-surface text-accent border border-accent/30 shadow-sm"
                : "text-text-muted hover:text-text hover:bg-white/5"
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
            <div className="bg-surface rounded-xl p-4 border border-white/10">
              <div className="text-sm text-text-muted">Komisi Pending</div>
              <div className="text-xl font-bold mt-1 text-text tabular-nums">{formatRupiah(overview.pendingCommissions)}</div>
              <div className="text-xs text-text-muted mt-1">{overview.pendingCommissionCount} items</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-white/10">
              <div className="text-sm text-text-muted">Komisi Bulan Ini</div>
              <div className="text-xl font-bold mt-1 text-text tabular-nums">{formatRupiah(overview.monthCommissionTotal)}</div>
              <div className="text-xs text-success mt-1">{formatRupiah(overview.monthCommissionPaid)} paid</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-white/10">
              <div className="text-sm text-text-muted">Payout Pending</div>
              <div className="text-xl font-bold mt-1 text-text tabular-nums">{formatRupiah(overview.pendingPayouts)}</div>
              <div className="text-xs text-text-muted mt-1">{overview.pendingPayoutCount} batches</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-white/10">
              <div className="text-sm text-text-muted">Total Dibayar Bulan Ini</div>
              <div className="text-xl font-bold mt-1 text-success tabular-nums">{formatRupiah(overview.totalPaidThisMonth)}</div>
              <div className="text-xs text-text-muted mt-1">{overview.activeStaffWithSalary} staff aktif</div>
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
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${commissionStatus === s ? "gradient-primary text-white shadow-md shadow-accent/20" : "bg-background border border-white/10 text-text-muted hover:text-text"}`}
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

          <div className="bg-surface rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-3 text-left w-8 text-text-muted font-medium">
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
                  <th className="p-3 text-left text-text-muted font-medium">Order</th>
                  <th className="p-3 text-left text-text-muted font-medium">Worker</th>
                  <th className="p-3 text-right text-text-muted font-medium">Order Total</th>
                  <th className="p-3 text-right text-text-muted font-medium">Rate</th>
                  <th className="p-3 text-right text-text-muted font-medium">Komisi</th>
                  <th className="p-3 text-right text-text-muted font-medium">Bonus</th>
                  <th className="p-3 text-right text-text-muted font-medium">Total</th>
                  <th className="p-3 text-center text-text-muted font-medium">Status</th>
                  <th className="p-3 text-left text-text-muted font-medium">Period</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-text-muted">Belum ada komisi. Klik Generate untuk membuat dari order completed.</td></tr>
                ) : commissions.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
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
                    <td className="p-3 text-xs text-text-muted">{c.period_start} ~ {c.period_end}</td>
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
              <h3 className="text-lg font-semibold text-text">Konfigurasi Gaji</h3>
              <button
                onClick={() => setShowSalaryForm(!showSalaryForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" /> Set Gaji
              </button>
            </div>

            {showSalaryForm && (
              <div className="bg-accent/5 rounded-xl p-4 mb-4 border border-accent/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Staff</label>
                    <select
                      value={salaryForm.staffId}
                      onChange={(e) => setSalaryForm({ ...salaryForm, staffId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
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
                      className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Catatan</label>
                    <input
                      type="text"
                      value={salaryForm.notes}
                      onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                      placeholder="Opsional"
                      className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={saveSalaryConfig} disabled={actionLoading} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                  <button onClick={() => setShowSalaryForm(false)} className="px-4 py-2 bg-white/10 text-text rounded-lg text-sm hover:bg-white/15">Batal</button>
                </div>
              </div>
            )}

            <div className="bg-surface rounded-xl border border-white/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-3 text-left text-text-muted font-medium">Nama</th>
                    <th className="p-3 text-left text-text-muted font-medium">Role</th>
                    <th className="p-3 text-right text-text-muted font-medium">Gaji Pokok</th>
                    <th className="p-3 text-left text-text-muted font-medium">Berlaku Sejak</th>
                    <th className="p-3 text-left text-text-muted font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryConfigs.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-text-muted">Belum ada konfigurasi gaji</td></tr>
                  ) : salaryConfigs.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-3 font-medium">{c.staff_users?.name || "—"}</td>
                      <td className="p-3">{c.staff_users?.role || "—"}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">{formatRupiah(c.base_salary)}</td>
                      <td className="p-3 text-sm">{c.effective_from}</td>
                      <td className="p-3 text-sm text-text-muted">{c.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Salary Records */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text">Record Gaji Bulan Ini</h3>
              <button
                onClick={generateSalaries}
                disabled={actionLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" /> Generate
              </button>
            </div>

            <div className="bg-surface rounded-xl border border-white/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-3 text-left w-8 text-text-muted font-medium">
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
                    <th className="p-3 text-left text-text-muted font-medium">Nama</th>
                    <th className="p-3 text-left text-text-muted font-medium">Role</th>
                    <th className="p-3 text-right text-text-muted font-medium">Gaji Pokok</th>
                    <th className="p-3 text-right text-text-muted font-medium">Tunjangan</th>
                    <th className="p-3 text-right text-text-muted font-medium">Potongan</th>
                    <th className="p-3 text-right text-text-muted font-medium">Bonus</th>
                    <th className="p-3 text-right text-text-muted font-medium">Total</th>
                    <th className="p-3 text-center text-text-muted font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryRecords.length === 0 ? (
                    <tr><td colSpan={9} className="p-8 text-center text-text-muted">Belum ada record. Klik Generate.</td></tr>
                  ) : salaryRecords.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
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
                      <td className="p-3 text-right text-error">{r.deductions > 0 ? `-${formatRupiah(r.deductions)}` : "—"}</td>
                      <td className="p-3 text-right text-success">{r.bonus_amount > 0 ? `+${formatRupiah(r.bonus_amount)}` : "—"}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">{formatRupiah(r.total_amount)}</td>
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
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${payoutStatus === s ? "gradient-primary text-white shadow-md shadow-accent/20" : "bg-background border border-white/10 text-text-muted hover:text-text"}`}
              >
                {s === "all" ? "Semua" : s.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {payouts.length === 0 ? (
              <div className="bg-surface rounded-xl p-8 text-center text-text-muted border border-white/10">
                Belum ada payout. Pilih komisi/gaji lalu create payout.
              </div>
            ) : payouts.map((p) => (
              <div key={p.id} className="bg-surface rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-text">{p.payout_code}</span>
                      {statusBadge(p.status)}
                      <span className="text-xs text-text-muted px-2 py-0.5 bg-white/5 rounded border border-white/10">{p.type}</span>
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      {p.period_label} · {p.total_items} items · Created by {p.created_by}
                    </div>
                    {p.approved_by && <div className="text-xs text-text-muted mt-0.5">Approved by {p.approved_by} at {new Date(p.approved_at!).toLocaleString("id-ID")}</div>}
                    {p.paid_at && (
                      <div className="text-xs text-success mt-0.5">
                        Paid at {new Date(p.paid_at).toLocaleString("id-ID")} by {p.paid_by}
                        {p.payment_method_label && <span className="ml-1">via <strong>{p.payment_method_label}</strong></span>}
                        {p.payment_reference && <span className="ml-1">(Ref: {p.payment_reference})</span>}
                      </div>
                    )}
                    {p.recipient_info && (
                      <div className="text-xs text-text-muted mt-0.5">
                        Ke: {p.recipient_info.name} — {p.recipient_info.method} {p.recipient_info.account}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-text tabular-nums">{formatRupiah(p.total_amount)}</div>
                    <div className="flex gap-2 mt-2">
                      {p.status === "pending_approval" && (
                        <button onClick={() => updatePayoutStatus(p.id, "approve")} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {p.status === "approved" && (
                        <button onClick={() => {
                          setShowPaymentModal(p.id);
                          setPaymentForm({ method: "", methodLabel: "", reference: "", accountId: "" });
                        }} className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs">
                          <CreditCard className="w-3 h-3" /> Bayar Manual
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
          <div className="bg-surface rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-text"><Receipt className="w-5 h-5" /> Pengaturan Komisi</h3>
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
                  className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
                />
                <p className="text-xs text-text-muted mt-1">
                  Worker: {((settings.commission?.worker_rate ?? 0.6) * 100).toFixed(0)}% | ETNYX: {((settings.commission?.company_rate ?? 0.4) * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dihitung dari</label>
                <select
                  value={settings.commission?.base_on || "total_price"}
                  onChange={(e) => setSettings({ ...settings, commission: { ...settings.commission!, base_on: e.target.value } })}
                  className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
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
                  <div key={i} className="flex items-center gap-3 text-sm bg-white/5 rounded-lg p-2 border border-white/5">
                    <span className="font-medium text-text">{tier.name}</span>
                    <span className="text-text-muted">→</span>
                    <span className="text-success font-medium">
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
          <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
            <h4 className="font-semibold mb-2 text-text">Alur Payroll</h4>
            <div className="flex items-center gap-2 text-sm text-text-muted flex-wrap">
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-text">Order Completed</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-text">Auto Commission</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-text">Create Payout</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded">Pending Approval</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-accent/10 text-accent px-2 py-1 rounded">Approved</span>
              <ArrowRight className="w-4 h-4" />
              <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded flex items-center gap-1"><CreditCard className="w-3 h-3" /> Transfer Manual <CheckCircle className="w-3 h-3" /></span>
            </div>
            <div className="mt-3 text-sm text-text-muted">
              <p>• <strong>Worker:</strong> Komisi per order ({((settings.commission?.worker_rate ?? 0.6) * 100).toFixed(0)}%) — payout setiap 2 minggu (tgl 1 & 16)</p>
              <p>• <strong>Staff (Lead/Admin):</strong> Gaji bulanan — payout tgl 28</p>
              <p>• Komisi otomatis dibuat saat order di-complete</p>
              <p>• <strong>Pembayaran manual:</strong> Transfer via Dana, OVO, ShopeePay, Bank Transfer, dll</p>
            </div>
          </div>

          {/* Payment Accounts Management */}
          <div className="bg-surface rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-text"><CreditCard className="w-5 h-5" /> Akun Pembayaran Staff</h3>
              <button
                onClick={() => setShowAddAccountForm(!showAddAccountForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Akun
              </button>
            </div>

            {showAddAccountForm && (
              <div className="bg-accent/5 rounded-xl p-4 mb-4 border border-accent/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Staff</label>
                    <select
                      value={accountForm.staffId}
                      onChange={(e) => setAccountForm({ ...accountForm, staffId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
                    >
                      <option value="">Pilih staff...</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Metode</label>
                    <select
                      value={accountForm.method}
                      onChange={(e) => {
                        const m = availablePaymentMethods.find(pm => pm.id === e.target.value);
                        setAccountForm({ ...accountForm, method: e.target.value, label: m?.label || "" });
                      }}
                      className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
                    >
                      <option value="">Pilih metode...</option>
                      {availablePaymentMethods.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Pemilik</label>
                    <input
                      type="text"
                      value={accountForm.accountName}
                      onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                      placeholder="Nama di rekening/e-wallet"
                      className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nomor Akun / HP</label>
                    <input
                      type="text"
                      value={accountForm.accountNumber}
                      onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                      placeholder="e.g. 081234567890"
                      className="w-full p-2 rounded-lg border border-white/10 bg-background text-text text-sm"
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={accountForm.isPrimary}
                        onChange={(e) => setAccountForm({ ...accountForm, isPrimary: e.target.checked })}
                        className="rounded"
                      />
                      Utama
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={savePaymentAccount} disabled={actionLoading} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                  <button onClick={() => setShowAddAccountForm(false)} className="px-4 py-2 bg-white/10 text-text rounded-lg text-sm hover:bg-white/15">Batal</button>
                </div>
              </div>
            )}

            {paymentAccounts.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">Belum ada akun pembayaran. Tambahkan agar bisa transfer manual.</p>
            ) : (
              <div className="space-y-2">
                {/* Group by staff */}
                {staffList.map((staff) => {
                  const accounts = paymentAccounts.filter(a => a.staff_id === staff.id);
                  if (accounts.length === 0) return null;
                  return (
                    <div key={staff.id} className="border border-white/10 rounded-lg p-3 bg-white/[0.02]">
                      <div className="font-medium text-sm mb-2 text-text">{staff.name} <span className="text-xs text-text-muted">({staff.role})</span></div>
                      <div className="flex flex-wrap gap-2">
                        {accounts.map((acc) => (
                          <div key={acc.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm border border-white/5">
                            {paymentMethodIcon(availablePaymentMethods.find(m => m.id === acc.method)?.type)}
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {acc.label}
                                {acc.is_primary && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                              </div>
                              <div className="text-xs text-text-muted">{acc.account_name} · {acc.account_number}</div>
                            </div>
                            <button onClick={() => deletePaymentAccount(acc.id)} className="ml-2 text-red-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ PAYOUT CREATION MODAL ============ */}
      {showPayoutForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full border border-white/10 text-text">
            <h3 className="text-lg font-semibold mb-4 text-text">Create Payout Batch</h3>
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
                className="px-4 py-2 bg-white/10 text-text rounded-lg text-sm hover:bg-white/15"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ PAYMENT MODAL (Mark Paid) ============ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 text-text">
            <h3 className="text-lg font-semibold mb-1 text-text">Pembayaran Manual</h3>
            <p className="text-sm text-text-muted mb-4">
              Payout: <strong>{payouts.find(p => p.id === showPaymentModal)?.payout_code}</strong> — {formatRupiah(payouts.find(p => p.id === showPaymentModal)?.total_amount || 0)}
            </p>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Metode Pembayaran *</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availablePaymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentForm({ ...paymentForm, method: m.id, methodLabel: m.label })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs transition-colors ${
                      paymentForm.method === m.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/10 hover:border-white/20 text-text"
                    }`}
                  >
                    {paymentMethodIcon(m.type)}
                    <span className="font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Account */}
            {(() => {
              // Find payout items' staff IDs to show relevant accounts
              const relevantAccounts = paymentAccounts.filter(a =>
                paymentForm.method ? a.method === paymentForm.method : true
              );
              if (relevantAccounts.length > 0) {
                return (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Akun Penerima</label>
                    <div className="space-y-2">
                      {relevantAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setPaymentForm({ ...paymentForm, accountId: acc.id })}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                            paymentForm.accountId === acc.id
                              ? "border-accent bg-accent/10"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          {paymentMethodIcon(availablePaymentMethods.find(m => m.id === acc.method)?.type)}
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-1">
                              {acc.staff_users?.name || "Staff"}
                              <span className="text-xs text-text-muted">— {acc.label}</span>
                              {acc.is_primary && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="text-xs text-text-muted">{acc.account_name} · {acc.account_number}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Reference Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">No. Referensi / ID Transaksi</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="Opsional — No. transaksi dari app/bank"
                className="w-full p-2.5 rounded-lg border border-white/10 bg-background text-text text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={markPaidWithDetails}
                disabled={actionLoading || !paymentForm.method}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50 font-medium"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Konfirmasi Sudah Dibayar
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(null);
                  setPaymentForm({ method: "", methodLabel: "", reference: "", accountId: "" });
                }}
                className="px-4 py-2.5 bg-white/10 text-text rounded-lg text-sm hover:bg-white/15"
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
