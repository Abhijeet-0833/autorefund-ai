"use client";

import { CheckCircle, XCircle, ShieldCheck, FileText, Check, X } from "lucide-react";
import { PolicyCheckDetails } from "@/lib/policy/refundPolicy";

interface RefundDecisionCardProps {
  decision: "APPROVE" | "DENY" | "PENDING";
  approvedAmount: number;
  explanation: string;
  orderId: string | null;
  customerId: string;
  executionTimeMs?: number;
  checks?: PolicyCheckDetails;
}

export function RefundDecisionCard({
  decision,
  approvedAmount,
  explanation,
  orderId,
  customerId,
  executionTimeMs,
  checks,
}: RefundDecisionCardProps) {
  const isApproved = decision === "APPROVE";

  return (
    <div
      className={`p-6 rounded-2xl border transition-all mt-4 ${
        isApproved
          ? "bg-gradient-to-br from-emerald-950/40 via-slate-900 to-emerald-950/30 border-emerald-500/40 shadow-xl shadow-emerald-950/30"
          : "bg-gradient-to-br from-rose-950/40 via-slate-900 to-rose-950/30 border-rose-500/40 shadow-xl shadow-rose-950/30"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isApproved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {isApproved ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Refund Verdict
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                Verified Backend Decision
              </span>
            </div>
            <h2
              className={`text-2xl font-extrabold tracking-tight ${
                isApproved ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isApproved ? "REFUND APPROVED" : "REFUND DENIED"}
            </h2>
          </div>
        </div>

        {isApproved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-right">
            <span className="text-xs text-emerald-400/80 font-medium block">Credit Amount</span>
            <span className="text-2xl font-black text-emerald-300 font-mono">
              ${approvedAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Explanation Box */}
      <div className="mt-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1.5">
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Decision Explanation & Reasoning:</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {explanation}
        </p>
      </div>

      {/* Policy Verification Breakdown Badges */}
      {checks && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Deterministic Policy Rules Check Breakdown:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${checks.orderExists ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"}`}>
              {checks.orderExists ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
              <span>Order Existence</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${checks.customerOwnsOrder ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"}`}>
              {checks.customerOwnsOrder ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
              <span>Order Ownership</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${checks.statusDelivered ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"}`}>
              {checks.statusDelivered ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
              <span>Status Delivered</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${checks.within30DayWindow ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"}`}>
              {checks.within30DayWindow ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
              <span>30-Day Window {checks.daysSinceDelivery !== null && `(${checks.daysSinceDelivery}d)`}</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${checks.notAlreadyRefunded ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"}`}>
              {checks.notAlreadyRefunded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
              <span>Previous Refund Check</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${checks.categoryEligible ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"}`}>
              {checks.categoryEligible ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
              <span>Category Eligibility</span>
            </div>
          </div>
        </div>
      )}

      {/* Details breakdown footer */}
      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-4">
          <span>Customer: <strong className="text-slate-200">{customerId}</strong></span>
          {orderId && <span>Order: <strong className="text-slate-200">#{orderId}</strong></span>}
        </div>

        {executionTimeMs && (
          <div className="flex items-center space-x-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Processed deterministically in {executionTimeMs}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}
