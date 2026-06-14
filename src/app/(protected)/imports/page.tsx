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
  const [episodeSource, setEpisodeSource] = useState("all");
  const [episodeLimit, setEpisodeLimit] = useState("500");
  const ui = useUi();

  function load() { setLoading(true); getAdminImportsDashboard().then((result) => { if (result.ok) { setData(result.data.data); setError(null); } else setError(result.message); }).finally(() => setLoading(false)); }
  useEffect(load, []);

  async function run(type: "initial" | "update") {
    const confirmed = await ui.confirm({ title: "Запустить импорт аниме", message: type === "initial" ? "Первичный импорт пропускает уже существующие аниме и начинает с первой страницы." : "Обновление изменит существующие аниме и добавит новые. Для выполнения должен работать обработчик очереди.", confirmLabel: "Запустить" });
    if (!confirmed) return;
    setRunning(type);
    const result = await runAdminImport(type);
    if (result.ok) { ui.toast({ tone: "success", title: "Импорт поставлен в очередь", message: `Лог #${result.data.data.id}` }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Не удалось запустить импорт", message: result.message }); }
    setRunning(null);
  }

  async function runEpisodes() {
    const limit = Math.max(1, Math.min(Number(episodeLimit) || 500, 5000));
    const confirmed = await ui.confirm({ title: "Запустить episodes import", message: `Будет поставлено до ${limit} задач для anime без серий. Source: ${episodeSource}. На production должен работать Redis queue worker.`, confirmLabel: "Запустить" });
    if (!confirmed) return;
    setRunning("episodes");
    const result = await importAllEpisodes({ source: episodeSource, only_missing: true, limit });
    if (result.ok) { ui.toast({ tone: "success", title: "Episodes import queued", message: `Queued ${result.data.data.queued_count ?? 0} anime · ${result.data.data.source ?? episodeSource}` }); load(); }
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

    const episodesResult = await importAllEpisodes({ source: "all", only_missing: true, limit: 500 });
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
  if (!data) return <EmptyState title="Нет данных об импорте" />;

  const stats = data.stats ?? {};
  return <section className="page"><PageHeader kicker="загрузка данных" title="Импорт" description="Запуск импорта аниме, серий и баннеров, контроль очереди и диагностика." actions={<button className="button secondary" onClick={load} type="button">↻ Обновить</button>} />
    {error ? <div className="pill" style={{ borderColor: "rgba(251,113,133,.35)", color: "var(--danger)" }}>{error}</div> : null}
    <div className="grid"><StatCard label="Всего запусков" value={formatNumber(stats.total_imports)} caption="Все попытки импорта" /><StatCard label="Успешно" value={formatNumber(stats.successful_imports)} caption="Завершены успешно" /><StatCard label="Ошибки" value={formatNumber(stats.failed_imports)} caption="Требуют внимания" /><StatCard label="Выполняются" value={formatNumber(stats.running_imports)} caption="Активны сейчас" /></div>
    <div className="split-layout"><Card><p className="kicker">запуск импорта</p><h2 style={{ marginTop: 0 }}>Запуск полного импорта</h2><p className="muted" style={{ lineHeight: 1.6 }}>Можно запустить обновление аниме, серий и баннеров вместе. Задачи продолжат выполняться после закрытия вкладки.</p><div style={{ display: "grid", gap: 12 }}><button className="button" disabled={!!running} onClick={runFullUpdate} type="button">{running === "full" ? "Запускаем…" : "Полное обновление"}</button><button className="button secondary" disabled={!!running} onClick={() => run("update")} type="button">{running === "update" ? "Запускаем…" : "Только обновить аниме"}</button><div className="form-grid two"><select className="input" value={episodeSource} onChange={(e) => setEpisodeSource(e.target.value)}><option value="all">Все источники</option><option value="anilibria">AniLibria</option><option value="kodik">Kodik</option><option value="videocdn">VideoCDN</option><option value="external">Внешние плееры</option></select><input className="input" value={episodeLimit} onChange={(e) => setEpisodeLimit(e.target.value)} placeholder="Лимит" /></div><button className="button secondary" disabled={!!running} onClick={runEpisodes} type="button">{running === "episodes" ? "Запускаем…" : "Только импорт серий"}</button><button className="button secondary" disabled={!!running} onClick={runBanners} type="button">{running === "banners" ? "Запускаем…" : "Только обновить баннеры"}</button><button className="button secondary" disabled={!!running} onClick={() => run("initial")} type="button">{running === "initial" ? "Запускаем…" : "Первичный импорт аниме"}</button></div></Card>
    <Card><p className="kicker">latest job</p><h2 style={{ marginTop: 0 }}>Последний импорт</h2>{data.latest_import ? <div className="grid"><div><span className="muted">ID</span><h3>#{data.latest_import.id}</h3></div><div><span className="muted">Type</span><h3>{data.latest_import.import_type ?? "—"}</h3></div><div><span className="muted">Status</span><h3><Badge tone={data.latest_import.status === "failed" ? "danger" : data.latest_import.status === "completed" ? "success" : "brand"}>{data.latest_import.status ?? "unknown"}</Badge></h3></div><div><span className="muted">Started</span><h3>{formatDate(data.latest_import.started_at)}</h3></div></div> : <p className="muted">Импорт ещё не запускался.</p>}</Card></div>
    <Card><p className="kicker">best practice</p><h2 style={{ marginTop: 0 }}>Как лучше сделать импорт</h2><div className="grid"><div><h3>Anime metadata</h3><p className="muted">Обновляет карточки anime: title, poster, status, tags, rating и новые записи.</p></div><div><h3>Episodes</h3><p className="muted">Episodes import запускается отдельной задачей, пропускает существующие серии и не должен создавать дубли.</p></div><div><h3>Banners</h3><p className="muted">Banner enrichment ищет wide banner через AniList и не трогает locked/manual covers.</p></div><div><h3>Queue worker</h3><p className="muted">На production должен работать api-worker. Без него ImportLog останется running, потому что job поставлена, но никто её не выполняет.</p></div></div></Card>
  </section>;
}
