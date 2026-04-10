"use client";

import { toastError } from "@/components/ToastProvider";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatRupiah } from "@/utils/helpers";
import { WHATSAPP_BOT_NUMBER } from "@/lib/constants";
import {
  Copy,
  Check,
  Upload,
  Loader2,
  ArrowLeft,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Camera,
  Landmark,
  Wallet,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

interface BankAccount {
  bank: string;
  category?: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  qris_image_url?: string;
  logo?: string;
}

// Icon & color mapping for each payment method
const PAYMENT_ICONS: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
  BCA: { icon: Landmark, bg: "bg-blue-500/20", text: "text-blue-400" },
  BRI: { icon: Building2, bg: "bg-blue-600/20", text: "text-blue-300" },
  BNI: { icon: Landmark, bg: "bg-orange-500/20", text: "text-orange-400" },
  Mandiri: { icon: Building2, bg: "bg-yellow-500/20", text: "text-yellow-400" },
  Jago: { icon: Banknote, bg: "bg-purple-500/20", text: "text-purple-400" },
  DANA: { icon: Wallet, bg: "bg-blue-400/20", text: "text-blue-400" },
  GoPay: { icon: Smartphone, bg: "bg-green-500/20", text: "text-green-400" },
  OVO: { icon: Wallet, bg: "bg-purple-500/20", text: "text-purple-400" },
  ShopeePay: { icon: Smartphone, bg: "bg-orange-500/20", text: "text-orange-400" },
  LinkAja: { icon: Wallet, bg: "bg-red-500/20", text: "text-red-400" },
  QRIS: { icon: QrCode, bg: "bg-indigo-500/20", text: "text-indigo-400" },
};

// Static logo mapping — /public/logo/payment/
const PAYMENT_LOGOS: Record<string, string> = {
  BCA: "/logo/payment/bank-central-asia(bca)-logo.png",
  BRI: "/logo/payment/bank-rakyat-indonesia-(bri)-logo.png",
  BNI: "/logo/payment/bank-negara-indonesia-(bni)-logo.png",
  Mandiri: "/logo/payment/bank-mandiri.png",
  Jago: "/logo/payment/bank-jago-logo.png",
  Jenius: "/logo/payment/jenius-logo.png",
  DANA: "/logo/payment/dana-logo.png",
  GoPay: "/logo/payment/gopay-logo.png",
  OVO: "/logo/payment/ovo-logo.png",
  ShopeePay: "/logo/payment/shopeepay-logo.png",
  LinkAja: "/logo/payment/linkaja-logo.png",
  QRIS: "/logo/payment/qris-logo.png",
};

interface OrderInfo {
  order_id: string;
  total_price: number;
  status: string;
  payment_status: string;
  payment_method: string;
  username: string;
}

