"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminAuditLog, PaginationMeta, getAdminAuditLogs } from "@/lib/admin-api";

function diffKeys(log: AdminAuditLog) {
  return Array.from(new Set([...Object.keys(log.before ?? {}), ...Object.keys(log.after ?? {})]));
}

export default function AuditLogsPage() {
  const [items, setItems] = useState<AdminAuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [filters, setFilters] = useState({ action: "", entity_type: "", entity_id: "" });
  const [applied, setApplied] = useState(filters);
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let mounted = true; setLoading(true); getAdminAuditLogs({ ...applied, page, per_page: 50 }).then((result) => { if (!mounted) return; if (result.ok) { setItems(result.data.data); setMeta(result.data.meta); setError(null); } else setError(result.message); }).finally(() => mounted && setLoading(false)); return () => { mounted = false; }; }, [page, applied]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setApplied(filters); }
  return <section className="page"><PageHeader kicker="security trail 2.0" title="Audit logs" description="Entity-aware audit trail: before/after changes, metadata, filters by entity and action." />
    <Card><form className="filter-row" onSubmit={submit}><input className="input" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} placeholder="action: update_anime" /><input className="input" value={filters.entity_type} onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })} placeholder="entity_type: App\\Models\\Anime" /><input className="input" value={filters.entity_id} onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })} placeholder="entity_id" /><button className="button secondary" type="submit">Фильтровать</button></form></Card>
    {loading ? <LoadingState label="Загружаем audit trail…" /> : null}{error ? <ErrorState message={error} /> : null}{!loading && !error && items.length === 0 ? <EmptyState title="Audit events не найдены" /> : null}
    {!loading && !error && items.length > 0 ? <div className="grid" style={{ gridTemplateColumns: "minmax(420px, 1.15fr) minmax(320px, .85fr)" }}><Card><div className="toolbar" style={{ marginBottom: 16 }}><h2 style={{ margin: 0 }}>Events</h2><span className="pill">{formatNumber(meta?.total)} events</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Action</th><th>Entity</th><th>Description</th><th>Admin</th><th>Date</th><th>Open</th></tr></thead><tbody>{items.map((log) => <tr key={log.id}><td>#{log.id}</td><td><Badge tone="brand">{log.action}</Badge></td><td>{log.entity_label ?? "—"}<br /><span className="muted">{log.entity_type?.split("\\").pop() ?? ""}</span></td><td style={{ maxWidth: 360 }}>{log.description ?? "—"}</td><td>{log.user?.name ?? log.user?.email ?? "system"}</td><td>{formatDate(log.created_at)}</td><td><button className="button secondary" onClick={() => setSelected(log)} type="button">Details</button></td></tr>)}</tbody></table></div><div className="toolbar" style={{ marginTop: 16 }}><button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Назад</button><span className="muted">Страница {meta?.current_page ?? page} из {meta?.last_page ?? 1}</span><button className="button secondary" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((p) => p + 1)}>Вперёд →</button></div></Card>
    <Card>{selected ? <div style={{ display: "grid", gap: 14 }}><div className="toolbar"><Badge tone="brand">{selected.action}</Badge><span className="muted">#{selected.id}</span></div><h2 style={{ margin: 0 }}>{selected.entity_label ?? "System event"}</h2><p className="muted">{selected.description ?? "—"}</p><div className="grid"><div className="pill" style={{ justifyContent: "space-between" }}><span>Admin</span><strong>{selected.user?.name ?? selected.user?.email ?? "system"}</strong></div><div className="pill" style={{ justifyContent: "space-between" }}><span>IP</span><strong>{selected.ip_address ?? "—"}</strong></div></div><div><p className="kicker">diff</p>{diffKeys(selected).length === 0 ? <p className="muted">No before/after diff for this event.</p> : <div className="table-wrap"><table className="admin-table"><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>{diffKeys(selected).map((key) => <tr key={key}><td>{key}</td><td><pre>{JSON.stringify(selected.before?.[key] ?? null)}</pre></td><td><pre>{JSON.stringify(selected.after?.[key] ?? null)}</pre></td></tr>)}</tbody></table></div>}</div><details className="debug-panel"><summary>Raw metadata</summary><pre>{JSON.stringify({ before: selected.before, after: selected.after, metadata: selected.metadata, user_agent: selected.user_agent }, null, 2)}</pre></details></div> : <div className="state-card"><div><h3>Выбери event</h3><p className="muted">Открой событие, чтобы увидеть before/after и metadata.</p></div></div>}</Card></div> : null}
  </section>;
}
