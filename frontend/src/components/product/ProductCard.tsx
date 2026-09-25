"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star, Heart, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

interface ProductCardProps {
  product: Product;
  matchReason?: string;
}

export function ProductCard({ product, matchReason }: ProductCardProps) {
  const { user, setCartCount, setCartOpen } = useStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      setAddingToCart(true);
      const updatedCart = await api.addToCart(product.id, 1);
      setCartCount(updatedCart.item_count);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch {
      // Toggle back on error
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          aria-label="Save to wishlist"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-slate-600 shadow-sm hover:scale-110 hover:text-rose-500 transition-all"
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        {/* Stock / Match Tag */}
        {matchReason ? (
          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-indigo-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-indigo-100 shadow-sm line-clamp-1">
            ✨ {matchReason}
          </div>
        ) : product.stock_status === "low_stock" ? (
          <div className="absolute top-3 left-3 rounded-full bg-amber-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            Only {product.stock_quantity} left
          </div>
        ) : null}
      </div>

      {/* Info Container */}
      <div className="flex flex-1 flex-col p-4">
        {/* Merchant & Rating */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          {product.business && (
            <Link
              href={`/businesses/${product.business.slug}`}
              className="font-medium text-slate-600 hover:text-indigo-600 truncate transition-colors"
            >
              {product.business.name}
            </Link>
          )}
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Product Title */}
        <Link href={`/products/${product.slug}`} className="group-hover:text-indigo-600 transition-colors">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium">USD</span>
            <div className="text-base font-bold text-slate-900">{formatPrice(product.price)}</div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock_status === "out_of_stock"}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
              addedSuccess
                ? "bg-emerald-600 text-white"
                : product.stock_status === "out_of_stock"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-indigo-600 active:scale-95"
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added</span>
              </>
            ) : product.stock_status === "out_of_stock" ? (
              <span>Sold out</span>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
