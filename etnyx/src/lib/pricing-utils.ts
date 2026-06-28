/**
 * Shared pricing & rank utilities — used by /order and /calculator
 * Single source of truth for rank configs, star calculations, and package matching.
 */

// ===== Rank Definitions =====

export const RANK_LIST: { id: string; label: string }[] = [
  { id: "warrior", label: "Warrior" },
  { id: "elite", label: "Elite" },
  { id: "master", label: "Master" },
  { id: "grandmaster", label: "Grand Master" },
  { id: "epic", label: "Epic" },
  { id: "legend", label: "Legend" },
  { id: "mythicgrading", label: "Mythic Grading" },
  { id: "mythic", label: "Mythic" },
  { id: "mythichonor", label: "Mythic Honor" },
  { id: "mythicglory", label: "Mythic Glory" },
  { id: "mythicimmortal", label: "Mythic Immortal" },
];

export const RANK_ORDER: string[] = RANK_LIST.map((r) => r.id);

// Ranks that have subdivisions (divisions)
export const RANKS_WITH_STARS = [
  "warrior",
  "elite",
  "master",
  "grandmaster",
  "epic",
  "legend",
];

// Rank config: divisions count and stars per division (ML actual system)
export const RANK_DIVISION_CONFIG: Record<
  string,
  { divisions: number; starsPerDiv: number }
> = {
  warrior: { divisions: 3, starsPerDiv: 3 }, // III, II, I — 3 stars per division
  elite: { divisions: 3, starsPerDiv: 4 }, // III, II, I — 4 stars per division
  master: { divisions: 4, starsPerDiv: 4 }, // IV, III, II, I — 4 stars per division
  grandmaster: { divisions: 5, starsPerDiv: 5 }, // V–I — 5 stars per division
  epic: { divisions: 5, starsPerDiv: 5 },
  legend: { divisions: 5, starsPerDiv: 5 },
};

// Mythic+ star ranges
export const MYTHIC_STAR_CONFIG: Record<
  string,
  { min: number; max: number; label: string }
> = {
  mythicgrading: { min: 0, max: 10, label: "Match" },
  mythic: { min: 0, max: 25, label: "Stars" },
  mythichonor: { min: 25, max: 49, label: "Stars" },
  mythicglory: { min: 50, max: 99, label: "Stars" },
  mythicimmortal: { min: 100, max: 999, label: "Stars" },
};

// Rank tier icon images
export const rankIcons: Record<string, string> = {
  warrior: "/icons-tier/Warrior.webp",
  elite: "/icons-tier/Elite.webp",
  master: "/icons-tier/Master.webp",
  grandmaster: "/icons-tier/Grandmaster.webp",
  epic: "/icons-tier/Epic.webp",
  legend: "/icons-tier/Legend.webp",
  mythic: "/icons-tier/Mythic.webp",
  mythicgrading: "/icons-tier/Mythic.webp",
  mythichonor: "/icons-tier/Mythical_Honor.webp",
  mythicglory: "/icons-tier/Mythical_Glory.webp",
  mythicimmortal: "/icons-tier/Mythical_Immortal.webp",
};

// Division labels
const DIVISION_LABELS = ["I", "II", "III", "IV", "V"];

// ===== Types =====

export interface PackageCategory {
  id: string;
  title: string;
  packages: ProductPackage[];
}

export interface ProductPackage {
  id: string;
  title: string;
  price: number;
  rankKey: string;
  currentRank: string;
  targetRank: string;
  originalPrice?: number;
  discountPercent?: number;
  currentDivision?: number;
  targetDivision?: number;
}

export interface PerStarRank {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  icon: string;
  maxStars: number;
}

// ===== Helper Functions =====

/** Get division options based on rank (dynamic) */
export function getDivisionOptions(
  rankId: string
): { value: number; label: string }[] {
  const config = RANK_DIVISION_CONFIG[rankId];
  if (!config) return [];
  const options: { value: number; label: string }[] = [];
  for (let i = config.divisions; i >= 1; i--) {
    options.push({ value: i, label: DIVISION_LABELS[i - 1] });
  }
  return options;
}

