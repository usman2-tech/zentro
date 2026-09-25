"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingBag,
  Sparkles,
  Heart,
  Search,
  User as UserIcon,
  Menu,
  X,
  Store,
  Compass,
  Radio,
  LogOut,
} from "lucide-react";
import { useStore } from "@/store/useStore";

export function Navbar() {
  const { user, logout, cartCount, setCartOpen, setAiModalOpen, setAiDrawerOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white font-black shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              Z
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Zentro<span className="text-indigo-600">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              href="/products"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Compass className="h-4 w-4 text-indigo-500" />
              Explore
            </Link>
            <Link
              href="/businesses"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Store className="h-4 w-4 text-emerald-500" />
              Businesses
            </Link>
            <Link
              href="/feed"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Radio className="h-4 w-4 text-amber-500" />
              Newsfeed
            </Link>
          </nav>
        </div>

        {/* Search Bar / AI Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex w-full items-center justify-between rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm text-slate-500 shadow-sm hover:border-indigo-300 hover:bg-white hover:text-slate-700 transition-all group"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
              <span>Search products, merchants, or ask anything...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ask AI Shopping Assistant Button */}
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-200/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 hover:from-indigo-100 hover:to-emerald-100 shadow-sm transition-all hover:scale-[1.02]"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            <span>AI Concierge</span>
          </button>

          {/* Search Trigger for Mobile */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setCartOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/orders"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 px-2 py-1 rounded-md"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>{user.name.split(" ")[0]}</span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Compass className="h-4 w-4 text-indigo-500" />
            Explore Products
          </Link>
          <Link
            href="/businesses"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Store className="h-4 w-4 text-emerald-500" />
            Browse Businesses
          </Link>
          <Link
            href="/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Radio className="h-4 w-4 text-amber-500" />
            Merchant Newsfeed
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setAiDrawerOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Ask AI Shopping Concierge
          </button>
        </div>
      )}
    </header>
  );
}
