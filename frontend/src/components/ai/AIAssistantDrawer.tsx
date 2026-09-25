"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, X, Send, Loader2, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  matchReasons?: Record<string, string>;
  followups?: string[];
}

export function AIAssistantDrawer() {
  const { aiDrawerOpen, setAiDrawerOpen, setCartCount } = useStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Zentro AI Shopping Concierge. Tell me what you're shopping for, your budget, or specific features you need, and I'll find the best verified matches.",
      followups: [
        "Find me gym headphones under $150",
        "Best ergonomic chair for home office",
        "Top-rated specialty coffee gear",
      ],
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput("");
    const userMsg: ChatEntry = { role: "user", content: query };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const historyPayload = newHistory.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.aiAssistant(query, historyPayload);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message,
          products: response.products,
          matchReasons: response.match_reasons,
          followups: response.suggested_followups,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble connecting to the catalog. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (productId: string) => {
    try {
      const updatedCart = await api.addToCart(productId, 1);
      setCartCount(updatedCart.item_count);
    } catch (err: any) {
      alert(err.message || "Failed to add product");
    }
  };

  if (!aiDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setAiDrawerOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-emerald-50/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Zentro AI Concierge</h2>
                <p className="text-[11px] text-slate-500">Grounded catalog shopping assistant</p>
              </div>
            </div>
            <button
              onClick={() => setAiDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Grounded Recommended Products Carousel/Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 w-full space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Matched Products:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.products.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm hover:border-indigo-300 transition-colors"
                        >
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/products/${p.slug}`}
                              onClick={() => setAiDrawerOpen(false)}
                              className="text-xs font-semibold text-slate-900 hover:text-indigo-600 truncate block"
                            >
                              {p.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-slate-900">
                                {formatPrice(p.price)}
                              </span>
                              <span className="text-[10px] text-amber-500 font-semibold">
                                ★ {p.rating}
                              </span>
                            </div>
                            {msg.matchReasons?.[p.id] && (
                              <p className="text-[10px] text-indigo-600 font-medium truncate mt-0.5">
                                ✨ {msg.matchReasons[p.id]}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleQuickAdd(p.id)}
                            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                            title="Add to cart"
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Followups */}
                {msg.followups && msg.followups.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.followups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleSend(f)}
                        className="rounded-full border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2.5 w-fit shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span>Searching catalog and verifying specifications...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-200 bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything (e.g., 'What are good headphones under $150?')..."
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
