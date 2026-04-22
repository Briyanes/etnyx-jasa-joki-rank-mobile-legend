"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { Check, Loader2, Package, ArrowRight, XCircle, Clock, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackPurchase } from "@/lib/tracking";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const orderId = searchParams.get("order_id");
  const transactionStatus = searchParams.get("transaction_status");
  const statusCode = searchParams.get("status_code");
  const grossAmount = searchParams.get("gross_amount");
  const firedRef = useRef(false);

  const isPending = transactionStatus === "pending";
  const isFailed = transactionStatus === "deny" || transactionStatus === "cancel" || transactionStatus === "expire" || statusCode === "202";
  const isSuccess = !isPending && !isFailed;

  // Fire Purchase conversion event once on successful payment
  useEffect(() => {
    if (isSuccess && orderId && !firedRef.current) {
      firedRef.current = true;
      const value = grossAmount ? parseInt(grossAmount, 10) : 0;
      if (value > 0) {
        // eventId matches server-side CAPI → Meta deduplicates automatically
        trackPurchase({ orderId, value, eventId: `purchase_${orderId}` });
      }
    }
  }, [isSuccess, orderId, grossAmount]);

  const t = locale === "id" ? {
    invalidPage: "Halaman Tidak Valid",
    orderNotFound: "Order ID tidak ditemukan.",
    backHome: "Kembali ke Home",
    titleFailed: "Pembayaran Gagal",
    titlePending: "Menunggu Pembayaran",
    titleSuccess: "Pembayaran Berhasil!",
    descFailed: "Pembayaran tidak berhasil diproses. Silakan coba lagi atau hubungi kami via WhatsApp.",
    descPending: "Selesaikan pembayaran sesuai instruksi yang diberikan. Status akan terupdate otomatis.",
    descSuccess: "Terima kasih! Pembayaran kamu sudah diterima. Tim kami akan segera memproses order.",
    badgeFailed: "Gagal",
    badgePending: "Menunggu Pembayaran",
    badgePaid: "Lunas",
    trackOrder: "Track Order",
    orderAgainFailed: "Coba Order Lagi",
    orderAgain: "Order Lagi",
    backToHome: "Kembali ke Beranda",
    adminContact: "Admin akan segera menghubungi kamu via WhatsApp untuk memulai proses joki.",
  } : {
    invalidPage: "Invalid Page",
    orderNotFound: "Order ID not found.",
    backHome: "Back to Home",
    titleFailed: "Payment Failed",
    titlePending: "Awaiting Payment",
    titleSuccess: "Payment Successful!",
    descFailed: "Payment could not be processed. Please try again or contact us via WhatsApp.",
    descPending: "Complete the payment as instructed. Status will update automatically.",
    descSuccess: "Thank you! Your payment has been received. Our team will process your order shortly.",
    badgeFailed: "Failed",
    badgePending: "Awaiting Payment",
    badgePaid: "Paid",
    trackOrder: "Track Order",
    orderAgainFailed: "Try Order Again",
    orderAgain: "Order Again",
    backToHome: "Back to Home",
    adminContact: "Our admin will contact you via WhatsApp to start the boosting process.",
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <h1 className="text-xl font-bold text-text mb-4">{t.invalidPage}</h1>
          <p className="text-text-muted mb-6">{t.orderNotFound}</p>
          <Link href="/" className="block w-full px-6 py-3 rounded-xl border border-white/10 text-text font-medium hover:bg-white/5 transition-colors">
            {t.backHome}
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
          {isFailed ? t.titleFailed : isPending ? t.titlePending : <>{t.titleSuccess} <Sparkles className="w-6 h-6 inline text-yellow-400" /></>}
        </h1>

        {/* Description */}
        <p className="text-text-muted mb-6 text-sm">
          {isFailed ? t.descFailed : isPending ? t.descPending : t.descSuccess}
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
          {isFailed ? t.badgeFailed : isPending ? t.badgePending : t.badgePaid}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/track?order_id=${orderId}`}
            className="flex items-center justify-center gap-2 w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {t.trackOrder} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/order"
            className="block w-full px-6 py-3.5 rounded-xl border border-white/10 text-text font-medium hover:bg-white/5 transition-colors"
          >
            {isFailed ? t.orderAgainFailed : t.orderAgain}
          </Link>
          <Link
            href="/"
            className="block text-text-muted text-sm hover:text-text transition-colors"
          >
            {t.backToHome}
          </Link>
        </div>

        {!isFailed && (
          <p className="text-text-muted text-xs mt-6">
            {t.adminContact}
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
