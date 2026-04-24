export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'customer' | 'admin' | 'kitchen_staff' | 'delivery_rider';
  is_active: boolean;
  marketing_alerts: boolean;
};

export type Address = {
  id: string;
  user_id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  image_url: string;
  images: string[];
  tags: string[];
  is_available: boolean;
  is_featured: boolean;
  prep_time_minutes: number;
  allergens: string[];
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  delivery_type: 'delivery';
  address_id: string | null;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  estimated_delivery_time: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  menu_item?: MenuItem;
};

export type Payment = {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  method: 'flutterwave' | 'wallet';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  flutterwave_tx_ref: string | null;
  flutterwave_tx_id: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'order_update' | 'promo' | 'general';
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  menu_item_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: Profile;
};

export type Promotion = {
  id: string;
  code: string;
  title: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  uses_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
};
