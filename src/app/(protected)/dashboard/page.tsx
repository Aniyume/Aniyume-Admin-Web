"use client";

import { EndpointPanel } from "@/components/endpoint-panel";
import { getAdminDashboard } from "@/lib/admin-api";

export default function DashboardPage() {
  return (
    <section className="page">
      <div>
        <h1>Dashboard</h1>
        <p className="muted">Read-only summary from /api/v1/admin/dashboard.</p>
      </div>
      <EndpointPanel loader={getAdminDashboard} title="Admin dashboard" />
    </section>
  );
}
