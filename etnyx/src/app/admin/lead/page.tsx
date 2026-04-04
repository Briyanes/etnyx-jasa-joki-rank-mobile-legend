"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingCart, Users, LogOut, RefreshCw, Filter, 
  ChevronDown, ChevronUp, UserPlus, Clock, CheckCircle,
  AlertCircle, Loader2, Package, TrendingUp, Eye,
} from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  username: string;
  game_id: string;
  current_rank: string;
  target_rank: string;
  package: string;
  is_express: boolean;
  is_premium: boolean;
  total_price: number;
  status: string;
  progress: number;
  current_progress_rank: string | null;
  created_at: string;
  assigned_worker_id: string | null;
  assigned_lead_id: string | null;
  whatsapp: string | null;
  order_assignments?: {
    id: string;
    assigned_to: string;
    status: string;
    assigned_at: string;
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

const RANK_LABELS: Record<string, string> = {
  warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster",
  epic: "Epic", legend: "Legend", mythic: "Mythic", mythicgrading: "Mythic Grading",
  mythichonor: "Mythic Honor", mythicglory: "Mythic Glory", mythicimmortal: "Mythic Immortal",
};

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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchOrders = useCallback(async () => {
    try {
      const url = statusFilter === "all" ? "/api/staff/orders" : `/api/staff/orders?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) { console.error(e); }
  }, [statusFilter]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/users");
      const data = await res.json();
      setWorkers((data.users || []).filter((u: Worker) => u.is_active));
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
  }, [statusFilter, loading, fetchOrders]);

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
        alert(data.error || "Gagal assign order");
      }
    } catch { alert("Network error"); }
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

        {/* Workers Overview */}
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <h2 className="text-text font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Tim Worker ({workers.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {workers.map(w => {
              const workerOrders = orders.filter(o => o.assigned_worker_id === w.id && o.status === "in_progress");
              return (
                <div key={w.id} className="bg-background rounded-lg p-3 border border-white/5 text-center">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-accent font-bold text-sm">{w.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-text text-sm font-medium truncate">{w.name}</p>
                  <p className="text-text-muted text-xs mt-1">{workerOrders.length} aktif</p>
                </div>
              );
            })}
            {workers.length === 0 && <p className="text-text-muted text-sm col-span-full text-center py-4">Belum ada worker</p>}
          </div>
        </div>

        {/* Orders */}
        <div className="bg-surface rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-text font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Daftar Order</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-text text-sm focus:border-accent focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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

              return (
                <div key={order.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  {/* Order Row */}
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-text font-mono text-sm font-medium">{order.order_id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        {order.is_express && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">Express</span>}
                        {order.is_premium && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">Premium</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-text-muted text-xs">
                        <span>{order.username}</span>
                        <span>•</span>
                        <span>{RANK_LABELS[order.current_rank] || order.current_rank} → {RANK_LABELS[order.target_rank] || order.target_rank}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
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
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-text-muted text-xs">Game ID</span>
                          <p className="text-text">{order.game_id}</p>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Package</span>
                          <p className="text-text capitalize">{order.package}</p>
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
                      </div>

                      {/* Assign Button */}
                      {!assignedWorker && order.status !== "cancelled" && (
                        <div>
                          {!isAssigning ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setAssigningOrder(order.id); }}
                              className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              <UserPlus className="w-4 h-4" /> Assign Worker
                            </button>
                          ) : (
                            <div className="bg-background rounded-lg p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={selectedWorker}
                                onChange={(e) => setSelectedWorker(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
                              >
                                <option value="">Pilih Worker...</option>
                                {workers.map(w => (
                                  <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder="Catatan (opsional)..."
                                value={assignNotes}
                                onChange={(e) => setAssignNotes(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAssign(order.id)}
                                  disabled={!selectedWorker}
                                  className="px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => { setAssigningOrder(null); setSelectedWorker(""); setAssignNotes(""); }}
                                  className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-text-muted text-sm hover:text-text transition-colors"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* View order details link */}
                      {order.whatsapp && (
                        <a
                          href={`https://wa.me/${order.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> WhatsApp Customer
                        </a>
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
