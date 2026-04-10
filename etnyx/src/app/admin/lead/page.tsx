"use client";

import { toast, toastError } from "@/components/ToastProvider";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingCart, Users, LogOut, RefreshCw, Filter, Search,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, UserPlus, Clock, CheckCircle, XCircle,
  AlertCircle, Loader2, Package, TrendingUp, Eye, MessageSquare,
  Send, RotateCcw, CheckSquare, Square, Star, Trophy, Swords, Target, Timer, Camera,
  Gamepad2, Flame, Zap,
} from "lucide-react";

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
  current_progress_rank: string | null;
  created_at: string;
  updated_at: string;
  assigned_worker_id: string | null;
  assigned_lead_id: string | null;
  whatsapp: string | null;
  customer_email: string | null;
  hero_request: string | null;
  login_method: string | null;
  order_assignments?: {
    id: string;
    assigned_to: string;
    status: string;
    assigned_at: string;
    notes: string | null;
    staff_users: { id: string; name: string; role: string } | null;
  }[];
}

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Note {
  id: string;
  action: string;
  new_value: string;
  notes: string;
  created_by: string;
  created_at: string;
}

interface Submission {
  id: string;
  stars_gained: number;
  mvp_count: number;
  savage_count: number;
  maniac_count: number;
  matches_played: number;
  win_count: number;
  duration_minutes: number;
  screenshots: string[];
  submitted_at: string;
  staff_users: { id: string; name: string } | null;
}

const RANK_LABELS: Record<string, string> = {
  warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster",
  epic: "Epic", legend: "Legend", mythic: "Mythic", mythicgrading: "Mythic Grading",
  mythichonor: "Mythic Honor", mythicglory: "Mythic Glory", mythicimmortal: "Mythic Immortal",
};

const STAR_LABELS: Record<number, string> = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
function rankWithStar(rank: string, star?: number | null): string {
  const label = RANK_LABELS[rank] || rank;
  if (star && STAR_LABELS[star]) return `${label} ${STAR_LABELS[star]}`;
  return label;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  confirmed: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-500/10" },
  in_progress: { label: "In Progress", color: "text-accent", bg: "bg-accent/10" },
  completed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10" },
};

