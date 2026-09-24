"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export interface DemoPreset {
  id: string;
  title: string;
  badge: "APPROVE" | "DENY";
  customerEmail: string;
  customerName: string;
  orderId: string;
  message: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "case-1",
    title: "Case 1: Valid Refund",
    badge: "APPROVE",
    customerEmail: "sarah.jenkins@example.com",
    customerName: "Sarah Jenkins",
    orderId: "ORD-1001",
    message: "I want a refund for order ORD-1001 because the headphones didn't fit properly.",
    description: "Delivered 10 days ago ($149.99 Electronics). Meets all 30-day policy rules.",
    icon: CheckCircle2,
  },
  {
    id: "case-2",
    title: "Case 2: Expired 30-Day Window",
    badge: "DENY",
    customerEmail: "mark.davis@example.com",
    customerName: "Mark Davis",
    orderId: "ORD-1002",
    message: "Can I get a refund for my smart watch order ORD-1002?",
    description: "Delivered 45 days ago ($299.00 Smart Watch). Exceeds 30-day policy limit.",
    icon: Clock,
  },
  {
    id: "case-3",
    title: "Case 3: Already Refunded Order",
    badge: "DENY",
    customerEmail: "elena.rostova@example.com",
    customerName: "Elena Rostova",
    orderId: "ORD-1003",
    message: "I am requesting a refund for order ORD-1003.",
    description: "Delivered 12 days ago ($79.50 Leather Wallet). Already processed and refunded.",
    icon: XCircle,
  },
  {
    id: "case-4",
    title: "Case 4: Non-Refundable Product",
    badge: "DENY",
    customerEmail: "david.chen@example.com",
    customerName: "David Chen",
    orderId: "ORD-1004",
    message: "I want to return order ORD-1004 and get my money back.",
    description: "Delivered 5 days ago ($59.99 Software Key). Digital Download category non-refundable.",
    icon: ShieldAlert,
  },
  {
    id: "case-5",
    title: "Case 5: Ownership Mismatch",
    badge: "DENY",
    customerEmail: "amanda.taylor@example.com",
    customerName: "Amanda Taylor",
    orderId: "ORD-1001",
    message: "Please process a refund for order ORD-1001.",
    description: "Amanda attempts to request refund for ORD-1001 owned by Sarah Jenkins.",
    icon: AlertTriangle,
  },
  {
    id: "case-6",
    title: "Case 6: Multi-Order Customer",
    badge: "APPROVE",
    customerEmail: "james.wilson@example.com",
    customerName: "James Wilson",
    orderId: "ORD-1006A",
    message: "I need to request a refund for my recent keyboard order ORD-1006A.",
    description: "James owns two orders. ORD-1006A delivered 7 days ago is eligible.",
    icon: UserCheck,
  },
];

interface CustomerSelectorProps {
  onSelectPreset: (preset: DemoPreset) => void;
  selectedPresetId?: string;
}

export function CustomerSelector({ onSelectPreset, selectedPresetId }: CustomerSelectorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="glass-panel p-5 rounded-2xl mb-6 border border-slate-800 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Demo Scenarios
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Use these scenarios to quickly demonstrate refund policy decisions.
          </p>
        </div>

        {/* Permanent Toggle Hide / Show Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
        >
          {isCollapsed ? (
            <>
              <span>Show Scenarios (6)</span>
              <ChevronDown className="w-4 h-4 text-blue-400" />
            </>
          ) : (
            <>
              <span>Hide Scenarios</span>
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/60">
          {DEMO_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPresetId === preset.id;
            const isApprove = preset.badge === "APPROVE";

            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-3.5 rounded-xl text-left transition-all relative overflow-hidden group border ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${isApprove ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{preset.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isApprove
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-300 truncate">
                  {preset.customerName} ({preset.orderId})
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
