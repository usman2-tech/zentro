"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, SlidersHorizontal, Search, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { Category, Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter states
  const category = searchParams.get("category") || "";
  const business = searchParams.get("business") || "";
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort_by") || "relevance";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const minRating = searchParams.get("min_rating") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(search);

  // Load categories once
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch products on filter changes
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const data = await api.getProducts({
          category: category || undefined,
          business: business || undefined,
          search: search || undefined,
          sort_by: sortBy,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          min_rating: minRating ? Number(minRating) : undefined,
          page,
          limit: 12,
        });
        setProducts(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [category, business, search, sortBy, minPrice, maxPrice, minRating, page]);

  const updateParam = (key: string, val: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // reset page on filter change
    router.push(`/products?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    router.push("/products");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Marketplace Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {products.length} of {total} products from independent merchants
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => updateParam("sort_by", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="relevance">Relevance & Popularity</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Customer Rating</option>
            <option value="newest">Newest Releases</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6 lg:border-r lg:border-slate-200/80 lg:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              <span>Filter Catalog</span>
            </div>
            {(category || search || minPrice || maxPrice || minRating) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam("search", searchInput);
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search keyword..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </form>

          {/* Category Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Department
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => updateParam("category", null)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                  !category
                    ? "bg-indigo-50 font-bold text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>All Categories</span>
                <span>{categories.reduce((acc, c) => acc + c.product_count, 0)}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateParam("category", c.slug)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    category === c.slug
                      ? "bg-indigo-50 font-bold text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-slate-400 text-[11px]">{c.product_count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Price</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateParam("min_price", e.target.value || null)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateParam("max_price", e.target.value || null)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rating</h3>
            <div className="space-y-1">
              {[
                { label: "All Ratings", val: null },
                { label: "4.5★ and above", val: "4.5" },
                { label: "4.8★ and above", val: "4.8" },
              ].map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => updateParam("min_rating", r.val)}
                  className={`block w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    minRating === r.val
                      ? "bg-indigo-50 font-bold text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <Search className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
                We couldn&apos;t find any items matching your selected criteria. Try adjusting your search or clearing price filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
              <button
                onClick={() => updateParam("page", String(page - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pNum = i + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => updateParam("page", String(pNum))}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition-colors ${
                      page === pNum
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => updateParam("page", String(page + 1))}
                disabled={page >= totalPages}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
