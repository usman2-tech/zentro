"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Star,
  Store,
  Compass,
  Radio,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { Business, Category, FeedPost, Product, RecommendationItem } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const { setAiModalOpen, setAiDrawerOpen } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods, recs, bizs, feed] = await Promise.all([
          api.getCategories(),
          api.getProducts({ limit: 8, sort_by: "rating_desc" }),
          api.getRecommendations(4),
          api.getBusinesses({ limit: 4 }),
          api.getFeed({ limit: 3 }),
        ]);
        setCategories(cats);
        setFeaturedProducts(prods.items);
        setRecommendations(recs.items);
        setBusinesses(bizs.items);
        setFeedPosts(feed.items);
      } catch (err) {
        console.error("Failed to load homepage data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 border-b border-slate-200/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            <span>AI-Enhanced B2C Commerce Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Shop Independently. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              Guided by Intelligence.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover vetted independent merchants, search with natural language, and enjoy personalized shopping grounded in verified specifications.
          </p>

          {/* Prompt / Search Bar in Hero */}
          <div className="max-w-2xl mx-auto pt-4">
            <div
              onClick={() => setAiModalOpen(true)}
              className="flex items-center justify-between rounded-2xl border-2 border-indigo-200 bg-white p-2.5 shadow-xl shadow-indigo-500/10 hover:border-indigo-400 hover:shadow-indigo-500/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 pl-3 text-slate-400 group-hover:text-slate-600">
                <Search className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium">
                  Try &quot;wireless gym earbuds under $100&quot; or &quot;standing desk setup&quot;...
                </span>
              </div>
              <button className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 group-hover:bg-indigo-700 transition-colors">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Search with AI</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Popular:</span>
              {[
                "Wireless ANC Headphones",
                "Ergonomic Standing Desks",
                "Espresso & Specialty Coffee",
                "Fitness Activewear",
              ].map((term) => (
                <Link
                  key={term}
                  href={`/products?search=${encodeURIComponent(term)}`}
                  className="rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-slate-600 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Carousel / Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore by Category
            </h2>
            <p className="text-xs text-slate-500 mt-1">Browse 8 curated product departments</p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-indigo-50 mb-3 group-hover:scale-110 transition-transform">
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
              </div>
              <h3 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {cat.name}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5">{cat.product_count} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. AI-Curated Recommendations */}
      {recommendations.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-700/60 pb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-emerald-300 mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Intelligent Discovery</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Recommended for You</h2>
                  <p className="text-xs text-indigo-200 mt-1">
                    Grounded suggestions generated from catalog ratings, specifications, and customer interest.
                  </p>
                </div>

                <button
                  onClick={() => setAiDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-950 shadow-md hover:bg-indigo-50 transition-colors self-start sm:self-auto"
                >
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Ask AI Concierge</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((rec) => (
                  <ProductCard key={rec.product.id} product={rec.product} matchReason={rec.reason} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Top-Rated Products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Top Rated Marketplace Products
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Highest customer satisfaction and performance</p>
          </div>
          <Link
            href="/products?sort_by=rating_desc"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>Explore All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Verified Independent Merchants */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Featured Merchants & Studios
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Vetted artisanal creators and boutique brands</p>
          </div>
          <Link
            href="/businesses"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>All Stores</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {businesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/businesses/${biz.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
            >
              <div className="relative h-28 w-full bg-slate-100">
                <Image src={biz.banner_url} alt={biz.name} fill className="object-cover" />
                <div className="absolute -bottom-4 left-4 h-12 w-12 rounded-xl border-2 border-white overflow-hidden bg-white shadow-sm">
                  <Image src={biz.logo_url} alt={biz.name} fill className="object-cover" />
                </div>
              </div>

              <div className="p-4 pt-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {biz.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{biz.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{biz.description}</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>{biz.location}</span>
                  <span className="font-semibold text-emerald-600">{biz.product_count} products</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Merchant Newsfeed Highlights */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Merchant News & Releases
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Live updates, launches, and artisan announcements</p>
          </div>
          <Link
            href="/feed"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>All Updates</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feedPosts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-amber-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    {post.type.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDate(post.created_at)}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {post.business && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href={`/businesses/${post.business.slug}`}
                    className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    {post.business.name}
                  </Link>
                  <span className="text-[11px] text-slate-400">{post.business.category}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
