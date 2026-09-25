"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Cart } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/store/useStore";

export default function CartPage() {
  const { user, setCartCount } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setCart(data);
      setCartCount(data.item_count);
    } catch {
      // Unauthenticated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    try {
      const updated = await api.updateCartItem(itemId, newQty);
      setCart(updated);
      setCartCount(updated.item_count);
    } catch (err: any) {
      alert(err.message || "Failed to update item");
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const updated = await api.removeCartItem(itemId);
      setCart(updated);
      setCartCount(updated.item_count);
    } catch (err: any) {
      alert(err.message || "Failed to remove item");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your cart</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Access your saved products across devices with your Zentro customer account.
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-400">
        Loading cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your shopping cart is empty</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto mb-6">
          You haven&apos;t added any items to your cart yet. Explore verified independent brands and discover unique products.
        </p>
        <Link
          href="/products"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  const shippingFee = cart.subtotal >= 100 ? 0 : 10.0;
  const estimatedTotal = cart.subtotal + shippingFee;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Shopping Cart ({cart.item_count} items)
        </h1>
        <p className="text-xs text-slate-500 mt-1">Review your items before proceeding to secure checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>

                  {item.product.business && (
                    <span className="text-xs text-slate-400 font-medium">
                      Sold by {item.product.business.name}
                    </span>
                  )}
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatPrice(item.product.price)} each
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 h-fit">
          <h2 className="text-base font-bold text-slate-900">Order Summary</h2>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Standard Shipping</span>
              <span className="font-semibold text-slate-900">
                {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
              </span>
            </div>
            {cart.subtotal < 100 && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-[11px] text-indigo-700">
                Add {formatPrice(100 - cart.subtotal)} more to qualify for FREE standard shipping!
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between text-base font-extrabold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(estimatedTotal)}</span>
          </div>

          <Link
            href="/checkout"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Simulated checkout. No real payment required.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
