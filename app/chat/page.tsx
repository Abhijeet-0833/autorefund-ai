import { ChatInterface } from "@/components/ChatInterface";

export const metadata = {
  title: "Customer Refund Chat | AutoRefund AI",
  description: "Interactive customer support chat interface powered by deterministic AI agent policy engine.",
};

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100">Customer Refund Support</h1>
        <p className="text-xs text-slate-400">
          Chat with the AI support agent to evaluate refund requests against store policies in real time
        </p>
      </div>

      <ChatInterface />
    </div>
  );
}
