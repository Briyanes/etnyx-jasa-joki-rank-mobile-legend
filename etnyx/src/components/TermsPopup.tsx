"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, ClipboardList, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { ReactNode } from "react";

const sectionIcons: Record<string, ReactNode> = {
  clock: <Clock className="w-5 h-5 inline mr-2" />,
  clipboard: <ClipboardList className="w-5 h-5 inline mr-2" />,
  alert: <AlertTriangle className="w-5 h-5 inline mr-2" />,
  check: <CheckCircle className="w-5 h-5 inline mr-2" />,
};

export default function TermsPopup() {
  const { locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const t = {
    id: {
      title: "Syarat & Ketentuan Order",
      subtitle: "Baca sebelum melakukan pemesanan",
      sections: [
        { icon: "clock", title: "Waktu Proses", items: ["Order diproses setiap hari 07.00 - 22.00 WIB", "Order di luar jam operasional diproses keesokan hari"] },
        { icon: "clipboard", title: "Syarat Order", items: ["Isi data akun dengan benar (ID, Server, Password)", "Siapkan minimal 3 hero request pada role yang dipilih (contoh EXP LANE: Lapu-Lapu, Uranus, Yuzhong)", "Nonaktifkan verifikasi 2 langkah sementara", "Gunakan akun utama, bukan akun GB/beli"] },
        { icon: "alert", title: "Penting", items: ["Jangan login selama proses joki berlangsung", "Login tanpa izin = pembatalan tanpa refund", "Tunggu sesuai estimasi, jangan spam chat", "Hubungi admin jika >3 jam belum diproses"] },
        { icon: "check", title: "Setelah Selesai", items: ["Tunggu konfirmasi dari admin sebelum login", "Cek hasil di menu Tracking / WhatsApp", "Tanggung jawab akun berakhir setelah selesai"] },
      ],
      scrollHint: "Scroll ke bawah untuk melanjutkan",
      dontShow: "Jangan tampilkan lagi",
      understand: "Saya Mengerti",
      contact: "Butuh bantuan? Hubungi Admin ETNYX",
    },
    en: {
      title: "Terms & Conditions",
      subtitle: "Read before placing an order",
      sections: [
        { icon: "clock", title: "Processing Time", items: ["Orders processed daily 07.00 - 22.00 WIB", "Orders outside hours processed next day"] },
        { icon: "clipboard", title: "Order Requirements", items: ["Fill account data correctly (ID, Server, Password)", "Prepare at least 3 heroes for each role", "Temporarily disable 2-step verification", "Use main account, not bought/GB accounts"] },
        { icon: "alert", title: "Important", items: ["Do not login during boosting process", "Unauthorized login = cancellation without refund", "Wait per estimate, don't spam chat", "Contact admin if not processed in >3 hours"] },
        { icon: "check", title: "After Completion", items: ["Wait for admin confirmation before login", "Check results in Tracking / WhatsApp", "Account responsibility ends after completion"] },
      ],
      scrollHint: "Scroll down to continue",
      dontShow: "Don't show again",
      understand: "I Understand",
      contact: "Need help? Contact ETNYX Admin",
    },
  };

  const txt = t[locale];

  useEffect(() => {
    const hasSeenTerms = localStorage.getItem("etnyx_terms_seen");
    if (!hasSeenTerms) {
      setIsOpen(true);
      document.body.style.overflow = "hidden";
    }
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || !isOpen) return;

    const checkScrollable = () => {
      const { scrollTop, scrollHeight, clientHeight } = content;
      // If content doesn't need scrolling, or already at bottom
      const needsScroll = scrollHeight > clientHeight + 10;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
      setCanClose(!needsScroll || isAtBottom);
    };

    // Check on mount
    setTimeout(checkScrollable, 100);

    // Check on scroll
    content.addEventListener("scroll", checkScrollable);
    // Also listen for touch events as backup
    content.addEventListener("touchmove", checkScrollable);
    
    return () => {
      content.removeEventListener("scroll", checkScrollable);
      content.removeEventListener("touchmove", checkScrollable);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!canClose) return;
    if (dontShowAgain) {
      localStorage.setItem("etnyx_terms_seen", "true");
    }
    setIsOpen(false);
    document.body.style.overflow = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md">
      <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 text-center shrink-0">
          <h2 className="text-xl font-bold text-text">{txt.title}</h2>
          <p className="text-sm text-accent mt-1 italic">{txt.subtitle}</p>
        </div>

        <div 
          ref={contentRef} 
          className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {txt.sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-bold text-primary mb-2 flex items-center">
                {sectionIcons[section.icon]}
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <span className="text-accent shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-muted text-center pt-2 border-t border-white/10">{txt.contact}</p>
        </div>

        <div className="p-5 border-t border-white/10 space-y-4 shrink-0 bg-background/50">
          {!canClose && (
            <p className="text-xs text-accent text-center animate-pulse flex items-center justify-center gap-2">
              <ChevronDown className="w-4 h-4 animate-bounce" />
              {txt.scrollHint}
            </p>
          )}

          <label className="flex items-center gap-2 cursor-pointer justify-center">
            <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-background text-primary focus:ring-primary" />
            <span className="text-sm text-muted">{txt.dontShow}</span>
          </label>

          <button onClick={handleClose} disabled={!canClose} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${canClose ? "bg-primary text-background hover:bg-primary/90" : "bg-surface text-muted cursor-not-allowed"}`}>
            {txt.understand}
          </button>
        </div>
      </div>
    </div>
  );
}
