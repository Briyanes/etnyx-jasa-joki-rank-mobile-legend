// Database types for Supabase tables

export interface Order {
  id: string;
  order_id: string;
  username: string;
  game_id: string;
  whatsapp?: string;
  customer_email?: string;
  customer_id?: string;
  current_rank: string;
  target_rank: string;
  current_star?: number | null;
  target_star?: number | null;
  package: string;
  package_title?: string;
  is_express: boolean;
  is_premium: boolean;
  base_price: number;
  total_price: number;
  status: OrderStatus;
  payment_status?: string;
  payment_method?: string;
  payment_type?: string;
  progress: number;
  current_progress_rank?: string;
  assigned_worker_id?: string;
  assigned_lead_id?: string;
  assigned_booster?: string;
  booster_id?: string;
  booster_notes?: string;
  promo_code?: string;
  promo_discount?: number;
  tier_discount?: number;
  tier_name?: string | null;
  account_login?: string;
  account_password?: string;
  hero_request?: string;
  login_method?: string;
  notes?: string;
  review_token?: string;
  midtrans_order_id?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  paid_at?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booster {
  id: string;
  name: string;
  whatsapp?: string;
  email?: string;
  specialization: string[];
  max_rank: string;
  is_active: boolean;
  total_orders: number;
  success_rate: number;
  created_at: string;
}

export interface OrderLog {
  id: string;
  order_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface Settings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface OrderStatistics {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  pending_revenue: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
}

// Admin session type
export interface AdminSession {
  isAuthenticated: boolean;
  email?: string;
  expiresAt?: number;
}
