"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, formatDate, formatNumber } from "@/components/ui";
import { AdminRating, AdminRatingStats, PaginationMeta, deleteAdminRating, getAdminRatings } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

type Filters = { anime_id: string; user_id: string; min_rating: string; max_rating: string; sort: string; direction: string };
const initialFilters: Filters = { anime_id: "", user_id: "", min_rating: "", max_rating: "", sort: "updated_at", direction: "desc" };
const emptyStats: AdminRatingStats = { total: 0, average: 0, suspicious_low: 0, suspicious_high: 0, distribution: [] };

export default function RatingsPage() {
  const [items, setItems] = useState<AdminRating[]>([]);
  const [stats, setStats] = useState<AdminRatingStats>(emptyStats);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ui = useUi();

  function load() { setLoading(true); getAdminRatings({ ...applied, page, per_page: 50 }).then((result) => { if (result.ok) { setItems(result.data.data); setStats(result.data.stats); setMeta(result.data.meta); setError(null); } else setError(result.message); }).finally(() => setLoading(false)); }
  useEffect(load, [applied, page]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setApplied(filters); }
  async function remove(rating: AdminRating) { if (!await ui.confirm({ title: "Удалить оценку", message: `Удалить rating ${rating.rating} от ${rating.user?.email ?? rating.user?.id ?? "unknown"}? Средний рейтинг anime будет пересчитан.`, confirmLabel: "Delete", danger: true })) return; const result = await deleteAdminRating(rating.id); if (result.ok) { ui.toast({ tone: "success", title: "Rating deleted" }); load(); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); } }

  return <section className="page"><PageHeader kicker="достоверность рейтинга" title="Оценки" description="Модерация оценок и удаление подозрительных голосов с пересчётом рейтинга." />
    <div className="grid"><StatCard label="Total ratings" value={formatNumber(stats.total)} caption="В текущей выборке" /><StatCard label="Average" value={`★ ${stats.average || 0}`} caption="Средняя оценка" /><StatCard label="Low suspicious" value={formatNumber(stats.suspicious_low)} caption="≤ 2.0 потенциальный review bomb" /><StatCard label="High suspicious" value={formatNumber(stats.suspicious_high)} caption="≥ 9.5 потенциальная накрутка" /></div>
    <Card><form className="filter-row" onSubmit={submit}><input className="input" value={filters.anime_id} onChange={(e) => setFilters({ ...filters, anime_id: e.target.value })} placeholder="Anime ID" /><input className="input" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} placeholder="User ID" /><input className="input" value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })} placeholder="Min rating" /><button className="button secondary" type="submit">Фильтровать</button></form></Card>
    <Card><p className="kicker">distribution</p><div style={{ display: "grid", gap: 10 }}>{stats.distribution.length === 0 ? <p className="muted">Нет данных для графика.</p> : stats.distribution.map((item) => { const max = Math.max(...stats.distribution.map((entry) => entry.count), 1); const percent = Math.round((item.count / max) * 100); return <div key={item.bucket}><div className="toolbar" style={{ marginBottom: 6 }}><span>★ {item.bucket}</span><strong>{formatNumber(item.count)}</strong></div><div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}><div style={{ width: `${percent}%`, height: "100%", background: "var(--brand-gradient)", borderRadius: 999 }} /></div></div>; })}</div></Card>
    {loading ? <LoadingState label="Загружаем ratings…" /> : null}{error ? <ErrorState message={error} /> : null}{!loading && !error && items.length === 0 ? <EmptyState title="Оценок не найдено" /> : null}
    {!loading && !error && items.length > 0 ? <Card><div className="toolbar" style={{ marginBottom: 16 }}><h2 style={{ margin: 0 }}>Ratings table</h2><span className="pill">{formatNumber(meta?.total)} ratings</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Rating</th><th>Anime</th><th>User</th><th>Flags</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{items.map((rating) => <tr key={rating.id}><td>#{rating.id}</td><td><Badge tone={rating.rating <= 2 || rating.rating >= 9.5 ? "warning" : "brand"}>★ {rating.rating}</Badge></td><td>{rating.anime ? <Link href={`/anime/${rating.anime.id}`}><strong>{rating.anime.title}</strong><br /><span className="muted">/{rating.anime.slug}</span></Link> : "—"}</td><td>{rating.user ? <Link href={`/users/${rating.user.id}`}>{rating.user.name ?? rating.user.email ?? `User #${rating.user.id}`}</Link> : "—"}</td><td>{rating.rating <= 2 ? <Badge tone="danger">low</Badge> : null}{rating.rating >= 9.5 ? <Badge tone="warning">high</Badge> : null}{rating.user?.is_banned ? <Badge tone="danger">banned user</Badge> : null}</td><td>{formatDate(rating.updated_at)}</td><td><button className="button secondary" onClick={() => remove(rating)} type="button">Delete</button></td></tr>)}</tbody></table></div><div className="toolbar" style={{ marginTop: 16 }}><button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Назад</button><span className="muted">Страница {meta?.current_page ?? page} из {meta?.last_page ?? 1}</span><button className="button secondary" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((p) => p + 1)}>Вперёд →</button></div></Card> : null}
  </section>;
}
