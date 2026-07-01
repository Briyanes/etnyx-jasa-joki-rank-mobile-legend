/**
 * PRICING ENGINE — Single Source of Truth
 * ========================================
 *
 * All rank configs, star math, and price calculations live here.
 * Both frontend (pricing-utils.ts) and backend (api/customer/order/route.ts)
 * import from this file to guarantee zero drift.
 *
 * CRITICAL: Mythic tier transitions use `nextMin` (promotion threshold),
 * NOT `max` (displayable max). Using `max` causes off-by-one bugs.
 * e.g. Honor max=49 but you need 50★ to promote to Glory.
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

export const RANKS_WITH_STARS = [
  "warrior",
  "elite",
  "master",
  "grandmaster",
  "epic",
  "legend",
];

export const RANK_DIVISION_CONFIG: Record<
  string,
  { divisions: number; starsPerDiv: number }
> = {
  warrior: { divisions: 3, starsPerDiv: 3 },
  elite: { divisions: 3, starsPerDiv: 4 },
  master: { divisions: 4, starsPerDiv: 4 },
  grandmaster: { divisions: 5, starsPerDiv: 5 },
  epic: { divisions: 5, starsPerDiv: 5 },
  legend: { divisions: 5, starsPerDiv: 5 },
};

/**
 * Mythic+ star ranges.
 * - `min`/`max`: star range shown in the UI selector (inclusive displayable).
 * - `nextMin`: threshold to ADVANCE to the next tier (used for star math).
 *
 * Why nextMin ≠ max: for Honor, the highest displayable star is 49 (`max`),
 * but you actually need 50★ to promote to Glory (`nextMin`). Using `max`
 * for promotion math caused an off-by-one that undercounted total stars
 * across Mythic tiers (e.g. Honor 25 → Immortal 100 returned 73, not 75).
 */
export const MYTHIC_STAR_CONFIG: Record<
  string,
  { min: number; max: number; nextMin: number; label: string }
> = {
  mythicgrading: { min: 0, max: 10, nextMin: 10, label: "Match" },
  mythic: { min: 0, max: 25, nextMin: 25, label: "Stars" },
  mythichonor: { min: 25, max: 49, nextMin: 50, label: "Stars" },
  mythicglory: { min: 50, max: 99, nextMin: 100, label: "Stars" },
  mythicimmortal: { min: 100, max: 999, nextMin: 1000, label: "Stars" },
};

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
  isFlat?: boolean;
}

// ===== Default Pricing Data (Single Source of Truth) =====

export const MYTHIC_PER_STAR_PRICES: Record<string, number> = {
  mythicgrading: 23000,
  mythic: 19000,
  mythichonor: 24000,
  mythicglory: 27000,
  mythicimmortal: 30000,
};

export const DEFAULT_PER_STAR_RANKS: PerStarRank[] = [
  { id: "master", name: "Master", price: 5000, icon: "/icons-tier/Master.webp", maxStars: 25 },
  { id: "grandmaster", name: "Grand Master", price: 6000, icon: "/icons-tier/Grandmaster.webp", maxStars: 25 },
  { id: "epic", name: "Epic", price: 7000, icon: "/icons-tier/Epic.webp", maxStars: 25 },
  { id: "legend", name: "Legend", price: 8000, icon: "/icons-tier/Legend.webp", maxStars: 25 },
  { id: "grading", name: "Mythic Grading", price: 230000, icon: "/icons-tier/Mythic.webp", maxStars: 10, isFlat: true },
  { id: "mythicromawi", name: "Mythic Romawi", price: 19000, icon: "/icons-tier/Mythic.webp", maxStars: 25 },
  { id: "honor", name: "Mythical Honor", price: 24000, icon: "/icons-tier/Mythical_Honor.webp", maxStars: 25 },
  { id: "glory", name: "Mythical Glory", price: 27000, icon: "/icons-tier/Mythical_Glory.webp", maxStars: 50 },
  { id: "immortal", name: "Mythical Immortal", price: 30000, icon: "/icons-tier/Mythical_Immortal.webp", maxStars: 100 },
];

