"use client";

import { useState } from "react";
import { CustomerSelector, DEMO_PRESETS, DemoPreset } from "./CustomerSelector";
import { RefundDecisionCard } from "./RefundDecisionCard";
import {
  Send,
  Bot,
  User,
  Loader2,
  Terminal,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import { AgentExecutionStepLog, AgentRunResult } from "@/lib/agent/refundAgent";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  result?: AgentRunResult;
}

export function ChatInterface() {
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset | null>(DEMO_PRESETS[0]);
  const [customerInput, setCustomerInput] = useState(DEMO_PRESETS[0].customerEmail);
  const [orderIdInput, setOrderIdInput] = useState(DEMO_PRESETS[0].orderId);
  const [messageInput, setMessageInput] = useState(DEMO_PRESETS[0].message);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "agent",
      text: "Hello! I am your AI Customer Support Agent for E-Commerce Refund Processing. How can I assist you with your order today?",
      timestamp: "Just now",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeStepLogs, setActiveStepLogs] = useState<AgentExecutionStepLog[]>([]);
  const [lastAgentResult, setLastAgentResult] = useState<AgentRunResult | null>(null);

  const handleSelectPreset = (preset: DemoPreset) => {
    setSelectedPreset(preset);
    setCustomerInput(preset.customerEmail);
    setOrderIdInput(preset.orderId);
    setMessageInput(preset.message);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !customerInput.trim() || isLoading) return;

    const userText = messageInput.trim();
    const currentCust = customerInput.trim();
    const currentOrder = orderIdInput.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setActiveStepLogs([]);
    setLastAgentResult(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: currentCust,
          orderId: currentOrder || undefined,
          message: userText,
        }),
      });

      const data: AgentRunResult = await res.json();

      if (data.logs) {
        setActiveStepLogs(data.logs);
      }

      setLastAgentResult(data);

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: data.explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        result: data,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: "I encountered an error communicating with the refund policy server. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        sender: "agent",
        text: "Hello! I am your AI Customer Support Agent for E-Commerce Refund Processing. How can I assist you with your order today?",
        timestamp: "Just now",
      },
    ]);
    setActiveStepLogs([]);
    setLastAgentResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Test Scenarios Selector */}
      <CustomerSelector
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPreset?.id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Interface (Left 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col h-[650px] border border-slate-800 shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-sm font-bold text-slate-100">Live Agent Refund Chat</h2>
                <p className="text-xs text-slate-400">Connected to CRM Policy Engine</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          </div>

          {/* Customer Input Bar Controls */}
          <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Customer Email / ID
              </label>
              <input
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="e.g. sarah.jenkins@example.com"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Order ID (Optional)
              </label>
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="e.g. ORD-1001"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {msg.sender === "agent" ? (
                    <Bot className="w-4 h-4 text-blue-400" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-[11px] font-semibold text-slate-400">
                    {msg.sender === "agent" ? "AutoRefund AI Agent" : "Customer"}
                  </span>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10"
                      : "bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/60"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Render Decision Card inside Agent Message if present */}
                {msg.result && (
                  <div className="w-full max-w-xl">
                    <RefundDecisionCard
                      decision={msg.result.decision}
                      approvedAmount={msg.result.approvedAmount}
                      explanation={msg.result.explanation}
                      orderId={msg.result.orderId}
                      customerId={msg.result.customerId}
                      executionTimeMs={msg.result.executionTimeMs}
                      checks={msg.result.checks}
                    />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-slate-300 w-fit animate-pulse">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-xs font-medium">Orchestrating agent tools & evaluating policy...</span>
              </div>
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/60 rounded-b-2xl">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your refund request message..."
                disabled={isLoading}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !messageInput.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 shadow-lg shadow-blue-500/20"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Agent Step Log Inspector (Right col) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-[650px] shadow-2xl">
          <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
            <Terminal className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Live Agent Execution Logs</h3>
              <p className="text-[11px] text-slate-400">Step-by-step telemetry & tool calls</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
            {activeStepLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                <HelpCircle className="w-8 h-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">Send a message or select a test scenario to inspect agent step-by-step tool execution logs.</p>
              </div>
            ) : (
              activeStepLogs.map((log, idx) => {
                const isSuccess = log.status === "SUCCESS";
                const isError = log.status === "ERROR" || log.status === "WARNING";

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isSuccess
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                        : isError
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                        : "bg-slate-900/80 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-blue-400">{log.step}</span>
                      <span>{log.timestamp}</span>
                    </div>

                    <div className="font-medium text-slate-200 text-xs mb-1">
                      {log.action}
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-1.5 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {lastAgentResult && (
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
              <span>Tools executed: <strong className="text-blue-400 font-mono">{lastAgentResult.toolCallsExecuted.length}</strong></span>
              <span className="font-mono text-emerald-400 font-semibold">{lastAgentResult.decision}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
