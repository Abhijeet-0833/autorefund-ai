"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";

export interface CustomerExplorerItem {
  id: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  isRefundable: boolean;
}

export interface CustomerExplorerOrder {
  id: string;
  totalAmount: number;
  status: string;
  deliveryDate: string | Date | null;
  items: CustomerExplorerItem[];
}

export interface CustomerExplorerCustomer {
  id: string;
  name: string;
  email: string;
  orders: CustomerExplorerOrder[];
}

export function CustomerExplorer() {
  const [customers, setCustomers] = useState<CustomerExplorerCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.customers);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">CRM Database Explorer (15 Seeded Customers)</h3>
          <p className="text-xs text-slate-400">Inspect customer profiles, order items, categories, and refund eligibility status</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading CRM database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all text-xs"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">{cust.name}</h4>
                  <span className="font-mono text-slate-400 text-[11px]">{cust.email}</span>
                </div>
                <span className="font-mono bg-slate-800 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
                  {cust.id}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Orders ({cust.orders.length})
                </span>
                {cust.orders.map((order: CustomerExplorerOrder) => (
                  <div key={order.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-400">#{order.id}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-200 font-semibold">${order.totalAmount.toFixed(2)}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : order.status === "REFUNDED"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between mb-1.5">
                      <span>Delivered: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not Delivered"}</span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-900">
                      {order.items.map((item: CustomerExplorerItem) => (
                        <div key={item.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 truncate max-w-[200px]">{item.productName}</span>
                          <span className="text-slate-500 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
