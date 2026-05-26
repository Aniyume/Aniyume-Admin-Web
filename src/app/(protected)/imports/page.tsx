"use client";

import { EndpointPanel } from "@/components/endpoint-panel";
import { getAdminImportsDashboard } from "@/lib/admin-api";

export default function ImportsPage() {
  return (
    <section className="page">
      <div>
        <h1>Imports</h1>
        <p className="muted">Read-only import status from /api/v1/admin/imports/dashboard.</p>
      </div>
      <EndpointPanel loader={getAdminImportsDashboard} title="Imports dashboard" />
    </section>
  );
}
