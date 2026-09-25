"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Package, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Order } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const data = await api.getOrder(orderNumber);
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    }
    if (orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-slate-400">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Could not find an order matching #{orderNumber}.
        </p>
        <Link
          href="/orders"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          View Order History
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Success Hero Confirmation */}
      <div className="text-center space-y-3 pb-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Thank you! Your order is confirmed.
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          We&apos;ve sent an order confirmation and tracking details to your account.
        </p>
      </div>

      {/* Order Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Number</span>
          <div className="text-base font-black text-slate-900">{order.order_number}</div>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</span>
          <div className="text-xs font-semibold text-slate-700">{formatDate(order.created_at)}</div>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</span>
          <div className="text-xs font-bold capitalize text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {order.status}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          <div className="text-base font-black text-slate-900">{formatPrice(order.total)}</div>
        </div>
      </div>

      {/* Items Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Purchased Items ({order.items.length})</h2>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              {item.product_image_snapshot && (
                <div className="relative h-16 w-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                  <Image src={item.product_image_snapshot} alt={item.product_name_snapshot} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{item.product_name_snapshot}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Qty: {item.quantity} × {formatPrice(item.unit_price)}
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-900">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-slate-100 pt-4 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shipping_fee === 0 ? "FREE" : formatPrice(order.shipping_fee)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-900">
            <span>Paid Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="text-xs space-y-1">
          <h3 className="font-bold text-slate-900">Shipping Destination</h3>
          <p className="font-medium text-slate-700">{order.shipping_name}</p>
          <p className="text-slate-500">{order.shipping_address}</p>
          <p className="text-slate-500">
            {order.shipping_city}, {order.shipping_postal_code}, {order.shipping_country}
          </p>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Link
          href="/orders"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>View All Orders</span>
        </Link>

        <Link
          href="/products"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
