export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  icon_name: string;
  product_count: number;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  banner_url: string;
  category: string;
  rating: number;
  location: string;
  created_at: string;
  product_count?: number;
  products?: Product[];
  posts?: FeedPost[];
}

export interface Product {
  id: string;
  business_id: string;
  category_id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  image_url: string;
  rating: number;
  created_at: string;
  business?: Business;
  category?: Category;
  related_products?: Product[];
}

export interface FeedPost {
  id: string;
  business_id: string;
  type: "announcement" | "promotion" | "product_launch" | "article" | "update";
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  business?: Business;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  product: Product;
  subtotal: number;
}

export interface Cart {
  id: string;
  user_id?: string;
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

export interface WishlistItem {
  product_id: string;
  created_at: string;
  product: Product;
}

export interface OrderItem {
  id: string;
  product_id?: string;
  product_name_snapshot: string;
  product_image_snapshot?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id?: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_country: string;
  shipping_postal_code: string;
  items: OrderItem[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AISearchResponse {
  query: string;
  explanation: string;
  products: Product[];
  match_reasons: Record<string, string>;
}

export interface AIAssistantResponse {
  message: string;
  products: Product[];
  match_reasons: Record<string, string>;
  suggested_followups: string[];
}

export interface RecommendationItem {
  product: Product;
  reason: string;
}

export interface RecommendationResponse {
  items: RecommendationItem[];
  strategy: string;
}
