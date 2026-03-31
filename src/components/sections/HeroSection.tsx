"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="pt-28 pb-16 px-4 min-h-screen flex items-center">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 text-sm">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-accent font-medium">100+ Order Minggu Ini</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-text">
                Push Rank,
                <br />
                <span className="gradient-text">Tanpa Main.</span>
              </h1>
              <p className="text-text-muted text-lg sm:text-xl max-w-lg">
                Platform joki ML tercepat. Hitung harga, order, selesai. Semua
                dalam hitungan detik.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#calculator"
                className="gradient-primary px-8 py-4 rounded-2xl text-white font-bold text-lg text-center hover:opacity-90 transition-opacity glow-accent"
              >
                Hitung Harga Sekarang
              </Link>
              <Link
                href="#pricing"
                className="border border-white/10 px-8 py-4 rounded-2xl font-semibold text-center text-text hover:bg-white/5 transition-colors"
              >
                Lihat Paket
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-text">3K+</p>
                <p className="text-text-muted text-sm">Order Selesai</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text">99%</p>
                <p className="text-text-muted text-sm">Sukses Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text">24/7</p>
                <p className="text-text-muted text-sm">Support</p>
              </div>
            </div>
          </div>

          {/* Right - Dashboard Preview Card */}
          <div className="lg:pl-8">
            <div className="bg-surface rounded-3xl p-6 border border-white/5 glow-primary relative">
              {/* Live Badge */}
              <div className="absolute -top-3 -right-3 bg-success/20 border border-success/30 text-success px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                LIVE
              </div>

              {/* User Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-text">GamerPro_ID</p>
                    <p className="text-sm text-text-muted">ID: 892847192</p>
                  </div>
                </div>
                <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-semibold">
                  PREMIUM
                </span>
              </div>

              {/* Rank Progress */}
              <div className="bg-background/50 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-2">Rank Awal</p>
                    <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl font-bold text-sm">
                      Legend V
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-[2px] bg-gradient-to-r from-yellow-400 to-primary" />
                      <span className="text-accent text-lg">→</span>
                      <div className="w-8 h-[2px] bg-gradient-to-r from-primary to-accent" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-2">Target</p>
                    <div className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-xl font-bold text-sm">
                      Mythic
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Progress</span>
                  <span className="text-accent font-bold">78%</span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full w-[78%] gradient-primary rounded-full relative"
                    style={{
                      boxShadow: "0 0 20px rgba(45, 212, 191, 0.5)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm text-text-muted bg-background/30 rounded-xl px-4 py-3">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                Sedang push di Legend II... Win streak 5 🔥
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
