"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/utils/helpers";

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
  is_express: boolean;
  is_premium: boolean;
  total_price: number;
  status: string;
  progress: number;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "settings">("overview");
  const [statusFilter, setStatusFilter] = useState("all");

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth");
      if (!res.ok) {
        router.push("/admin");
        return false;
      }
      return true;
    } catch {
      router.push("/admin");
      return false;
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, [statusFilter]);

  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth();
      if (isAuth) {
        await Promise.all([fetchStats(), fetchOrders()]);
      }
      setLoading(false);
    };
    init();
  }, [checkAuth, fetchStats, fetchOrders]);

  useEffect(() => {
    if (!loading) {
      fetchOrders();
    }
  }, [statusFilter, loading, fetchOrders]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      confirmed: "bg-blue-500/20 text-blue-400",
      in_progress: "bg-purple-500/20 text-purple-400",
      completed: "bg-green-500/20 text-green-400",
      cancelled: "bg-red-500/20 text-red-400",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-surface border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-bold text-white">
              E
            </div>
            <div>
              <h1 className="font-bold text-lg text-text">ETNYX Admin</h1>
              <p className="text-xs text-text-muted">Dashboard Panel</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-muted hover:text-red-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-surface/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {(["overview", "orders", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface rounded-2xl p-5 border border-white/5">
                <p className="text-text-muted text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-text">{stats.total_orders}</p>
              </div>
              <div className="bg-surface rounded-2xl p-5 border border-white/5">
                <p className="text-text-muted text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold gradient-text">{formatRupiah(stats.total_revenue)}</p>
              </div>
              <div className="bg-surface rounded-2xl p-5 border border-white/5">
                <p className="text-text-muted text-sm mb-1">Orders Today</p>
                <p className="text-3xl font-bold text-accent">{stats.orders_today}</p>
              </div>
              <div className="bg-surface rounded-2xl p-5 border border-white/5">
                <p className="text-text-muted text-sm mb-1">Pending Revenue</p>
                <p className="text-2xl font-bold text-yellow-400">{formatRupiah(stats.pending_revenue)}</p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold text-text mb-4">Order Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-yellow-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending_orders}</p>
                  <p className="text-sm text-text-muted">Pending</p>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-blue-400">{stats.confirmed_orders}</p>
                  <p className="text-sm text-text-muted">Confirmed</p>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-purple-400">{stats.in_progress_orders}</p>
                  <p className="text-sm text-text-muted">In Progress</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-green-400">{stats.completed_orders}</p>
                  <p className="text-sm text-text-muted">Completed</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-red-400">{stats.cancelled_orders}</p>
                  <p className="text-sm text-text-muted">Cancelled</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-surface rounded-2xl p-6 border border-white/5">
                <h3 className="font-semibold text-text mb-4">This Week</h3>
                <p className="text-4xl font-bold gradient-text">{stats.orders_this_week}</p>
                <p className="text-text-muted text-sm mt-1">orders received</p>
              </div>
              <div className="bg-surface rounded-2xl p-6 border border-white/5">
                <h3 className="font-semibold text-text mb-4">This Month</h3>
                <p className="text-4xl font-bold gradient-text">{stats.orders_this_month}</p>
                <p className="text-text-muted text-sm mt-1">orders received</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "gradient-primary text-white"
                      : "bg-surface text-text-muted hover:text-text"
                  }`}
                >
                  {status === "all" ? "All" : getStatusLabel(status)}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Order ID</th>
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Customer</th>
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Rank</th>
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Package</th>
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Price</th>
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Status</th>
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Progress</th>
                      <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-muted">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">
                            <span className="font-mono text-accent text-sm">{order.order_id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-text text-sm font-medium">{order.username}</p>
                            <p className="text-text-muted text-xs">ID: {order.game_id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-text">
                              {order.current_rank} → {order.target_rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-text">{order.package}</span>
                            {order.is_express && (
                              <span className="ml-1 text-xs text-yellow-400">⚡</span>
                            )}
                            {order.is_premium && (
                              <span className="ml-1 text-xs text-purple-400">👑</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-text">
                              {formatRupiah(order.total_price)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-20">
                              <div className="h-2 bg-background rounded-full overflow-hidden">
                                <div
                                  className="h-full gradient-primary rounded-full"
                                  style={{ width: `${order.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-text-muted">{order.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="bg-background border border-white/10 rounded-lg px-2 py-1 text-xs text-text focus:outline-none focus:border-accent"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold text-text mb-4">WhatsApp Settings</h3>
              <div>
                <label className="block text-sm text-text-muted mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  defaultValue="6281414131321"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold text-text mb-4">Admin Credentials</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="admin@etnyx.com"
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button className="gradient-primary px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity">
              Save Settings
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
