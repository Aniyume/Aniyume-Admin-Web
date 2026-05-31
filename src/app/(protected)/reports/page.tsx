"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminReport, PaginationMeta, deleteAdminReport, getAdminReports, updateAdminReportStatus } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

type Filters = { status: string; category: string; target_type: string };
const initialFilters: Filters = { status: "", category: "", target_type: "" };

function tone(status: string) {
  if (status === "resolved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "reviewed") return "warning" as const;
  return "brand" as const;
}

function targetLabel(report: AdminReport) {
  const target = report.target ?? {};
  const title = target.title ?? target.name ?? target.email ?? target.comment ?? `${report.target_type} #${report.target_id}`;
  return String(title).slice(0, 140);
}

export default function ReportsPage() {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const ui = useUi();

  function load() {
    setLoading(true);
    getAdminReports({ ...applied, page, per_page: 20 }).then((result) => {
      if (result.ok) { setItems(result.data.data); setMeta(result.data.meta); setError(null); }
      else setError(result.message);
    }).finally(() => setLoading(false));
  }
  useEffect(load, [applied, page]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setApplied(filters); }
  async function setStatus(report: AdminReport, status: string) {
    const note = ["resolved", "rejected"].includes(status) ? await ui.prompt({ title: "Resolution note", defaultValue: report.resolution_note ?? "", confirmLabel: status }) ?? undefined : undefined;
    const result = await updateAdminReportStatus(report.id, status, note);
    if (result.ok) { const title = `Report #${report.id}: ${status}`; setNotice(title); ui.toast({ tone: "success", title }); load(); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }
  async function remove(report: AdminReport) {
    if (!await ui.confirm({ title: "Удалить report", message: `Удалить report #${report.id}?`, confirmLabel: "Delete", danger: true })) return;
    const result = await deleteAdminReport(report.id);
    if (result.ok) { setNotice("Report deleted"); ui.toast({ tone: "success", title: "Report deleted" }); load(); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  return <section className="page"><PageHeader kicker="trust & safety" title="Reports" description="Система жалоб: очередь pending/reviewed/resolved/rejected, target preview, reporter/admin и audit trail для решений." />
    <Card><form className="filter-row" onSubmit={submit}><select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Все статусы</option><option value="pending">pending</option><option value="reviewed">reviewed</option><option value="resolved">resolved</option><option value="rejected">rejected</option></select><input className="input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="category: spam/toxic/abuse" /><input className="input" value={filters.target_type} onChange={(e) => setFilters({ ...filters, target_type: e.target.value })} placeholder="target_type model class" /><button className="button secondary" type="submit">Фильтровать</button></form></Card>
    {notice ? <div className="pill" style={{ borderColor: "rgba(52,211,153,.35)", color: "var(--success)" }}>{notice}</div> : null}
    {loading ? <LoadingState label="Загружаем reports queue…" /> : null}{error ? <ErrorState message={error} /> : null}{!loading && !error && items.length === 0 ? <EmptyState title="Жалоб не найдено" description="Когда появятся жалобы пользователей, они будут отображаться здесь." /> : null}
    {!loading && !error && items.length > 0 ? <Card><div className="toolbar" style={{ marginBottom: 16 }}><h2 style={{ margin: 0 }}>Reports queue</h2><span className="pill">{formatNumber(meta?.total)} reports</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Status</th><th>Category</th><th>Reason</th><th>Target</th><th>Reporter</th><th>Admin</th><th>Date</th><th>Actions</th></tr></thead><tbody>{items.map((report) => <tr key={report.id}><td>#{report.id}</td><td><Badge tone={tone(report.status)}>{report.status}</Badge></td><td>{report.category}</td><td><strong>{report.reason}</strong>{report.details ? <><br /><span className="muted">{report.details.slice(0, 120)}</span></> : null}</td><td><span className="muted">{report.target_type.split("\\").pop()} #{report.target_id}</span><br />{targetLabel(report)}</td><td>{report.reporter?.name ?? report.reporter?.email ?? "anonymous"}</td><td>{report.admin?.name ?? report.admin?.email ?? "—"}</td><td>{formatDate(report.created_at)}</td><td><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="button secondary" onClick={() => setStatus(report, "reviewed")} type="button">Review</button><button className="button secondary" onClick={() => setStatus(report, "resolved")} type="button">Resolve</button><button className="button secondary" onClick={() => setStatus(report, "rejected")} type="button">Reject</button><button className="button secondary" onClick={() => remove(report)} type="button">Delete</button></div></td></tr>)}</tbody></table></div><div className="toolbar" style={{ marginTop: 16 }}><button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Назад</button><span className="muted">Страница {meta?.current_page ?? page} из {meta?.last_page ?? 1}</span><button className="button secondary" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((p) => p + 1)}>Вперёд →</button></div></Card> : null}
  </section>;
}