/** Combined rank+division options for dropdown (e.g. "Epic V", "Epic IV", ...) */
export function getRankDivisionOptions(): {
  value: string;
  label: string;
  rankId: string;
  division: number;
}[] {
  const options: {
    value: string;
    label: string;
    rankId: string;
    division: number;
  }[] = [];
  for (const rank of RANK_LIST) {
    if (RANKS_WITH_STARS.includes(rank.id)) {
      const cfg = RANK_DIVISION_CONFIG[rank.id];
      if (!cfg) continue;
      for (let d = cfg.divisions; d >= 1; d--) {
        options.push({
          value: `${rank.id}:${d}`,
          label: `${rank.label} ${DIVISION_LABELS[d - 1]}`,
          rankId: rank.id,
          division: d,
        });
      }
    } else {
      options.push({
        value: rank.id,
        label: rank.label,
        rankId: rank.id,
        division: 0,
      });
    }
  }
  return options;
}

/**
 * Calculate total stars between current rank+division and target rank+division.
 * Uses ML's actual rank system: higher division number = lower tier (V is lowest, I is highest).
 */
export function calculateTotalStars(
  currentRank: string,
  currentDiv: number,
  targetRank: string,
  targetDiv: number,
  currentDivisionStar: number = 0,
  targetDivisionStar: number = 0
): number {
  const ci = RANK_ORDER.indexOf(currentRank);
  const ti = RANK_ORDER.indexOf(targetRank);
  if (ci < 0 || ti < 0 || ci >= ti) {
    // Same rank: calculate within-rank stars
    if (ci === ti && RANKS_WITH_STARS.includes(currentRank)) {
      const cfg = RANK_DIVISION_CONFIG[currentRank];
      if (cfg && currentDiv > targetDiv) {
        // Moving from higher division number to lower (V → I = progress)
        const divDiff = currentDiv - targetDiv;
        return divDiff * cfg.starsPerDiv - currentDivisionStar + targetDivisionStar;
      }
    }
    return 0;
  }

  let stars = 0;

  // Stars remaining in current rank (from current division to I)
  if (RANKS_WITH_STARS.includes(currentRank)) {
    const cfg = RANK_DIVISION_CONFIG[currentRank];
    if (cfg) {
      // Stars needed to clear current division
      stars += (cfg.starsPerDiv - currentDivisionStar);
      // Stars for remaining divisions in current rank (div-1 down to 1)
      if (currentDiv > 1) {
        stars += (currentDiv - 1) * cfg.starsPerDiv;
      }
    }
  }

  // Full ranks in between
  for (let i = ci + 1; i < ti; i++) {
    const rank = RANK_ORDER[i];
    const cfg = RANK_DIVISION_CONFIG[rank];
    if (cfg) {
      stars += cfg.divisions * cfg.starsPerDiv;
    } else {
      // Mythic tiers: use actual star range from config
      const mythicCfg = MYTHIC_STAR_CONFIG[rank];
      if (mythicCfg) {
        stars += mythicCfg.max - mythicCfg.min;
      }
    }
  }

  // Stars needed in target rank
  if (RANKS_WITH_STARS.includes(targetRank)) {
    const cfg = RANK_DIVISION_CONFIG[targetRank];
    if (cfg) {
      // Target division: e.g. if target is Legend V(5), need 0 extra stars
      // If target is Legend I(1), need (divisions-1)*starsPerDiv + targetDivisionStar
      stars += (cfg.divisions - targetDiv) * cfg.starsPerDiv + targetDivisionStar;
    }
  } else {
    // Mythic target: stars = targetStar - min
    const mythicCfg = MYTHIC_STAR_CONFIG[targetRank];
    if (mythicCfg) {
      stars += targetDivisionStar - mythicCfg.min;
    }
  }

  return Math.max(0, stars);
}

