"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, CreditCard, Lock, Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Cart } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/store/useStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, setCartCount } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State with realistic default values for instant recruiter evaluation
  const [form, setForm] = useState({
    shipping_name: user?.name || "Alex Rivera",
    shipping_address: "742 Evergreen Terrace",
    shipping_city: "Seattle",
    shipping_country: "United States",
    shipping_postal_code: "98101",
    payment_method: "simulated_card",
  });

  useEffect(() => {
    async function loadCart() {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        setLoading(true);
        const data = await api.getCart();
        if (data.items.length === 0) {
          router.push("/cart");
          return;
        }
        setCart(data);
      } catch {
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !cart) return;

    try {
      setSubmitting(true);
      const order = await api.checkout(form);
      setCartCount(0); // clear cart count badge
      router.push(`/orders/${order.order_number}`);
    } catch (err: any) {
      alert(err.message || "Checkout failed. Please check stock or address.");
      setSubmitting(false);
    }
  };

  if (loading || !cart) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-slate-400">
        Loading checkout...
      </div>
    );
  }

  const shippingFee = cart.subtotal >= 100 ? 0 : 10.0;
  const grandTotal = cart.subtotal + shippingFee;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Shopping Cart</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Secure Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your order using our simulated payment sandbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Shipping & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Shipping Address */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              1. Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.shipping_name}
                  onChange={(e) => setForm({ ...form, shipping_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Street Address</label>
                <input
                  type="text"
                  required
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">City</label>
                <input
                  type="text"
                  required
                  value={form.shipping_city}
                  onChange={(e) => setForm({ ...form, shipping_city: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Postal / ZIP Code</label>
                <input
                  type="text"
                  required
                  value={form.shipping_postal_code}
                  onChange={(e) => setForm({ ...form, shipping_postal_code: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Country</label>
                <input
                  type="text"
                  required
                  value={form.shipping_country}
                  onChange={(e) => setForm({ ...form, shipping_country: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Simulated Payment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                2. Payment Method
              </h2>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Simulated Sandbox</span>
              </span>
            </div>

            <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50/40 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Simulated Instant Payment</h4>
                  <p className="text-[11px] text-slate-500">Auto-approved test credit card ending in 4242</p>
                </div>
              </div>
              <div className="h-4 w-4 rounded-full border-4 border-indigo-600 bg-white" />
            </div>
          </div>
        </div>

        {/* Right Column: Order Review */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-900">Order Summary ({cart.item_count} items)</h2>

            {/* Cart Items Mini Review */}
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1 space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pt-3 first:pt-0">
                  <div className="relative h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <h4 className="font-semibold text-slate-900 truncate">{item.product.name}</h4>
                    <span className="text-slate-500">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-900">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Pay & Place Order ({formatPrice(grandTotal)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
