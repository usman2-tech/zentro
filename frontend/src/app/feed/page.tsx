"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Radio, ShieldCheck, Tag, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { FeedPost } from "@/types";
import { formatDate } from "@/lib/utils";

const POST_TYPES = [
  { label: "All Updates", value: "" },
  { label: "Product Launches", value: "product_launch" },
  { label: "Promotions", value: "promotion" },
  { label: "Announcements", value: "announcement" },
  { label: "Articles", value: "article" },
];

function FeedContent() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        const data = await api.getFeed({ type: selectedType || undefined, limit: 30 });
        setPosts(data.items);
      } catch (err) {
        console.error("Failed to load feed", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [selectedType]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Merchant Newsfeed & Activity
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Follow direct releases, product drop announcements, and behind-the-scenes stories from vetted merchants.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {POST_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedType(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedType === t.value
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Feed Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">
          No updates found in this category.
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-4"
            >
              {/* Author Merchant Row */}
              {post.business && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <Link
                    href={`/businesses/${post.business.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                      <Image src={post.business.logo_url} alt={post.business.name} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {post.business.name}
                        </span>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <span className="text-[11px] text-slate-400">{post.business.category}</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {post.type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDate(post.created_at)}</span>
                  </div>
                </div>
              )}

              {/* Post Content */}
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">{post.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Action */}
              {post.business && (
                <div className="pt-2 flex justify-end">
                  <Link
                    href={`/businesses/${post.business.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>Visit {post.business.name} Storefront</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading feed...</div>}>
      <FeedContent />
    </Suspense>
  );
}
