"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setCartCount } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrefillDemo = () => {
    setEmail("alex.rivera@example.com");
    setPassword("ZentroDemo2026!");
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    try {
      setLoading(true);
      const res = await api.login({ email, password });
      setUser(res.user, res.access_token);
      // Fetch cart count
      api
        .getCart()
        .then((cart) => setCartCount(cart.item_count))
        .catch(() => {});
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-500/20">
            Z
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back to Zentro
          </h1>
          <p className="text-xs text-slate-500">Sign in to your customer account</p>
        </div>

        {/* Demo Fast-Track Card */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Recruiter Assessment Quick-Login</span>
          </div>
          <p className="text-[11px] text-indigo-700 leading-relaxed">
            Click below to instantly autofill the pre-seeded demo customer account (Alex Rivera) with active cart, orders, and wishlist history.
          </p>
          <button
            type="button"
            onClick={handlePrefillDemo}
            className="w-full rounded-xl bg-white border border-indigo-300 py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-100 transition-colors"
          >
            Autofill Demo Credentials
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