export const DEFAULT_GENDONG_RANKS: PerStarRank[] = [
  { id: "grandmaster", name: "Grand Master", price: 9000, originalPrice: 11000, discountPercent: 18, icon: "/icons-tier/Grandmaster.webp", maxStars: 25 },
  { id: "epic", name: "Epic", price: 10000, originalPrice: 12000, discountPercent: 17, icon: "/icons-tier/Epic.webp", maxStars: 25 },
  { id: "legend", name: "Legend", price: 11000, originalPrice: 13000, discountPercent: 15, icon: "/icons-tier/Legend.webp", maxStars: 25 },
  { id: "grading", name: "Mythic Grading", price: 23000, originalPrice: 26000, discountPercent: 12, icon: "/icons-tier/Mythic.webp", maxStars: 10 },
  { id: "mythic", name: "Mythic", price: 21000, originalPrice: 24000, discountPercent: 13, icon: "/icons-tier/Mythic.webp", maxStars: 25 },
  { id: "honor", name: "Mythic Honor", price: 25000, originalPrice: 28000, discountPercent: 11, icon: "/icons-tier/Mythical_Honor.webp", maxStars: 25 },
  { id: "glory", name: "Mythic Glory", price: 30000, originalPrice: 34000, discountPercent: 12, icon: "/icons-tier/Mythical_Glory.webp", maxStars: 50 },
  { id: "immortal", name: "Mythic Immortal", price: 35000, originalPrice: 40000, discountPercent: 13, icon: "/icons-tier/Mythical_Immortal.webp", maxStars: 100 },
];

