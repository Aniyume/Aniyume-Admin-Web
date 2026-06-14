"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminAuditLog, PaginationMeta, getAdminAuditLogs } from "@/lib/admin-api";

function diffKeys(log: AdminAuditLog) {
  return Array.from(new Set([...Object.keys(log.before ?? {}), ...Object.keys(log.after ?? {})]));
}

export default function AuditLogsPage() {
  const [items, setItems] = useState<AdminAuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [filters, setFilters] = useState({ action: "", entity_type: "", entity_id: "" });
  const [applied, setApplied] = useState(filters);
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAdminAuditLogs({ ...applied, page, per_page: 50 })
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
  }, [page, applied]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setApplied(filters);
  }

  return (
    <section className="page">
      <PageHeader
        kicker="безопасность и контроль"
        title="Журнал действий"
        description="История изменений в админке: кто, когда и над какой записью выполнил действие."
      />

      <Card>
        <form className="filter-row" onSubmit={submit}>
          <input className="input" value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} placeholder="Действие, например update_anime" />
          <input className="input" value={filters.entity_type} onChange={(event) => setFilters({ ...filters, entity_type: event.target.value })} placeholder="Тип объекта, например Anime" />
          <input className="input" value={filters.entity_id} onChange={(event) => setFilters({ ...filters, entity_id: event.target.value })} placeholder="ID объекта" />
          <button className="button secondary" type="submit">Применить</button>
        </form>
      </Card>

      {loading ? <LoadingState label="Загружаем журнал действий…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="События не найдены" description="Измените фильтры или вернитесь позже." /> : null}

      {!loading && !error && items.length > 0 ? (
        <div className="split-layout">
          <Card>
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <h2 className="section-title">Последние события</h2>
              <span className="pill">{formatNumber(meta?.total)} событий</span>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead><tr><th>ID</th><th>Действие</th><th>Объект</th><th>Описание</th><th>Администратор</th><th>Дата</th><th /></tr></thead>
                <tbody>
                  {items.map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td><Badge tone="brand">{log.action}</Badge></td>
                      <td>{log.entity_label ?? "—"}<br /><span className="muted">{log.entity_type?.split("\\").pop() ?? ""}</span></td>
                      <td style={{ maxWidth: 320 }}>{log.description ?? "—"}</td>
                      <td>{log.user?.name ?? log.user?.email ?? "Система"}</td>
                      <td>{formatDate(log.created_at)}</td>
                      <td><button className="button secondary" onClick={() => setSelected(log)} type="button">Открыть</button></td>
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

          <Card>
            {selected ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div className="toolbar"><Badge tone="brand">{selected.action}</Badge><span className="muted">#{selected.id}</span></div>
                <h2 className="section-title">{selected.entity_label ?? "Системное событие"}</h2>
                <p className="muted" style={{ margin: 0 }}>{selected.description ?? "Описание отсутствует"}</p>
                <div className="grid">
                  <div className="pill" style={{ justifyContent: "space-between" }}><span>Администратор</span><strong>{selected.user?.name ?? selected.user?.email ?? "Система"}</strong></div>
                  <div className="pill" style={{ justifyContent: "space-between" }}><span>IP-адрес</span><strong>{selected.ip_address ?? "—"}</strong></div>
                </div>
                <div>
                  <p className="kicker">изменения</p>
                  {diffKeys(selected).length === 0 ? <p className="muted">Для этого события нет сравнения значений.</p> : (
                    <div className="table-wrap">
                      <table className="admin-table">
                        <thead><tr><th>Поле</th><th>Было</th><th>Стало</th></tr></thead>
                        <tbody>{diffKeys(selected).map((key) => <tr key={key}><td>{key}</td><td><pre>{JSON.stringify(selected.before?.[key] ?? null)}</pre></td><td><pre>{JSON.stringify(selected.after?.[key] ?? null)}</pre></td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
                <details className="debug-panel"><summary>Технические данные</summary><pre>{JSON.stringify({ before: selected.before, after: selected.after, metadata: selected.metadata, user_agent: selected.user_agent }, null, 2)}</pre></details>
              </div>
            ) : (
              <div className="state-card"><div><h3>Выберите событие</h3><p className="muted">Откройте событие из таблицы, чтобы увидеть детали изменений.</p></div></div>
            )}
          </Card>
        </div>
      ) : null}
    </section>
  );
}
