import { MonitoringToolPage } from "@/components/monitoring-tool-page";

export default function GrafanaPage() {
  return (
    <MonitoringToolPage
      description="Метрики производительности и дашборды."
      embed={process.env.NEXT_PUBLIC_GRAFANA_EMBED === "true"}
      name="Grafana"
      repositoryUrl="https://github.com/grafana/grafana"
      sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
      target="grafana"
      url={process.env.NEXT_PUBLIC_GRAFANA_URL ?? "http://localhost:3002"}
    />
  );
}
