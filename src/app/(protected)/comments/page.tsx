"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminComment, PaginationMeta, approveAdminComment, getAdminComments, rejectAdminComment, toggleAdminCommentHeart } from "@/lib/admin-api";

export default function CommentsPage() {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [applied, setApplied] = useState({ search: "", status: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    getAdminComments({ ...applied, page, per_page: 20 }).then((result) => {
      if (result.ok) { setItems(result.data.data); setMeta(result.data.meta); setError(null); }
      else setError(result.message);
    }).finally(() => setLoading(false));
  }
  useEffect(load, [applied, page]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setApplied({ search, status }); }
  async function moderate(comment: AdminComment, action: "approve" | "reject") {
    const result = action === "approve" ? await approveAdminComment(comment.id) : await rejectAdminComment(comment.id);
    if (result.ok) load(); else setError(result.message);
  }
  async function heart(comment: AdminComment) {
    const result = await toggleAdminCommentHeart(comment.id);
    if (result.ok) load(); else setError(result.message);
  }

  return <section className="page">
    <PageHeader kicker="moderation queue" title="Comments" description="Общая очередь комментариев с быстрым approve/reject, привязкой к пользователю и anime." />
    <Card><form className="filter-row" onSubmit={submit}><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по тексту" /><select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Все статусы</option><option value="approved">approved</option><option value="rejected">rejected</option></select><button className="button secondary" type="submit">Фильтровать</button></form></Card>
    {loading ? <LoadingState label="Загружаем комментарии…" /> : null}{error ? <ErrorState message={error} /> : null}{!loading && !error && items.length === 0 ? <EmptyState title="Комментариев не найдено" /> : null}
    {!loading && !error && items.length > 0 ? <Card><div className="toolbar" style={{ marginBottom: 16 }}><h2 style={{ margin: 0 }}>Moderation table</h2><span className="pill">{formatNumber(meta?.total)} comments</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Comment</th><th>Author</th><th>Anime</th><th>Status</th><th>Heart</th><th>Date</th><th>Actions</th></tr></thead><tbody>{items.map((comment) => <tr key={comment.id}><td>#{comment.id}</td><td style={{ maxWidth: 420 }}><strong>{comment.comment.slice(0, 220)}</strong>{comment.comment.length > 220 ? "…" : ""}</td><td>{comment.user?.name ?? "—"}<br /><span className="muted">{comment.user?.email ?? ""}</span></td><td>{comment.anime?.title ?? "—"}</td><td><Badge tone={comment.is_approved ? "success" : "danger"}>{comment.status}</Badge></td><td>{comment.admin_hearted ? <Badge tone="brand">♥ admin</Badge> : <span className="muted">—</span>}</td><td>{formatDate(comment.created_at)}</td><td><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="button secondary" onClick={() => heart(comment)} type="button">{comment.admin_hearted ? "Unheart" : "Heart"}</button><button className="button secondary" onClick={() => moderate(comment, "approve")} type="button">Approve</button><button className="button secondary" onClick={() => moderate(comment, "reject")} type="button">Reject</button></div></td></tr>)}</tbody></table></div><div className="toolbar" style={{ marginTop: 16 }}><button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Назад</button><span className="muted">Страница {meta?.current_page ?? page} из {meta?.last_page ?? 1}</span><button className="button secondary" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((p) => p + 1)}>Вперёд →</button></div></Card> : null}
  </section>;
}
