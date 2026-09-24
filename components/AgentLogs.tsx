"use client";

import { useState, useEffect } from "react";
import { Terminal, RefreshCw, Filter, Search, ChevronDown, ChevronUp } from "lucide-react";

export interface AgentExecutionLog {
  id: string;
  refundRequestId?: string | null;
  timestamp: string | Date;
  step: string;
  action: string;
  details: string;
  status: string;
}

export function AgentLogs() {
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [collapsedLogs, setCollapsedLogs] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleLogCollapse = (id: string) => {
    setCollapsedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = logs.filter((log) => {
    const matchesText =
      log.step.toLowerCase().includes(filterText.toLowerCase()) ||
      log.action.toLowerCase().includes(filterText.toLowerCase()) ||
      log.details.toLowerCase().includes(filterText.toLowerCase());

    const matchesStatus = filterStatus === "ALL" || log.status === filterStatus;
    return matchesText && matchesStatus;
  });

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Structured Agent Execution Logs</h3>
            <p className="text-xs text-slate-400">Complete audit trail of tool invocations & policy evaluations</p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search logs by step, action, or payload..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="INFO">INFO</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      {/* Log list */}
      <div className="space-y-3 font-mono text-xs max-h-[500px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No agent execution logs found.</div>
        ) : (
          filteredLogs.map((log) => {
            let parsedDetails = {};
            try {
              parsedDetails = JSON.parse(log.details);
            } catch {
              parsedDetails = { raw: log.details };
            }

            const isSuccess = log.status === "SUCCESS";
            const isError = log.status === "ERROR" || log.status === "WARNING";
            const isPayloadHidden = collapsedLogs[log.id];

            return (
              <div
                key={log.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSuccess
                    ? "bg-emerald-950/10 border-emerald-500/20"
                    : isError
                    ? "bg-rose-950/10 border-rose-500/20"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSuccess
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isError
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="font-bold text-slate-200">{log.step}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => toggleLogCollapse(log.id)}
                      className="text-[10px] flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-sans px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                    >
                      <span>{isPayloadHidden ? "Show Payload" : "Hide Payload"}</span>
                      {isPayloadHidden ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="text-slate-300 font-sans text-xs mb-2 font-medium">
                  {log.action}
                </div>

                {!isPayloadHidden && (
                  <pre className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(parsedDetails, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
