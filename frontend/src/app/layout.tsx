import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AISearchModal } from "@/components/ai/AISearchModal";
import { AIAssistantDrawer } from "@/components/ai/AIAssistantDrawer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zentro | Premier AI-Enhanced B2C Marketplace",
  description:
    "Discover verified independent merchants with natural language AI search and personalized product discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <AISearchModal />
            <AIAssistantDrawer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
