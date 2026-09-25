"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const { setUser, setCartCount } = useStore();

  useEffect(() => {
    // Check if token exists on mount
    const token = localStorage.getItem("zentro_token");
    if (token) {
      api
        .getMe()
        .then((user) => {
          setUser(user, token);
          // Fetch cart count
          api
            .getCart()
            .then((cart) => setCartCount(cart.item_count))
            .catch(() => {});
        })
        .catch(() => {
          setUser(null, null);
        });
    }
  }, [setUser, setCartCount]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
