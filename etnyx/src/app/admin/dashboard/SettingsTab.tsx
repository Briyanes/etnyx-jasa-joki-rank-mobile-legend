"use client";

import { toast, toastError, toastSuccess } from "@/components/ToastProvider";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Layout, Megaphone, HelpCircle, Users, Share2, Building,
  BarChart3, Zap, Settings2, Eye, EyeOff, Plus, Trash2,
  Save, Loader2, CheckCircle, ChevronUp, ChevronDown, Download,
  CreditCard, Mail, MessageCircle, Send, BookOpen, AlertTriangle, Copy, Plug, Upload,
  Landmark, Wallet, QrCode, Smartphone, Building2, Banknote,
  Swords, CalendarClock, Gamepad2,
  type LucideIcon,
} from "lucide-react";

// Icon mapping for payment methods
const BANK_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  BCA: { icon: Landmark, color: "text-blue-400" },
  BRI: { icon: Building2, color: "text-blue-300" },
  BNI: { icon: Landmark, color: "text-orange-400" },
  Mandiri: { icon: Building2, color: "text-yellow-400" },
  Jago: { icon: Banknote, color: "text-purple-400" },
  DANA: { icon: Wallet, color: "text-blue-400" },
  GoPay: { icon: Smartphone, color: "text-green-400" },
  OVO: { icon: Wallet, color: "text-purple-400" },
  ShopeePay: { icon: Smartphone, color: "text-orange-400" },
  LinkAja: { icon: Wallet, color: "text-red-400" },
  QRIS: { icon: QrCode, color: "text-indigo-400" },
};

// Static logo mapping
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

// ---- Types ----
interface HeroSettings { headline: string; subheadline: string; ctaPrimary: string; ctaSecondary: string; isVisible: boolean }
interface PromoBannerSettings { text: string; link: string; isVisible: boolean }
interface FAQItem { question: string; answer: string }
interface SectionVisibility { hero: boolean; pricing: boolean; whyChooseUs: boolean; teamShowcase: boolean; testimonials: boolean; portfolio: boolean; tracking: boolean; faq: boolean; cta: boolean }
interface TrackingPixels { metaPixelId: string; metaAccessToken: string; googleAdsId: string; googleAdsConversionLabel: string; googleAnalyticsId: string; gtmId: string; tiktokPixelId: string; isMetaEnabled: boolean; isGoogleAdsEnabled: boolean; isGoogleAnalyticsEnabled: boolean; isGtmEnabled: boolean; isTiktokEnabled: boolean }
interface SocialLinks { instagram: string; facebook: string; tiktok: string; youtube: string; whatsapp: string }
interface SiteInfo { siteName: string; taglineId: string; taglineEn: string; supportEmail: string; companyName: string; address: string; phone: string }
interface IntegrationSettings {
  ipaymuApiKey: string; ipaymuVa: string; ipaymuIsProduction: boolean;
  resendApiKey: string; resendFromEmail: string;
  fonnteApiToken: string; fonnteDeviceId: string;
  telegramBotToken: string; telegramAdminGroupId: string; telegramWorkerGroupId: string; telegramReviewGroupId: string; telegramReportGroupId: string;
}

type SettingsSubTab = "cms-sections" | "hero" | "banner" | "faq" | "team" | "social" | "site" | "pixels" | "integrations" | "gendong" | "general";

const SETTINGS_TABS: { id: SettingsSubTab; label: string; icon: typeof Layout }[] = [
  { id: "cms-sections", label: "Visibilitas", icon: Layout },
  { id: "hero", label: "Hero", icon: Megaphone },
  { id: "banner", label: "Banner", icon: Megaphone },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "team", label: "Tim", icon: Users },
  { id: "social", label: "Sosial", icon: Share2 },
  { id: "site", label: "Info Situs", icon: Building },
  { id: "pixels", label: "Pixels", icon: BarChart3 },
  { id: "integrations", label: "Integrasi", icon: Zap },
  { id: "gendong", label: "Gendong", icon: Gamepad2 },
  { id: "general", label: "General", icon: Settings2 },
];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section", pricing: "Paket Harga",
  whyChooseUs: "Kenapa Pilih Kami", teamShowcase: "Tim Booster", testimonials: "Testimoni",
  portfolio: "Portfolio", tracking: "Tracking", faq: "FAQ", cta: "Call to Action",
};

interface SettingsTabProps {
  onSwitchTab: (tab: "overview" | "orders" | "boosters" | "testimonials" | "portfolio" | "promo" | "customers" | "rewards" | "pricing" | "staff" | "settings") => void;
}

