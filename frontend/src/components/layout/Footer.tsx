import Link from "next/link";
import { ShieldCheck, Sparkles, Truck, RefreshCcw } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      {/* Trust Badges */}
      <div className="border-b border-slate-100 py-8 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">AI-Grounded</h4>
              <p className="text-xs text-slate-500">Vector search & assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Verified Merchants</h4>
              <p className="text-xs text-slate-500">100% vetted independent stores</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Fast Shipping</h4>
              <p className="text-xs text-slate-500">Free delivery on orders $100+</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Easy Returns</h4>
              <p className="text-xs text-slate-500">30-day simulated satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white font-black text-sm">
              Z
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Zentro Marketplace</span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            A next-generation B2C commerce platform connecting discerning customers with premier independent brands, powered by grounded semantic search and intelligent shopping assistance.
          </p>
          <div className="text-[11px] text-slate-400">
            © 2026 Zentro Technologies Inc. All rights reserved. Recruiter assessment demonstration.
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Explore</h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/products" className="hover:text-indigo-600 transition-colors">All Products</Link></li>
            <li><Link href="/products?sort_by=rating_desc" className="hover:text-indigo-600 transition-colors">Top Rated</Link></li>
            <li><Link href="/businesses" className="hover:text-indigo-600 transition-colors">Merchant Directory</Link></li>
            <li><Link href="/feed" className="hover:text-indigo-600 transition-colors">Merchant Newsfeed</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Account</h3>
          <ul className="space-y-2 text-xs">
            <li><Link href="/login" className="hover:text-indigo-600 transition-colors">Customer Login</Link></li>
            <li><Link href="/register" className="hover:text-indigo-600 transition-colors">Create Account</Link></li>
            <li><Link href="/orders" className="hover:text-indigo-600 transition-colors">Order History</Link></li>
            <li><Link href="/wishlist" className="hover:text-indigo-600 transition-colors">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Technical Stack</h3>
          <ul className="space-y-2 text-xs text-slate-500">
            <li>Next.js 14 App Router</li>
            <li>FastAPI & PostgreSQL</li>
            <li>pgvector & Semantic RAG</li>
            <li>Tailwind CSS & TanStack</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