function ManualPaymentContent() {
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const orderId = (searchParams.get("order_id") || "").replace(/\/+$/, "") || null;

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const t = locale === "id"
    ? {
        title: "Transfer Manual",
        orderNotFound: "Order tidak ditemukan.",
        backHome: "Kembali ke Home",
        transferTo: "Transfer ke Salah Satu Rekening Berikut",
        totalPayment: "Total Pembayaran",
        important: "Penting",
        importantDesc: "Transfer TEPAT sesuai nominal agar pembayaran terverifikasi otomatis. Tambahkan angka unik jika diminta.",
        uploadProof: "Upload Bukti Transfer",
        senderName: "Nama Pengirim",
        senderBank: "Bank Pengirim",
        selectImage: "Pilih Gambar Bukti Transfer",
        changeImage: "Ganti Gambar",
        maxSize: "Maks. 5MB (JPG, PNG, WebP)",
        submit: "Kirim Bukti Transfer",
        submitting: "Mengirim...",
        successTitle: "Bukti Transfer Terkirim!",
        successDesc: "Admin akan memverifikasi pembayaran kamu dalam 1-15 menit. Kamu akan menerima notifikasi via WhatsApp.",
        trackOrder: "Track Order",
        alreadyPaid: "Order ini sudah dibayar.",
        expired: "Order ini sudah expired/cancelled.",
        copySuccess: "Tersalin!",
        copy: "Salin",
        step1: "1. Pilih rekening tujuan",
        step2: "2. Transfer sesuai nominal",
        step3: "3. Upload bukti transfer",
        waitingVerification: "Menunggu Verifikasi",
        waitingDesc: "Bukti transfer sudah dikirim sebelumnya. Silakan tunggu verifikasi admin.",
      }
    : {
        title: "Manual Transfer",
        orderNotFound: "Order not found.",
        backHome: "Back to Home",
        transferTo: "Transfer to One of These Accounts",
        totalPayment: "Total Payment",
        important: "Important",
        importantDesc: "Transfer the EXACT amount for automatic verification. Add unique digits if requested.",
        uploadProof: "Upload Transfer Proof",
        senderName: "Sender Name",
        senderBank: "Sender Bank",
        selectImage: "Select Transfer Proof Image",
        changeImage: "Change Image",
        maxSize: "Max. 5MB (JPG, PNG, WebP)",
        submit: "Submit Transfer Proof",
        submitting: "Submitting...",
        successTitle: "Transfer Proof Submitted!",
        successDesc: "Admin will verify your payment within 1-15 minutes. You will receive a WhatsApp notification.",
        trackOrder: "Track Order",
        alreadyPaid: "This order is already paid.",
        expired: "This order has expired/cancelled.",
        copySuccess: "Copied!",
        copy: "Copy",
        step1: "1. Choose a destination account",
        step2: "2. Transfer the exact amount",
        step3: "3. Upload transfer proof",
        waitingVerification: "Waiting for Verification",
        waitingDesc: "Transfer proof was already submitted. Please wait for admin verification.",
      };

  // Fetch order info + bank accounts
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await fetch(`/api/payment/manual?order_id=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load");
          return;
        }
        setOrder(data.order);
        setBankAccounts(data.bankAccounts || []);
        if (data.hasProof) setUploaded(true);
      } catch {
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toastError("File terlalu besar. Maksimal 5MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleSubmit = async () => {
    if (!file || !orderId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("order_id", orderId);
      formData.append("sender_name", senderName);
      formData.append("sender_bank", senderBank);

      const res = await fetch("/api/payment/manual", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Gagal upload bukti transfer");
        return;
      }
      setUploaded(true);
    } catch {
      toastError("Gagal mengirim bukti. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text mb-2">{error || t.orderNotFound}</h1>
          <Link href="/" className="text-accent text-sm hover:underline">{t.backHome}</Link>
        </div>
      </div>
    );
  }

  // Already paid
  if (order.payment_status === "paid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text mb-2">{t.alreadyPaid}</h1>
          <Link
            href={`/track?order_id=${order.order_id}`}
            className="block mt-4 gradient-primary px-6 py-3 rounded-xl text-white font-semibold"
          >
            {t.trackOrder}
          </Link>
        </div>
      </div>
    );
  }

  // Cancelled/expired
  if (order.status === "cancelled") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text mb-2">{t.expired}</h1>
          <Link href="/" className="text-accent text-sm hover:underline mt-4 block">{t.backHome}</Link>
        </div>
      </div>
    );
  }

  // Upload success
  if (uploaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">{t.successTitle}</h1>
          <p className="text-text-muted text-sm mb-6">{t.successDesc}</p>
          <div className="bg-background rounded-xl p-4 mb-6">
            <p className="text-text-muted text-xs">Order ID</p>
            <p className="font-mono text-accent font-bold text-lg">{order.order_id}</p>
          </div>
          <Link
            href={`/track?order_id=${order.order_id}`}
            className="block w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {t.trackOrder}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-text-muted hover:text-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <CreditCard className="w-5 h-5 text-accent" />
          <h1 className="text-text font-bold">{t.title}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Order Info */}
        <div className="bg-surface rounded-2xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <p className="text-text-muted text-[10px] uppercase tracking-wider">Order ID</p>
              <p className="font-mono text-accent font-bold text-sm truncate">{order.order_id}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-500/15 text-yellow-400 px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0">
              <Clock className="w-3 h-3" />
              Menunggu Bayar
            </div>
          </div>
          <div className="bg-background rounded-xl p-4 text-center">
            <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">{t.totalPayment}</p>
            <p className="gradient-text text-3xl font-bold tracking-tight">{formatRupiah(order.total_price)}</p>
          </div>
        </div>

        {/* Activate WA Notifications */}
        <a
          href={`https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(`Aktifkan notifikasi order ${order.order_id}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 hover:bg-green-500/15 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-green-400 font-semibold text-sm">
              {locale === "id" ? "Aktifkan Notifikasi WhatsApp" : "Activate WhatsApp Notifications"}
            </p>
            <p className="text-text-muted text-[11px] leading-tight mt-0.5">
              {locale === "id"
                ? "Klik untuk mengaktifkan notifikasi otomatis. Link dalam pesan akan bisa diklik."
                : "Tap to enable auto notifications. Links in messages will be clickable."}
            </p>
          </div>
          <svg className="w-4 h-4 text-green-400/60 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </a>

        {/* Steps */}
        <div className="flex items-center justify-between text-xs text-text-muted bg-surface rounded-xl border border-white/5 p-3">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm">1</div>
            <span className="text-accent font-medium text-center text-[10px] leading-tight">Pilih<br/>Rekening</span>
          </div>
          <div className="w-8 h-px bg-white/10 flex-shrink-0" />
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-7 h-7 rounded-full bg-white/5 text-text-muted flex items-center justify-center font-bold text-sm">2</div>
            <span className="text-center text-[10px] leading-tight">Transfer<br/>Nominal</span>
          </div>
          <div className="w-8 h-px bg-white/10 flex-shrink-0" />
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-7 h-7 rounded-full bg-white/5 text-text-muted flex items-center justify-center font-bold text-sm">3</div>
            <span className="text-center text-[10px] leading-tight">Upload<br/>Bukti</span>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-surface rounded-2xl border border-white/5 p-4">
          <h2 className="text-text font-bold text-sm mb-3">{t.transferTo}</h2>
          
          {/* Group by category */}
          {[
            { key: "bank", label: "Bank Transfer", icon: Landmark, color: "text-blue-400" },
            { key: "ewallet", label: "Dompet Digital", icon: Wallet, color: "text-green-400" },
            { key: "qris", label: "QRIS", icon: QrCode, color: "text-purple-400" },
          ].map((group) => {
            const items = bankAccounts.filter(b => b.is_active && (b.account_number || b.qris_image_url) && (b.category || "bank") === group.key);
            if (items.length === 0) return null;
            const GroupIcon = group.icon;

            // E-Wallet compact mode: if all items share the same number, show as icon grid
            const allSameNumber = group.key === "ewallet" && items.length > 1 && items.every(b => b.account_number === items[0].account_number);

            return (
              <div key={group.key} className="mb-3 last:mb-0">
                <p className={`text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-1.5 ${group.color}`}>
                  <GroupIcon className="w-3 h-3" /> {group.label}
                </p>

                {allSameNumber ? (
                  /* Compact e-wallet: icon grid + shared number */
                  <div className="bg-background rounded-xl p-3 space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {items.map((bank, i) => {
                        const logo = PAYMENT_LOGOS[bank.bank] || bank.logo;
                        const iconInfo = PAYMENT_ICONS[bank.bank];
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 w-14">
                            {logo ? (
                              <Image src={logo} alt={bank.bank} width={36} height={36} className="w-9 h-9 object-contain rounded-lg" />
                            ) : iconInfo ? (
                              <div className={`w-9 h-9 rounded-lg ${iconInfo.bg} flex items-center justify-center`}>
                                {(() => { const Icon = iconInfo.icon; return <Icon className={`w-4 h-4 ${iconInfo.text}`} />; })()}
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-accent" />
                              </div>
                            )}
                            <span className="text-text-muted text-[9px] text-center leading-tight">{bank.bank}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-surface rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-accent font-mono font-bold text-sm">{items[0].account_number}</p>
                        {items[0].account_name && <p className="text-text-muted text-[10px]">a.n. {items[0].account_name}</p>}
                      </div>
                      <button
                        onClick={() => handleCopy(items[0].account_number, "ewallet-shared")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent text-[10px] font-semibold hover:bg-accent/20 transition-colors flex-shrink-0"
                      >
                        {copiedAccount === "ewallet-shared" ? (
                          <><Check className="w-3.5 h-3.5" /> {t.copySuccess}</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> {t.copy}</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="space-y-2">
                  {items.map((bank, i) => (
                    <div
                      key={i}
                      className="bg-background rounded-xl p-3"
                    >
                      {/* QRIS with image */}
                      {group.key === "qris" && bank.qris_image_url ? (
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <QrCode className="w-5 h-5 text-indigo-400" />
                            <span className="text-text font-bold">Scan QRIS</span>
                          </div>
                          <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                            <img src={bank.qris_image_url} alt="QRIS Code" className="w-52 h-52 object-contain" />
                          </div>
                          <p className="text-text-muted text-xs">
                            {locale === "id" ? "Scan QR code di atas menggunakan aplikasi banking/e-wallet kamu" : "Scan the QR code above using your banking/e-wallet app"}
                          </p>
                          {bank.account_name && <p className="text-text-muted text-xs">a.n. {bank.account_name}</p>}
                        </div>
                      ) : (
                        /* Bank / E-Wallet normal display */
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {(() => {
                              const logo = PAYMENT_LOGOS[bank.bank] || bank.logo;
                              const iconInfo = PAYMENT_ICONS[bank.bank];
                              if (logo) {
                                return <Image src={logo} alt={bank.bank} width={36} height={36} className="w-9 h-9 object-contain rounded-lg flex-shrink-0" />;
                              }
                              if (iconInfo) {
                                const Icon = iconInfo.icon;
                                return (
                                  <div className={`w-9 h-9 rounded-lg ${iconInfo.bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-4 h-4 ${iconInfo.text}`} />
                                  </div>
                                );
                              }
                              return (
                                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                                  <CreditCard className="w-4 h-4 text-accent" />
                                </div>
                              );
                            })()}
                            <div className="min-w-0">
                              <p className="text-text font-bold text-xs">{bank.bank}</p>
                              <p className="text-accent font-mono font-bold text-sm truncate">{bank.account_number}</p>
                              {bank.account_name && <p className="text-text-muted text-[10px]">a.n. {bank.account_name}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(bank.account_number, `${bank.bank}-${i}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent text-[10px] font-semibold hover:bg-accent/20 transition-colors flex-shrink-0"
                          >
                            {copiedAccount === `${bank.bank}-${i}` ? (
                              <><Check className="w-3.5 h-3.5" /> {t.copySuccess}</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> {t.copy}</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            );
          })}

          {bankAccounts.filter(b => b.is_active && (b.account_number || b.qris_image_url)).length === 0 && (
            <div className="text-center py-6 text-text-muted text-sm">
              Belum ada rekening yang dikonfigurasi. Hubungi admin via WhatsApp.
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold text-sm">{t.important}</p>
            <p className="text-text-muted text-xs mt-1">{t.importantDesc}</p>
          </div>
        </div>

        {/* Upload Proof */}
        <div className="bg-surface rounded-2xl border border-white/5 p-4">
          <h2 className="text-text font-bold text-sm mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent" />
            {t.uploadProof}
          </h2>

          <div className="space-y-3">
            {/* Sender Info */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-text-muted text-[10px] block mb-1">{t.senderName}</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama di rekening"
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2.5 text-text text-sm focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-text-muted text-[10px] block mb-1">{t.senderBank}</label>
                <select
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2.5 text-text text-sm focus:border-accent outline-none appearance-none"
                >
                  <option value="" className="bg-background text-text-muted">{locale === "id" ? "Pilih bank..." : "Select bank..."}</option>
                  {Array.from(new Set(["BCA", "BRI", "BNI", "Mandiri", "Jago", "DANA", "GoPay", "OVO", "ShopeePay", "LinkAja", ...bankAccounts.filter(b => b.is_active).map(b => b.bank)])).map(name => (
                    <option key={name} value={name} className="bg-background text-text">{name}</option>
                  ))}
                  <option value="__other__" className="bg-background text-text">{locale === "id" ? "Lainnya..." : "Other..."}</option>
                </select>
                {senderBank === "__other__" && (
                  <input
                    type="text"
                    onChange={(e) => {
                      if (e.target.value) setSenderBank(e.target.value);
                    }}
                    onBlur={(e) => { if (!e.target.value) setSenderBank(""); }}
                    placeholder={locale === "id" ? "Ketik nama bank" : "Type bank name"}
                    autoFocus
                    className="w-full bg-background border border-white/10 rounded-xl px-3 py-2.5 text-text text-sm focus:border-accent outline-none mt-1.5"
                  />
                )}
              </div>
            </div>

            {/* File Upload */}
            {preview ? (
              <div className="relative">
                <Image
                  src={preview}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="w-full max-h-64 object-contain rounded-xl bg-background"
                />
                <label className="absolute bottom-2 right-2 cursor-pointer bg-surface/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-accent font-medium hover:bg-surface transition-colors flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  {t.changeImage}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-accent/50 transition-colors">
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text text-sm font-medium">{t.selectImage}</p>
                  <p className="text-text-muted text-xs mt-1">{t.maxSize}</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="w-full gradient-primary px-6 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t.submitting}</>
              ) : (
                <><Upload className="w-5 h-5" /> {t.submit}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManualPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <ManualPaymentContent />
    </Suspense>
  );
}
