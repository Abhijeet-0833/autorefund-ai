import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata = {
  title: "Admin Dashboard | AutoRefund AI",
  description: "Real-time agent execution telemetry, refund metrics, and CRM database audit portal.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
