"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminMonitoringHealth } from "@/lib/admin-api";

type HealthStatus = "loading" | "ready" | "unavailable" | "unconfigured";

type MonitoringToolPageProps = {
  description: string;
  embed?: boolean;
  name: string;
  repositoryUrl: string;
  target: "uptime" | "grafana" | "nocodb";
  url: string;
  sandbox?: string;
};

export function MonitoringToolPage({
  description,
  embed = false,
  name,
  repositoryUrl,
  target,
  url,
  sandbox = "allow-forms allow-scripts allow-same-origin allow-popups allow-downloads",
}: MonitoringToolPageProps) {
  const [status, setStatus] = useState<HealthStatus>("loading");

  const checkHealth = useCallback(() => {
    const controller = new AbortController();

    async function run() {
      setStatus("loading");

      try {
        const result = await getAdminMonitoringHealth(target);
        if (controller.signal.aborted) return;
        setStatus(!result.ok ? "unavailable" : !result.data.data.configured ? "unconfigured" : result.data.data.ok ? "ready" : "unavailable");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("unavailable");
        }
      }
    }

    void run();
    return controller;
  }, [target]);

  useEffect(() => {
    const controller = checkHealth();
    return () => controller.abort();
  }, [checkHealth]);

  const statusLabel = {
    loading: "Checking...",
    ready: "Online",
    unavailable: "Unavailable",
    unconfigured: "Not configured",
  }[status];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="muted">{description}</p>
        </div>
        <div className="toolbar">
          <span className={`badge ${status === "ready" ? "success" : status === "loading" ? "brand" : status === "unconfigured" ? "warning" : "danger"}`}>
            {statusLabel}
          </span>
          <a className="button secondary" href={repositoryUrl} rel="noopener noreferrer" target="_blank">
            GitHub
          </a>
          {url ? (
            <a className="button secondary" href={url} rel="noopener noreferrer" target="_blank">
              Открыть сервис
            </a>
          ) : null}
        </div>
      </header>

      {status === "loading" ? (
        <div className="card">
          <div className="card-content state-card">
            <p className="muted">Проверяем доступность {name}...</p>
          </div>
        </div>
      ) : null}

      {status === "unavailable" || status === "unconfigured" ? (
        <div className="card" style={{ border: "1px solid #f59e0b", background: "rgba(245, 158, 11, .08)" }}>
          <div className="card-content">
            <p className="muted">
              {status === "unconfigured"
                ? `${name} еще не настроен для этого окружения. Укажите публичный и внутренний URL в env админки.`
                : `Не удалось подключиться к ${name}. Проверьте сервис и его внутренний URL.`}
            </p>
            <button className="button secondary" onClick={checkHealth} type="button">Повторить проверку</button>
          </div>
        </div>
      ) : null}

      {status === "ready" && embed && url ? (
        <div className="card" style={{ padding: 0 }}>
          <iframe
            allow="clipboard-read; clipboard-write; fullscreen"
            sandbox={sandbox}
            src={url}
            title={name}
            style={{ width: "100%", height: "calc(100vh - 220px)", border: "none" }}
          />
        </div>
      ) : null}

      {status === "ready" && (!embed || !url) ? (
        <div className="card">
          <div className="card-content state-card">
            <div>
              <h3>{name} доступен</h3>
              <p className="muted">
                Сервис открывается отдельно. Встраивание выключено, чтобы не ослаблять защиту iframe/CSP без явной настройки инфраструктуры.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
