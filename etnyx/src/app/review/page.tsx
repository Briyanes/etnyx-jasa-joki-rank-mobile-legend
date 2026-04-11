"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Star, AlertTriangle, Send, ExternalLink, CheckCircle, Loader2, MessageCircle, Gift } from "lucide-react";
import Image from "next/image";

const translations = {
  id: {
    title: "Review Pesanan",
    subtitle: "Bantu kami meningkatkan pelayanan",
    orderInfo: "Info Pesanan",
    orderId: "Order ID",
    rank: "Rank",
    worker: "Dikerjakan oleh",
    completedAt: "Selesai pada",
    serviceTitle: "Rating Layanan",
    serviceDesc: "Bagaimana pengalaman kamu dengan layanan ETNYX?",
    workerTitle: "Rating Worker",
    workerDesc: "Bagaimana performa worker yang mengerjakan?",
    commentPlaceholder: "Ceritakan pengalaman kamu... (opsional)",
    workerCommentPlaceholder: "Komentar tentang worker... (opsional)",
    reportTitle: "Laporkan Worker",
    reportDesc: "Ada masalah dengan worker? Laporkan di sini",
    reportToggle: "Saya ingin melaporkan worker",
    reportTypes: {
      cheating: "Bermain curang / menggunakan cheat",
      offering_services: "Menawarkan jasa di luar ETNYX",
      rude: "Kasar / tidak sopan",
      account_issue: "Masalah dengan akun (diamankan, dll)",
      other: "Lainnya",
    },
    reportDetailPlaceholder: "Jelaskan detail masalahnya...",
    yourName: "Nama kamu",
    yourWhatsapp: "Nomor WhatsApp",
    namePlaceholder: "Nama (opsional, untuk testimonial)",
    submit: "Kirim Review",
    submitting: "Mengirim...",
    successTitle: "Terima kasih!",
    successDesc: "Review kamu sudah kami terima. Terima kasih telah membantu kami meningkatkan pelayanan!",
    googlePrompt: "Bantu kami juga dengan review di Google Maps ya!",
    googleButton: "Review di Google Maps",
    alreadyReviewed: "Kamu sudah memberikan review untuk pesanan ini.",
    notFound: "Pesanan tidak ditemukan",
    notCompleted: "Pesanan belum selesai",
    errorGeneric: "Terjadi kesalahan",
    skinReward: "Sebagai terima kasih, kamu akan mendapat skin gratis! CS kami akan menghubungi kamu.",
    ratingLabels: ["Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"],
    back: "Kembali ke Beranda",
  },
  en: {
    title: "Order Review",
    subtitle: "Help us improve our service",
    orderInfo: "Order Info",
    orderId: "Order ID",
    rank: "Rank",
    worker: "Handled by",
    completedAt: "Completed at",
    serviceTitle: "Service Rating",
    serviceDesc: "How was your experience with ETNYX?",
    workerTitle: "Worker Rating",
    workerDesc: "How was the worker's performance?",
    commentPlaceholder: "Tell us about your experience... (optional)",
    workerCommentPlaceholder: "Comment about the worker... (optional)",
    reportTitle: "Report Worker",
    reportDesc: "Had issues with the worker? Report here",
    reportToggle: "I want to report the worker",
    reportTypes: {
      cheating: "Using cheats / playing unfairly",
      offering_services: "Offering services outside ETNYX",
      rude: "Rude / disrespectful",
      account_issue: "Account issues (secured, etc)",
      other: "Other",
    },
    reportDetailPlaceholder: "Describe the issue in detail...",
    yourName: "Your name",
    yourWhatsapp: "WhatsApp number",
    namePlaceholder: "Name (optional, for testimonial)",
    submit: "Submit Review",
    submitting: "Submitting...",
    successTitle: "Thank you!",
    successDesc: "Your review has been received. Thank you for helping us improve!",
    googlePrompt: "Please also help us with a Google Maps review!",
    googleButton: "Review on Google Maps",
    alreadyReviewed: "You have already reviewed this order.",
    notFound: "Order not found",
    notCompleted: "Order not completed yet",
    errorGeneric: "Something went wrong",
    skinReward: "As a thank you, you'll receive a free skin! Our CS will contact you.",
    ratingLabels: ["Very Bad", "Bad", "Okay", "Good", "Excellent"],
    back: "Back to Home",
  },
};

const GOOGLE_REVIEW_URL =
  "https://www.google.com/search?sca_esv=1fa3911bd390220b&sxsrf=ANbL-n6wz3Hf9PvITgrabADpob9cHcYY9Q%3A1775412529879&q=ETNYX&stick=H4sIAAAAAAAAAONgU1I1qDBKNbewNDa2MDM0NzI2MDa0MqgwTjVLNDdITEpJNjNJszAwWcTK6hriFxkBACART7QxAAAA&mat=CZv3iATpcvix&ved=2ahUKEwiVkrGJp9eTAxV0ZWwGHRDWIysQrMcEegQIGxAC";

interface OrderInfo {
  orderId: string;
  username: string;
  currentRank: string;
  targetRank: string;
  completedAt: string;
  hasWorker: boolean;
  workerName: string | null;
}