export default function SettingsTab({ onSwitchTab }: SettingsTabProps) {
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("cms-sections");
  const [cmsSaving, setCmsSaving] = useState<string | null>(null);
  const [cmsSaved, setCmsSaved] = useState<string | null>(null);

  const [hero, setHero] = useState<HeroSettings>({ headline: "", subheadline: "", ctaPrimary: "", ctaSecondary: "", isVisible: true });
  const [promoBanner, setPromoBanner] = useState<PromoBannerSettings>({ text: "", link: "/order", isVisible: true });
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({ hero: true, pricing: true, whyChooseUs: true, teamShowcase: true, testimonials: true, portfolio: true, tracking: true, faq: true, cta: true });
  const [trackingPixels, setTrackingPixels] = useState<TrackingPixels>({ metaPixelId: "", metaAccessToken: "", googleAdsId: "", googleAdsConversionLabel: "", googleAnalyticsId: "", gtmId: "", tiktokPixelId: "", isMetaEnabled: false, isGoogleAdsEnabled: false, isGoogleAnalyticsEnabled: false, isGtmEnabled: false, isTiktokEnabled: false });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ instagram: "", facebook: "", tiktok: "", youtube: "", whatsapp: "" });
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ siteName: "", taglineId: "", taglineEn: "", supportEmail: "", companyName: "", address: "", phone: "" });
  const [integrations, setIntegrations] = useState<IntegrationSettings>({
    ipaymuApiKey: "", ipaymuVa: "", ipaymuIsProduction: false,
    resendApiKey: "", resendFromEmail: "noreply@etnyx.com",
    fonnteApiToken: "", fonnteDeviceId: "",
    telegramBotToken: "", telegramAdminGroupId: "", telegramWorkerGroupId: "", telegramReviewGroupId: "", telegramReportGroupId: "",
  });
  const DEFAULT_BANK_ACCOUNTS: { bank: string; category: string; account_number: string; account_name: string; is_active: boolean; qris_image_url?: string }[] = [
    { bank: "BCA", category: "bank", account_number: "", account_name: "", is_active: true },
    { bank: "BRI", category: "bank", account_number: "", account_name: "", is_active: true },
    { bank: "BNI", category: "bank", account_number: "", account_name: "", is_active: true },
    { bank: "Mandiri", category: "bank", account_number: "", account_name: "", is_active: true },
    { bank: "Jago", category: "bank", account_number: "", account_name: "", is_active: true },
    { bank: "DANA", category: "ewallet", account_number: "081515141452", account_name: "", is_active: true },
    { bank: "GoPay", category: "ewallet", account_number: "081515141452", account_name: "", is_active: true },
    { bank: "OVO", category: "ewallet", account_number: "081515141452", account_name: "", is_active: true },
    { bank: "ShopeePay", category: "ewallet", account_number: "081515141452", account_name: "", is_active: true },
    { bank: "LinkAja", category: "ewallet", account_number: "081515141452", account_name: "", is_active: true },
    { bank: "QRIS", category: "qris", account_number: "", account_name: "", is_active: true },
  ];
  const [bankAccounts, setBankAccounts] = useState(DEFAULT_BANK_ACCOUNTS);
  const [qrisUploading, setQrisUploading] = useState(false);

  // Gendong settings
  const [gendongRoles, setGendongRoles] = useState<{ id: string; name: string; emoji: string; disabled: boolean }[]>([
    { id: "exp", name: "EXP Laner", emoji: "⚔️", disabled: false },
    { id: "roam", name: "Roamer", emoji: "🛡️", disabled: false },
    { id: "mid", name: "Mid Laner", emoji: "🔮", disabled: false },
    { id: "jungler", name: "Jungler", emoji: "🌿", disabled: true },
    { id: "gold", name: "Gold Laner", emoji: "💰", disabled: true },
  ]);
  const [gendongSchedules, setGendongSchedules] = useState<{ id: string; label: string }[]>([
    { id: "pagi", label: "Pagi (08:00-12:00)" },
    { id: "siang", label: "Siang (12:00-16:00)" },
    { id: "sore", label: "Sore (16:00-19:00)" },
    { id: "malam", label: "Malam (19:00-22:00)" },
    { id: "larut", label: "Larut Malam (22:00-02:00)" },
    { id: "weekend", label: "Weekend Seharian" },
    { id: "flexible", label: "Fleksibel (Kapan Saja)" },
  ]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return;
      const { settings } = await res.json();
      if (settings.hero) setHero(settings.hero);
      if (settings.promo_banner) setPromoBanner(settings.promo_banner);
      if (settings.faq_items) setFaqItems(settings.faq_items);
      if (settings.section_visibility) setSectionVisibility(settings.section_visibility);
      if (settings.tracking_pixels) setTrackingPixels(settings.tracking_pixels);
      if (settings.social_links) setSocialLinks(settings.social_links);
      if (settings.site_info) setSiteInfo(settings.site_info);
      if (settings.integrations) setIntegrations(settings.integrations);
      if (settings.gendong_settings) {
        const gs = settings.gendong_settings;
        if (gs.roles && Array.isArray(gs.roles)) setGendongRoles(gs.roles);
        if (gs.schedules && Array.isArray(gs.schedules)) setGendongSchedules(gs.schedules);
      }
      if (settings.bank_accounts && Array.isArray(settings.bank_accounts)) {
        // Merge with defaults, maintain correct order (bank → ewallet → qris)
        const saved = settings.bank_accounts as typeof DEFAULT_BANK_ACCOUNTS;
        const merged = DEFAULT_BANK_ACCOUNTS.map((def) => {
          const existing = saved.find((s: { bank: string }) => s.bank === def.bank);
          return existing ? { ...def, ...existing, category: def.category } : def;
        });
        // Append any custom entries not in defaults
        for (const s of saved) {
          if (!DEFAULT_BANK_ACCOUNTS.some((d) => d.bank === s.bank)) {
            merged.push(s);
          }
        }
        setBankAccounts(merged);
      }
    } catch (err) { console.error("Failed to fetch CMS settings:", err); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveCmsSetting = async (key: string, value: unknown) => {
    setCmsSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) { setCmsSaved(key); setTimeout(() => setCmsSaved(null), 2000); }
      else toastError("Gagal menyimpan. Coba lagi.");
    } catch { toastError("Gagal menyimpan. Coba lagi."); }
    finally { setCmsSaving(null); }
  };

  const handleExport = (type: string) => window.open(`/api/admin/export?type=${type}`, "_blank");

  const CmsSaveButton = ({ settingKey, value }: { settingKey: string; value: unknown }) => (
    <button onClick={() => saveCmsSetting(settingKey, value)} disabled={cmsSaving === settingKey}
      className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
      {cmsSaving === settingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : cmsSaved === settingKey ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {cmsSaved === settingKey ? "Tersimpan!" : "Simpan"}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SETTINGS_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setSettingsSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              settingsSubTab === tab.id ? "gradient-primary text-white shadow-lg shadow-accent/20" : "bg-surface border border-white/5 text-text-muted hover:text-text"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section Visibility */}
      {settingsSubTab === "cms-sections" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Visibilitas Section</h2>
              <p className="text-text-muted text-xs mt-1">Kontrol section mana yang tampil di homepage</p>
            </div>
            <CmsSaveButton settingKey="section_visibility" value={sectionVisibility} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(sectionVisibility).map(([key, visible]) => (
              <button key={key} onClick={() => setSectionVisibility((prev) => ({ ...prev, [key]: !visible }))}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  visible ? "bg-accent/10 border-accent/30 text-text" : "bg-surface border-white/5 text-text-muted"
                }`}>
                <span className="font-medium text-sm">{SECTION_LABELS[key] || key}</span>
                {visible ? <Eye className="w-5 h-5 text-accent" /> : <EyeOff className="w-5 h-5 text-text-muted" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero Settings */}
      {settingsSubTab === "hero" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Hero Section</h2>
              <p className="text-text-muted text-xs mt-1">Edit headline dan CTA buttons di hero banner</p>
            </div>
            <CmsSaveButton settingKey="hero" value={hero} />
          </div>
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-text font-medium">Tampilkan Hero Section</label>
              <button onClick={() => setHero({ ...hero, isVisible: !hero.isVisible })}
                className={`w-12 h-6 rounded-full transition-colors relative ${hero.isVisible ? "bg-accent" : "bg-white/10"}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${hero.isVisible ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Headline</label>
              <input type="text" value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                placeholder="Push Rank, Tanpa Main."
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
              <p className="text-text-muted text-[10px] mt-1">Gunakan koma (,) untuk memisahkan baris. Contoh: <code className="text-accent">Push Rank, Tanpa Main.</code></p>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Sub-headline</label>
              <textarea value={hero.subheadline} onChange={(e) => setHero({ ...hero, subheadline: e.target.value })} rows={3}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Tombol CTA Utama</label>
                <input type="text" value={hero.ctaPrimary} onChange={(e) => setHero({ ...hero, ctaPrimary: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Tombol CTA Sekunder</label>
                <input type="text" value={hero.ctaSecondary} onChange={(e) => setHero({ ...hero, ctaSecondary: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promo Banner */}
      {settingsSubTab === "banner" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Promo Banner</h2>
              <p className="text-text-muted text-xs mt-1">Banner promo yang tampil di atas navbar</p>
            </div>
            <CmsSaveButton settingKey="promo_banner" value={promoBanner} />
          </div>
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-text font-medium">Tampilkan Banner</label>
              <button onClick={() => setPromoBanner({ ...promoBanner, isVisible: !promoBanner.isVisible })}
                className={`w-12 h-6 rounded-full transition-colors relative ${promoBanner.isVisible ? "bg-accent" : "bg-white/10"}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${promoBanner.isVisible ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Teks Banner</label>
              <input type="text" value={promoBanner.text} onChange={(e) => setPromoBanner({ ...promoBanner, text: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Link Tujuan</label>
              <input type="text" value={promoBanner.link} onChange={(e) => setPromoBanner({ ...promoBanner, link: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
            </div>
          </div>
        </div>
      )}

      {/* FAQ Manager */}
      {settingsSubTab === "faq" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">FAQ Manager</h2>
              <p className="text-text-muted text-xs mt-1">Kelola pertanyaan yang sering ditanyakan</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setFaqItems([...faqItems, { question: "", answer: "" }])}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-white/10 rounded-lg text-text text-sm hover:border-white/20 transition-colors">
                <Plus className="w-4 h-4" /> Tambah FAQ
              </button>
              <CmsSaveButton settingKey="faq_items" value={faqItems} />
            </div>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="bg-surface rounded-xl border border-white/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 mt-2 flex-shrink-0">
                    <button onClick={() => { if (i === 0) return; const next = [...faqItems]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setFaqItems(next); }}
                      disabled={i === 0} className="text-text-muted hover:text-accent disabled:opacity-30 transition-colors" title="Pindah ke atas">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (i === faqItems.length - 1) return; const next = [...faqItems]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setFaqItems(next); }}
                      disabled={i === faqItems.length - 1} className="text-text-muted hover:text-accent disabled:opacity-30 transition-colors" title="Pindah ke bawah">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input type="text" value={item.question} onChange={(e) => { const next = [...faqItems]; next[i] = { ...next[i], question: e.target.value }; setFaqItems(next); }}
                      placeholder="Pertanyaan..." className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
                    <textarea value={item.answer} onChange={(e) => { const next = [...faqItems]; next[i] = { ...next[i], answer: e.target.value }; setFaqItems(next); }}
                      placeholder="Jawaban..." rows={2} className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
                  </div>
                  <button onClick={() => setFaqItems(faqItems.filter((_, idx) => idx !== i))}
                    className="mt-3 text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Manager - redirects to Boosters tab */}
      {settingsSubTab === "team" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Tim Booster</h2>
              <p className="text-text-muted text-xs mt-1">Data tim booster sekarang dikelola dari tab Boosters</p>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-white/5 p-6 text-center">
            <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm mb-4">Kelola data booster yang tampil di homepage melalui tab <strong className="text-accent">Boosters</strong>.</p>
            <button onClick={() => onSwitchTab("boosters")} className="gradient-primary px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Buka Tab Boosters
            </button>
          </div>
        </div>
      )}

      {/* Social Media Links */}
      {settingsSubTab === "social" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Sosial Media</h2>
              <p className="text-text-muted text-xs mt-1">Link sosial media yang tampil di footer</p>
            </div>
            <CmsSaveButton settingKey="social_links" value={socialLinks} />
          </div>
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
            {(["instagram", "facebook", "tiktok", "youtube", "whatsapp"] as const).map((platform) => (
              <div key={platform}>
                <label className="block text-sm text-text-muted mb-1.5 capitalize">{platform === "whatsapp" ? "WhatsApp Number" : platform}</label>
                <input type="text" value={socialLinks[platform]} onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                  placeholder={platform === "whatsapp" ? "6281234567890" : `https://${platform}.com/...`}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Site Info */}
      {settingsSubTab === "site" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Informasi Situs</h2>
              <p className="text-text-muted text-xs mt-1">Nama bisnis, tagline, dan informasi kontak</p>
            </div>
            <CmsSaveButton settingKey="site_info" value={siteInfo} />
          </div>
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Nama Situs</label>
                <input type="text" value={siteInfo.siteName} onChange={(e) => setSiteInfo({ ...siteInfo, siteName: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Nama Perusahaan</label>
                <input type="text" value={siteInfo.companyName} onChange={(e) => setSiteInfo({ ...siteInfo, companyName: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Email Support</label>
              <input type="email" value={siteInfo.supportEmail} onChange={(e) => setSiteInfo({ ...siteInfo, supportEmail: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">No. Telepon / WhatsApp</label>
              <input type="text" value={siteInfo.phone} onChange={(e) => setSiteInfo({ ...siteInfo, phone: e.target.value })} placeholder="+62 815-1514-1452"
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Alamat Perusahaan</label>
              <textarea value={siteInfo.address} onChange={(e) => setSiteInfo({ ...siteInfo, address: e.target.value })} rows={2} placeholder="Jl. Kaliurang KM 5.5, Caturtunggal, Depok, Sleman, D.I. Yogyakarta 55281, Indonesia"
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Tagline (Bahasa Indonesia)</label>
              <textarea value={siteInfo.taglineId} onChange={(e) => setSiteInfo({ ...siteInfo, taglineId: e.target.value })} rows={2}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Tagline (English)</label>
              <textarea value={siteInfo.taglineEn} onChange={(e) => setSiteInfo({ ...siteInfo, taglineEn: e.target.value })} rows={2}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* Tracking Pixels */}
      {settingsSubTab === "pixels" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Tracking Pixels</h2>
              <p className="text-text-muted text-xs mt-1">Setup pixel untuk Meta Ads, Google Ads, GA4, GTM, dan TikTok Ads</p>
            </div>
            <CmsSaveButton settingKey="tracking_pixels" value={trackingPixels} />
          </div>
          {[
            { key: "gtm", label: "Google Tag Manager", desc: "Container untuk mengelola semua tag & pixel dari satu dashboard", enabled: trackingPixels.isGtmEnabled, toggle: () => setTrackingPixels({ ...trackingPixels, isGtmEnabled: !trackingPixels.isGtmEnabled }),
              fields: [
                { label: "GTM Container ID", value: trackingPixels.gtmId, onChange: (v: string) => setTrackingPixels({ ...trackingPixels, gtmId: v }), placeholder: "GTM-XXXXXXX" },
              ]},
            { key: "meta", label: "Meta (Facebook) Pixel", desc: "Tracking konversi Meta & Instagram Ads", enabled: trackingPixels.isMetaEnabled, toggle: () => setTrackingPixels({ ...trackingPixels, isMetaEnabled: !trackingPixels.isMetaEnabled }),
              fields: [
                { label: "Pixel ID", value: trackingPixels.metaPixelId, onChange: (v: string) => setTrackingPixels({ ...trackingPixels, metaPixelId: v }), placeholder: "123456789012345" },
                { label: "Access Token (opsional)", value: trackingPixels.metaAccessToken, onChange: (v: string) => setTrackingPixels({ ...trackingPixels, metaAccessToken: v }), placeholder: "EAAxxxxxxx..." },
              ]},
            { key: "gads", label: "Google Ads", desc: "Tracking konversi Google Ads", enabled: trackingPixels.isGoogleAdsEnabled, toggle: () => setTrackingPixels({ ...trackingPixels, isGoogleAdsEnabled: !trackingPixels.isGoogleAdsEnabled }),
              fields: [
                { label: "Google Ads ID (gtag)", value: trackingPixels.googleAdsId, onChange: (v: string) => setTrackingPixels({ ...trackingPixels, googleAdsId: v }), placeholder: "AW-123456789" },
                { label: "Conversion Label", value: trackingPixels.googleAdsConversionLabel, onChange: (v: string) => setTrackingPixels({ ...trackingPixels, googleAdsConversionLabel: v }), placeholder: "AbCdEfGh123" },
              ]},
            { key: "ga4", label: "Google Analytics 4", desc: "Analytics & audience website", enabled: trackingPixels.isGoogleAnalyticsEnabled, toggle: () => setTrackingPixels({ ...trackingPixels, isGoogleAnalyticsEnabled: !trackingPixels.isGoogleAnalyticsEnabled }),
              fields: [
                { label: "Measurement ID", value: trackingPixels.googleAnalyticsId, onChange: (v: string) => setTrackingPixels({ ...trackingPixels, googleAnalyticsId: v }), placeholder: "G-XXXXXXXXXX" },
              ]},
            { key: "tiktok", label: "TikTok Pixel", desc: "Tracking konversi TikTok Ads", enabled: trackingPixels.isTiktokEnabled, toggle: () => setTrackingPixels({ ...trackingPixels, isTiktokEnabled: !trackingPixels.isTiktokEnabled }),
              fields: [
                { label: "Pixel ID", value: trackingPixels.tiktokPixelId, onChange: (v: string) => setTrackingPixels({ ...trackingPixels, tiktokPixelId: v }), placeholder: "CXXXXXXXXXXXXXXX" },
              ]},
          ].map((pixel) => (
            <div key={pixel.key} className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text font-bold text-sm">{pixel.label}</h3>
                  <p className="text-text-muted text-xs mt-0.5">{pixel.desc}</p>
                </div>
                <button onClick={pixel.toggle}
                  className={`w-12 h-6 rounded-full transition-colors relative ${pixel.enabled ? "bg-accent" : "bg-white/10"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${pixel.enabled ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              {pixel.fields.map((f) => (
                <div key={f.label}>
                  <label className="block text-sm text-text-muted mb-1.5">{f.label}</label>
                  <input type="text" value={f.value} onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder} className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Integrations */}
      {settingsSubTab === "integrations" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text">Integrasi API</h2>
              <p className="text-text-muted text-xs mt-1">Setup Payment Gateway, Email, dan WhatsApp API</p>
            </div>
            <CmsSaveButton settingKey="integrations" value={integrations} />
          </div>

          {/* iPaymu */}
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-5">
            <div>
              <h3 className="text-text font-bold text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-accent" /> iPaymu Payment Gateway</h3>
              <p className="text-text-muted text-xs mt-0.5">Konfigurasi dan monitoring payment gateway</p>
            </div>
            <div className="bg-background rounded-lg p-4 border border-white/5">
              <p className="text-text-muted text-xs font-semibold mb-2 uppercase tracking-wider">Environment</p>
              <div className="flex gap-2">
                <button onClick={() => setIntegrations({ ...integrations, ipaymuIsProduction: false })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!integrations.ipaymuIsProduction ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-background border border-white/10 text-text-muted hover:text-text"}`}>
                  Sandbox
                </button>
                <button onClick={() => setIntegrations({ ...integrations, ipaymuIsProduction: true })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${integrations.ipaymuIsProduction ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-background border border-white/10 text-text-muted hover:text-text"}`}>
                  Production
                </button>
              </div>
              {integrations.ipaymuIsProduction && (
                <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Mode Production — transaksi menggunakan uang asli
                </p>
              )}
            </div>
            <div className="bg-background rounded-lg p-4 border border-white/5 space-y-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">API Credentials</p>
              {[
                { label: "Virtual Account (VA)", value: integrations.ipaymuVa, key: "ipaymuVa", type: "text", placeholder: "1179000899" },
                { label: "API Key", value: integrations.ipaymuApiKey, key: "ipaymuApiKey", type: "password", placeholder: "QbGcoO0Qds9sQFDmY0MWg1Tq.xtuh1" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm text-text-muted mb-1.5">{f.label}</label>
                  <input type={f.type} value={f.value} onChange={(e) => setIntegrations({ ...integrations, [f.key]: e.target.value })}
                    placeholder={f.placeholder} className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                </div>
              ))}
            </div>
            <div className="bg-background rounded-lg p-4 border border-white/5 space-y-2">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Notification URL (Webhook)</p>
              <p className="text-text-muted text-xs">Daftarkan URL ini di iPaymu Dashboard → Integrasi → Notify URL</p>
              <div className="flex gap-2">
                <input type="text" readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/payment/notification`}
                  className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm font-mono focus:outline-none" />
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/payment/notification`); toastSuccess("URL berhasil disalin!"); }}
                  className="px-4 py-2.5 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors whitespace-nowrap flex items-center gap-1.5">
                  <Copy className="w-4 h-4" /> Salin
                </button>
              </div>
              <p className="text-yellow-400/80 text-xs mt-1">
                <AlertTriangle className="w-3.5 h-3.5 inline shrink-0" /> <strong>Penting:</strong> Setelah deploy ke production, copy URL di atas dan paste ke iPaymu Dashboard agar status pembayaran otomatis terupdate.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={async () => {
                if (!integrations.ipaymuApiKey || !integrations.ipaymuVa) { toast("API Key dan VA belum diisi!"); return; }
                try {
                  const res = await fetch("/api/payment/test-connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: integrations.ipaymuApiKey, va: integrations.ipaymuVa, isProduction: integrations.ipaymuIsProduction }) });
                  const data = await res.json();
                  toast(data.success ? "✅ Koneksi berhasil! iPaymu aktif dan siap menerima pembayaran." : `❌ Gagal: ${data.error}\n\nPastikan API Key dan VA benar dan environment sesuai.`);
                } catch (e) { toast(`❌ Error koneksi: ${e instanceof Error ? e.message : "Network error"}`); }
              }} className="px-4 py-2.5 rounded-lg border border-white/10 text-text text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <Plug className="w-4 h-4" /> Test Connection
              </button>
              <p className="text-text-muted text-xs">
                <BookOpen className="w-3 h-3 inline mr-1" /> Dapatkan credentials di <a href="https://my.ipaymu.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">my.ipaymu.com</a>
              </p>
            </div>
          </div>

          {/* Bank Accounts for Manual Transfer */}
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-text font-bold text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-yellow-400" /> Rekening Transfer Manual</h3>
                <p className="text-text-muted text-xs mt-0.5">Rekening tujuan untuk pembayaran manual transfer</p>
              </div>
              <CmsSaveButton settingKey="bank_accounts" value={bankAccounts} />
            </div>

            {/* Group: Bank */}
            {(() => {
              const groups: { key: string; label: string; color: string; icon: LucideIcon }[] = [
                { key: "bank", label: "Bank Transfer", color: "text-blue-400", icon: Landmark },
                { key: "ewallet", label: "Dompet Digital", color: "text-green-400", icon: Wallet },
                { key: "qris", label: "QRIS", color: "text-purple-400", icon: QrCode },
              ];
              return groups.map((group) => {
                const items = bankAccounts.map((b, i) => ({ ...b, _idx: i })).filter((b) => (b.category || "bank") === group.key);
                if (items.length === 0) return null;
                return (
                  <div key={group.key}>
                    <p className={`text-xs font-semibold mb-2 uppercase tracking-wider ${group.color} flex items-center gap-1.5`}>
                      <group.icon className="w-3.5 h-3.5" /> {group.label}
                    </p>
                    <div className="space-y-3">
                      {items.map((bank) => (
                        <div key={bank._idx} className="bg-background rounded-lg p-4 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const logo = PAYMENT_LOGOS[bank.bank];
                                if (logo) {
                                  return <Image src={logo} alt={bank.bank} width={20} height={20} className="w-5 h-5 object-contain" />;
                                }
                                const bi = BANK_ICONS[bank.bank];
                                if (bi) {
                                  const BIcon = bi.icon;
                                  return <BIcon className={`w-4 h-4 ${bi.color}`} />;
                                }
                                return <CreditCard className="w-4 h-4 text-accent" />;
                              })()}
                              <span className="text-text font-bold text-sm">{bank.bank}</span>
                              {bank.is_active && bank.account_number && <span className="w-2 h-2 rounded-full bg-green-400" />}
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={bank.is_active}
                                  onChange={(e) => { const updated = [...bankAccounts]; updated[bank._idx] = { ...updated[bank._idx], is_active: e.target.checked }; setBankAccounts(updated); }}
                                  className="w-4 h-4 rounded border-white/20 bg-surface text-accent focus:ring-accent cursor-pointer" />
                                <span className="text-text-muted text-xs">Aktif</span>
                              </label>
                              <button onClick={() => setBankAccounts(bankAccounts.filter((_, i) => i !== bank._idx))}
                                className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-text-muted mb-1">{group.key === "ewallet" ? "No. HP" : group.key === "qris" ? "Merchant ID (opsional)" : "No. Rekening"}</label>
                              <input type="text" value={bank.account_number}
                                onChange={(e) => { const updated = [...bankAccounts]; updated[bank._idx] = { ...updated[bank._idx], account_number: e.target.value }; setBankAccounts(updated); }}
                                placeholder={group.key === "ewallet" ? "081515141452" : "1234567890"}
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none font-mono" />
                            </div>
                            <div>
                              <label className="block text-xs text-text-muted mb-1">Atas Nama</label>
                              <input type="text" value={bank.account_name}
                                onChange={(e) => { const updated = [...bankAccounts]; updated[bank._idx] = { ...updated[bank._idx], account_name: e.target.value }; setBankAccounts(updated); }}
                                placeholder="Nama pemilik" className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                            </div>
                          </div>
                          {/* QRIS Image Upload */}
                          {group.key === "qris" && (
                            <div className="mt-3">
                              <label className="block text-xs text-text-muted mb-1.5">Gambar QR Code</label>
                              {bank.qris_image_url ? (
                                <div className="relative inline-block">
                                  <Image src={bank.qris_image_url} alt="QRIS" width={160} height={160} unoptimized className="w-40 h-40 object-contain rounded-lg border border-white/10 bg-white p-2" />
                                  <button onClick={() => { const updated = [...bankAccounts]; updated[bank._idx] = { ...updated[bank._idx], qris_image_url: "" }; setBankAccounts(updated); }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                                </div>
                              ) : (
                                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/10 text-text-muted text-sm hover:border-accent/50 hover:text-accent transition-colors cursor-pointer">
                                  {qrisUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                  {qrisUploading ? "Mengupload..." : "Upload Gambar QRIS"}
                                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    if (f.size > 5 * 1024 * 1024) { toastError("Maks 5MB"); return; }
                                    setQrisUploading(true);
                                    try {
                                      const formData = new FormData();
                                      formData.append("file", f);
                                      const res = await fetch("/api/admin/upload-qris", { method: "POST", body: formData });
                                      const data = await res.json();
                                      if (res.ok && data.url) {
                                        const updated = [...bankAccounts]; updated[bank._idx] = { ...updated[bank._idx], qris_image_url: data.url }; setBankAccounts(updated);
                                      } else { toast(data.error || "Gagal upload"); }
                                    } catch { toastError("Gagal upload"); }
                                    finally { setQrisUploading(false); }
                                  }} />
                                </label>
                              )}
                              <p className="text-text-muted text-xs mt-1">Upload gambar QR code QRIS (JPG/PNG, maks 5MB)</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            <div className="bg-background rounded-lg p-4 border border-white/5 space-y-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Tambah Rekening / Wallet Baru</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Kategori</label>
                  <select id="new-bank-category" defaultValue="bank"
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none">
                    <option value="bank">Bank Transfer</option>
                    <option value="ewallet">Dompet Digital</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Nama Bank / Wallet</label>
                  <input type="text" id="new-bank-name" placeholder="Contoh: BCA, DANA..."
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => {
                    const nameEl = document.getElementById("new-bank-name") as HTMLInputElement;
                    const catEl = document.getElementById("new-bank-category") as HTMLSelectElement;
                    const name = nameEl?.value?.trim();
                    if (!name) return;
                    setBankAccounts([...bankAccounts, { bank: name, category: catEl.value, account_number: "", account_name: "", is_active: true }]);
                    nameEl.value = "";
                  }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resend Email */}
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
            <div>
              <h3 className="text-text font-bold text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-accent" /> Resend (Email API)</h3>
              <p className="text-text-muted text-xs mt-0.5">Kirim email konfirmasi order ke customer</p>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">API Key</label>
              <input type="password" value={integrations.resendApiKey} onChange={(e) => setIntegrations({ ...integrations, resendApiKey: e.target.value })}
                placeholder="re_xxxxxxxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">From Email</label>
              <input type="email" value={integrations.resendFromEmail} onChange={(e) => setIntegrations({ ...integrations, resendFromEmail: e.target.value })}
                placeholder="noreply@etnyx.com" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none" />
            </div>
            <p className="text-text-muted text-xs"><BookOpen className="w-3 h-3 inline mr-1" /> Dapatkan API Key di <a href="https://resend.com/api-keys" target="_blank" rel="noopener" className="text-accent hover:underline">resend.com/api-keys</a></p>
          </div>

          {/* Fonnte */}
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
            <div>
              <h3 className="text-text font-bold text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4 text-accent" /> Fonnte (WhatsApp API)</h3>
              <p className="text-text-muted text-xs mt-0.5">Kirim notifikasi order via WhatsApp</p>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">API Token</label>
              <input type="password" value={integrations.fonnteApiToken} onChange={(e) => setIntegrations({ ...integrations, fonnteApiToken: e.target.value })}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Device ID (opsional)</label>
              <input type="text" value={integrations.fonnteDeviceId} onChange={(e) => setIntegrations({ ...integrations, fonnteDeviceId: e.target.value })}
                placeholder="628xxxxxxxxxx" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
            </div>
            <p className="text-text-muted text-xs"><BookOpen className="w-3 h-3 inline mr-1" /> Dapatkan Token di <a href="https://md.fonnte.com/api" target="_blank" rel="noopener" className="text-accent hover:underline">md.fonnte.com</a></p>
          </div>

          {/* Telegram */}
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
            <div>
              <h3 className="text-text font-bold text-sm flex items-center gap-2"><Send className="w-4 h-4 text-accent" /> Telegram Bot</h3>
              <p className="text-text-muted text-xs mt-0.5">Notifikasi order ke grup Admin & Worker</p>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Bot Token</label>
              <input type="password" value={integrations.telegramBotToken} onChange={(e) => setIntegrations({ ...integrations, telegramBotToken: e.target.value })}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Admin Group Chat ID</label>
              <input type="text" value={integrations.telegramAdminGroupId} onChange={(e) => setIntegrations({ ...integrations, telegramAdminGroupId: e.target.value })}
                placeholder="-1001234567890" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
              <p className="text-text-muted text-xs mt-1">Notifikasi order baru untuk konfirmasi admin</p>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Worker Group Chat ID</label>
              <input type="text" value={integrations.telegramWorkerGroupId} onChange={(e) => setIntegrations({ ...integrations, telegramWorkerGroupId: e.target.value })}
                placeholder="-1001234567890" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
              <p className="text-text-muted text-xs mt-1">Notifikasi order yang sudah dikonfirmasi untuk dikerjakan</p>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Review Group Chat ID</label>
              <input type="text" value={integrations.telegramReviewGroupId} onChange={(e) => setIntegrations({ ...integrations, telegramReviewGroupId: e.target.value })}
                placeholder="-1001234567890" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
              <p className="text-text-muted text-xs mt-1">Notifikasi review customer baru (opsional, default ke Admin Group)</p>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Report Group Chat ID</label>
              <input type="text" value={integrations.telegramReportGroupId} onChange={(e) => setIntegrations({ ...integrations, telegramReportGroupId: e.target.value })}
                placeholder="-1001234567890" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none font-mono" />
              <p className="text-text-muted text-xs mt-1">Notifikasi laporan worker (opsional, default ke Admin Group)</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-xs text-text-muted space-y-1">
              <p><BookOpen className="w-3 h-3 inline mr-1" /> <strong>Cara mendapatkan Bot Token:</strong></p>
              <p>1. Chat @BotFather di Telegram → /newbot → ikuti instruksi</p>
              <p>2. Copy token yang diberikan</p>
              <p className="mt-2"><BookOpen className="w-3 h-3 inline mr-1" /> <strong>Cara mendapatkan Group Chat ID:</strong></p>
              <p>1. Tambahkan bot ke grup</p>
              <p>2. Kirim pesan di grup</p>
              <p>3. Buka: api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</p>
              <p>4. Cari &quot;chat&quot;:{`{`}&quot;id&quot;: -100xxx...{`}`}</p>
            </div>
          </div>
        </div>
      )}

      {/* Gendong Settings */}
      {settingsSubTab === "gendong" && (
        <div className="max-w-2xl space-y-4">
          {/* Roles */}
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text flex items-center gap-2"><Swords className="w-4 h-4 text-purple-400" /> Role Picker</h3>
                <p className="text-text-muted text-xs mt-0.5">Atur role yang bisa dipilih customer di form gendong. Role dengan toggle off = &quot;khusus booster&quot;.</p>
              </div>
            </div>
            <div className="space-y-2">
              {gendongRoles.map((role, idx) => (
                <div key={role.id} className="flex items-center gap-3 bg-background rounded-lg px-3 py-2 border border-white/5">
                  <span className="text-lg">{role.emoji}</span>
                  <input
                    value={role.emoji}
                    onChange={(e) => {
                      const updated = [...gendongRoles];
                      updated[idx] = { ...updated[idx], emoji: e.target.value };
                      setGendongRoles(updated);
                    }}
                    className="w-12 bg-transparent border border-white/10 rounded px-2 py-1 text-center text-sm"
                    maxLength={4}
                  />
                  <input
                    value={role.name}
                    onChange={(e) => {
                      const updated = [...gendongRoles];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setGendongRoles(updated);
                    }}
                    className="flex-1 bg-transparent border border-white/10 rounded px-3 py-1 text-text text-sm"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!role.disabled}
                      onChange={() => {
                        const updated = [...gendongRoles];
                        updated[idx] = { ...updated[idx], disabled: !updated[idx].disabled };
                        setGendongRoles(updated);
                      }}
                      className="accent-[var(--accent)]"
                    />
                    {role.disabled ? "Booster Only" : "Customer"}
                  </label>
                  <button
                    onClick={() => setGendongRoles(gendongRoles.filter((_, i) => i !== idx))}
                    className="text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setGendongRoles([...gendongRoles, { id: `role_${Date.now()}`, name: "", emoji: "🎯", disabled: false }])}
              className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Role
            </button>
          </div>

          {/* Schedules */}
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text flex items-center gap-2"><CalendarClock className="w-4 h-4 text-purple-400" /> Jadwal Main (Dropdown)</h3>
                <p className="text-text-muted text-xs mt-0.5">Opsi jadwal yang muncul di dropdown form gendong.</p>
              </div>
            </div>
            <div className="space-y-2">
              {gendongSchedules.map((sched, idx) => (
                <div key={sched.id} className="flex items-center gap-3 bg-background rounded-lg px-3 py-2 border border-white/5">
                  <span className="text-text-muted text-xs w-6 text-center">{idx + 1}.</span>
                  <input
                    value={sched.label}
                    onChange={(e) => {
                      const updated = [...gendongSchedules];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      setGendongSchedules(updated);
                    }}
                    className="flex-1 bg-transparent border border-white/10 rounded px-3 py-1 text-text text-sm"
                    placeholder="Label jadwal"
                  />
                  <button
                    onClick={() => setGendongSchedules(gendongSchedules.filter((_, i) => i !== idx))}
                    className="text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setGendongSchedules([...gendongSchedules, { id: `sched_${Date.now()}`, label: "" }])}
              className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Jadwal
            </button>
          </div>

          {/* Save */}
          <CmsSaveButton settingKey="gendong_settings" value={{ roles: gendongRoles, schedules: gendongSchedules }} />
        </div>
      )}

      {/* General (Env + Export) */}
      {settingsSubTab === "general" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-text mb-1">Site Configuration</h3>
            <p className="text-text-muted text-xs mb-4">Dikelola via environment variables.</p>
            <div className="space-y-2">
              {["NEXT_PUBLIC_WHATSAPP_NUMBER", "ADMIN_EMAIL", "ENCRYPTION_KEY", "IPAYMU_API_KEY", "IPAYMU_VA"].map((key) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-text-muted font-mono">{key}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2"><Download className="w-4 h-4" /> Export Data (CSV)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {["orders", "customers", "boosters", "testimonials", "promo_codes"].map((t) => (
                <button key={t} onClick={() => handleExport(t)} className="px-3 py-2 bg-background border border-white/10 rounded-lg text-text text-xs hover:bg-white/5 transition capitalize">{t.replace("_", " ")}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
