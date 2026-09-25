"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { WishlistItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/store/useStore";

export default function WishlistPage() {
  const { user, setCartCount } = useStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getWishlist();
      setItems(data);
    } catch (err) {
      console.error("Failed to load wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const handleRemove = async (productId: string) => {
    try {
      await api.removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } catch {
      alert("Failed to remove item from wishlist");
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const updated = await api.addToCart(productId, 1);
      setCartCount(updated.item_count);
      alert("Product added to cart!");
    } catch (err: any) {
      alert(err.message || "Failed to add to cart");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Heart className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your wishlist</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Save favorite products from independent merchants across browsing sessions.
        </p>
        <Link
          href="/login"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Saved Wishlist ({items.length} items)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Products you have bookmarked for future purchases
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Your wishlist is empty</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Click the heart icon on any product to save it here for later.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <button
                  onClick={() => handleRemove(item.product_id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm hover:scale-110 transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <div className="text-sm font-extrabold text-slate-900 mt-1">
                    {formatPrice(item.product.price)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleAddToCart(item.product_id)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors shadow-sm"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Add to Cart</span>
                  </button>

                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
