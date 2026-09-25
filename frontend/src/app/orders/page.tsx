"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight, Clock, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { Order } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { useStore } from "@/store/useStore";

export default function OrdersHistoryPage() {
  const { user } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await api.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your orders</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Track and review all previous purchases made with your Zentro customer account.
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Order History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review details and tracking for your verified marketplace purchases
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No orders yet</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            You haven&apos;t placed any orders yet. Discover curated items from verified independent merchants.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">{ord.order_number}</span>
                  <span className="text-xs font-bold capitalize text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {ord.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(ord.created_at)}</span>
                  </div>
                  <span>•</span>
                  <span>{ord.items.length} items</span>
                  <span>•</span>
                  <span>Shipped to {ord.shipping_city}, {ord.shipping_country}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-medium">Total Paid</span>
                  <div className="text-base font-black text-slate-900">{formatPrice(ord.total)}</div>
                </div>

                <Link
                  href={`/orders/${ord.order_number}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-sm transition-all"
                >
                  <span>Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
