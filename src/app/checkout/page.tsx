"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculatePrice, formatRupiah, isValidRankProgression } from "@/utils/helpers";
import { rankOptions } from "@/lib/constants";
import type { RankTier } from "@/types";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentRank, setCurrentRank] = useState<RankTier>(
    (searchParams.get("current_rank") as RankTier) || "epic"
  );
  const [targetRank, setTargetRank] = useState<RankTier>(
    (searchParams.get("target_rank") as RankTier) || "mythic"
  );
  const [isExpress, setIsExpress] = useState(searchParams.get("express") === "1");
  const [isPremium, setIsPremium] = useState(searchParams.get("premium") === "1");

  const [username, setUsername] = useState("");
  const [gameId, setGameId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState(searchParams.get("promo") || "");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const basePrice = calculatePrice(currentRank, targetRank, isExpress, isPremium);
  const totalPrice = Math.max(0, basePrice - promoDiscount);
  const isValid = isValidRankProgression(currentRank, targetRank);

  const applyPromo = useCallback(async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, orderAmount: basePrice }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoDiscount(data.calculatedDiscount);
        setPromoApplied(true);
        setPromoMessage(`✓ Hemat ${formatRupiah(data.calculatedDiscount)}`);
      } else {
        // Coba referral code
        const refRes = await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoCode }),
        });
        const refData = await refRes.json();
        if (refData.valid) {
          const disc = Math.round(basePrice * refData.discount / 100);
          setPromoDiscount(disc);
          setPromoApplied(true);
          setPromoMessage(`✓ Referral! Hemat ${formatRupiah(disc)}`);
        } else {
          setPromoMessage("Kode tidak valid");
        }
      }
    } catch {
      setPromoMessage("Gagal memvalidasi kode");
    }
  }, [promoCode, basePrice]);

  // Auto-apply promo if passed from calculator
  useEffect(() => {
    const promo = searchParams.get("promo");
    if (promo) applyPromo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !gameId) {
      setError("Username dan Game ID wajib diisi");
      return;
    }
    if (!isValid) {
      setError("Target rank harus lebih tinggi dari rank sekarang");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Buat order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          game_id: gameId,
          whatsapp: whatsapp || undefined,
          email: email || undefined,
          current_rank: currentRank,
          target_rank: targetRank,
          is_express: isExpress,
          is_premium: isPremium,
          promo_code: promoApplied ? promoCode : undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Gagal membuat order");
        return;
      }

      const { order_id } = orderData;

      // 2. Init pembayaran Moota
      const payRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order_id }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.error || "Gagal inisialisasi pembayaran");
        return;
      }

      // 3. Redirect ke halaman instruksi transfer
      router.push(`/payment/transfer?order_id=${order_id}`);
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-primary inline-block mb-6">
            ETNYX
          </Link>
          <h1 className="text-3xl font-bold text-text">Checkout Order</h1>
          <p className="text-text-muted mt-2">Isi detail order kamu di bawah ini</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rank Selection */}
          <div className="bg-surface rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-text mb-4">🏆 Detail Rank</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Rank Sekarang</label>
                <select
                  value={currentRank}
                  onChange={(e) => setCurrentRank(e.target.value as RankTier)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                >
                  {rankOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Target Rank</label>
                <select
                  value={targetRank}
                  onChange={(e) => setTargetRank(e.target.value as RankTier)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                >
                  {rankOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add-ons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-sm text-text">⚡ Express <span className="text-accent">(+20%)</span></span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-sm text-text">👑 Premium Booster <span className="text-accent">(+30%)</span></span>
              </label>
            </div>

            {!isValid && (
              <p className="text-red-400 text-sm mt-3">Target rank harus lebih tinggi dari rank sekarang</p>
            )}
          </div>

          {/* Info Akun ML */}
          <div className="bg-surface rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-text mb-4">🎮 Info Akun ML</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Username ML <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: ProPlayer123"
                  required
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Game ID ML <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Contoh: 123456789"
                  required
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Info Kontak */}
          <div className="bg-surface rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-text mb-4">📱 Info Kontak (opsional)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 628123456789"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: kamu@email.com"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-surface rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-text mb-4">🎁 Kode Promo / Referral</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode"
                disabled={promoApplied}
                className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none disabled:opacity-50"
              />
              {promoApplied ? (
                <button
                  type="button"
                  onClick={() => { setPromoApplied(false); setPromoDiscount(0); setPromoMessage(""); setPromoCode(""); }}
                  className="px-5 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  Hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={!promoCode.trim()}
                  className="px-5 py-3 bg-accent/20 text-accent rounded-xl hover:bg-accent/30 transition-colors disabled:opacity-50"
                >
                  Pakai
                </button>
              )}
            </div>
            {promoMessage && (
              <p className={`mt-2 text-sm ${promoApplied ? "text-green-400" : "text-red-400"}`}>{promoMessage}</p>
            )}
          </div>

          {/* Ringkasan Harga */}
          <div className="bg-surface rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-text mb-4">💰 Ringkasan Harga</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Harga dasar</span>
                <span>{formatRupiah(basePrice)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Diskon promo</span>
                  <span>- {formatRupiah(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-text font-bold text-base pt-2 border-t border-white/10">
                <span>Total Transfer</span>
                <span className="gradient-text">{formatRupiah(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isValid || !username || !gameId}
            className="w-full gradient-primary py-4 rounded-2xl text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </span>
            ) : (
              "Lanjut ke Pembayaran →"
            )}
          </button>

          <p className="text-center text-text-muted text-sm">
            Dengan menekan tombol di atas, kamu setuju dengan{" "}
            <Link href="/" className="text-accent hover:underline">syarat & ketentuan</Link> kami.
          </p>
        </form>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
