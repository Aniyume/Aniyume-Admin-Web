"use client";

import { EndpointPanel } from "@/components/endpoint-panel";
import { getAdminAnime } from "@/lib/admin-api";

export default function AnimePage() {
  return (
    <section className="page">
      <div>
        <h1>Anime</h1>
        <p className="muted">Read-only list/foundation from /api/v1/admin/anime.</p>
      </div>
      <EndpointPanel loader={getAdminAnime} title="Anime endpoint response" />
    </section>
  );
}
