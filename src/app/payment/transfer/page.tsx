"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/utils/helpers";

const BANK_NAMES: Record<string, string> = {
  bca: "Bank BCA",
  bca_giro: "Bank BCA (Giro)",
  bca_snap: "Bank BCA (SNAP)",
  bca_syariah: "Bank BCA Syariah",
  bni: "Bank BNI",
  bni_syariah: "Bank BNI Syariah",
  bri: "Bank BRI",
  bri_syariah: "Bank BRI Syariah",
  mandiri: "Bank Mandiri",
  mandiri_syariah: "Bank Mandiri Syariah",
  muamalat: "Bank Muamalat",
  sandbox: "Bank Transfer (Sandbox)",
};

interface PaymentInfo {
  status: string;
  payment_status: string;
  bank_account_number: string;
  bank_type: string;
  payment_expired_at: string;
  amount: number;
}

function TransferContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const fetchStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/payment?order_id=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Polling setiap 5 detik untuk cek status pembayaran
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Countdown timer
  useEffect(() => {
    if (!payment?.payment_expired_at) return;

    const update = () => {
      const now = new Date().getTime();
      const expiry = new Date(payment.payment_expired_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Kadaluarsa");
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [payment?.payment_expired_at]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-text-muted mb-4">Order ID tidak ditemukan</p>
          <Link href="/" className="text-accent hover:underline">Kembali ke Home</Link>
        </div>
      </div>
    );
  }

  // Sudah dibayar
  if (payment?.payment_status === "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-surface rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Pembayaran Dikonfirmasi! 🎉</h1>
          <p className="text-text-muted mb-4">
            Pembayaran kamu sudah kami terima. Order sedang diproses oleh tim booster kami.
          </p>
          <div className="bg-background rounded-xl p-4 mb-6">
            <p className="text-text-muted text-sm">Order ID</p>
            <p className="font-mono text-accent font-bold">{orderId}</p>
          </div>
          <div className="space-y-3">
            <Link
              href={`/track?id=${orderId}`}
              className="block w-full gradient-primary px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Track Order
            </Link>
            <Link
              href="/"
              className="block w-full px-6 py-3 rounded-xl border border-white/10 text-text font-medium hover:bg-white/5 transition-colors"
            >
              Kembali ke Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bankName = BANK_NAMES[payment?.bank_type ?? ""] || payment?.bank_type || "Bank Transfer";
  const accountNumber = payment?.bank_account_number || "-";
  const amount = payment?.amount ?? 0;
  const isExpired = timeLeft === "Kadaluarsa";

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary inline-block mb-4">
            ETNYX
          </Link>
          <h1 className="text-2xl font-bold text-text">Instruksi Transfer</h1>
          <p className="text-text-muted mt-1 text-sm">
            Selesaikan pembayaran sebelum waktu habis
          </p>
        </div>

        {/* Timer */}
        <div className={`rounded-2xl p-4 mb-6 text-center border ${
          isExpired
            ? "bg-red-500/10 border-red-500/30"
            : "bg-accent/10 border-accent/30"
        }`}>
          <p className="text-sm text-text-muted mb-1">Batas Waktu Pembayaran</p>
          <p className={`text-3xl font-mono font-bold ${isExpired ? "text-red-400" : "text-accent"}`}>
            {timeLeft || "—"}
          </p>
          {isExpired && (
            <p className="text-red-400 text-sm mt-1">
              Waktu pembayaran habis.{" "}
              <Link href="/checkout" className="underline">Buat order baru</Link>
            </p>
          )}
        </div>

        {/* Info Transfer */}
        <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden mb-6">
          <div className="bg-white/5 px-6 py-4 border-b border-white/5">
            <p className="text-text font-semibold">Detail Transfer</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Order ID */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Order ID</p>
              <p className="font-mono font-bold text-accent">{orderId}</p>
            </div>

            {/* Bank */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Bank Tujuan</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">
                    {bankName.replace("Bank ", "").slice(0, 3).toUpperCase()}
                  </span>
                </div>
                <p className="text-text font-semibold">{bankName}</p>
              </div>
            </div>

            {/* Nomor Rekening / VA */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Nomor Rekening / Virtual Account</p>
              <div className="flex items-center justify-between bg-background rounded-xl px-4 py-3 border border-white/5">
                <span className="font-mono text-xl font-bold text-text tracking-wider">{accountNumber}</span>
                <button
                  onClick={() => copyToClipboard(accountNumber)}
                  className="ml-2 p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors flex-shrink-0"
                  title="Salin nomor rekening"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {copied && <p className="text-green-400 text-xs mt-1">✓ Tersalin!</p>}
            </div>

            {/* Jumlah Transfer */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Jumlah Transfer (HARUS TEPAT)</p>
              <div className="flex items-center justify-between bg-background rounded-xl px-4 py-3 border border-accent/30">
                <span className="text-2xl font-bold gradient-text">{formatRupiah(amount)}</span>
                <button
                  onClick={() => copyToClipboard(String(amount))}
                  className="ml-2 p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors flex-shrink-0"
                  title="Salin jumlah"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-yellow-400 text-xs mt-1">
                ⚠️ Transfer jumlah <strong>tepat</strong> agar pembayaran terdeteksi otomatis
              </p>
            </div>
          </div>
        </div>

        {/* Langkah-langkah */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5 mb-6">
          <p className="text-text font-semibold mb-4">Cara Bayar</p>
          <ol className="space-y-3">
            {[
              "Buka aplikasi m-Banking atau ATM kamu",
              `Pilih Transfer → ${bankName}`,
              `Masukkan nomor rekening: ${accountNumber}`,
              `Transfer jumlah TEPAT: ${formatRupiah(amount)}`,
              "Konfirmasi transfer",
              "Pembayaran akan otomatis terdeteksi dalam beberapa menit ✅",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-muted">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Status polling indicator */}
        <div className="flex items-center justify-center gap-2 text-text-muted text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Menunggu konfirmasi pembayaran secara otomatis...
        </div>

        {/* Bantuan */}
        <div className="text-center">
          <p className="text-text-muted text-sm mb-2">Ada kendala?</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281414131321"}?text=${encodeURIComponent(`Halo, saya butuh bantuan pembayaran untuk order ${orderId}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}
