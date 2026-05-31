"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, formatDate, formatNumber } from "@/components/ui";
import { AdminImportsDashboard, getAdminImportsDashboard } from "@/lib/admin-api";

export default function ImportsPage() {
  const [data, setData] = useState<AdminImportsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAdminImportsDashboard()
      .then((result) => {
        if (!mounted) return;
        if (result.ok) setData(result.data.data);
        else setError(result.message);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <LoadingState label="Проверяем состояние импортов…" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Нет данных imports" />;

  const stats = data.stats ?? {};
  return (
    <section className="page">
      <PageHeader
        kicker="data operations"
        title="Imports"
        description="Контроль импорта anime, состояние очередей импорта и последние результаты. Следующий этап — retry failed, progress и detailed errors."
        actions={<button className="button" type="button">Запустить import</button>}
      />
      <div className="grid">
        <StatCard label="Total imports" value={formatNumber(stats.total_imports)} caption="Все попытки импорта" />
        <StatCard label="Successful" value={formatNumber(stats.successful_imports)} caption="Завершены успешно" />
        <StatCard label="Failed" value={formatNumber(stats.failed_imports)} caption="Требуют внимания" />
        <StatCard label="Running" value={formatNumber(stats.running_imports)} caption="Выполняются сейчас" />
      </div>
      <Card>
        <p className="kicker">latest job</p>
        <h2 style={{ marginTop: 0 }}>Последний импорт</h2>
        {data.latest_import ? (
          <div className="grid">
            <div><span className="muted">ID</span><h3>#{data.latest_import.id}</h3></div>
            <div><span className="muted">Type</span><h3>{data.latest_import.import_type ?? "—"}</h3></div>
            <div><span className="muted">Status</span><h3><Badge tone="brand">{data.latest_import.status ?? "unknown"}</Badge></h3></div>
            <div><span className="muted">Started</span><h3>{formatDate(data.latest_import.started_at)}</h3></div>
          </div>
        ) : <p className="muted">Импорт ещё не запускался.</p>}
      </Card>
    </section>
  );
}
