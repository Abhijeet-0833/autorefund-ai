"use client";

import { useState, useEffect } from "react";
import { AgentLogs } from "./AgentLogs";
import { CustomerExplorer } from "./CustomerExplorer";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign,
  Terminal,
  Users,
  FileCheck2,
  RefreshCw,
} from "lucide-react";

export interface RecentRefundRequest {
  id: string;
  createdAt: string | Date;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  orderId: string;
  decision: string;
  approvedAmount: number;
  explanation: string;
}

export interface AdminStatsData {
  success: boolean;
  stats: {
    totalRequests: number;
    approvedCount: number;
    deniedCount: number;
    totalApprovedAmount: number;
  };
  recentRequests: RecentRefundRequest[];
  recentLogs: Array<{
    id: string;
    timestamp: string | Date;
    step: string;
    action: string;
    details: string;
    status: string;
  }>;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "crm">("overview");
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const json: AdminStatsData = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats || {
    totalRequests: 0,
    approvedCount: 0,
    deniedCount: 0,
    totalApprovedAmount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Management Portal
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
              Live Auditing
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-1">Admin Operations & Analytics</h1>
          <p className="text-xs text-slate-400">
            Real-time agent telemetry, refund decision metrics, and deterministic policy enforcement logs
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Overview & Activity</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "logs"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Agent Logs</span>
          </button>
          <button
            onClick={() => setActiveTab("crm")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "crm"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>CRM Database</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Refund Requests</span>
                <FileCheck2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-slate-100 font-mono">
                {stats.totalRequests}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Evaluated by policy engine</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                  Approved Refunds
                </span>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {stats.approvedCount}
              </div>
              <span className="text-[11px] text-emerald-500/80 mt-1 block">
                {stats.totalRequests > 0
                  ? `${Math.round((stats.approvedCount / stats.totalRequests) * 100)}% approval rate`
                  : "No requests yet"}
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-rose-400">
                  Denied Refunds
                </span>
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                {stats.deniedCount}
              </div>
              <span className="text-[11px] text-rose-500/80 mt-1 block">Policy violations blocked</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Approved Refund Amount</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-300 font-mono">
                ${stats.totalApprovedAmount.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Based on approved refund decisions</span>
            </div>
          </div>

          {/* Recent Requests Table */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Recent Refund Audit Trail</h3>
                <p className="text-xs text-slate-400">Verified decisions stored in database</p>
              </div>
              <button
                onClick={fetchStats}
                disabled={isLoading}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Order ID</th>
                    <th className="py-3 px-4 font-semibold">Decision</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {!data?.recentRequests || data.recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        No refund requests submitted yet. Use the Customer Refund Support chat to launch test cases.
                      </td>
                    </tr>
                  ) : (
                    data.recentRequests.map((req: RecentRefundRequest) => {
                      const isApproved = req.decision === "APPROVE";
                      return (
                        <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {new Date(req.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-slate-200 font-sans font-medium">
                            {req.customer.name}
                            <span className="block text-[10px] text-slate-500 font-mono">
                              {req.customer.email}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-blue-400">#{req.orderId}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isApproved
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {req.decision}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            ${req.approvedAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-sans text-xs max-w-xs truncate">
                            {req.explanation}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AGENT LOGS TAB */}
      {activeTab === "logs" && <AgentLogs />}

      {/* CRM DATABASE TAB */}
      {activeTab === "crm" && <CustomerExplorer />}
    </div>
  );
}
