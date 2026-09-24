import Link from "next/link";
import {
  Bot,
  Zap,
  ArrowRight,
  Database,
  Terminal,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-14 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Gen Enterprise AI Agent</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            Deterministic AI Support Agent for{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              E-Commerce Refunds
            </span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            Empower your store with an AI support agent that dynamically queries CRM database tools, inspects customer order timelines, and strictly enforces refund policies with server-side validation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 group"
            >
              <span>Launch Customer Refund Chat</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-4 rounded-2xl border border-slate-800 transition-all"
            >
              <Terminal className="w-5 h-5 text-blue-400" />
              <span>Open Admin Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Deterministic Policy Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The LLM never makes autonomous financial decisions. Policy validation rules (30-day window, category checks, ownership verification) are computed in backend code.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Dynamic Tool Orchestration</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            OpenAI function calling agent loop dynamically invokes backend database tools (`getCustomer`, `getOrder`, `validateEligibility`, `processRefundDecision`).
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">15 Seeded CRM Profiles</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pre-seeded database covering valid refunds, expired 30-day orders, already refunded orders, digital software non-refundable items, and ownership mismatches.
          </p>
        </div>
      </div>

      {/* Quick Test Demo Scenarios List */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Included Test Demo Scenarios</h2>
          <p className="text-xs text-slate-400">Clicking any scenario in the chat UI instantly tests the agent workflow</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-400 font-sans text-sm block mb-1">
                Demo Case 1: Valid Refund (Sarah Jenkins / ORD-1001)
              </span>
              <p className="text-slate-400 font-sans text-xs">
                Delivered 10 days ago ($149.99 Electronics). Meets all policy criteria. Result: <strong>APPROVE</strong>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-400 font-sans text-sm block mb-1">
                Demo Case 2: Expired Window (Mark Davis / ORD-1002)
              </span>
              <p className="text-slate-400 font-sans text-xs">
                Delivered 45 days ago ($299.00 Smart Watch). Exceeds 30-day window. Result: <strong>DENY</strong>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-400 font-sans text-sm block mb-1">
                Demo Case 3: Already Refunded (Elena Rostova / ORD-1003)
              </span>
              <p className="text-slate-400 font-sans text-xs">
                Delivered 12 days ago ($79.50 Leather Wallet). Status is REFUNDED. Result: <strong>DENY</strong>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-400 font-sans text-sm block mb-1">
                Demo Case 4: Non-Refundable Item (David Chen / ORD-1004)
              </span>
              <p className="text-slate-400 font-sans text-xs">
                Delivered 5 days ago ($59.99 Digital Software key). Digital category. Result: <strong>DENY</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