function StarRating({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-9 h-9 transition-colors ${
                star <= (hover || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-white/20"
              }`}
            />
          </button>
        ))}
      </div>
      {(hover || value) > 0 && (
        <p className="text-sm text-text-muted animate-in fade-in">
          {labels[(hover || value) - 1]}
        </p>
      )}
    </div>
  );
}

function formatRank(rank: string) {
  return rank
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <ReviewPageContent />
    </Suspense>
  );
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const orderId = (searchParams.get("id") || searchParams.get("orderId") || "").replace(/\/+$/, "");
  const token = searchParams.get("token") || "";
  const lang = searchParams.get("lang") || "id";
  const t = translations[lang as keyof typeof translations] || translations.id;

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [serviceRating, setServiceRating] = useState(0);
  const [serviceComment, setServiceComment] = useState("");
  const [workerRating, setWorkerRating] = useState(0);
  const [workerComment, setWorkerComment] = useState("");
  const [showReport, setShowReport] = useState(searchParams.get("report") === "1");
  const [reportType, setReportType] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError(t.notFound);
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams({ orderId });
      if (token) params.set("token", token);
      const res = await fetch(`/api/review?${params}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_reviewed") {
          setError(t.alreadyReviewed);
        } else if (res.status === 400) {
          setError(t.notCompleted);
        } else if (res.status === 404) {
          setError(t.notFound);
        } else {
          setError(t.errorGeneric);
        }
        setLoading(false);
        return;
      }

      setOrder(data.order);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [orderId, token, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleSubmit = async () => {
    if (serviceRating === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          token: token || undefined,
          serviceRating,
          serviceComment: serviceComment.trim() || undefined,
          workerRating: workerRating || undefined,
          workerComment: workerComment.trim() || undefined,
          hasWorkerReport: showReport,
          reportType: showReport ? reportType : undefined,
          reportDetail: showReport ? reportDetail.trim() : undefined,
          customerName: customerName.trim() || undefined,
          customerWhatsapp: customerWhatsapp.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        if (data.error === "already_reviewed") {
          setError(t.alreadyReviewed);
        }
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-text-muted">{error}</p>
          <a href="/" className="inline-block text-accent text-sm hover:underline">{t.back}</a>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-text">{t.successTitle}</h2>
          <p className="text-text-muted">{t.successDesc}</p>

          {/* Skin reward notice */}
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm text-accent flex items-center gap-2">
            <Gift className="w-4 h-4 flex-shrink-0" /> {t.skinReward}
          </div>

          {/* Google Maps CTA */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-3">
            <p className="text-text text-sm font-medium">{t.googlePrompt}</p>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-lg font-semibold hover:brightness-110 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              {t.googleButton}
            </a>
          </div>

          <a href="/" className="inline-block text-text-muted text-sm hover:text-accent transition-colors">
            {t.back}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Image src="/logo/logo-circle.webp" alt="ETNYX" width={56} height={56} className="mx-auto rounded-full" />
          <h1 className="text-2xl font-bold text-text">{t.title}</h1>
          <p className="text-text-muted text-sm">{t.subtitle}</p>
        </div>

        {/* Order Info Card */}
        {order && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-widest">{t.orderInfo}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-muted">{t.orderId}:</span>{" "}
                <span className="text-text font-mono">{order.orderId}</span>
              </div>
              <div>
                <span className="text-text-muted">{t.rank}:</span>{" "}
                <span className="text-text">{formatRank(order.currentRank)} → {formatRank(order.targetRank)}</span>
              </div>
              {order.workerName && (
                <div>
                  <span className="text-text-muted">{t.worker}:</span>{" "}
                  <span className="text-text">{order.workerName}</span>
                </div>
              )}
              {order.completedAt && (
                <div>
                  <span className="text-text-muted">{t.completedAt}:</span>{" "}
                  <span className="text-text">{new Date(order.completedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Rating */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-text font-semibold">{t.serviceTitle}</h3>
            <p className="text-text-muted text-xs mt-1">{t.serviceDesc}</p>
          </div>
          <StarRating value={serviceRating} onChange={setServiceRating} labels={t.ratingLabels} />
          {serviceRating > 0 && (
            <div className="space-y-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.namePlaceholder}
                maxLength={100}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 focus:outline-none"
              />
              <textarea
                value={serviceComment}
                onChange={(e) => setServiceComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Worker Rating */}
        {order?.hasWorker && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-text font-semibold">{t.workerTitle}</h3>
              <p className="text-text-muted text-xs mt-1">
                {t.workerDesc} {order.workerName && `(${order.workerName})`}
              </p>
            </div>
            <StarRating value={workerRating} onChange={setWorkerRating} labels={t.ratingLabels} />
            {workerRating > 0 && (
              <textarea
                value={workerComment}
                onChange={(e) => setWorkerComment(e.target.value)}
                placeholder={t.workerCommentPlaceholder}
                rows={2}
                maxLength={1000}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 focus:outline-none resize-none"
              />
            )}

          </div>
        )}

        {/* Worker Report - Always visible */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={showReport}
              onChange={(e) => setShowReport(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 accent-red-500"
            />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 group-hover:text-red-300">{t.reportToggle}</span>
            </div>
          </label>

          {showReport && (
            <div className="space-y-3 pl-7">
              <p className="text-xs text-text-muted">{t.reportDesc}</p>
              <div className="space-y-2">
                {(Object.entries(t.reportTypes) as [string, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value={key}
                      checked={reportType === key}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-3.5 h-3.5 accent-red-500"
                    />
                    <span className="text-sm text-text-muted">{label}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder={t.reportDetailPlaceholder}
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg text-sm text-text placeholder:text-red-400/30 focus:border-red-500/50 focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* WhatsApp (optional) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-text-muted">{t.yourWhatsapp}</span>
          </div>
          <input
            type="tel"
            value={customerWhatsapp}
            onChange={(e) => setCustomerWhatsapp(e.target.value)}
            placeholder="08xxx (opsional)"
            maxLength={20}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={serviceRating === 0 || submitting || (showReport && !reportType)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent text-background rounded-xl font-bold text-base hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {submitting ? t.submitting : t.submit}
        </button>

        {/* Footer */}
        <p className="text-center text-[10px] text-text-muted">
          © {new Date().getFullYear()} ETNYX
        </p>
      </div>
    </div>
  );
}
