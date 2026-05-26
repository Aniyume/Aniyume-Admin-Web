"use client";

import { EndpointPanel } from "@/components/endpoint-panel";
import { getAdminImportLogs } from "@/lib/admin-api";

export default function ImportLogsPage() {
  return (
    <section className="page">
      <div>
        <h1>Import logs</h1>
        <p className="muted">Read-only import logs from /api/v1/admin/imports/logs.</p>
      </div>
      <EndpointPanel loader={getAdminImportLogs} title="Import logs response" />
    </section>
  );
}
