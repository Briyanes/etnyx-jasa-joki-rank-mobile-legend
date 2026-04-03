// Rank types
export type RankTier =
  | "warrior"
  | "elite"
  | "master"
  | "grandmaster"
  | "epic"
  | "legend"
  | "mythic"
  | "mythichonor"
  | "mythicglory"
  | "mythicimmortal";

export interface RankOption {
  value: RankTier;
  label: string;
  order: number;
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
