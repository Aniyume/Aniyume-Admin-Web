"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, formatDate, formatNumber } from "@/components/ui";
import { AdminDashboard, getAdminDashboard } from "@/lib/admin-api";
import { BroadcastButton } from "@/components/BroadcastButton";
import { Gazan67Button } from "@/components/Gazan67Button";

function statusTone(status?: string | null) {
  if (status === "completed" || status === "success") return "success" as const;
  if (status === "failed" || status === "error") return "danger" as const;
  if (status === "running") return "warning" as const;
  return "brand" as const;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAdminDashboard()
      .then((result) => {
        if (!mounted) return;
        if (result.ok) {
          setDashboard(result.data.data);
          setError(null);
        } else {
          setError(result.message);
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingState label="Собираем сводку по сервису…" />;
  if (error) return <ErrorState message={error} />;
  if (!dashboard) return <EmptyState title="Сводка пока пуста" description="Сервер вернул пустой ответ." />;

  const summary = dashboard.summary ?? {};
  const statusTotal = (dashboard.anime_by_status ?? []).reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <section className="page">
      <PageHeader
        kicker="центр управления Aniyume"
        title="Главная"
        description="Важные показатели каталога, пользователей, жалоб и импорта в одном месте."
        actions={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <BroadcastButton />
            <Gazan67Button />
            <button className="button secondary" onClick={() => window.location.reload()} type="button">↻ Обновить</button>
          </div>
        }
      />

      <div className="grid">
        <StatCard label="Аниме" value={formatNumber(summary.total_anime)} caption="Всего тайтлов в каталоге" />
        <StatCard label="Серии" value={formatNumber(summary.total_episodes)} caption="Серии из всех источников" />
        <StatCard label="Пользователи" value={formatNumber(summary.total_users)} caption="Зарегистрированные аккаунты" />
        <StatCard label="Новые жалобы" value={formatNumber(summary.pending_reports)} caption={`${formatNumber(summary.total_reports)} жалоб всего`} />
      </div>

      <div className="split-layout">
        <Card>
          <div className="toolbar" style={{ marginBottom: 16 }}>
            <div>
              <p className="kicker">состояние каталога</p>
              <h2 className="section-title">Аниме по статусам</h2>
            </div>
            <Badge tone="brand">{formatNumber(statusTotal)} тайтлов</Badge>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {(dashboard.anime_by_status ?? []).map((item) => {
              const percent = Math.round((item.count / statusTotal) * 100);
              return (
                <div key={item.status ?? "unknown"}>
                  <div className="toolbar" style={{ marginBottom: 8 }}>
                    <span className="muted">{item.status ?? "unknown"}</span>
                    <strong>{formatNumber(item.count)} · {percent}%</strong>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: "var(--brand-gradient)", borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className="kicker">импорт данных</p>
          <h2 className="section-title">Последние импорты</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {(dashboard.recent_imports ?? []).slice(0, 5).map((log) => (
              <div className="pill" key={log.id} style={{ justifyContent: "space-between", borderRadius: 16 }}>
                <span>#{log.id} · {log.import_type ?? "import"}</span>
                <Badge tone={statusTone(log.status)}>{log.status ?? "unknown"}</Badge>
              </div>
            ))}
            {(dashboard.recent_imports ?? []).length === 0 ? <p className="muted">Импорт ещё не запускался.</p> : null}
          </div>
        </Card>
      </div>

      <Card>
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <div>
            <p className="kicker">новый контент</p>
            <h2 className="section-title">Последние аниме</h2>
          </div>
          <a className="button secondary" href="/anime">Перейти в каталог</a>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Постер</th><th>Название</th><th>Статус</th><th>Тип</th><th>Рейтинг</th><th>Обновлено</th></tr>
            </thead>
            <tbody>
              {(dashboard.latest_anime ?? []).map((anime) => (
                <tr key={anime.id}>
                  <td>#{anime.id}</td>
                  <td>{anime.poster_url ? <img alt="" className="poster-thumb" src={anime.poster_url} /> : <div className="poster-thumb poster-placeholder">◇</div>}</td>
                  <td><strong>{anime.title}</strong><br /><span className="muted">/{anime.slug}</span></td>
                  <td><Badge tone="brand">{anime.status ?? "—"}</Badge></td>
                  <td>{anime.type ?? "—"}</td>
                  <td>★ {anime.rating ?? "—"}</td>
                  <td>{formatDate(anime.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
