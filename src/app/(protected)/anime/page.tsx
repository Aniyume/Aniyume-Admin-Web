"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminAnime, PaginationMeta, getAdminAnime } from "@/lib/admin-api";

type Filters = { search: string; status: string; type: string; sort: string; direction: string };

const initialFilters: Filters = { search: "", status: "", type: "", sort: "updated_at", direction: "desc" };

export default function AnimePage() {
  const [items, setItems] = useState<AdminAnime[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAdminAnime({ ...applied, page, per_page: 20 })
      .then((result) => {
        if (!mounted) return;
        if (result.ok) {
          setItems(result.data.data);
          setMeta(result.data.meta);
          setError(null);
        } else {
          setError(result.message);
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [applied, page]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setApplied(filters);
  }

  return (
    <section className="page">
      <PageHeader
        kicker="content management"
        title="Anime"
        description="Каталог тайтлов с poster preview, фильтрами, сортировкой и foundation под bulk operations, drawer edit, comments/episodes tabs."
        actions={<button className="button" type="button">+ Создать anime</button>}
      />

      <Card>
        <form className="filter-row" onSubmit={submit}>
          <input className="input" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Поиск по title / slug / ID" />
          <select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Все статусы</option><option value="planned">planned</option><option value="ongoing">ongoing</option><option value="finished">finished</option><option value="paused">paused</option>
          </select>
          <select className="select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Все типы</option><option value="tv">tv</option><option value="movie">movie</option><option value="ova">ova</option><option value="ona">ona</option>
          </select>
          <button className="button secondary" type="submit">Применить</button>
        </form>
      </Card>

      {loading ? <LoadingState label="Загружаем anime catalog…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="Ничего не найдено" description="Попробуй изменить фильтры или поисковый запрос." /> : null}

      {!loading && !error && items.length > 0 ? (
        <Card>
          <div className="toolbar" style={{ marginBottom: 16 }}>
            <div>
              <p className="kicker">database table</p>
              <h2 style={{ margin: 0 }}>Anime list</h2>
            </div>
            <div className="pill">{formatNumber(meta?.total)} записей</div>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Poster</th><th>Title</th><th>Status</th><th>Type</th><th>Year</th><th>Rating</th><th>Episodes</th><th>Tags</th><th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((anime) => (
                  <tr key={anime.id}>
                    <td>#{anime.id}</td>
                    <td>{anime.poster_url ? <img alt="" className="poster-thumb" src={anime.poster_url} /> : <div className="poster-thumb poster-placeholder">◇</div>}</td>
                    <td><Link href={`/anime/${anime.id}`}><strong>{anime.title}</strong><br /><span className="muted">/{anime.slug}</span></Link></td>
                    <td><Badge tone="brand">{anime.status ?? "—"}</Badge></td>
                    <td>{anime.type ?? "—"}</td>
                    <td>{anime.year ?? "—"}</td>
                    <td>★ {anime.rating ?? "—"}</td>
                    <td>{anime.episodes_count ?? anime.number_of_episodes ?? 0}</td>
                    <td>{(anime.tags ?? []).slice(0, 2).map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}</td>
                    <td>{formatDate(anime.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="toolbar" style={{ marginTop: 16 }}>
            <button className="button secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">← Назад</button>
            <span className="muted">Страница {meta?.current_page ?? page} из {meta?.last_page ?? 1}</span>
            <button className="button secondary" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((current) => current + 1)} type="button">Вперёд →</button>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