/**
 * Find the best matching package from catalog for given rank params.
 * Priority: exact division match → exact rank match → nearest covering package.
 */
export function findBestPackage(
  catalog: PackageCategory[],
  currentRank: string,
  currentDiv: number,
  targetRank: string,
  targetDiv: number
): { pkg: ProductPackage; cat: PackageCategory; exact: boolean } | null {
  // 1. Try exact rank + division match
  const allPkgs = catalog.flatMap((cat) =>
    cat.packages.map((pkg) => ({ pkg, cat }))
  );

  // Exact rank + division match
  const exactMatch = allPkgs.find(
    ({ pkg }) =>
      pkg.currentRank === currentRank &&
      pkg.targetRank === targetRank &&
      pkg.currentDivision === currentDiv &&
      pkg.targetDivision === targetDiv
  );
  if (exactMatch) return { ...exactMatch, exact: true };

  // Exact rank match (any division)
  const rankMatch = allPkgs.filter(
    ({ pkg }) =>
      pkg.currentRank === currentRank && pkg.targetRank === targetRank
  );
  if (rankMatch.length > 0) {
    // Pick the one closest to the current division
    const sorted = rankMatch.sort((a, b) => {
      const aDiff = a.pkg.currentDivision
        ? Math.abs(a.pkg.currentDivision - currentDiv)
        : 99;
      const bDiff = b.pkg.currentDivision
        ? Math.abs(b.pkg.currentDivision - currentDiv)
        : 99;
      return aDiff - bDiff;
    });
    return { ...sorted[0], exact: false };
  }

  // Nearest covering package
  const ci = RANK_ORDER.indexOf(currentRank);
  const ti = RANK_ORDER.indexOf(targetRank);
  const covering = allPkgs.filter(({ pkg }) => {
    const pkgCi = RANK_ORDER.indexOf(pkg.currentRank);
    const pkgTi = RANK_ORDER.indexOf(pkg.targetRank);
    return pkgCi <= ci && pkgTi >= ti;
  });
  if (covering.length > 0) {
    const sorted = covering.sort((a, b) => {
      const aCi = RANK_ORDER.indexOf(a.pkg.currentRank);
      const aTi = RANK_ORDER.indexOf(a.pkg.targetRank);
      const bCi = RANK_ORDER.indexOf(b.pkg.currentRank);
      const bTi = RANK_ORDER.indexOf(b.pkg.targetRank);
      // Prefer tighter coverage
      const aRange = aTi - aCi;
      const bRange = bTi - bCi;
      return aRange - bRange;
    });
    return { ...sorted[0], exact: false };
  }

  return null;
}

/** Format currency as Indonesian Rupiah */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Build a WhatsApp-ready message for a calculated order */
export function buildWhatsAppMessage(params: {
  currentRankLabel: string;
  targetRankLabel: string;
  totalStars: number;
  price: number;
  orderType: "paket" | "perstar" | "gendong";
  express?: boolean;
  premium?: boolean;
}): string {
  const { currentRankLabel, targetRankLabel, totalStars, price, orderType, express, premium } = params;
  const typeLabel =
    orderType === "paket" ? "Joki Paket" : orderType === "perstar" ? "Joki Per Bintang" : "Joki Gendong";

  const addons: string[] = [];
  if (express) addons.push("Express (+20%)");
  if (premium) addons.push("Premium Pilot (+30%)");

  const lines = [
    `Halo Kak ETNYX, saya mau order ${typeLabel}`,
    ``,
    `Detail Order:`,
    `Rank Awal: ${currentRankLabel}`,
    `Rank Tujuan: ${targetRankLabel}`,
    `Total Bintang: ${totalStars}`,
    ...(addons.length > 0 ? [`Add-on: ${addons.join(", ")}`] : []),
    ``,
    `Total Harga: ${formatRupiah(price)}`,
    ``,
    `Mohon info lanjutan ya Kak 🙏`,
  ];

  return lines.join("\n");
}