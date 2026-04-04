"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Check, Loader2, Package, ArrowRight, XCircle, Clock } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const transactionStatus = searchParams.get("transaction_status") || searchParams.get("status");
  const statusCode = searchParams.get("status_code");

  const isPending = transactionStatus === "pending";
  const isFailed = transactionStatus === "deny" || transactionStatus === "cancel" || transactionStatus === "expire" || transactionStatus === "gagal" || statusCode === "202" || statusCode === "0";

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <h1 className="text-xl font-bold text-text mb-4">Halaman Tidak Valid</h1>
          <p className="text-text-muted mb-6">Order ID tidak ditemukan.</p>
          <Link href="/" className="block w-full px-6 py-3 rounded-xl border border-white/10 text-text font-medium hover:bg-white/5 transition-colors">
            Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
        {/* Icon */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
          isFailed ? "bg-red-500/20" : isPending ? "bg-yellow-500/20" : "bg-success/20"
        }`}>
          {isFailed ? (
            <XCircle className="w-10 h-10 text-red-400" />
          ) : isPending ? (
            <Clock className="w-10 h-10 text-yellow-400" />
          ) : (
            <Check className="w-10 h-10 text-success" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-text mb-2">
          {isFailed
            ? "Pembayaran Gagal"
            : isPending
              ? "Menunggu Pembayaran"
              : "Pembayaran Berhasil! 🎉"}
        </h1>

        {/* Description */}
        <p className="text-text-muted mb-6 text-sm">
          {isFailed
            ? "Pembayaran tidak berhasil diproses. Silakan coba lagi atau hubungi kami via WhatsApp."
            : isPending
              ? "Selesaikan pembayaran sesuai instruksi yang diberikan. Status akan terupdate otomatis."
              : "Terima kasih! Pembayaran kamu sudah diterima. Tim kami akan segera memproses order."}
        </p>

        {/* Order ID */}
        <div className="bg-background rounded-xl p-4 mb-6">
          <p className="text-text-muted text-sm">Order ID</p>
          <p className="font-mono text-accent font-bold text-lg">{orderId}</p>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 ${
          isFailed
            ? "bg-red-500/20 text-red-400"
            : isPending
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-green-500/20 text-green-400"
        }`}>
          <Package className="w-4 h-4" />
          {isFailed ? "Gagal" : isPending ? "Menunggu Pembayaran" : "Lunas"}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/track?order_id=${orderId}`}
            className="flex items-center justify-center gap-2 w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Track Order <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/order"
            className="block w-full px-6 py-3.5 rounded-xl border border-white/10 text-text font-medium hover:bg-white/5 transition-colors"
          >
            {isFailed ? "Coba Order Lagi" : "Order Lagi"}
          </Link>
          <Link
            href="/"
            className="block text-text-muted text-sm hover:text-text transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>

        {!isFailed && (
          <p className="text-text-muted text-xs mt-6">
            Admin akan segera menghubungi kamu via WhatsApp untuk memulai proses joki.
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
