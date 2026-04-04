"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      // Redirect based on role
      switch (data.user.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "lead":
          router.push("/admin/lead");
          break;
        case "worker":
          router.push("/admin/worker");
          break;
        default:
          router.push("/admin/dashboard");
      }
    } catch {
      setError("Network error. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo/circle-landscape.webp"
              alt="ETNYX Logo"
              width={180}
              height={50}
              priority
            />
          </div>
          <h1 className="text-xl font-semibold text-text">Staff Portal</h1>
          <p className="text-text-muted text-sm mt-1">Login untuk mengakses dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-text-muted mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none transition-colors"
                placeholder="email@etnyx.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-text-muted mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 pr-12 text-text focus:border-accent focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-5 h-5" /> Login</>
              )}
            </button>
          </form>
        </div>

        {/* Role info */}
        <div className="mt-6 bg-surface/50 rounded-xl p-4 border border-white/5">
          <p className="text-text-muted text-xs text-center mb-2">Akses berdasarkan role:</p>
          <div className="flex justify-center gap-4 text-xs">
            <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400">Admin</span>
            <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400">Lead</span>
            <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400">Worker</span>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-4">
          <a href="/" className="text-text-muted hover:text-accent text-sm transition-colors">
            ← Kembali ke Website
          </a>
        </div>
      </div>
    </div>
  );
}
