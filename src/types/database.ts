// Database types for Supabase tables

export interface Order {
  id: string;
  order_id: string;
  username: string;
  game_id: string;
  whatsapp?: string;
  current_rank: string;
  target_rank: string;
  package: string;
  is_express: boolean;
  is_premium: boolean;
  base_price: number;
  total_price: number;
  status: OrderStatus;
  progress: number;
  current_progress_rank?: string;
  booster_id?: string;
  booster_notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
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
