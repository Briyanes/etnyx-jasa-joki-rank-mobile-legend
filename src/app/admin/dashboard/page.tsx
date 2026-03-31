"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/utils/helpers";
import dynamic from "next/dynamic";

// Dynamic import for charts (client-side only)
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });

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

type TabType = "overview" | "orders" | "boosters" | "testimonials" | "portfolio" | "promo" | "customers" | "settings";

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

  const fetchChartData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chart-data");
      const data = await res.json();
      setChartData(data.chartData || []);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    }
  }, []);

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/testimonials");
      const data = await res.json();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
    }
  }, []);

  const fetchPortfolios = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/portfolio");
      const data = await res.json();
      setPortfolios(data.portfolios || []);
    } catch (error) {
      console.error("Failed to fetch portfolios:", error);
    }
  }, []);

  const fetchPromoCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo-codes");
      const data = await res.json();
      setPromoCodes(data.promoCodes || []);
    } catch (error) {
      console.error("Failed to fetch promo codes:", error);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  }, []);

  const fetchBoosters = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/boosters");
      const data = await res.json();
      setBoosters(data.boosters || []);
    } catch (error) {
      console.error("Failed to fetch boosters:", error);
    }
  }, []);

  const handleExport = async (type: string) => {
    window.open(`/api/admin/export?type=${type}`, "_blank");
  };

  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth();
      if (isAuth) {
        await Promise.all([fetchStats(), fetchOrders(), fetchChartData()]);
      }
      setLoading(false);
    };
    init();
  }, [checkAuth, fetchStats, fetchOrders, fetchChartData]);

  useEffect(() => {
    if (!loading) {
      if (activeTab === "orders") fetchOrders();
      else if (activeTab === "testimonials") fetchTestimonials();
      else if (activeTab === "portfolio") fetchPortfolios();
      else if (activeTab === "promo") fetchPromoCodes();
      else if (activeTab === "customers") fetchCustomers();
      else if (activeTab === "boosters") fetchBoosters();
    }
  }, [activeTab, statusFilter, loading, fetchOrders, fetchTestimonials, fetchPortfolios, fetchPromoCodes, fetchCustomers, fetchBoosters]);

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

  // CRUD Handlers
  const handleSaveTestimonial = async (data: Partial<Testimonial>) => {
    try {
      const method = editItem ? "PUT" : "POST";
      const body = editItem ? { ...data, id: editItem.id } : data;
      await fetch("/api/admin/testimonials", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchTestimonials();
      setShowModal(null);
      setEditItem(null);
    } catch (error) {
      console.error("Failed to save testimonial:", error);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Hapus testimonial ini?")) return;
    try {
      await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchTestimonials();
    } catch (error) {
      console.error("Failed to delete testimonial:", error);
    }
  };

  const handleSavePortfolio = async (data: Partial<Portfolio>) => {
    try {
      const method = editItem ? "PUT" : "POST";
      const body = editItem ? { ...data, id: editItem.id } : data;
      await fetch("/api/admin/portfolio", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchPortfolios();
      setShowModal(null);
      setEditItem(null);
    } catch (error) {
      console.error("Failed to save portfolio:", error);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm("Hapus portfolio ini?")) return;
    try {
      await fetch("/api/admin/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchPortfolios();
    } catch (error) {
      console.error("Failed to delete portfolio:", error);
    }
  };

  const handleSavePromoCode = async (data: Partial<PromoCode>) => {
    try {
      const method = editItem ? "PUT" : "POST";
      const body = editItem ? { ...data, id: editItem.id } : data;
      await fetch("/api/admin/promo-codes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchPromoCodes();
      setShowModal(null);
      setEditItem(null);
    } catch (error) {
      console.error("Failed to save promo code:", error);
    }
  };

  const handleDeletePromoCode = async (id: string) => {
    if (!confirm("Hapus promo code ini?")) return;
    try {
      await fetch("/api/admin/promo-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchPromoCodes();
    } catch (error) {
      console.error("Failed to delete promo code:", error);
    }
  };

  const handleSaveBooster = async (data: Partial<Booster>) => {
    try {
      const method = editItem ? "PUT" : "POST";
      const body = editItem ? { ...data, id: editItem.id } : data;
      await fetch("/api/admin/boosters", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchBoosters();
      setShowModal(null);
      setEditItem(null);
    } catch (error) {
      console.error("Failed to save booster:", error);
    }
  };

  const handleDeleteBooster = async (id: string) => {
    if (!confirm("Hapus booster ini?")) return;
    try {
      await fetch("/api/admin/boosters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchBoosters();
    } catch (error) {
      console.error("Failed to delete booster:", error);
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
          <div className="flex gap-4 overflow-x-auto">
            {(["overview", "orders", "boosters", "testimonials", "portfolio", "promo", "customers", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tab === "promo" ? "Promo Codes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
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

            {/* Revenue Chart */}
            {chartData.length > 0 && (
              <div className="bg-surface rounded-2xl p-6 border border-white/5">
                <h3 className="font-semibold text-text mb-4">📈 Revenue Trend (Last 7 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                        labelStyle={{ color: "#f3f4f6" }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Orders Chart */}
            {chartData.length > 0 && (
              <div className="bg-surface rounded-2xl p-6 border border-white/5">
                <h3 className="font-semibold text-text mb-4">📊 Orders per Day</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                        labelStyle={{ color: "#f3f4f6" }}
                      />
                      <Bar dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
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

        {/* Boosters Tab */}
        {activeTab === "boosters" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text">Boosters ({boosters.length})</h2>
              <button
                onClick={() => { setEditItem(null); setShowModal("booster"); }}
                className="gradient-primary px-4 py-2 rounded-xl text-white text-sm font-medium"
              >
                + Add Booster
              </button>
            </div>
            <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Name</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">WhatsApp</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Specialization</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Orders</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Rating</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Status</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boosters.map((b) => (
                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-text font-medium">{b.name}</td>
                      <td className="px-4 py-3 text-text-muted text-sm">{b.whatsapp}</td>
                      <td className="px-4 py-3 text-accent text-sm">{b.rank_specialization}</td>
                      <td className="px-4 py-3 text-text font-medium">{b.total_orders}</td>
                      <td className="px-4 py-3 text-yellow-400">{"⭐".repeat(Math.round(b.rating || 5))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${b.is_available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {b.is_available ? "Available" : "Busy"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setEditItem(b); setShowModal("booster"); }} className="text-accent text-sm mr-2">Edit</button>
                        <button onClick={() => handleDeleteBooster(b.id)} className="text-red-400 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold text-text mb-4">📥 Export Data (CSV)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button onClick={() => handleExport("orders")} className="px-4 py-2 bg-background border border-white/10 rounded-xl text-text text-sm hover:bg-white/5">Export Orders</button>
                <button onClick={() => handleExport("customers")} className="px-4 py-2 bg-background border border-white/10 rounded-xl text-text text-sm hover:bg-white/5">Export Customers</button>
                <button onClick={() => handleExport("boosters")} className="px-4 py-2 bg-background border border-white/10 rounded-xl text-text text-sm hover:bg-white/5">Export Boosters</button>
                <button onClick={() => handleExport("testimonials")} className="px-4 py-2 bg-background border border-white/10 rounded-xl text-text text-sm hover:bg-white/5">Export Testimonials</button>
                <button onClick={() => handleExport("promo_codes")} className="px-4 py-2 bg-background border border-white/10 rounded-xl text-text text-sm hover:bg-white/5">Export Promo Codes</button>
              </div>
            </div>

            <button className="gradient-primary px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity">
              Save Settings
            </button>
          </div>
        )}

        {/* Testimonials Tab */}
        {activeTab === "testimonials" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text">Testimonials</h2>
              <button
                onClick={() => { setEditItem(null); setShowModal("testimonial"); }}
                className="gradient-primary px-4 py-2 rounded-xl text-white text-sm font-medium"
              >
                + Add Testimonial
              </button>
            </div>
            <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Name</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Rank</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Rating</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Comment</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Status</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-text">{t.name}</td>
                      <td className="px-4 py-3 text-text text-sm">{t.rank_from} → {t.rank_to}</td>
                      <td className="px-4 py-3 text-yellow-400">{"⭐".repeat(t.rating)}</td>
                      <td className="px-4 py-3 text-text-muted text-sm max-w-xs truncate">{t.comment}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${t.is_visible ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {t.is_visible ? "Visible" : "Hidden"}
                        </span>
                        {t.is_featured && <span className="ml-1 px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">Featured</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setEditItem(t); setShowModal("testimonial"); }} className="text-accent text-sm mr-2">Edit</button>
                        <button onClick={() => handleDeleteTestimonial(t.id)} className="text-red-400 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text">Portfolio</h2>
              <button
                onClick={() => { setEditItem(null); setShowModal("portfolio"); }}
                className="gradient-primary px-4 py-2 rounded-xl text-white text-sm font-medium"
              >
                + Add Portfolio
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((p) => (
                <div key={p.id} className="bg-surface rounded-2xl p-4 border border-white/5">
                  <h3 className="font-semibold text-text mb-2">{p.title}</h3>
                  <p className="text-sm text-accent mb-2">{p.rank_from} → {p.rank_to}</p>
                  <p className="text-text-muted text-sm mb-4">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs ${p.is_visible ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {p.is_visible ? "Visible" : "Hidden"}
                    </span>
                    <div>
                      <button onClick={() => { setEditItem(p); setShowModal("portfolio"); }} className="text-accent text-sm mr-2">Edit</button>
                      <button onClick={() => handleDeletePortfolio(p.id)} className="text-red-400 text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo Codes Tab */}
        {activeTab === "promo" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text">Promo Codes</h2>
              <button
                onClick={() => { setEditItem(null); setShowModal("promo"); }}
                className="gradient-primary px-4 py-2 rounded-xl text-white text-sm font-medium"
              >
                + Add Promo Code
              </button>
            </div>
            <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Code</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Discount</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Usage</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Expires</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Status</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-accent font-medium">{p.code}</td>
                      <td className="px-4 py-3 text-text">
                        {p.discount_type === "percentage" ? `${p.discount_value}%` : formatRupiah(p.discount_value)}
                        {p.max_discount && <span className="text-text-muted text-xs ml-1">(max {formatRupiah(p.max_discount)})</span>}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {p.used_count}/{p.max_uses || "∞"}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-sm">
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString("id-ID") : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${p.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setEditItem(p); setShowModal("promo"); }} className="text-accent text-sm mr-2">Edit</button>
                        <button onClick={() => handleDeletePromoCode(p.id)} className="text-red-400 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-text">Customers ({customers.length})</h2>
            <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Name</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Email</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">WhatsApp</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Orders</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Total Spent</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Referral Code</th>
                    <th className="text-left text-text-muted text-sm font-medium px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-text font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-text-muted text-sm">{c.email}</td>
                      <td className="px-4 py-3 text-text-muted text-sm">{c.whatsapp || "-"}</td>
                      <td className="px-4 py-3 text-accent font-medium">{c.total_orders}</td>
                      <td className="px-4 py-3 text-text">{formatRupiah(c.total_spent)}</td>
                      <td className="px-4 py-3 font-mono text-purple-400 text-sm">{c.referral_code}</td>
                      <td className="px-4 py-3 text-text-muted text-sm">{new Date(c.created_at).toLocaleDateString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal === "testimonial" && (
        <TestimonialModal
          item={editItem as Testimonial | null}
          onSave={handleSaveTestimonial}
          onClose={() => { setShowModal(null); setEditItem(null); }}
        />
      )}
      {showModal === "portfolio" && (
        <PortfolioModal
          item={editItem as Portfolio | null}
          onSave={handleSavePortfolio}
          onClose={() => { setShowModal(null); setEditItem(null); }}
        />
      )}
      {showModal === "promo" && (
        <PromoModal
          item={editItem as PromoCode | null}
          onSave={handleSavePromoCode}
          onClose={() => { setShowModal(null); setEditItem(null); }}
        />
      )}
      {showModal === "booster" && (
        <BoosterModal
          item={editItem as Booster | null}
          onSave={handleSaveBooster}
          onClose={() => { setShowModal(null); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// Modal Components
function TestimonialModal({ item, onSave, onClose }: { item: Testimonial | null; onSave: (data: Partial<Testimonial>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    rank_from: item?.rank_from || "warrior",
    rank_to: item?.rank_to || "mythic",
    rating: item?.rating || 5,
    comment: item?.comment || "",
    is_featured: item?.is_featured || false,
    is_visible: item?.is_visible ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-text mb-4">{item ? "Edit" : "Add"} Testimonial</h3>
        <div className="space-y-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.rank_from} onChange={(e) => setForm({ ...form, rank_from: e.target.value })} className="bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
              {["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicglory"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={form.rank_to} onChange={(e) => setForm({ ...form, rank_to: e.target.value })} className="bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
              {["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicglory"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
          </select>
          <textarea placeholder="Comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text h-24" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-text">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-text">
              <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} />
              Visible
            </label>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 rounded-xl text-text-muted">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 gradient-primary px-4 py-2 rounded-xl text-white font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function PortfolioModal({ item, onSave, onClose }: { item: Portfolio | null; onSave: (data: Partial<Portfolio>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    rank_from: item?.rank_from || "epic",
    rank_to: item?.rank_to || "mythic",
    description: item?.description || "",
    is_visible: item?.is_visible ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-text mb-4">{item ? "Edit" : "Add"} Portfolio</h3>
        <div className="space-y-4">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.rank_from} onChange={(e) => setForm({ ...form, rank_from: e.target.value })} className="bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
              {["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={form.rank_to} onChange={(e) => setForm({ ...form, rank_to: e.target.value })} className="bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
              {["elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicglory"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <textarea placeholder="Description (e.g., Completed in 3 days with 78% winrate)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text h-24" />
          <label className="flex items-center gap-2 text-text">
            <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} />
            Visible
          </label>
        </div>
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 rounded-xl text-text-muted">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 gradient-primary px-4 py-2 rounded-xl text-white font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function PromoModal({ item, onSave, onClose }: { item: PromoCode | null; onSave: (data: Partial<PromoCode>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: item?.code || "",
    discount_type: item?.discount_type || "percentage" as "percentage" | "fixed",
    discount_value: item?.discount_value || 10,
    max_discount: item?.max_discount || null as number | null,
    max_uses: item?.max_uses || null as number | null,
    is_active: item?.is_active ?? true,
    expires_at: item?.expires_at ? item.expires_at.split("T")[0] : "",
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-text mb-4">{item ? "Edit" : "Add"} Promo Code</h3>
        <div className="space-y-4">
          <input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text font-mono" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })} className="bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (Rp)</option>
            </select>
            <input type="number" placeholder="Value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseInt(e.target.value) || 0 })} className="bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          </div>
          {form.discount_type === "percentage" && (
            <input type="number" placeholder="Max Discount (Rp)" value={form.max_discount || ""} onChange={(e) => setForm({ ...form, max_discount: parseInt(e.target.value) || null })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          )}
          <input type="number" placeholder="Max Uses (empty = unlimited)" value={form.max_uses || ""} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || null })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          <label className="flex items-center gap-2 text-text">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </div>
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 rounded-xl text-text-muted">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 gradient-primary px-4 py-2 rounded-xl text-white font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function BoosterModal({ item, onSave, onClose }: { item: Booster | null; onSave: (data: Partial<Booster>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    whatsapp: item?.whatsapp || "",
    rank_specialization: item?.rank_specialization || "Mythic",
    is_available: item?.is_available ?? true,
    rating: item?.rating || 5,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-text mb-4">{item ? "Edit" : "Add"} Booster</h3>
        <div className="space-y-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          <input placeholder="WhatsApp (628xxx)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text" />
          <select value={form.rank_specialization} onChange={(e) => setForm({ ...form, rank_specialization: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
            <option value="Epic - Legend">Epic - Legend</option>
            <option value="Legend - Mythic">Legend - Mythic</option>
            <option value="Mythic">Mythic</option>
            <option value="Mythic Glory">Mythic Glory</option>
            <option value="All Ranks">All Ranks</option>
          </select>
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text">
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
          </select>
          <label className="flex items-center gap-2 text-text">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Available
          </label>
        </div>
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 rounded-xl text-text-muted">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 gradient-primary px-4 py-2 rounded-xl text-white font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}
