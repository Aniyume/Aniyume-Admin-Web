"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminImportLog, PaginationMeta, getAdminImportLogs } from "@/lib/admin-api";

export default function ImportLogsPage() {
  const [items, setItems] = useState<AdminImportLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAdminImportLogs({ page, per_page: 20, status })
      .then((result) => {
        if (!mounted) return;
        if (result.ok) { setItems(result.data.data); setMeta(result.data.meta); setError(null); }
        else setError(result.message);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [page, status]);

  return (
    <section className="page">
      <PageHeader kicker="история загрузок" title="Логи импорта" description="История импорта с фильтрацией по статусу и страницами." />
      <Card>
        <div className="toolbar">
          <select className="select" style={{ maxWidth: 240 }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">Все статусы</option><option value="running">Выполняется</option><option value="completed">Завершено</option><option value="failed">Ошибка</option>
          </select>
          <span className="pill">{formatNumber(meta?.total)} логов</span>
        </div>
      </Card>
      {loading ? <LoadingState label="Загружаем логи импорта…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="Логов нет" /> : null}
      {!loading && !error && items.length > 0 ? (
        <Card>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Processed</th><th>Created</th><th>Updated</th><th>Skipped</th><th>Started</th><th>Finished</th></tr></thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td><td>{log.import_type ?? "—"}</td><td><Badge tone={log.status === "failed" ? "danger" : log.status === "completed" ? "success" : "warning"}>{log.status ?? "unknown"}</Badge></td>
                    <td>{formatNumber(log.total_processed)}</td><td>{formatNumber(log.total_created)}</td><td>{formatNumber(log.total_updated)}</td><td>{formatNumber(log.total_skipped)}</td>
                    <td>{formatDate(log.started_at)}</td><td>{formatDate(log.finished_at ?? log.completed_at)}</td>
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
