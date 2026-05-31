"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, formatDate, formatNumber } from "@/components/ui";
import { AdminImportsDashboard, enrichAdminAnimeBanners, getAdminImportsDashboard, importAllEpisodes, runAdminImport } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

export default function ImportsPage() {
  const [data, setData] = useState<AdminImportsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<"initial" | "update" | "episodes" | "banners" | "full" | null>(null);
  const ui = useUi();

  function load() { setLoading(true); getAdminImportsDashboard().then((result) => { if (result.ok) { setData(result.data.data); setError(null); } else setError(result.message); }).finally(() => setLoading(false)); }
  useEffect(load, []);

  async function run(type: "initial" | "update") {
    const confirmed = await ui.confirm({ title: `Запустить ${type} import`, message: type === "initial" ? "Initial import пропускает уже существующие anime и идёт с первой страницы." : "Update import обновит существующие anime и добавит новые. Для hosted окружения нужен запущенный queue worker.", confirmLabel: "Запустить" });
    if (!confirmed) return;
    setRunning(type);
    const result = await runAdminImport(type);
    if (result.ok) { ui.toast({ tone: "success", title: "Import queued", message: `Log #${result.data.data.id}` }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Import failed to start", message: result.message }); }
    setRunning(null);
  }

  async function runEpisodes() {
    const confirmed = await ui.confirm({ title: "Запустить episodes import", message: "Импорт эпизодов поставит массовую задачу поиска серий для существующих anime. На production должен работать Redis queue worker.", confirmLabel: "Запустить" });
    if (!confirmed) return;
    setRunning("episodes");
    const result = await importAllEpisodes();
    if (result.ok) { ui.toast({ tone: "success", title: "Episodes import queued", message: `Queued ${result.data.data.queued_count ?? 0} anime` }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Episodes import failed to start", message: result.message }); }
    setRunning(null);
  }

  async function runBanners() {
    const confirmed = await ui.confirm({ title: "Запустить banner enrichment", message: "Будут найдены лучшие баннеры через AniList для anime без баннера/источника. Ручные locked covers не перетираются.", confirmLabel: "Запустить" });
    if (!confirmed) return;
    setRunning("banners");
    const result = await enrichAdminAnimeBanners({ limit: 100, only_missing: true, force: false });
    if (result.ok) { ui.toast({ tone: "success", title: "Banner enrichment queued", message: `Limit ${result.data.data.limit}` }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Banner enrichment failed to start", message: result.message }); }
    setRunning(null);
  }

  async function runFullUpdate() {
    const confirmed = await ui.confirm({ title: "Запустить full update", message: "Full update запустит обновление anime metadata, массовый импорт эпизодов и улучшение баннеров для anime без locked/manual cover.", confirmLabel: "Запустить всё" });
    if (!confirmed) return;
    setRunning("full");

    const animeResult = await runAdminImport("update");
    if (!animeResult.ok) {
      setError(animeResult.message);
      ui.toast({ tone: "error", title: "Anime import failed to start", message: animeResult.message });
      setRunning(null);
      return;
    }

    const episodesResult = await importAllEpisodes();
    if (!episodesResult.ok) {
      setError(episodesResult.message);
      ui.toast({ tone: "error", title: "Anime queued, episodes failed", message: episodesResult.message });
      setRunning(null);
      load();
      return;
    }

    const bannersResult = await enrichAdminAnimeBanners({ limit: 100, only_missing: true, force: false });
    if (!bannersResult.ok) {
      setError(bannersResult.message);
      ui.toast({ tone: "error", title: "Anime + episodes queued, banners failed", message: bannersResult.message });
      setRunning(null);
      load();
      return;
    }

    ui.toast({ tone: "success", title: "Full update queued", message: `Anime log #${animeResult.data.data.id}; episodes queued ${episodesResult.data.data.queued_count ?? 0}; banners limit ${bannersResult.data.data.limit}` });
    load();
    setRunning(null);
  }

  if (loading) return <LoadingState label="Проверяем состояние импортов…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Нет данных imports" />;

  const stats = data.stats ?? {};
  return <section className="page"><PageHeader kicker="data operations" title="Imports" description="Запуск anime import, контроль очереди и диагностика. Если на хостинге import не идёт — почти всегда не запущен Laravel queue worker." actions={<button className="button secondary" onClick={load} type="button">↻ Refresh</button>} />
    {error ? <div className="pill" style={{ borderColor: "rgba(251,113,133,.35)", color: "var(--danger)" }}>{error}</div> : null}
    <div className="grid"><StatCard label="Total imports" value={formatNumber(stats.total_imports)} caption="Все попытки импорта" /><StatCard label="Successful" value={formatNumber(stats.successful_imports)} caption="Завершены успешно" /><StatCard label="Failed" value={formatNumber(stats.failed_imports)} caption="Требуют внимания" /><StatCard label="Running" value={formatNumber(stats.running_imports)} caption="Выполняются сейчас" /></div>
    <div className="grid" style={{ gridTemplateColumns: "minmax(320px, .9fr) minmax(320px, 1.1fr)" }}><Card><p className="kicker">run import</p><h2 style={{ marginTop: 0 }}>Запуск полного импорта</h2><p className="muted" style={{ lineHeight: 1.6 }}>Можно запускать anime metadata, episodes и banner enrichment вместе. Кнопки ставят задачи в Redis queue, поэтому после старта можно закрыть вкладку — worker продолжит выполнение.</p><div style={{ display: "grid", gap: 12 }}><button className="button" disabled={!!running} onClick={runFullUpdate} type="button">{running === "full" ? "Starting…" : "Full update: anime + episodes + banners"}</button><button className="button secondary" disabled={!!running} onClick={() => run("update")} type="button">{running === "update" ? "Starting…" : "Anime update only"}</button><button className="button secondary" disabled={!!running} onClick={runEpisodes} type="button">{running === "episodes" ? "Starting…" : "Episodes import only"}</button><button className="button secondary" disabled={!!running} onClick={runBanners} type="button">{running === "banners" ? "Starting…" : "Banners enrich only"}</button><button className="button secondary" disabled={!!running} onClick={() => run("initial")} type="button">{running === "initial" ? "Starting…" : "Initial anime import"}</button></div></Card>
    <Card><p className="kicker">latest job</p><h2 style={{ marginTop: 0 }}>Последний импорт</h2>{data.latest_import ? <div className="grid"><div><span className="muted">ID</span><h3>#{data.latest_import.id}</h3></div><div><span className="muted">Type</span><h3>{data.latest_import.import_type ?? "—"}</h3></div><div><span className="muted">Status</span><h3><Badge tone={data.latest_import.status === "failed" ? "danger" : data.latest_import.status === "completed" ? "success" : "brand"}>{data.latest_import.status ?? "unknown"}</Badge></h3></div><div><span className="muted">Started</span><h3>{formatDate(data.latest_import.started_at)}</h3></div></div> : <p className="muted">Импорт ещё не запускался.</p>}</Card></div>
    <Card><p className="kicker">best practice</p><h2 style={{ marginTop: 0 }}>Как лучше сделать импорт</h2><div className="grid"><div><h3>Anime metadata</h3><p className="muted">Обновляет карточки anime: title, poster, status, tags, rating и новые записи.</p></div><div><h3>Episodes</h3><p className="muted">Episodes import запускается отдельной задачей, пропускает существующие серии и не должен создавать дубли.</p></div><div><h3>Banners</h3><p className="muted">Banner enrichment ищет wide banner через AniList и не трогает locked/manual covers.</p></div><div><h3>Queue worker</h3><p className="muted">На production должен работать api-worker. Без него ImportLog останется running, потому что job поставлена, но никто её не выполняет.</p></div></div></Card>
  </section>;
}
