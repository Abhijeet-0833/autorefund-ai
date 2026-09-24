import "./globals.css";
import { Navbar } from "@/components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AutoRefund AI | Enterprise Refund Agent",
  description: "Production AI Customer Support Agent for E-Commerce Refund Processing with deterministic policy validation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col selection:bg-blue-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>AutoRefund AI Agent System • Built with Next.js 15, Prisma, Zod & OpenAI</span>
            <span className="text-slate-400 font-mono">Deterministic Policy Engine Active</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
