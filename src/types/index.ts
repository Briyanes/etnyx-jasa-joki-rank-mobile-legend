// Rank types
export type RankTier =
  | "warrior"
  | "elite"
  | "master"
  | "grandmaster"
  | "epic"
  | "legend"
  | "mythic"
  | "mythicglory";

export interface RankOption {
  value: RankTier;
  label: string;
  order: number;
}

// Pricing types
export interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceUnit: string;
  description: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}

// Order types
export interface OrderData {
  username: string;
  gameId: string;
  currentRank: RankTier;
  targetRank: RankTier;
  package: string;
  express: boolean;
  premium: boolean;
  totalPrice: number;
}

// FAQ types
export interface FAQItem {
  question: string;
  answer: string;
}

// Trust item types
export interface TrustItem {
  icon: string;
  title: string;
  description: string;
}

// Step types
export interface StepItem {
  icon: string;
  step: number;
  title: string;
}
