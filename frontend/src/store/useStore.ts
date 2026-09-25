import { create } from "zustand";
import { User } from "@/types";

interface AppState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  aiModalOpen: boolean;
  setAiModalOpen: (open: boolean) => void;

  aiDrawerOpen: boolean;
  setAiDrawerOpen: (open: boolean) => void;

  cartCount: number;
  setCartCount: (count: number) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("zentro_token") : null,
  setUser: (user, token) => {
    if (token) {
      localStorage.setItem("zentro_token", token);
    } else {
      localStorage.removeItem("zentro_token");
    }
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("zentro_token");
    set({ user: null, token: null, cartCount: 0 });
  },

  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),

  aiModalOpen: false,
  setAiModalOpen: (open) => set({ aiModalOpen: open }),

  aiDrawerOpen: false,
  setAiDrawerOpen: (open) => set({ aiDrawerOpen: open }),

  cartCount: 0,
  setCartCount: (count) => set({ cartCount: count }),
}));
