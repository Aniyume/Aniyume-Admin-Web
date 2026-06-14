"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminTag, PaginationMeta, createAdminTag, deleteAdminTag, getAdminTags, updateAdminTag } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

type AdminTagWithCount = AdminTag & { anime_count?: number | null; created_at?: string | null; updated_at?: string | null };

export default function TagsPage() {
  const [items, setItems] = useState<AdminTagWithCount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const ui = useUi();
  function load() { setLoading(true); getAdminTags({ page, per_page: 50, search: applied }).then((result) => { if (result.ok) { setItems(result.data.data); setMeta(result.data.meta); setError(null); } else setError(result.message); }).finally(() => setLoading(false)); }
  useEffect(load, [page, applied]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setApplied(search); }
  async function createTag() { const name = await ui.prompt({ title: "Новый тег", placeholder: "Название тега", confirmLabel: "Создать" }); if (!name?.trim()) return; const result = await createAdminTag(name.trim()); if (result.ok) { setNotice("Тег создан"); ui.toast({ tone: "success", title: "Тег создан" }); load(); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); } }
  async function editTag(tag: AdminTagWithCount) { const name = await ui.prompt({ title: "Редактировать тег", defaultValue: tag.name, confirmLabel: "Сохранить" }); if (!name?.trim() || name.trim() === tag.name) return; const result = await updateAdminTag(tag.id, name.trim()); if (result.ok) { setNotice("Tag updated"); ui.toast({ tone: "success", title: "Tag updated" }); load(); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); } }
  async function removeTag(tag: AdminTagWithCount) { if (!await ui.confirm({ title: "Удалить тег", message: `${tag.name}: Anime links будут отсоединены.`, confirmLabel: "Delete", danger: true })) return; const result = await deleteAdminTag(tag.id); if (result.ok) { setNotice("Tag deleted"); ui.toast({ tone: "success", title: "Tag deleted" }); load(); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); } }
  return <section className="page"><PageHeader kicker="структура каталога" title="Теги и жанры" description="Управление жанрами и тегами каталога." actions={<button className="button" onClick={createTag} type="button">+ Новый тег</button>} />
    <Card><form className="toolbar" onSubmit={submit}><input className="input" style={{ maxWidth: 420 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск tag / slug" /><button className="button secondary" type="submit">Искать</button><span className="pill">{formatNumber(meta?.total)} tags</span></form></Card>
    {notice ? <div className="pill" style={{ borderColor: "rgba(52,211,153,.35)", color: "var(--success)" }}>{notice}</div> : null}
    {loading ? <LoadingState label="Загружаем теги…" /> : null}{error ? <ErrorState message={error} /> : null}{!loading && !error && items.length === 0 ? <EmptyState title="Теги не найдены" /> : null}
    {!loading && !error && items.length > 0 ? <Card><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Slug</th><th>Anime count</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{items.map((tag) => <tr key={tag.id}><td>#{tag.id}</td><td><strong>{tag.name}</strong></td><td><span className="muted">/{tag.slug}</span></td><td><Badge tone="brand">{formatNumber(tag.anime_count)} anime</Badge></td><td>{formatDate(tag.updated_at)}</td><td><div style={{ display: "flex", gap: 8 }}><button className="button secondary" onClick={() => editTag(tag)} type="button">Edit</button><button className="button secondary" onClick={() => removeTag(tag)} type="button">Delete</button></div></td></tr>)}</tbody></table></div><div className="toolbar" style={{ marginTop: 16 }}><button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Назад</button><span className="muted">Страница {meta?.current_page ?? page} из {meta?.last_page ?? 1}</span><button className="button secondary" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((p) => p + 1)}>Вперёд →</button></div></Card> : null}
  </section>;
}
