"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { Cart } from "@/types";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { cartOpen, setCartOpen, setCartCount } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setCart(data);
      setCartCount(data.item_count);
    } catch {
      // Unauthenticated or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cartOpen) {
      fetchCart();
    }
  }, [cartOpen]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    try {
      const updated = await api.updateCartItem(itemId, newQty);
      setCart(updated);
      setCartCount(updated.item_count);
    } catch (err: any) {
      alert(err.message || "Could not update item");
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const updated = await api.removeCartItem(itemId);
      setCart(updated);
      setCartCount(updated.item_count);
    } catch (err: any) {
      alert(err.message || "Could not remove item");
    }
  };

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Your Shopping Cart</h2>
              {cart && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {cart.item_count} items
                </span>
              )}
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading && !cart ? (
              <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                Loading cart...
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Explore thousands of verified products from independent merchants.
                </p>
                <Link
                  href="/products"
                  onClick={() => setCartOpen(false)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        {formatPrice(item.product.price)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-slate-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Subtotal & Checkout */}
          {cart && cart.items.length > 0 && (
            <div className="border-t border-slate-200 bg-white p-6 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{cart.subtotal >= 100 ? "FREE" : "$10.00"}</span>
                </div>
                {cart.subtotal < 100 && (
                  <p className="text-[11px] text-emerald-600 font-medium pt-1">
                    Add {formatPrice(100 - cart.subtotal)} more to qualify for FREE shipping!
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-bold text-slate-900">
                <span>Estimated Total</span>
                <span>{formatPrice(cart.subtotal + (cart.subtotal >= 100 ? 0 : 10))}</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
