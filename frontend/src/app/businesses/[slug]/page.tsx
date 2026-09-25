"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, MapPin, Radio, ShieldCheck, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Business, FeedPost, Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { formatDate } from "@/lib/utils";

export default function BusinessProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "posts">("catalog");

  useEffect(() => {
    async function loadBusiness() {
      try {
        setLoading(true);
        const data = await api.getBusiness(slug);
        setBusiness(data);
      } catch (err) {
        console.error("Failed to load business profile", err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadBusiness();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-400">
        Loading storefront...
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Merchant Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          The merchant storefront you are looking for does not exist.
        </p>
        <Link
          href="/businesses"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          View All Merchants
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Back button */}
      <Link
        href="/businesses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Merchants</span>
      </Link>

      {/* Storefront Hero Banner */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-48 sm:h-64 w-full bg-slate-100">
          <Image src={business.banner_url} alt={business.name} fill priority className="object-cover" />
        </div>

        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="relative h-24 w-24 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-lg flex-shrink-0">
                <Image src={business.logo_url} alt={business.name} fill className="object-cover" />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {business.name}
                  </h1>
                  <span title="Verified Independent Brand">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {business.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{business.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 self-start sm:self-auto">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-slate-900">{business.rating}</span>
              <span className="text-xs text-slate-400">Customer Rating</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{business.description}</p>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-t border-slate-200 px-8">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-3.5 text-xs font-bold border-b-2 mr-8 transition-colors ${
              activeTab === "catalog"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Catalog ({business.products?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-3.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "posts"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            News & Releases ({business.posts?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "catalog" ? (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Products by {business.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {business.products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <h2 className="text-lg font-bold text-slate-900">News & Announcements</h2>
          {business.posts?.length === 0 ? (
            <p className="text-xs text-slate-400">No announcements posted yet.</p>
          ) : (
            business.posts?.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    {post.type.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDate(post.created_at)}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{post.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{post.content}</p>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
