"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, Star, MapPin, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Business } from "@/types";

function BusinessesContent() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoading(true);
        const data = await api.getBusinesses({ search: search || undefined, limit: 30 });
        setBusinesses(data.items);
      } catch (err) {
        console.error("Failed to load businesses", err);
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verified Merchants Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse vetted independent studios, workshop creators, and premium boutique brands.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Business Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">
          No businesses found matching &quot;{search}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/businesses/${biz.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all"
            >
              <div className="relative h-32 w-full bg-slate-100">
                <Image src={biz.banner_url} alt={biz.name} fill className="object-cover" />
                <div className="absolute -bottom-5 left-5 h-14 w-14 rounded-2xl border-2 border-white overflow-hidden bg-white shadow-md">
                  <Image src={biz.logo_url} alt={biz.name} fill className="object-cover" />
                </div>
              </div>

              <div className="p-5 pt-8 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {biz.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{biz.rating}</span>
                    </div>
                  </div>
                  <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 mt-1">
                    {biz.category}
                  </span>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                    {biz.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{biz.location}</span>
                  </div>
                  <span className="font-bold text-indigo-600">{biz.product_count} products</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading directory...</div>}>
      <BusinessesContent />
    </Suspense>
  );
}