export const DEFAULT_CATALOG: PackageCategory[] = [
  {
    id: "promo",
    title: "Paket Rush 10 Star",
    packages: [
      { id: "rush5-epic", title: "Rush 5 Star Epic", price: 32000, originalPrice: 35000, discountPercent: 9, rankKey: "epic", currentRank: "epic", targetRank: "epic" },
      { id: "rush5-legend", title: "Rush 5 Star Legend", price: 37000, originalPrice: 40000, discountPercent: 8, rankKey: "legend", currentRank: "legend", targetRank: "legend" },
      { id: "rush9-epic", title: "Rush 9 Star Epic + Bonus 1", price: 58000, originalPrice: 70000, discountPercent: 17, rankKey: "epic", currentRank: "epic", targetRank: "epic" },
      { id: "rush9-legend", title: "Rush 9 Star Legend + Bonus 1", price: 68000, originalPrice: 80000, discountPercent: 15, rankKey: "legend", currentRank: "legend", targetRank: "legend" },
      { id: "rush5-mythic", title: "Rush 5 Star Mythic", price: 95000, originalPrice: 105000, discountPercent: 10, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "rush5-honor", title: "Rush 5 Star Honor", price: 105000, originalPrice: 115000, discountPercent: 9, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
      { id: "rush5-glory", title: "Rush 5 Star Glory", price: 130000, originalPrice: 137000, discountPercent: 5, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
      { id: "rush9-mythic", title: "Rush 9 Star Mythic + Bonus 1", price: 171000, originalPrice: 211000, discountPercent: 19, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "rush9-honor", title: "Rush 9 Star Honor + Bonus 1", price: 189000, originalPrice: 230000, discountPercent: 18, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
      { id: "rush9-glory", title: "Rush 9 Star Glory + Bonus 1", price: 234000, originalPrice: 275000, discountPercent: 15, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
    ],
  },
  {
    id: "paket-warrior",
    title: "Paket Warrior",
    packages: [
      { id: "warrior3-elite3", title: "Warrior III - Elite III", price: 25089, rankKey: "warrior", currentRank: "warrior", targetRank: "elite", currentDivision: 3, targetDivision: 3 },
      { id: "warrior3-master4", title: "Warrior III - Master IV", price: 70089, rankKey: "warrior", currentRank: "warrior", targetRank: "master", currentDivision: 3, targetDivision: 4 },
      { id: "warrior3-gm5", title: "Warrior III - GM V", price: 149089, rankKey: "warrior", currentRank: "warrior", targetRank: "grandmaster", currentDivision: 3, targetDivision: 5 },
      { id: "warrior3-epic5", title: "Warrior III - Epic V", price: 282089, rankKey: "warrior", currentRank: "warrior", targetRank: "epic", currentDivision: 3, targetDivision: 5 },
      { id: "warrior3-legend5", title: "Warrior III - Legend V", price: 459089, rankKey: "warrior", currentRank: "warrior", targetRank: "legend", currentDivision: 3, targetDivision: 5 },
      { id: "warrior1-mythic", title: "Warrior I - Mythic", price: 645089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic", currentDivision: 1 },
      { id: "warrior2-mythic", title: "Warrior II - Mythic", price: 653089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic", currentDivision: 2 },
      { id: "warrior3-mythic", title: "Warrior III - Mythic", price: 660089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic", currentDivision: 3 },
    ],
  },
  {
    id: "paket-elite",
    title: "Paket Elite",
    packages: [
      { id: "elite3-master4", title: "Elite III - Master IV", price: 45089, rankKey: "elite", currentRank: "elite", targetRank: "master", currentDivision: 3, targetDivision: 4 },
      { id: "elite3-gm5", title: "Elite III - GM V", price: 123089, rankKey: "elite", currentRank: "elite", targetRank: "grandmaster", currentDivision: 3, targetDivision: 5 },
      { id: "elite3-epic5", title: "Elite III - Epic V", price: 259089, rankKey: "elite", currentRank: "elite", targetRank: "epic", currentDivision: 3, targetDivision: 5 },
      { id: "elite3-legend5", title: "Elite III - Legend V", price: 435089, rankKey: "elite", currentRank: "elite", targetRank: "legend", currentDivision: 3, targetDivision: 5 },
      { id: "elite1-mythic", title: "Elite I - Mythic", price: 605089, rankKey: "elite", currentRank: "elite", targetRank: "mythic", currentDivision: 1 },
      { id: "elite2-mythic", title: "Elite II - Mythic", price: 620089, rankKey: "elite", currentRank: "elite", targetRank: "mythic", currentDivision: 2 },
      { id: "elite3-mythic", title: "Elite III - Mythic", price: 635089, rankKey: "elite", currentRank: "elite", targetRank: "mythic", currentDivision: 3 },
    ],
  },
  {
    id: "paket-master",
    title: "Paket Master",
    packages: [
      { id: "master4-gm5", title: "Master IV - GM V", price: 78089, rankKey: "master", currentRank: "master", targetRank: "grandmaster", currentDivision: 4, targetDivision: 5 },
      { id: "master4-epic5", title: "Master IV - Epic V", price: 213089, rankKey: "master", currentRank: "master", targetRank: "epic", currentDivision: 4, targetDivision: 5 },
      { id: "master4-legend5", title: "Master IV - Legend V", price: 389089, rankKey: "master", currentRank: "master", targetRank: "legend", currentDivision: 4, targetDivision: 5 },
      { id: "master1-mythic", title: "Master I - Mythic", price: 533089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 1 },
      { id: "master2-mythic", title: "Master II - Mythic", price: 550089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 2 },
      { id: "master3-mythic", title: "Master III - Mythic", price: 570089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 3 },
      { id: "master4-mythic", title: "Master IV - Mythic", price: 590089, rankKey: "master", currentRank: "master", targetRank: "mythic", currentDivision: 4 },
    ],
  },
  {
    id: "paket-gm",
    title: "Paket Grand Master",
    packages: [
      { id: "gm5-epic5", title: "GM V - Epic V", price: 113089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "epic", currentDivision: 5, targetDivision: 5 },
      { id: "gm5-legend5", title: "GM V - Legend V", price: 259089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "legend", currentDivision: 5, targetDivision: 5 },
      { id: "gm1-mythic", title: "GM I - Mythic", price: 338089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 1 },
      { id: "gm2-mythic", title: "GM II - Mythic", price: 360089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 2 },
      { id: "gm3-mythic", title: "GM III - Mythic", price: 383089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 3 },
      { id: "gm4-mythic", title: "GM IV - Mythic", price: 405089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 4 },
      { id: "gm5-mythic", title: "GM V - Mythic", price: 428089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic", currentDivision: 5 },
      { id: "gm1-honor", title: "GM I - Mythic Honor", price: 511089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 1 },
      { id: "gm2-honor", title: "GM II - Mythic Honor", price: 533089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 2 },
      { id: "gm3-honor", title: "GM III - Mythic Honor", price: 556089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 3 },
      { id: "gm4-honor", title: "GM IV - Mythic Honor", price: 578089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 4 },
      { id: "gm5-honor", title: "GM V - Mythic Honor", price: 601089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor", currentDivision: 5 },
      { id: "gm1-glory", title: "GM I - Mythic Glory", price: 983089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory", currentDivision: 1 },
      { id: "gm2-glory", title: "GM II - Mythic Glory", price: 1006089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory", currentDivision: 2 },
      { id: "gm3-glory", title: "GM III - Mythic Glory", price: 1028089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory", currentDivision: 3 },
      { id: "gm4-glory", title: "GM IV - Mythic Glory", price: 1051089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory", currentDivision: 4 },
      { id: "gm5-glory", title: "GM V - Mythic Glory", price: 1073089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory", currentDivision: 5 },
      { id: "gm1-immortal", title: "GM I - Mythic Immortal", price: 2153089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal", currentDivision: 1 },
      { id: "gm2-immortal", title: "GM II - Mythic Immortal", price: 2176089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal", currentDivision: 2 },
      { id: "gm3-immortal", title: "GM III - Mythic Immortal", price: 2198089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal", currentDivision: 3 },
      { id: "gm4-immortal", title: "GM IV - Mythic Immortal", price: 2221089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal", currentDivision: 4 },
      { id: "gm5-immortal", title: "GM V - Mythic Immortal", price: 2243089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal", currentDivision: 5 },
    ],
  },
  {
    id: "paket-epic",
    title: "Paket Epic",
    packages: [
      { id: "epic5-legend5", title: "Epic V - Legend V", price: 146089, rankKey: "epic", currentRank: "epic", targetRank: "legend", currentDivision: 5, targetDivision: 5 },
      { id: "epic1-mythic", title: "Epic I - Mythic", price: 198089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 1 },
      { id: "epic2-mythic", title: "Epic II - Mythic", price: 227089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 2 },
      { id: "epic3-mythic", title: "Epic III - Mythic", price: 257089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 3 },
      { id: "epic4-mythic", title: "Epic IV - Mythic", price: 286089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 4 },
      { id: "epic5-mythic", title: "Epic V - Mythic", price: 315089, rankKey: "epic", currentRank: "epic", targetRank: "mythic", currentDivision: 5 },
      { id: "epic1-honor", title: "Epic I - Mythic Honor", price: 371089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 1 },
      { id: "epic2-honor", title: "Epic II - Mythic Honor", price: 401089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 2 },
      { id: "epic3-honor", title: "Epic III - Mythic Honor", price: 430089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 3 },
      { id: "epic4-honor", title: "Epic IV - Mythic Honor", price: 459089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 4 },
      { id: "epic5-honor", title: "Epic V - Mythic Honor", price: 488089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor", currentDivision: 5 },
      { id: "epic1-glory", title: "Epic I - Mythic Glory", price: 844089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory", currentDivision: 1 },
      { id: "epic2-glory", title: "Epic II - Mythic Glory", price: 873089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory", currentDivision: 2 },
      { id: "epic3-glory", title: "Epic III - Mythic Glory", price: 902089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory", currentDivision: 3 },
      { id: "epic4-glory", title: "Epic IV - Mythic Glory", price: 932089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory", currentDivision: 4 },
      { id: "epic5-glory", title: "Epic V - Mythic Glory", price: 961089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory", currentDivision: 5 },
      { id: "epic1-immortal", title: "Epic I - Mythic Immortal", price: 2014089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal", currentDivision: 1 },
      { id: "epic2-immortal", title: "Epic II - Mythic Immortal", price: 2043089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal", currentDivision: 2 },
      { id: "epic3-immortal", title: "Epic III - Mythic Immortal", price: 2072089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal", currentDivision: 3 },
      { id: "epic4-immortal", title: "Epic IV - Mythic Immortal", price: 2102089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal", currentDivision: 4 },
      { id: "epic5-immortal", title: "Epic V - Mythic Immortal", price: 2131089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal", currentDivision: 5 },
    ],
  },
  {
    id: "paket-legend",
    title: "Paket Legend",
    packages: [
      { id: "legend1-mythic", title: "Legend I - Mythic", price: 34089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 1 },
      { id: "legend2-mythic", title: "Legend II - Mythic", price: 68089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 2 },
      { id: "legend3-mythic", title: "Legend III - Mythic", price: 101089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 3 },
      { id: "legend4-mythic", title: "Legend IV - Mythic", price: 135089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 4 },
      { id: "legend5-mythic", title: "Legend V - Mythic", price: 169089, rankKey: "legend", currentRank: "legend", targetRank: "mythic", currentDivision: 5 },
      { id: "legend1-honor", title: "Legend I - Mythic Honor", price: 376089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor", currentDivision: 1 },
      { id: "legend2-honor", title: "Legend II - Mythic Honor", price: 410089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor", currentDivision: 2 },
      { id: "legend3-honor", title: "Legend III - Mythic Honor", price: 443089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor", currentDivision: 3 },
      { id: "legend4-honor", title: "Legend IV - Mythic Honor", price: 477089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor", currentDivision: 4 },
      { id: "legend5-honor", title: "Legend V - Mythic Honor", price: 511089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor", currentDivision: 5 },
      { id: "legend1-glory", title: "Legend I - Mythic Glory", price: 848089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory", currentDivision: 1 },
      { id: "legend2-glory", title: "Legend II - Mythic Glory", price: 882089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory", currentDivision: 2 },
      { id: "legend3-glory", title: "Legend III - Mythic Glory", price: 916089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory", currentDivision: 3 },
      { id: "legend4-glory", title: "Legend IV - Mythic Glory", price: 950089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory", currentDivision: 4 },
      { id: "legend5-glory", title: "Legend V - Mythic Glory", price: 983089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory", currentDivision: 5 },
      { id: "legend1-immortal", title: "Legend I - Mythic Immortal", price: 2018089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal", currentDivision: 1 },
      { id: "legend2-immortal", title: "Legend II - Mythic Immortal", price: 2052089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal", currentDivision: 2 },
      { id: "legend3-immortal", title: "Legend III - Mythic Immortal", price: 2086089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal", currentDivision: 3 },
      { id: "legend4-immortal", title: "Legend IV - Mythic Immortal", price: 2120089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal", currentDivision: 4 },
      { id: "legend5-immortal", title: "Legend V - Mythic Immortal", price: 2153089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal", currentDivision: 5 },
    ],
  },
  {
    id: "paket-mythic",
    title: "Paket Mythic",
    packages: [
      { id: "mythic-grading", title: "Open Grading (Auto Star 15)", price: 180089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
      { id: "mythic-honor", title: "Mythic Grading - Mythic Honor (25)", price: 342089, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
      { id: "mythic-glory", title: "Mythic Grading - Mythic Glory (50)", price: 815089, rankKey: "mythicglory", currentRank: "mythic", targetRank: "mythicglory" },
      { id: "mythic-immortal", title: "Mythic Grading - Mythic Immortal (100)", price: 1985089, rankKey: "mythicimmortal", currentRank: "mythic", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-honor",
    title: "Paket Mythic Honor",
    packages: [
      { id: "honor-glory", title: "Mythic Honor (25) - Mythic Glory (50)", price: 473089, rankKey: "mythicglory", currentRank: "mythichonor", targetRank: "mythicglory" },
      { id: "honor-immortal", title: "Mythic Honor (25) - Mythic Immortal (100)", price: 1643089, rankKey: "mythicimmortal", currentRank: "mythichonor", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "paket-glory",
    title: "Paket Mythic Glory",
    packages: [
      { id: "glory-immortal", title: "Mythic Glory (50) - Mythic Immortal (100)", price: 1170089, rankKey: "mythicimmortal", currentRank: "mythicglory", targetRank: "mythicimmortal" },
    ],
  },
  {
    id: "classic-10-win",
    title: "Paket Classic 10 WIN",
    packages: [
      { id: "epic-10win", title: "Epic 10 Win", price: 50000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "legend-10win", title: "Legend 10 Win", price: 50000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "mythic-10win", title: "Mythic 10 Win", price: 55000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "honor-10win", title: "Honor 10 Win", price: 55000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "glory-10win", title: "Glory 10 Win", price: 60000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
      { id: "immortal-10win", title: "Immortal 10 Win", price: 60000, rankKey: "classic", currentRank: "classic", targetRank: "classic" },
    ],
  },
];

// ===== Derived Price Maps (auto-generated from DEFAULT_* arrays) =====

/** Build id→price map from DEFAULT_PER_STAR_RANKS — no manual sync needed */
const PER_STAR_PRICE_MAP: Record<string, number> = Object.fromEntries(
  DEFAULT_PER_STAR_RANKS.map((r) => [r.id, r.price])
);

/** Build id→price map from DEFAULT_GENDONG_RANKS — no manual sync needed */
const GENDONG_PRICE_MAP: Record<string, number> = Object.fromEntries(
  DEFAULT_GENDONG_RANKS.map((r) => [r.id, r.price])
);

/** Build packageId→price map from DEFAULT_CATALOG — no manual sync needed */
const PACKAGE_PRICE_MAP: Record<string, number> = Object.fromEntries(
  DEFAULT_CATALOG.flatMap((cat) =>
    cat.packages.map((pkg) => [pkg.id, pkg.price])
  )
);

// Maps canonical Mythic rank IDs to per-star pricing keys
const RANK_TO_PRICE_KEY: Record<string, string> = {
  warrior: "master",
  elite: "master",
  master: "master",
  grandmaster: "grandmaster",
  epic: "epic",
  legend: "legend",
  mythicgrading: "grading",
  mythic: "mythicromawi",
  mythichonor: "honor",
  mythicglory: "glory",
  mythicimmortal: "immortal",
};

// ===== Core Calculation Functions =====

/**
 * Get division options based on rank (for UI dropdowns).
 */
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

/**
 * Combined rank+division options for dropdown (e.g. "Epic V", "Epic IV", ...)
 */
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
 *
 * NOTE: For Mythic tiers we use `nextMin` (promotion threshold), NOT `max`.
 * e.g. to leave Honor (max displayable 49★) you must reach 50★ (nextMin).
 */
export function calculateTotalStars(
  currentRank: string,
  currentDiv: number,
  targetRank: string,
  targetDiv: number,
  currentDivisionStar: number = 0,
  targetDivisionStar: number = 0,
  currentMythicStars?: number
): number {
  const ci = RANK_ORDER.indexOf(currentRank);
  const ti = RANK_ORDER.indexOf(targetRank);
  if (ci < 0 || ti < 0 || ci >= ti) {
    if (ci === ti && RANKS_WITH_STARS.includes(currentRank)) {
      const cfg = RANK_DIVISION_CONFIG[currentRank];
      if (cfg && currentDiv > targetDiv) {
        const divDiff = currentDiv - targetDiv;
        return divDiff * cfg.starsPerDiv - currentDivisionStar + targetDivisionStar;
      }
    }
    return 0;
  }

  let stars = 0;

  if (RANKS_WITH_STARS.includes(currentRank)) {
    const cfg = RANK_DIVISION_CONFIG[currentRank];
    if (cfg) {
      stars += (cfg.starsPerDiv - currentDivisionStar);
      if (currentDiv > 1) {
        stars += (currentDiv - 1) * cfg.starsPerDiv;
      }
    }
  } else if (MYTHIC_STAR_CONFIG[currentRank]) {
    const mCfg = MYTHIC_STAR_CONFIG[currentRank];
    const cur = currentMythicStars ?? mCfg.min;
    stars += mCfg.nextMin - cur;
  }

  for (let i = ci + 1; i < ti; i++) {
    const rank = RANK_ORDER[i];
    if (rank === "mythicgrading") continue;

    const cfg = RANK_DIVISION_CONFIG[rank];
    if (cfg) {
      stars += cfg.divisions * cfg.starsPerDiv;
    } else {
      const mythicCfg = MYTHIC_STAR_CONFIG[rank];
      if (mythicCfg) {
        stars += mythicCfg.nextMin - mythicCfg.min;
      }
    }
  }

  if (RANKS_WITH_STARS.includes(targetRank)) {
    const cfg = RANK_DIVISION_CONFIG[targetRank];
    if (cfg) {
      stars += (cfg.divisions - targetDiv) * cfg.starsPerDiv + targetDivisionStar;
    }
  } else {
    const mythicCfg = MYTHIC_STAR_CONFIG[targetRank];
    if (mythicCfg) {
      stars += targetDivisionStar - mythicCfg.min;
    }
  }

  return Math.max(0, stars);
}

/**
 * Find the best matching package from catalog for given rank params.
 */
export function findBestPackage(
  catalog: PackageCategory[],
  currentRank: string,
  currentDiv: number,
  targetRank: string,
  targetDiv: number
): { pkg: ProductPackage; cat: PackageCategory; exact: boolean } | null {
  const allPkgs = catalog.flatMap((cat) =>
    cat.packages.map((pkg) => ({ pkg, cat }))
  );

  const exactMatch = allPkgs.find(
    ({ pkg }) =>
      pkg.currentRank === currentRank &&
      pkg.targetRank === targetRank &&
      pkg.currentDivision === currentDiv &&
      pkg.targetDivision === targetDiv
  );
  if (exactMatch) return { ...exactMatch, exact: true };

  const rankMatch = allPkgs.filter(
    ({ pkg }) =>
      pkg.currentRank === currentRank && pkg.targetRank === targetRank
  );
  if (rankMatch.length > 0) {
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
      const aRange = aTi - aCi;
      const bRange = bTi - bCi;
      return aRange - bRange;
    });
    return { ...sorted[0], exact: false };
  }

  return null;
}

/**
 * Calculate extra cost for additional Mythic stars beyond what a package covers.
 */
export function calculateExtraMythicCost(
  targetRank: string,
  targetDivisionStar: number
): number {
  const pricePerStar = MYTHIC_PER_STAR_PRICES[targetRank];
  if (!pricePerStar || targetDivisionStar <= 0) return 0;

  if (targetRank === "mythicgrading") {
    return 230000;
  }

  const cfg = MYTHIC_STAR_CONFIG[targetRank];
  if (!cfg) return 0;

  const starsInTier = targetDivisionStar - cfg.min;
  return Math.max(0, starsInTier) * pricePerStar;
}

// ===== Server-Side Price Calculation =====

/** CMS pricing override shape */
export interface CMSPricing {
  perstar?: Record<string, number>;
  gendong?: Record<string, number>;
  catalog?: Record<string, number>;
}

/**
 * Auto-calculate package/perstar price based on rank params.
 * Used by BOTH frontend (order page) and backend (price verification).
 *
 * This function replaces the duplicated calculateAutoPaketPriceServer in route.ts.
 */
export function calculateAutoPaketPrice(
  body: Record<string, unknown>,
  cmsPricing?: CMSPricing
): number | null {
  const currentRank = String(body.currentRank || "").toLowerCase();
  const targetRank = String(body.targetRank || "").toLowerCase();
  const currentDiv = Number(body.currentStar || 5);
  const targetDiv = Number(body.targetStar || 5);
  const currentMythicStars = Number(body.currentMythicStars || 0);
  const targetMythicStars = Number(body.targetMythicStars || 0);
  // ★ FIX: Account for stars already earned within current/target division
  // Without this, server overcharges vs frontend (e.g. Epic III with 2★:
  // frontend=13★, backend=15★ — 2★ overcharge)
  const currentDivisionStar = Number(body.currentDivisionStar || 0);
  const targetDivisionStar = Number(body.targetDivisionStar || 0);

  const ci = RANK_ORDER.indexOf(currentRank);
  const ti = RANK_ORDER.indexOf(targetRank);
  if (ci < 0 || ti < 0 || ci >= ti) return null;

  const getPricePerStar = (rank: string): number => {
    const key = RANK_TO_PRICE_KEY[rank] || "grandmaster";
    return cmsPricing?.perstar?.[key] ?? PER_STAR_PRICE_MAP[key] ?? 5000;
  };

  let originalTotal = 0;

  // Segment 1: current rank remaining stars
  if (RANKS_WITH_STARS.includes(currentRank)) {
    const cfg = RANK_DIVISION_CONFIG[currentRank];
    if (cfg) {
      // ★ FIX: Subtract stars already earned in current division
      // Matches frontend formula: currentDiv * starsPerDiv - currentDivisionStar
      const starsInThisRank = currentDiv * cfg.starsPerDiv - currentDivisionStar;
      originalTotal += getPricePerStar(currentRank) * starsInThisRank;
    }
  } else {
    const mCfg = MYTHIC_STAR_CONFIG[currentRank];
    if (mCfg) {
      originalTotal += getPricePerStar(currentRank) * (mCfg.nextMin - currentMythicStars);
    }
  }

  // Segments in between
  for (let i = ci + 1; i < ti; i++) {
    const rank = RANK_ORDER[i];
    if (rank === "mythicgrading") continue;
    if (RANKS_WITH_STARS.includes(rank)) {
      const cfg = RANK_DIVISION_CONFIG[rank];
      if (cfg) originalTotal += getPricePerStar(rank) * (cfg.divisions * cfg.starsPerDiv);
    } else {
      const mCfg = MYTHIC_STAR_CONFIG[rank];
      if (mCfg) originalTotal += getPricePerStar(rank) * (mCfg.nextMin - mCfg.min);
    }
  }

  // Segment last: target rank stars needed
  if (RANKS_WITH_STARS.includes(targetRank)) {
    const cfg = RANK_DIVISION_CONFIG[targetRank];
    if (cfg) {
      // ★ FIX: Add stars already earned in target division
      // Matches frontend: (divisions - targetDiv) * starsPerDiv + targetDivisionStar
      const starsInThisRank = (cfg.divisions - targetDiv) * cfg.starsPerDiv + targetDivisionStar;
      originalTotal += getPricePerStar(targetRank) * starsInThisRank;
    }
  } else {
    const mCfg = MYTHIC_STAR_CONFIG[targetRank];
    if (mCfg) originalTotal += getPricePerStar(targetRank) * (targetMythicStars - mCfg.min);
  }

  return Math.round(originalTotal);
}

/**
 * Unified server-side price calculation for all order types.
 * Replaces calculateServerPrice + all SERVER_*_PRICES constants in route.ts.
 */
export function calculateServerPrice(
  body: Record<string, unknown>,
  cmsPricing?: CMSPricing
): number | null {
  const orderType = String(body.orderType || "");
  const isGendong = orderType === "gendong";

  // Gendong mode: simple per-star × quantity (single tier)
  if (isGendong) {
    const rankId = String(body.perStarRankId || body.currentRank || "").toLowerCase();
    const starQty = Number(body.starQuantity || 0);
    const pricePerStar = cmsPricing?.gendong?.[rankId] ?? GENDONG_PRICE_MAP[rankId];
    if (!pricePerStar || starQty < 1 || starQty > 100) return null;
    return pricePerStar * starQty;
  }

  // Per Star mode: multi-tier calculation
  if (orderType === "perstar") {
    return calculateAutoPaketPrice(body, cmsPricing);
  }

  // Paket mode
  if (orderType === "paket") {
    const packageId = String(body.packageId || "");

    // Auto-calculated packages: packageId starts with "auto-"
    if (packageId.startsWith("auto-")) {
      return calculateAutoPaketPrice(body, cmsPricing);
    }

    // Legacy: static catalog lookup
    const price = cmsPricing?.catalog?.[packageId] ?? PACKAGE_PRICE_MAP[packageId];
    return price ?? null;
  }

  return null;
}