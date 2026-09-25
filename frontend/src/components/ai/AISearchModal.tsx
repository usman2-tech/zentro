"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Sparkles, X, ArrowRight, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { AISearchResponse } from "@/types";
import { formatPrice } from "@/lib/utils";

const SAMPLE_PROMPTS = [
  "Wireless workout headphones under $150",
  "Minimalist wooden standing desk for office",
  "Specialty espresso equipment under $200",
  "Waterproof backpack for daily commute",
];

export function AISearchModal() {
  const { aiModalOpen, setAiModalOpen } = useStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AISearchResponse | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAiModalOpen(!aiModalOpen);
      }
      if (e.key === "Escape") {
        setAiModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiModalOpen, setAiModalOpen]);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    setQuery(q);
    try {
      setLoading(true);
      const data = await api.aiSearch(q, 8);
      setResults(data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  if (!aiModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => setAiModalOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
          <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="Describe what you want (e.g., 'wireless headphones under $150')..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {loading ? (
            <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
          ) : query ? (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button
            onClick={() => handleSearch(query)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Suggested Prompts */}
        {!results && !loading && (
          <div className="p-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Try Natural Language Prompts
            </h4>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSearch(prompt)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all text-left"
                >
                  ✨ {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Container */}
        {results && (
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            <div className="px-2 py-1 text-xs font-medium text-slate-500 flex items-center justify-between">
              <span>{results.explanation}</span>
              <span className="text-[11px] text-indigo-600 font-semibold">Semantic Match Score</span>
            </div>

            {results.products.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No products match those criteria. Try relaxing your price constraint.
              </div>
            ) : (
              results.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => setAiModalOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {results.match_reasons[product.id] || product.description}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-slate-900">{formatPrice(product.price)}</div>
                    <span className="inline-flex items-center text-[10px] text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      View <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Press ESC to close</span>
          <span className="font-semibold text-indigo-600">Grounded in pgvector embeddings</span>
        </div>
      </div>
    </div>
  );
}