export default function LeadDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Bulk assign
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkWorker, setBulkWorker] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Notes
  const [notesOrder, setNotesOrder] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteSending, setNoteSending] = useState(false);

  // Submissions
  const [submissionsOrder, setSubmissionsOrder] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/auth");
      if (!res.ok) { router.push("/admin"); return null; }
      const data = await res.json();
      if (data.user.role !== "lead" && data.user.role !== "admin") {
        router.push("/admin"); return null;
      }
      return data.user;
    } catch { router.push("/admin"); return null; }
  }, [router]);

  // Debounced search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const url = `/api/staff/orders${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) { console.error(e); }
  }, [statusFilter, debouncedSearch]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/users");
      const data = await res.json();
      const active = (data.users || []).filter((u: Worker) => u.is_active);
      // Deduplicate by id (safety net for duplicate DB records)
      const seen = new Set<string>();
      setWorkers(active.filter((u: Worker) => { if (seen.has(u.id)) return false; seen.add(u.id); return true; }));
    } catch (e) { console.error(e); }
  }, []);

  const fetchNotes = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/staff/notes?orderId=${orderId}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch { setNotes([]); }
  }, []);

  const fetchSubmissions = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/staff/submissions?orderId=${orderId}`);
      const data = await res.json();
      setSubmissions(prev => ({ ...prev, [orderId]: data.submissions || [] }));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    (async () => {
      const user = await checkAuth();
      if (user) {
        setCurrentUser(user);
        await Promise.all([fetchOrders(), fetchWorkers()]);
      }
      setLoading(false);
    })();
  }, [checkAuth, fetchOrders, fetchWorkers]);

  useEffect(() => {
    if (!loading) fetchOrders();
  }, [statusFilter, debouncedSearch, loading, fetchOrders]);

  // Auto-refresh polling every 30 seconds
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      fetchOrders();
      fetchWorkers();
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, fetchOrders, fetchWorkers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchWorkers()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await fetch("/api/staff/auth", { method: "DELETE" });
    router.push("/admin");
  };

  const handleAssign = async (orderId: string) => {
    if (!selectedWorker) return;
    setAssignLoading(true);
    try {
      const res = await fetch("/api/staff/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, workerId: selectedWorker, notes: assignNotes }),
      });
      if (res.ok) {
        setAssigningOrder(null);
        setSelectedWorker("");
        setAssignNotes("");
        await fetchOrders();
      } else {
        const data = await res.json();
        toast(data.error || "Gagal assign order");
      }
    } catch { toastError("Network error"); }
    setAssignLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch("/api/staff/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) await fetchOrders();
      else {
        const data = await res.json();
        toast(data.error || "Gagal update status");
      }
    } catch { toastError("Network error"); }
    setUpdatingStatus(null);
  };

  const handleBulkAssign = async () => {
    if (!bulkWorker || selectedOrders.size === 0) return;
    setBulkLoading(true);
    let success = 0;
    for (const orderId of selectedOrders) {
      try {
        const res = await fetch("/api/staff/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, workerId: bulkWorker, notes: bulkNotes }),
        });
        if (res.ok) success++;
      } catch { /* continue */ }
    }
    toast(`${success}/${selectedOrders.size} order berhasil di-assign`);
    setSelectedOrders(new Set());
    setBulkAssigning(false);
    setBulkWorker("");
    setBulkNotes("");
    setBulkLoading(false);
    await fetchOrders();
  };

  const handleAddNote = async (orderId: string) => {
    if (!newNote.trim()) return;
    setNoteSending(true);
    try {
      const res = await fetch("/api/staff/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, message: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        await fetchNotes(orderId);
      }
    } catch { toastError("Gagal kirim catatan"); }
    setNoteSending(false);
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatPrice = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Stats
  const unassigned = orders.filter(o => !o.assigned_worker_id && o.status !== "cancelled" && o.status !== "completed");
  const inProgress = orders.filter(o => o.status === "in_progress");
  const completed = orders.filter(o => o.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Image src="/logo/circle-landscape.webp" alt="ETNYX" width={140} height={40} priority />
          <div className="mt-6 w-48 h-1.5 bg-surface rounded-full overflow-hidden mx-auto">
            <div className="h-full gradient-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
          <p className="text-text-muted text-sm mt-3">Loading Lead Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo/circle-landscape.webp" alt="ETNYX" width={120} height={35} />
            <span className="px-2 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-400 font-medium">LEAD</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-sm hidden sm:block">{currentUser?.name}</span>
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 text-text-muted hover:text-text transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleLogout} className="p-2 text-text-muted hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-1"><ShoppingCart className="w-4 h-4" /> Total Orders</div>
            <p className="text-2xl font-bold text-text">{orders.length}</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1"><AlertCircle className="w-4 h-4" /> Belum Assign</div>
            <p className="text-2xl font-bold text-yellow-400">{unassigned.length}</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-accent/20">
            <div className="flex items-center gap-2 text-accent text-sm mb-1"><TrendingUp className="w-4 h-4" /> In Progress</div>
            <p className="text-2xl font-bold text-accent">{inProgress.length}</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1"><CheckCircle className="w-4 h-4" /> Completed</div>
            <p className="text-2xl font-bold text-green-400">{completed.length}</p>
          </div>
        </div>

        {/* Workers Overview - Horizontal Slider */}
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <h2 className="text-text font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Tim Worker ({workers.length})</h2>
          <div className="relative group">
            <button
              onClick={() => {
                const el = document.getElementById('worker-slider');
                if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-white/10 flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-all opacity-0 group-hover:opacity-100 -ml-2 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div id="worker-slider" className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {workers.map(w => {
                const workerActive = orders.filter(o => o.assigned_worker_id === w.id && o.status === "in_progress").length;
                const workerCompleted = orders.filter(o => o.assigned_worker_id === w.id && o.status === "completed").length;
                return (
                  <div key={w.id} className="flex-shrink-0 w-[130px] bg-background rounded-lg p-3 border border-white/5 text-center">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-accent font-bold text-sm">{w.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="text-text text-sm font-medium truncate">{w.name}</p>
                    <p className="text-text-muted text-[10px] mt-1">{workerActive} aktif · {workerCompleted} selesai</p>
                    {w.last_login_at && (
                      <p className="text-text-muted text-[10px]">Login: {new Date(w.last_login_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</p>
                    )}
                  </div>
                );
              })}
              {workers.length === 0 && <p className="text-text-muted text-sm text-center py-4 w-full">Belum ada worker</p>}
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('worker-slider');
                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-white/10 flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-all opacity-0 group-hover:opacity-100 -mr-2 shadow-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Assign Bar */}
        {selectedOrders.size > 0 && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-accent text-sm font-medium">{selectedOrders.size} order dipilih</p>
            {!bulkAssigning ? (
              <div className="flex gap-2">
                <button onClick={() => setBulkAssigning(true)} className="px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90">
                  <UserPlus className="w-4 h-4 inline mr-1" /> Bulk Assign
                </button>
                <button onClick={() => setSelectedOrders(new Set())} className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-text-muted text-sm hover:text-text">
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <select value={bulkWorker} onChange={(e) => setBulkWorker(e.target.value)}
                  className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none">
                  <option value="">Pilih Worker...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input type="text" placeholder="Catatan..." value={bulkNotes} onChange={(e) => setBulkNotes(e.target.value)}
                  className="bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none flex-1 min-w-[150px]" />
                <button onClick={handleBulkAssign} disabled={!bulkWorker || bulkLoading}
                  className="px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Assign
                </button>
                <button onClick={() => { setBulkAssigning(false); setBulkWorker(""); setBulkNotes(""); }}
                  className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-text-muted text-sm">Batal</button>
              </div>
            )}
          </div>
        )}

        {/* Orders */}
        <div className="bg-surface rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-text font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Daftar Order</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-text text-sm focus:border-accent focus:outline-none">
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Cari order ID, username, game ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-text text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {orders.length === 0 && (
              <div className="p-8 text-center text-text-muted">Tidak ada order</div>
            )}
            {orders.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedOrder === order.id;
              const isAssigning = assigningOrder === order.id;
              const assignedWorker = order.order_assignments?.[0]?.staff_users;
              const canSelect = !order.assigned_worker_id && order.status !== "cancelled" && order.status !== "completed";

              return (
                <div key={order.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  {/* Order Row */}
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Checkbox for bulk select */}
                    {canSelect && (
                      <button onClick={(e) => { e.stopPropagation(); toggleSelectOrder(order.id); }} className="shrink-0 mt-1 sm:mt-0">
                        {selectedOrders.has(order.id)
                          ? <CheckSquare className="w-5 h-5 text-accent" />
                          : <Square className="w-5 h-5 text-text-muted hover:text-text" />}
                      </button>
                    )}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { 
                      const newExpanded = isExpanded ? null : order.id;
                      setExpandedOrder(newExpanded);
                      if (newExpanded && order.assigned_worker_id && !submissions[order.id]) fetchSubmissions(order.id);
                    }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-text font-mono text-sm font-medium">{order.order_id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        {order.is_express && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">Express</span>}
                        {order.is_premium && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">Premium</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-text-muted text-xs flex-wrap">
                        <span>{order.username}</span>
                        <span>•</span>
                        <span className="truncate">{order.current_rank === order.target_rank && order.package_title ? order.package_title : `${rankWithStar(order.current_rank, order.current_star)} → ${rankWithStar(order.target_rank, order.target_star)}`}</span>
                      </div>
                      {/* Price & date - shown inline on mobile */}
                      <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                        <span className="text-text text-xs font-medium">{formatPrice(order.total_price)}</span>
                        <span className="text-text-muted text-[10px]">{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-text text-sm font-medium">{formatPrice(order.total_price)}</p>
                      <p className="text-text-muted text-xs">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="shrink-0">
                      {assignedWorker ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center" title={assignedWorker.name}>
                          <span className="text-green-400 font-bold text-xs">{assignedWorker.name.charAt(0)}</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <button onClick={() => {
                      const newExpanded = isExpanded ? null : order.id;
                      setExpandedOrder(newExpanded);
                      if (newExpanded && order.assigned_worker_id && !submissions[order.id]) fetchSubmissions(order.id);
                    }} className="shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                      {/* Full Order Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-text-muted text-xs">Game ID</span>
                          <p className="text-text font-mono">{order.game_id}</p>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Username</span>
                          <p className="text-text">{order.username}</p>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Package</span>
                          <p className="text-text capitalize">{order.package}</p>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Login Method</span>
                          <p className="text-text capitalize">{order.login_method || "-"}</p>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Progress</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                              <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${order.progress || 0}%` }} />
                            </div>
                            <span className="text-text text-xs">{order.progress || 0}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Worker</span>
                          <p className="text-text">{assignedWorker?.name || <span className="text-yellow-400">Belum assign</span>}</p>
                        </div>
                        {order.hero_request && (
                          <div>
                            <span className="text-text-muted text-xs">Hero Request</span>
                            <p className="text-text">{order.hero_request}</p>
                          </div>
                        )}
                        {order.current_progress_rank && (
                          <div>
                            <span className="text-text-muted text-xs">Rank Sekarang</span>
                            <p className="text-text">{RANK_LABELS[order.current_progress_rank] || order.current_progress_rank}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex flex-wrap gap-2">
                        {/* Status Update */}
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-text text-xs focus:border-accent focus:outline-none disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Reopen completed order */}
                        {order.status === "completed" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "in_progress")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/20 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reopen
                          </button>
                        )}

                        {/* Notes */}
                        <button
                          onClick={() => { setNotesOrder(notesOrder === order.id ? null : order.id); if (notesOrder !== order.id) fetchNotes(order.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs hover:bg-blue-500/20 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Catatan
                        </button>

                        {/* Submissions */}
                        {order.assigned_worker_id && (
                          <button
                            onClick={() => { setSubmissionsOrder(submissionsOrder === order.id ? null : order.id); if (submissionsOrder !== order.id) fetchSubmissions(order.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs hover:bg-purple-500/20 transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" /> Hasil ({submissions[order.id]?.length || 0})
                          </button>
                        )}

                        {/* WhatsApp */}
                        {order.whatsapp && (
                          <a href={`https://wa.me/${order.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs hover:bg-green-500/20 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        )}
                      </div>

                      {/* Assign / Reassign */}
                      {((!assignedWorker && order.status !== "cancelled") || assignedWorker) && (
                        <div>
                          {!isAssigning ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setAssigningOrder(order.id); setSelectedWorker(order.assigned_worker_id || ""); }}
                              className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              <UserPlus className="w-4 h-4" /> {assignedWorker ? "Reassign Worker" : "Assign Worker"}
                            </button>
                          ) : (
                            <div className="bg-background rounded-lg p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                              <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none">
                                <option value="">Pilih Worker...</option>
                                {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({orders.filter(o => o.assigned_worker_id === w.id && o.status === "in_progress").length} aktif)</option>)}
                              </select>
                              <input type="text" placeholder="Catatan (opsional)..." value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                              <div className="flex gap-2">
                                <button onClick={() => handleAssign(order.id)} disabled={!selectedWorker || assignLoading}
                                  className="px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                                  {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Assign
                                </button>
                                <button onClick={() => { setAssigningOrder(null); setSelectedWorker(""); setAssignNotes(""); }}
                                  className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-text-muted text-sm hover:text-text transition-colors">Batal</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes Panel */}
                      {notesOrder === order.id && (
                        <div className="bg-background rounded-lg p-4 space-y-3">
                          <h4 className="text-text font-medium text-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-400" /> Catatan & Log Order
                          </h4>
                          {/* Add Note */}
                          <div className="flex gap-2">
                            <input type="text" placeholder="Tulis catatan..." value={newNote} onChange={(e) => setNewNote(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(order.id); }}
                              className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                            <button onClick={() => handleAddNote(order.id)} disabled={noteSending || !newNote.trim()}
                              className="px-3 py-2 gradient-primary rounded-lg text-white text-sm disabled:opacity-50 flex items-center gap-1">
                              {noteSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                          </div>
                          {/* Notes List */}
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {notes.length === 0 && <p className="text-text-muted text-xs text-center py-2">Belum ada catatan</p>}
                            {notes.map(n => (
                              <div key={n.id} className="bg-surface rounded-lg p-2.5 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-text font-medium">{n.created_by}</span>
                                  <span className="text-text-muted">{new Date(n.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <p className="text-text-muted">{n.action === "note" ? n.new_value : `[${n.action}] ${n.new_value}`}</p>
                                {n.notes && n.action !== "note" && <p className="text-text-muted text-[10px] mt-0.5">{n.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submissions Panel */}
                      {submissionsOrder === order.id && (
                        <div className="bg-background rounded-lg p-4 space-y-3">
                          <h4 className="text-text font-medium text-sm flex items-center gap-2">
                            <Camera className="w-4 h-4 text-purple-400" /> Hasil Boosting Worker
                          </h4>
                          {!submissions[order.id] || submissions[order.id].length === 0 ? (
                            <p className="text-text-muted text-xs text-center py-2">Belum ada hasil submit</p>
                          ) : (
                            <>
                              {/* Aggregate Stats */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { label: "Match", value: submissions[order.id].reduce((s, x) => s + x.matches_played, 0), icon: Swords },
                                  { label: "Win", value: submissions[order.id].reduce((s, x) => s + x.win_count, 0), icon: Trophy },
                                  { label: "Bintang", value: submissions[order.id].reduce((s, x) => s + x.stars_gained, 0), icon: Star },
                                  { label: "Menit", value: submissions[order.id].reduce((s, x) => s + x.duration_minutes, 0), icon: Timer },
                                ].map(({ label, value, icon: Icon }) => (
                                  <div key={label} className="bg-surface rounded-lg p-2 text-center">
                                    <Icon className="w-3.5 h-3.5 text-accent mx-auto mb-1" />
                                    <div className="text-text font-bold text-sm">{value}</div>
                                    <div className="text-text-muted text-[10px]">{label}</div>
                                  </div>
                                ))}
                              </div>
                              {/* Winrate */}
                              {(() => {
                                const totalMatches = submissions[order.id].reduce((s, x) => s + x.matches_played, 0);
                                const totalWins = submissions[order.id].reduce((s, x) => s + x.win_count, 0);
                                const wr = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : "0";
                                return (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Target className="w-3.5 h-3.5 text-accent" />
                                    <span className="text-text-muted">Winrate:</span>
                                    <span className={`font-bold ${Number(wr) >= 70 ? "text-green-400" : Number(wr) >= 50 ? "text-yellow-400" : "text-red-400"}`}>{wr}%</span>
                                    <span className="text-text-muted">({totalWins}/{totalMatches})</span>
                                  </div>
                                );
                              })()}
                              {/* Per-session list */}
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {submissions[order.id].map((sub, idx) => (
                                  <div key={sub.id} className="bg-surface rounded-lg p-2.5 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-text font-medium">Sesi {idx + 1}</span>
                                      <span className="text-text-muted">{new Date(sub.submitted_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-text-muted">
                                      <span><Star className="w-3 h-3 inline mr-0.5" />{sub.stars_gained} bintang</span>
                                      <span><Gamepad2 className="w-3 h-3 inline mr-0.5" />{sub.matches_played} match</span>
                                      <span><CheckCircle className="w-3 h-3 inline mr-0.5" />{sub.win_count} win</span>
                                      <span><Timer className="w-3 h-3 inline mr-0.5" />{sub.duration_minutes} menit</span>
                                      {sub.mvp_count > 0 && <span><Trophy className="w-3 h-3 inline mr-0.5" />{sub.mvp_count} MVP</span>}
                                      {sub.savage_count > 0 && <span><Flame className="w-3 h-3 inline mr-0.5" />{sub.savage_count} Savage</span>}
                                      {sub.maniac_count > 0 && <span><Zap className="w-3 h-3 inline mr-0.5" />{sub.maniac_count} Maniac</span>}
                                    </div>
                                    {sub.screenshots && sub.screenshots.length > 0 && (
                                      <div className="flex gap-1 mt-1.5 overflow-x-auto">
                                        {sub.screenshots.map((ss, si) => (
                                          <a key={si} href={ss} target="_blank" rel="noopener noreferrer"
                                            className="flex-shrink-0 w-16 h-16 rounded border border-white/10 overflow-hidden hover:border-accent transition-colors">
                                            <img src={ss} alt={`Screenshot ${si + 1}`} className="w-full h-full object-cover" />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Assignment Info */}
                      {order.order_assignments && order.order_assignments.length > 0 && (
                        <div className="text-xs text-text-muted">
                          {order.order_assignments.map((a, i) => (
                            <span key={i}>
                              Assigned ke <span className="text-text">{a.staff_users?.name || "?"}</span>
                              {" "}pada {formatDate(a.assigned_at)}
                              {a.notes && <> — <span className="italic">{a.notes}</span></>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
