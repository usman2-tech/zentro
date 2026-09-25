import {
  AIAssistantResponse,
  AISearchResponse,
  AuthResponse,
  Business,
  Cart,
  Category,
  FeedPost,
  Order,
  PaginatedResponse,
  Product,
  RecommendationResponse,
  User,
  WishlistItem,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("zentro_token");
}

async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errMessage = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errMessage = response.statusText;
    }
    throw new Error(errMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    fetcher<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetcher<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  getMe: () => fetcher<User>("/users/me"),

  // Catalog
  getCategories: () => fetcher<Category[]>("/categories"),

  getProducts: (params: Record<string, string | number | undefined> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString();
    return fetcher<PaginatedResponse<Product>>(`/products${qs ? `?${qs}` : ""}`);
  },

  getProduct: (idOrSlug: string) => fetcher<Product>(`/products/${idOrSlug}`),

  getBusinesses: (params: Record<string, string | number | undefined> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString();
    return fetcher<PaginatedResponse<Business>>(`/businesses${qs ? `?${qs}` : ""}`);
  },

  getBusiness: (idOrSlug: string) => fetcher<Business>(`/businesses/${idOrSlug}`),

  getFeed: (params: Record<string, string | number | undefined> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString();
    return fetcher<PaginatedResponse<FeedPost>>(`/feed${qs ? `?${qs}` : ""}`);
  },

  search: (query: string) =>
    fetcher<{ products: Product[]; businesses: Business[]; total_products: number; total_businesses: number }>(
      `/search?q=${encodeURIComponent(query)}`
    ),

  // Cart
  getCart: () => fetcher<Cart>("/cart"),

  addToCart: (productId: string, quantity: number = 1) =>
    fetcher<Cart>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    fetcher<Cart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (itemId: string) =>
    fetcher<Cart>(`/cart/items/${itemId}`, { method: "DELETE" }),

  // Wishlist
  getWishlist: () => fetcher<WishlistItem[]>("/wishlist"),

  addToWishlist: (productId: string) =>
    fetcher<WishlistItem>(`/wishlist/${productId}`, { method: "POST" }),

  removeFromWishlist: (productId: string) =>
    fetcher<{ success: boolean; product_id: string }>(`/wishlist/${productId}`, { method: "DELETE" }),

  // Checkout & Orders
  checkout: (data: {
    shipping_name: string;
    shipping_address: string;
    shipping_city: string;
    shipping_country: string;
    shipping_postal_code: string;
    payment_method?: string;
  }) => fetcher<Order>("/checkout", { method: "POST", body: JSON.stringify(data) }),

  getOrders: () => fetcher<Order[]>("/orders"),

  getOrder: (orderNumber: string) => fetcher<Order>(`/orders/${orderNumber}`),

  // AI & Recommendations
  aiSearch: (query: string, limit: number = 8, maxPrice?: number) =>
    fetcher<AISearchResponse>("/ai/search", {
      method: "POST",
      body: JSON.stringify({ query, limit, max_price: maxPrice }),
    }),

  aiAssistant: (query: string, history: { role: string; content: string }[] = []) =>
    fetcher<AIAssistantResponse>("/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ query, history }),
    }),

  getRecommendations: (limit: number = 8) =>
    fetcher<RecommendationResponse>(`/recommendations?limit=${limit}`),
};
