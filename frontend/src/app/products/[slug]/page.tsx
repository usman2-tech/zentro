"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, ShieldCheck, Heart, ShoppingBag, Truck, RotateCcw, Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { ProductCard } from "@/components/product/ProductCard";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { user, setCartCount, setCartOpen } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await api.getProduct(slug);
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!product) return;

    try {
      setAddingToCart(true);
      const updated = await api.addToCart(product.id, qty);
      setCartCount(updated.item_count);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!product) return;

    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-400">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/products"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-slate-600">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-slate-600">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Product Information & Buy Box */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Merchant link & Rating */}
            <div className="flex items-center justify-between">
              {product.business && (
                <Link
                  href={`/businesses/${product.business.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{product.business.name}</span>
                </Link>
              )}
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                <span className="text-[10px] text-slate-400 font-normal">Rating</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">{formatPrice(product.price)}</span>
              <span className="text-xs font-medium text-slate-500">Includes applicable taxes</span>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  product.stock_status === "in_stock"
                    ? "bg-emerald-500"
                    : product.stock_status === "low_stock"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-xs font-semibold text-slate-700 capitalize">
                {product.stock_status === "in_stock"
                  ? "In Stock & Ready to Ship"
                  : product.stock_status === "low_stock"
                  ? `Low Stock — Only ${product.stock_quantity} Remaining`
                  : "Out of Stock"}
              </span>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Action Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
                  className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock_status === "out_of_stock"}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-md transition-all ${
                  addedSuccess
                    ? "bg-emerald-600 text-white"
                    : product.stock_status === "out_of_stock"
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20 active:scale-98"
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Cart ({formatPrice(product.price * qty)})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleWishlist}
                className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-colors shadow-sm"
                title="Save to Wishlist"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            </div>

            {/* Service Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-400" />
                <span>Free shipping over $100</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-slate-400" />
                <span>30-day simulated returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {product.related_products && product.related_products.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Related Products from This Collection
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {product.related_products.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
