"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Zap, Star, CheckCircle, XCircle, DollarSign,
  Package, Users, Crown, Loader2,
  Plus, Pencil, Trash2, Save, Search,
  CalendarDays, Flame, Target, Lightbulb,
} from "lucide-react";
import { toast, toastError } from "@/components/ToastProvider";
import { formatRupiah } from "@/utils/helpers";

// ---- Types ----
interface PricingPackage {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isFlat?: boolean;
  rankKey: string;
  currentRank: string;
  targetRank: string;
}

interface PricingCategory {
  id: string;
  title: string;
  packages: PricingPackage[];
}

interface PerStarTier {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isFlat?: boolean;
  maxStars?: number;
  icon: string;
}

interface SeasonPhase { id: string; label: string; multiplier: number; startDate: string }
interface SeasonPricing { isEnabled: boolean; seasonName: string; phases: SeasonPhase[] }

type PricingMode = "paket" | "perstar" | "gendong" | "classic";

// ---- Rank helpers ----
const RANKS = ["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicgrading", "mythichonor", "mythicglory", "mythicimmortal"];

const rankLabel = (r: string) => {
  const m: Record<string, string> = { warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster", epic: "Epic", legend: "Legend", mythic: "Mythic", mythicgrading: "Mythic Grading", mythichonor: "Mythic Honor", mythicglory: "Mythic Glory", mythicimmortal: "Mythic Immortal" };
  return m[r] || r;
};

// ---- Component ----
export default function PricingTab() {
  // State
  const [pricingCatalog, setPricingCatalog] = useState<PricingCategory[]>([]);
  const [perStarPricing, setPerStarPricing] = useState<PerStarTier[]>([]);
  const [gendongPricing, setGendongPricing] = useState<PerStarTier[]>([]);
  const [classicPricing, setClassicPricing] = useState<PricingCategory[]>([]);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [activePricingCat, setActivePricingCat] = useState("");
  const [activeClassicCat, setActiveClassicCat] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode>("paket");
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [addPkgForm, setAddPkgForm] = useState({ title: "", price: "", originalPrice: "", currentRank: "warrior", targetRank: "epic" });
  const [editPkgTitle, setEditPkgTitle] = useState<string | null>(null);
  const [editPkgTitleValue, setEditPkgTitleValue] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [addCatForm, setAddCatForm] = useState({ title: "" });
  const [seasonPricing, setSeasonPricing] = useState<SeasonPricing>({
    isEnabled: false,
    seasonName: "",
    phases: [
      { id: "early", label: "Early Season", multiplier: 1.25, startDate: "" },
      { id: "mid", label: "Mid Season", multiplier: 1.0, startDate: "" },
      { id: "end", label: "End Season", multiplier: 0.85, startDate: "" },
    ],
  });
  const [seasonSaving, setSeasonSaving] = useState(false);
  const [seasonSaved, setSeasonSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ---- Fetch ----
  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings?key=pricing_catalog");
      const d = await res.json();
      if (d.value && Array.isArray(d.value)) {
        setPricingCatalog(d.value);
        if (d.value.length > 0 && !activePricingCat) setActivePricingCat(d.value[0].id);
      }

      const res2 = await fetch("/api/admin/settings?key=perstar_pricing");
      const d2 = await res2.json();
      if (d2.value && Array.isArray(d2.value)) {
        setPerStarPricing(d2.value);
      } else {
        setPerStarPricing([
          { id: "master", name: "Master", price: 5000, icon: "/icons-tier/Master.webp" },
          { id: "grandmaster", name: "Grand Master", price: 6000, icon: "/icons-tier/Grandmaster.webp" },
          { id: "epic", name: "Epic", price: 7000, icon: "/icons-tier/Epic.webp" },
          { id: "legend", name: "Legend", price: 8000, icon: "/icons-tier/Legend.webp" },
          { id: "grading", name: "Mythic Grading", price: 230000, icon: "/icons-tier/Mythic.webp", isFlat: true },
          { id: "mythicromawi", name: "Mythic Romawi", price: 19000, icon: "/icons-tier/Mythic.webp" },
          { id: "honor", name: "Mythical Honor", price: 24000, icon: "/icons-tier/Mythical_Honor.webp" },
          { id: "glory", name: "Mythical Glory", price: 27000, icon: "/icons-tier/Mythical_Glory.webp" },
          { id: "immortal", name: "Mythical Immortal", price: 30000, icon: "/icons-tier/Mythical_Immortal.webp" },
        ]);
      }

      const res3 = await fetch("/api/admin/settings?key=gendong_pricing");
      const d3 = await res3.json();
      if (d3.value && Array.isArray(d3.value)) {
        setGendongPricing(d3.value);
      } else {
        setGendongPricing([
          { id: "grandmaster", name: "Grand Master", price: 9000, icon: "/icons-tier/Grandmaster.webp" },
          { id: "epic", name: "Epic", price: 10000, icon: "/icons-tier/Epic.webp" },
          { id: "legend", name: "Legend", price: 11000, icon: "/icons-tier/Legend.webp" },
          { id: "grading", name: "Mythic Grading", price: 23000, icon: "/icons-tier/Mythic.webp", isFlat: true },
          { id: "mythic", name: "Mythic", price: 21000, icon: "/icons-tier/Mythic.webp" },
          { id: "honor", name: "Mythic Honor", price: 25000, icon: "/icons-tier/Mythical_Honor.webp" },
          { id: "glory", name: "Mythic Glory", price: 30000, icon: "/icons-tier/Mythical_Glory.webp" },
          { id: "immortal", name: "Mythic Immortal", price: 35000, icon: "/icons-tier/Mythical_Immortal.webp" },
        ]);
      }

      const resC = await fetch("/api/admin/settings?key=classic_pricing_catalog");
      const dC = await resC.json();
      if (dC.value && Array.isArray(dC.value)) {
        setClassicPricing(dC.value);
        if (dC.value.length > 0 && !activeClassicCat) setActiveClassicCat(dC.value[0].id);
      } else {
        const defaultClassic: PricingCategory[] = [{
          id: "classic-10-win",
          title: "Paket Classic 10 WIN",
          packages: [
            { id: "epic-10win", title: "Epic 10 Win", price: 50000, rankKey: "", currentRank: "", targetRank: "" },
            { id: "legend-10win", title: "Legend 10 Win", price: 50000, rankKey: "", currentRank: "", targetRank: "" },
            { id: "mythic-10win", title: "Mythic 10 Win", price: 55000, rankKey: "", currentRank: "", targetRank: "" },
            { id: "honor-10win", title: "Honor 10 Win", price: 55000, rankKey: "", currentRank: "", targetRank: "" },
            { id: "glory-10win", title: "Glory 10 Win", price: 60000, rankKey: "", currentRank: "", targetRank: "" },
            { id: "immortal-10win", title: "Immortal 10 Win", price: 60000, rankKey: "", currentRank: "", targetRank: "" },
          ],
        }];
        setClassicPricing(defaultClassic);
        setActiveClassicCat("classic-10-win");
        fetch("/api/admin/settings", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "classic_pricing_catalog", value: defaultClassic }),
        }).catch(() => {});
      }

      const res4 = await fetch("/api/admin/settings?key=season_pricing");
      const d4 = await res4.json();
      if (d4.value && typeof d4.value === "object") {
        setSeasonPricing(d4.value);
      }
    } catch (e) { console.error(e); }
    finally { setLoaded(true); }
  }, [activePricingCat, activeClassicCat]);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);

  // ---- Save handlers ----
  const savePricingCatalog = async (catalog: PricingCategory[]) => {
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing_catalog", value: catalog }),
      });
      if (res.ok) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000); }
      else toastError("Gagal menyimpan pricing.");
    } catch { toastError("Gagal menyimpan pricing."); }
    finally { setPricingSaving(false); }
  };

  const savePerStarPricing = async (tiers: PerStarTier[]) => {
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "perstar_pricing", value: tiers }),
      });
      if (res.ok) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000); }
      else toastError("Gagal menyimpan per star pricing.");
    } catch { toastError("Gagal menyimpan per star pricing."); }
    finally { setPricingSaving(false); }
  };

  const saveGendongPricing = async (tiers: PerStarTier[]) => {
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "gendong_pricing", value: tiers }),
      });
      if (res.ok) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000); }
      else toastError("Gagal menyimpan gendong pricing.");
    } catch { toastError("Gagal menyimpan gendong pricing."); }
    finally { setPricingSaving(false); }
  };

  const saveClassicPricing = async (catalog: PricingCategory[]) => {
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "classic_pricing_catalog", value: catalog }),
      });
      if (res.ok) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 2000); }
      else toastError("Gagal menyimpan classic pricing.");
    } catch { toastError("Gagal menyimpan classic pricing."); }
    finally { setPricingSaving(false); }
  };

  const saveSeasonPricing = async (data: SeasonPricing) => {
    setSeasonSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "season_pricing", value: data }),
      });
      if (res.ok) { setSeasonSaved(true); setTimeout(() => setSeasonSaved(false), 2000); }
      else toastError("Gagal menyimpan season pricing.");
    } catch { toastError("Gagal menyimpan season pricing."); }
    finally { setSeasonSaving(false); }
  };

  const getActivePhase = (sp: SeasonPricing) => {
    if (!sp.isEnabled || sp.phases.every(p => !p.startDate)) return null;
    const now = new Date();
    const sorted = [...sp.phases].filter(p => p.startDate).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return sorted.find(p => new Date(p.startDate) <= now) || null;
  };

  // ---- Edit handlers (shared for paket, perstar, gendong, classic) ----
  const startEditPrice = (pkg: PricingPackage) => {
    setEditingPriceId(pkg.id);
    setEditPriceValue(String(pkg.price));
    setEditOriginalPrice(String(pkg.originalPrice || ""));
  };

  const saveEditPrice = (catId: string, pkgId: string) => {
    const newCatalog = pricingCatalog.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        packages: cat.packages.map(pkg => {
          if (pkg.id !== pkgId) return pkg;
          const price = Math.max(0, parseInt(editPriceValue) || pkg.price);
          const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
          const discountPercent = originalPrice && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : undefined;
          return { ...pkg, price, originalPrice, discountPercent };
        }),
      };
    });
    setPricingCatalog(newCatalog);
    setEditingPriceId(null);
    savePricingCatalog(newCatalog);
  };

  const startEditPerStar = (tier: PerStarTier) => {
    setEditingPriceId(tier.id);
    setEditPriceValue(String(tier.price));
    setEditOriginalPrice(String(tier.originalPrice || ""));
  };

  const saveEditPerStar = (tierId: string) => {
    const price = Math.max(1, parseInt(editPriceValue) || 0);
    const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
    if (price <= 0) { toast("Harga harus lebih dari 0"); return; }
    if (originalPrice && originalPrice < price) { toast("Harga asli harus lebih besar dari harga diskon"); return; }
    const newTiers = perStarPricing.map(tier => {
      if (tier.id !== tierId) return tier;
      const discountPercent = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined;
      return { ...tier, price, originalPrice, discountPercent };
    });
    setPerStarPricing(newTiers);
    setEditingPriceId(null);
    savePerStarPricing(newTiers);
  };

  const saveEditGendong = (tierId: string) => {
    const newTiers = gendongPricing.map(tier => {
      if (tier.id !== tierId) return tier;
      const price = Math.max(0, parseInt(editPriceValue) || tier.price);
      const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
      const discountPercent = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined;
      return { ...tier, price, originalPrice, discountPercent };
    });
    setGendongPricing(newTiers);
    setEditingPriceId(null);
    saveGendongPricing(newTiers);
  };

  // ---- Package CRUD (paket mode) ----
  const addPackageToCategory = (catId: string) => {
    const price = Math.max(1, parseInt(addPkgForm.price) || 0);
    const originalPrice = addPkgForm.originalPrice ? Math.max(0, parseInt(addPkgForm.originalPrice)) : undefined;
    if (!addPkgForm.title.trim()) { toast("Nama paket harus diisi"); return; }
    if (price <= 0) { toast("Harga harus lebih dari 0"); return; }
    const id = addPkgForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const discountPercent = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
    const newPkg: PricingPackage = {
      id, title: addPkgForm.title.trim(), price, originalPrice, discountPercent,
      rankKey: addPkgForm.currentRank, currentRank: addPkgForm.currentRank, targetRank: addPkgForm.targetRank,
    };
    const newCatalog = pricingCatalog.map(cat => cat.id !== catId ? cat : { ...cat, packages: [...cat.packages, newPkg] });
    setPricingCatalog(newCatalog);
    savePricingCatalog(newCatalog);
    setShowAddPkg(false);
    setAddPkgForm({ title: "", price: "", originalPrice: "", currentRank: "warrior", targetRank: "epic" });
  };

  const deletePackage = (catId: string, pkgId: string) => {
    const newCatalog = pricingCatalog.map(cat => cat.id !== catId ? cat : { ...cat, packages: cat.packages.filter(p => p.id !== pkgId) });
    setPricingCatalog(newCatalog);
    savePricingCatalog(newCatalog);
  };

  const saveEditPkgTitle = (catId: string, pkgId: string) => {
    if (!editPkgTitleValue.trim()) { toast("Nama paket harus diisi"); return; }
    const newCatalog = pricingCatalog.map(cat => cat.id !== catId ? cat : { ...cat, packages: cat.packages.map(p => p.id !== pkgId ? p : { ...p, title: editPkgTitleValue.trim() }) });
    setPricingCatalog(newCatalog);
    setEditPkgTitle(null);
    savePricingCatalog(newCatalog);
  };

  const addCategory = () => {
    if (!addCatForm.title.trim()) { toast("Nama kategori harus diisi"); return; }
    const id = `paket-${addCatForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
    const newCat: PricingCategory = { id, title: addCatForm.title.trim(), packages: [] };
    const newCatalog = [...pricingCatalog, newCat];
    setPricingCatalog(newCatalog);
    savePricingCatalog(newCatalog);
    setActivePricingCat(id);
    setShowAddCat(false);
    setAddCatForm({ title: "" });
  };

  const deleteCategory = (catId: string) => {
    const cat = pricingCatalog.find(c => c.id === catId);
    if (cat && cat.packages.length > 0) { toast(`Hapus semua ${cat.packages.length} paket di kategori ini dulu`); return; }
    const newCatalog = pricingCatalog.filter(c => c.id !== catId);
    setPricingCatalog(newCatalog);
    savePricingCatalog(newCatalog);
    if (activePricingCat === catId && newCatalog.length > 0) setActivePricingCat(newCatalog[0].id);
  };

  // ---- Classic CRUD ----
  const addClassicPackageToCategory = (catId: string) => {
    const price = Math.max(1, parseInt(addPkgForm.price) || 0);
    const originalPrice = addPkgForm.originalPrice ? Math.max(0, parseInt(addPkgForm.originalPrice)) : undefined;
    if (!addPkgForm.title.trim()) { toast("Nama paket harus diisi"); return; }
    if (price <= 0) { toast("Harga harus lebih dari 0"); return; }
    const id = addPkgForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const discountPercent = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
    const newPkg: PricingPackage = {
      id, title: addPkgForm.title.trim(), price, originalPrice, discountPercent,
      rankKey: "", currentRank: "", targetRank: "",
    };
    const newCatalog = classicPricing.map(cat => cat.id !== catId ? cat : { ...cat, packages: [...cat.packages, newPkg] });
    setClassicPricing(newCatalog);
    saveClassicPricing(newCatalog);
    setShowAddPkg(false);
    setAddPkgForm({ title: "", price: "", originalPrice: "", currentRank: "", targetRank: "" });
  };

  const deleteClassicPackage = (catId: string, pkgId: string) => {
    const newCatalog = classicPricing.map(cat => cat.id !== catId ? cat : { ...cat, packages: cat.packages.filter(p => p.id !== pkgId) });
    setClassicPricing(newCatalog);
    saveClassicPricing(newCatalog);
  };

  const saveEditClassicPkgTitle = (catId: string, pkgId: string) => {
    if (!editPkgTitleValue.trim()) { toast("Nama paket harus diisi"); return; }
    const newCatalog = classicPricing.map(cat => cat.id !== catId ? cat : { ...cat, packages: cat.packages.map(p => p.id !== pkgId ? p : { ...p, title: editPkgTitleValue.trim() }) });
    setClassicPricing(newCatalog);
    setEditPkgTitle(null);
    saveClassicPricing(newCatalog);
  };

  const saveEditClassicPrice = (catId: string, pkgId: string) => {
    const newCatalog = classicPricing.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        packages: cat.packages.map(pkg => {
          if (pkg.id !== pkgId) return pkg;
          const price = Math.max(0, parseInt(editPriceValue) || pkg.price);
          const originalPrice = editOriginalPrice ? Math.max(0, parseInt(editOriginalPrice)) : undefined;
          const discountPercent = originalPrice && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : undefined;
          return { ...pkg, price, originalPrice, discountPercent };
        }),
      };
    });
    setClassicPricing(newCatalog);
    setEditingPriceId(null);
    saveClassicPricing(newCatalog);
  };

  const addClassicCategory = () => {
    if (!addCatForm.title.trim()) { toast("Nama kategori harus diisi"); return; }
    const id = `classic-${addCatForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
    const newCat: PricingCategory = { id, title: addCatForm.title.trim(), packages: [] };
    const newCatalog = [...classicPricing, newCat];
    setClassicPricing(newCatalog);
    saveClassicPricing(newCatalog);
    setActiveClassicCat(id);
    setShowAddCat(false);
    setAddCatForm({ title: "" });
  };

  const deleteClassicCategory = (catId: string) => {
    const cat = classicPricing.find(c => c.id === catId);
    if (cat && cat.packages.length > 0) { toast(`Hapus semua ${cat.packages.length} paket di kategori ini dulu`); return; }
    const newCatalog = classicPricing.filter(c => c.id !== catId);
    setClassicPricing(newCatalog);
    saveClassicPricing(newCatalog);
    if (activeClassicCat === catId && newCatalog.length > 0) setActiveClassicCat(newCatalog[0].id);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-x-hidden max-w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">Edit harga paket dan per bintang yang tampil di halaman order</p>
        </div>
        <button
          onClick={() => pricingMode === "paket" ? savePricingCatalog(pricingCatalog) : pricingMode === "perstar" ? savePerStarPricing(perStarPricing) : pricingMode === "classic" ? saveClassicPricing(classicPricing) : saveGendongPricing(gendongPricing)}
          disabled={pricingSaving}
          className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {pricingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : pricingSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {pricingSaved ? "Tersimpan!" : `Simpan ${pricingMode === "paket" ? "Paket" : pricingMode === "perstar" ? "Per Star" : pricingMode === "gendong" ? "Gendong" : "Classic"}`}
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-1 sm:gap-2 p-1 bg-surface rounded-xl border border-white/5 overflow-x-auto">
        {([
          { mode: "paket" as const, icon: Package, label: "Paket", prefix: "Joki " },
          { mode: "perstar" as const, icon: Star, label: "Per Bintang" },
          { mode: "gendong" as const, icon: Users, label: "Gendong" },
          { mode: "classic" as const, icon: Crown, label: "Classic" },
        ]).map(({ mode, icon: Icon, label, prefix }) => (
          <button
            key={mode}
            onClick={() => setPricingMode(mode)}
            className={`flex-1 min-w-0 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              pricingMode === mode
                ? "gradient-primary text-white shadow-lg"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Icon className="w-4 h-4 inline-block mr-1 sm:mr-2" />
            {prefix && <span className="hidden sm:inline">{prefix}</span>}{label}
          </button>
        ))}
      </div>

      {/* Season Pricing Scheduler */}
      <div className="bg-surface rounded-xl border border-white/5 p-3 sm:p-5 space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-sm font-bold text-text">Season Pricing</h3>
              <p className="text-text-muted text-[10px]">Harga otomatis berubah sesuai fase season ML (1 season ≈ 90 hari)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {seasonPricing.isEnabled && (() => {
              const active = getActivePhase(seasonPricing);
              return active ? (
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${active.id === "early" ? "bg-red-500/20 text-red-400" : active.id === "mid" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                  {active.label} aktif ({active.multiplier > 1 ? `+${Math.round((active.multiplier - 1) * 100)}%` : active.multiplier < 1 ? `-${Math.round((1 - active.multiplier) * 100)}%` : "Normal"})
                </span>
              ) : <span className="text-[10px] text-yellow-400">Tanggal belum di-set</span>;
            })()}
            <button onClick={() => { const next = { ...seasonPricing, isEnabled: !seasonPricing.isEnabled }; setSeasonPricing(next); saveSeasonPricing(next); }}
              className={`w-11 h-6 rounded-full transition-colors relative ${seasonPricing.isEnabled ? "bg-accent" : "bg-white/10"}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${seasonPricing.isEnabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {seasonPricing.isEnabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Nama Season</label>
              <input type="text" value={seasonPricing.seasonName} onChange={(e) => setSeasonPricing({ ...seasonPricing, seasonName: e.target.value })}
                placeholder="Season 35 - April 2026" className="w-full sm:w-80 bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
              {seasonPricing.phases.map((phase, idx) => (
                <div key={phase.id} className={`rounded-xl border p-3 sm:p-4 space-y-3 min-w-0 ${phase.id === "early" ? "border-red-500/30 bg-red-500/5" : phase.id === "mid" ? "border-blue-500/30 bg-blue-500/5" : "border-green-500/30 bg-green-500/5"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${phase.id === "early" ? "text-red-400" : phase.id === "mid" ? "text-blue-400" : "text-green-400"}`}>
                      {phase.id === "early" ? <Flame className="w-3.5 h-3.5 inline" /> : phase.id === "mid" ? <Zap className="w-3.5 h-3.5 inline" /> : <Target className="w-3.5 h-3.5 inline" />}{" "}{phase.label}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${phase.multiplier > 1 ? "text-red-400" : phase.multiplier < 1 ? "text-green-400" : "text-blue-400"}`}>
                      ×{phase.multiplier}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">Tanggal Mulai</label>
                    <input type="date" value={phase.startDate} onChange={(e) => {
                      const next = { ...seasonPricing, phases: seasonPricing.phases.map((p, i) => i === idx ? { ...p, startDate: e.target.value } : p) };
                      setSeasonPricing(next);
                    }} onBlur={() => saveSeasonPricing(seasonPricing)} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">Multiplier Harga</label>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.05" min="0.5" max="2" value={phase.multiplier} onChange={(e) => {
                        const val = Math.min(2, Math.max(0.5, parseFloat(e.target.value) || 1));
                        const next = { ...seasonPricing, phases: seasonPricing.phases.map((p, i) => i === idx ? { ...p, multiplier: val } : p) };
                        setSeasonPricing(next);
                      }} onBlur={() => saveSeasonPricing(seasonPricing)} className="w-20 bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none font-mono" />
                      <span className="text-text-muted text-[10px]">
                        {phase.multiplier > 1 ? `+${Math.round((phase.multiplier - 1) * 100)}% dari harga dasar` : phase.multiplier < 1 ? `${Math.round((1 - phase.multiplier) * 100)}% diskon` : "Harga normal"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2 space-y-1">
                    <p className="text-[10px] text-text-muted font-semibold">Preview (Per Star):</p>
                    {perStarPricing.slice(0, 4).map(tier => (
                      <div key={tier.id} className="flex justify-between text-[10px]">
                        <span className="text-text-muted">{tier.name}</span>
                        <span className="text-text font-mono">{formatRupiah(Math.round(tier.price * phase.multiplier))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-background/50 rounded-lg p-3 mb-2">
              <p className="text-[10px] text-text-muted font-semibold mb-1"><Lightbulb className="w-3 h-3 inline mr-1" />Rekomendasi pembagian season ML (~90 hari):</p>
              <div className="flex flex-wrap gap-3 text-[10px] text-text-muted">
                <span><strong className="text-red-400">Early:</strong> Hari 1–21 (~3 minggu) — demand tinggi, harga naik</span>
                <span><strong className="text-blue-400">Mid:</strong> Hari 22–60 (~5-6 minggu) — stabil, harga normal</span>
                <span><strong className="text-green-400">End:</strong> Hari 61–90 (~4 minggu) — push rank akhir, diskon</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <p className="text-text-muted text-[10px]">Harga di halaman order & homepage akan otomatis ×multiplier sesuai fase aktif saat ini.</p>
              <button onClick={() => saveSeasonPricing(seasonPricing)} disabled={seasonSaving}
                className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                {seasonSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : seasonSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {seasonSaved ? "Tersimpan!" : "Simpan Season"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== PAKET MODE ===== */}
      {pricingMode === "paket" && (
        <>
          {pricingCatalog.length === 0 ? (
            <div className="bg-surface rounded-xl border border-white/5 p-12 text-center">
              <Package className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm mb-3">Belum ada data pricing di database.</p>
              <p className="text-text-muted text-xs mb-4">Klik tombol di bawah untuk mengimpor pricing dari order page ke database agar bisa diedit via dashboard.</p>
              <button
                onClick={async () => {
                  const res = await fetch("/api/admin/settings?key=pricing_catalog");
                  const d = await res.json();
                  if (!d.value) { toast("Jalankan seed-pricing.js atau tambah kategori baru."); }
                }}
                className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm hover:bg-accent/20 transition"
              >
                Refresh Data
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2 items-center snap-x scroll-smooth">
                {pricingCatalog.map((cat) => (
                  <button key={cat.id} onClick={() => setActivePricingCat(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start ${activePricingCat === cat.id ? "gradient-primary text-white shadow-lg shadow-accent/20" : "bg-surface border border-white/5 text-text-muted hover:text-text"}`}>
                    {cat.title}<span className="ml-1.5 opacity-60">({cat.packages.length})</span>
                  </button>
                ))}
                <button onClick={() => setShowAddCat(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border border-dashed border-accent/30 text-accent hover:bg-accent/10 transition-all flex items-center gap-1 flex-shrink-0">
                  <Plus className="w-3 h-3" /> Kategori
                </button>
              </div>

              {showAddCat && (
                <div className="bg-surface rounded-xl border border-accent/20 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-text">Tambah Kategori Baru</h4>
                  <input type="text" value={addCatForm.title} onChange={(e) => setAddCatForm({ title: e.target.value })}
                    placeholder="Nama kategori, mis: Paket Spesial" className="w-full sm:w-80 bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                  <div className="flex gap-2">
                    <button onClick={addCategory} className="px-4 py-2 gradient-primary rounded-lg text-white text-xs font-medium">Tambah</button>
                    <button onClick={() => setShowAddCat(false)} className="px-4 py-2 bg-white/5 rounded-lg text-text-muted text-xs">Batal</button>
                  </div>
                </div>
              )}

              {pricingCatalog.filter(c => c.id === activePricingCat).map((cat) => (
                <div key={cat.id} className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text">{cat.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{cat.packages.length} paket</span>
                      {cat.packages.length === 0 && (
                        <button onClick={() => { if (confirm(`Hapus kategori "${cat.title}"?`)) deleteCategory(cat.id); }}
                          className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" title="Hapus kategori">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Paket</th>
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Rank</th>
                          <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga</th>
                          <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga Coret</th>
                          <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Diskon</th>
                          <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.packages.map((pkg) => (
                          <tr key={pkg.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5">
                              {editPkgTitle === pkg.id ? (
                                <div className="flex items-center gap-1">
                                  <input type="text" value={editPkgTitleValue} onChange={(e) => setEditPkgTitleValue(e.target.value)}
                                    className="w-40 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text focus:outline-none" autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") saveEditPkgTitle(cat.id, pkg.id); if (e.key === "Escape") setEditPkgTitle(null); }} />
                                  <button onClick={() => saveEditPkgTitle(cat.id, pkg.id)} className="p-0.5 rounded bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3" /></button>
                                  <button onClick={() => setEditPkgTitle(null)} className="p-0.5 rounded bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <span className="text-text text-xs font-medium cursor-pointer hover:text-accent transition" onClick={() => { setEditPkgTitle(pkg.id); setEditPkgTitleValue(pkg.title); }}>{pkg.title}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5"><span className="text-accent text-xs">{rankLabel(pkg.currentRank)} → {rankLabel(pkg.targetRank)}</span></td>
                            <td className="px-4 py-2.5 text-right">
                              {editingPriceId === pkg.id ? (
                                <input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-28 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" autoFocus />
                              ) : <span className="text-text text-xs font-medium font-mono">{formatRupiah(pkg.price)}</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {editingPriceId === pkg.id ? (
                                <input type="number" value={editOriginalPrice} onChange={(e) => setEditOriginalPrice(e.target.value)} placeholder="Opsional" className="w-28 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" />
                              ) : <span className="text-text-muted text-xs line-through font-mono">{pkg.originalPrice ? formatRupiah(pkg.originalPrice) : "-"}</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {pkg.discountPercent ? <span className="text-green-400 text-xs font-medium">-{pkg.discountPercent}%</span> : <span className="text-text-muted text-xs">-</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {editingPriceId === pkg.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => saveEditPrice(cat.id, pkg.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setEditingPriceId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"><XCircle className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => startEditPrice(pkg)} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition" title="Edit harga"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => { if (confirm(`Hapus paket "${pkg.title}"?`)) deletePackage(cat.id, pkg.id); }} className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" title="Hapus paket"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {showAddPkg && activePricingCat === cat.id ? (
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] space-y-3">
                      <h4 className="text-xs font-semibold text-text">Tambah Paket Baru</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] text-text-muted mb-1">Nama Paket</label>
                          <input type="text" value={addPkgForm.title} onChange={(e) => setAddPkgForm(f => ({ ...f, title: e.target.value }))} placeholder="GM V - Mythic Honor" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted mb-1">Rank Awal</label>
                          <select value={addPkgForm.currentRank} onChange={(e) => setAddPkgForm(f => ({ ...f, currentRank: e.target.value }))} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none">
                            {RANKS.map(r => <option key={r} value={r}>{rankLabel(r)}</option>)}
                            <option value="mythicgrading">Mythic Grading</option>
                            <option value="mythichonor">Mythic Honor</option>
                            <option value="mythicimmortal">Mythic Immortal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted mb-1">Rank Tujuan</label>
                          <select value={addPkgForm.targetRank} onChange={(e) => setAddPkgForm(f => ({ ...f, targetRank: e.target.value }))} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none">
                            {RANKS.map(r => <option key={r} value={r}>{rankLabel(r)}</option>)}
                            <option value="mythicgrading">Mythic Grading</option>
                            <option value="mythichonor">Mythic Honor</option>
                            <option value="mythicimmortal">Mythic Immortal</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-text-muted mb-1">Harga</label>
                            <input type="number" value={addPkgForm.price} onChange={(e) => setAddPkgForm(f => ({ ...f, price: e.target.value }))} placeholder="125000" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-muted mb-1">Harga Coret</label>
                            <input type="number" value={addPkgForm.originalPrice} onChange={(e) => setAddPkgForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="Opsional" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addPackageToCategory(cat.id)} className="px-4 py-2 gradient-primary rounded-lg text-white text-xs font-medium">Tambah Paket</button>
                        <button onClick={() => setShowAddPkg(false)} className="px-4 py-2 bg-white/5 rounded-lg text-text-muted text-xs">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-t border-white/5">
                      <button onClick={() => { setShowAddPkg(true); setAddPkgForm({ title: "", price: "", originalPrice: "", currentRank: "warrior", targetRank: "epic" }); }} className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition">
                        <Plus className="w-3.5 h-3.5" /> Tambah Paket
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ===== PER STAR MODE ===== */}
      {pricingMode === "perstar" && (
        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Harga Per Bintang</h3>
            <span className="text-xs text-text-muted">{perStarPricing.length} tier</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Tier Rank</th>
                  <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga/Star</th>
                  <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga Coret</th>
                  <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Diskon</th>
                  <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Max Stars</th>
                  <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Tipe Harga</th>
                  <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {perStarPricing.map((tier) => (
                  <tr key={tier.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Image src={tier.icon} alt={tier.name} width={24} height={24} className="w-6 h-6 object-contain" />
                        <span className="text-text text-xs font-medium">{tier.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {editingPriceId === tier.id ? (
                        <input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-28 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" autoFocus />
                      ) : <span className="text-text text-xs font-medium font-mono">{formatRupiah(tier.price)}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {editingPriceId === tier.id ? (
                        <input type="number" value={editOriginalPrice} onChange={(e) => setEditOriginalPrice(e.target.value)} placeholder="Opsional" className="w-28 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" />
                      ) : <span className="text-text-muted text-xs line-through font-mono">{tier.originalPrice ? formatRupiah(tier.originalPrice) : "-"}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {tier.discountPercent ? <span className="text-green-400 text-xs font-medium">-{tier.discountPercent}%</span> : <span className="text-text-muted text-xs">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input type="number" min="1" max="100" defaultValue={tier.maxStars ?? 25} onBlur={(e) => { const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 25)); if (val !== (tier.maxStars ?? 25)) { const nt = perStarPricing.map(t => t.id === tier.id ? { ...t, maxStars: val } : t); setPerStarPricing(nt); savePerStarPricing(nt); } }} className="w-16 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-center focus:border-accent focus:outline-none" />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => {
                        const newTiers = perStarPricing.map(t => t.id === tier.id ? { ...t, isFlat: !t.isFlat } : t);
                        setPerStarPricing(newTiers); savePerStarPricing(newTiers);
                      }} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${tier.isFlat ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"}`}
                        title={tier.isFlat ? "Harga flat (tidak dikali quantity)" : "Harga per star (dikali quantity)"}>
                        {tier.isFlat ? "FLAT" : "PER STAR"}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {editingPriceId === tier.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => saveEditPerStar(tier.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingPriceId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"><XCircle className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEditPerStar(tier)} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition"><Pencil className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== GENDONG MODE ===== */}
      {pricingMode === "gendong" && (
        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Harga Joki Gendong (Duo Boost)</h3>
            <span className="text-xs text-text-muted">{gendongPricing.length} tier</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Tier Rank</th>
                  <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga/Star</th>
                  <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga Coret</th>
                  <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Diskon</th>
                  <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {gendongPricing.map((tier) => (
                  <tr key={tier.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Image src={tier.icon} alt={tier.name} width={24} height={24} className="w-6 h-6 object-contain" />
                        <span className="text-text text-xs font-medium">{tier.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {editingPriceId === `gendong-${tier.id}` ? (
                        <input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-28 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" autoFocus />
                      ) : <span className="text-text text-xs font-medium font-mono">{formatRupiah(tier.price)}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {editingPriceId === `gendong-${tier.id}` ? (
                        <input type="number" value={editOriginalPrice} onChange={(e) => setEditOriginalPrice(e.target.value)} placeholder="Opsional" className="w-28 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" />
                      ) : <span className="text-text-muted text-xs line-through font-mono">{tier.originalPrice ? formatRupiah(tier.originalPrice) : "-"}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {tier.discountPercent ? <span className="text-green-400 text-xs font-medium">-{tier.discountPercent}%</span> : <span className="text-text-muted text-xs">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {editingPriceId === `gendong-${tier.id}` ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => saveEditGendong(tier.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingPriceId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"><XCircle className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingPriceId(`gendong-${tier.id}`); setEditPriceValue(String(tier.price)); setEditOriginalPrice(String(tier.originalPrice || "")); }} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition"><Pencil className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== CLASSIC MODE ===== */}
      {pricingMode === "classic" && (
        <>
          {classicPricing.length === 0 ? (
            <div className="bg-surface rounded-xl border border-white/5 p-12 text-center">
              <Crown className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm mb-3">Belum ada data pricing classic.</p>
              <button onClick={() => setShowAddCat(true)} className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm hover:bg-accent/20 transition">+ Buat Kategori Classic</button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2 items-center snap-x scroll-smooth">
                {classicPricing.map((cat) => (
                  <button key={cat.id} onClick={() => setActiveClassicCat(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start ${activeClassicCat === cat.id ? "gradient-primary text-white shadow-lg shadow-accent/20" : "bg-surface border border-white/5 text-text-muted hover:text-text"}`}>
                    {cat.title}<span className="ml-1.5 opacity-60">({cat.packages.length})</span>
                  </button>
                ))}
                <button onClick={() => setShowAddCat(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border border-dashed border-accent/30 text-accent hover:bg-accent/10 transition-all flex items-center gap-1 flex-shrink-0">
                  <Plus className="w-3 h-3" /> Kategori
                </button>
              </div>

              {showAddCat && (
                <div className="bg-surface rounded-xl border border-accent/20 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-text">Tambah Kategori Classic Baru</h4>
                  <input type="text" value={addCatForm.title} onChange={(e) => setAddCatForm({ title: e.target.value })}
                    placeholder="Nama kategori, mis: Paket 10 Win" className="w-full sm:w-80 bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                  <div className="flex gap-2">
                    <button onClick={addClassicCategory} className="px-4 py-2 gradient-primary rounded-lg text-white text-xs font-medium">Tambah</button>
                    <button onClick={() => setShowAddCat(false)} className="px-4 py-2 bg-white/5 rounded-lg text-text-muted text-xs">Batal</button>
                  </div>
                </div>
              )}

              {classicPricing.filter(c => c.id === activeClassicCat).map((cat) => (
                <div key={cat.id} className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text">{cat.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{cat.packages.length} paket</span>
                      {cat.packages.length === 0 && (
                        <button onClick={() => { if (confirm(`Hapus kategori "${cat.title}"?`)) deleteClassicCategory(cat.id); }} className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" title="Hapus kategori"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5">Paket</th>
                          <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga</th>
                          <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Harga Coret</th>
                          <th className="text-right text-text-muted text-xs font-medium px-4 py-2.5">Diskon</th>
                          <th className="text-center text-text-muted text-xs font-medium px-4 py-2.5">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.packages.map((pkg) => (
                          <tr key={pkg.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5">
                              {editPkgTitle === pkg.id ? (
                                <div className="flex items-center gap-1">
                                  <input type="text" value={editPkgTitleValue} onChange={(e) => setEditPkgTitleValue(e.target.value)} className="w-40 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text focus:outline-none" autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") saveEditClassicPkgTitle(cat.id, pkg.id); if (e.key === "Escape") setEditPkgTitle(null); }} />
                                  <button onClick={() => saveEditClassicPkgTitle(cat.id, pkg.id)} className="p-0.5 rounded bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3" /></button>
                                  <button onClick={() => setEditPkgTitle(null)} className="p-0.5 rounded bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <span className="text-text text-xs font-medium cursor-pointer hover:text-accent transition" onClick={() => { setEditPkgTitle(pkg.id); setEditPkgTitleValue(pkg.title); }}>{pkg.title}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {editingPriceId === pkg.id ? (
                                <input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-28 bg-background border border-accent/50 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" autoFocus />
                              ) : <span className="text-text text-xs font-medium font-mono">{formatRupiah(pkg.price)}</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {editingPriceId === pkg.id ? (
                                <input type="number" value={editOriginalPrice} onChange={(e) => setEditOriginalPrice(e.target.value)} placeholder="Opsional" className="w-28 bg-background border border-white/10 rounded px-2 py-1 text-xs text-text text-right focus:outline-none" />
                              ) : <span className="text-text-muted text-xs line-through font-mono">{pkg.originalPrice ? formatRupiah(pkg.originalPrice) : "-"}</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {pkg.discountPercent ? <span className="text-green-400 text-xs font-medium">-{pkg.discountPercent}%</span> : <span className="text-text-muted text-xs">-</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {editingPriceId === pkg.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => saveEditClassicPrice(cat.id, pkg.id)} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setEditingPriceId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"><XCircle className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => startEditPrice(pkg)} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition" title="Edit harga"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => { if (confirm(`Hapus paket "${pkg.title}"?`)) deleteClassicPackage(cat.id, pkg.id); }} className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" title="Hapus paket"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {showAddPkg && activeClassicCat === cat.id ? (
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] space-y-3">
                      <h4 className="text-xs font-semibold text-text">Tambah Paket Classic Baru</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-text-muted mb-1">Nama Paket</label>
                          <input type="text" value={addPkgForm.title} onChange={(e) => setAddPkgForm(f => ({ ...f, title: e.target.value }))} placeholder="Classic Warrior V" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted mb-1">Harga</label>
                          <input type="number" value={addPkgForm.price} onChange={(e) => setAddPkgForm(f => ({ ...f, price: e.target.value }))} placeholder="50000" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted mb-1">Harga Coret</label>
                          <input type="number" value={addPkgForm.originalPrice} onChange={(e) => setAddPkgForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="Opsional" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-text text-xs focus:border-accent focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addClassicPackageToCategory(cat.id)} className="px-4 py-2 gradient-primary rounded-lg text-white text-xs font-medium">Tambah Paket</button>
                        <button onClick={() => setShowAddPkg(false)} className="px-4 py-2 bg-white/5 rounded-lg text-text-muted text-xs">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-t border-white/5">
                      <button onClick={() => { setShowAddPkg(true); setAddPkgForm({ title: "", price: "", originalPrice: "", currentRank: "", targetRank: "" }); }} className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition">
                        <Plus className="w-3.5 h-3.5" /> Tambah Paket
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}