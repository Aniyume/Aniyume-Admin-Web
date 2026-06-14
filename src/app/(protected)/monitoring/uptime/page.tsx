import { MonitoringToolPage } from "@/components/monitoring-tool-page";

export default function UptimePage() {
  return (
    <MonitoringToolPage
      description="Мониторинг доступности сервисов и endpoints."
      embed={process.env.NEXT_PUBLIC_UPTIME_KUMA_EMBED === "true"}
      name="Uptime Kuma"
      repositoryUrl="https://github.com/louislam/uptime-kuma"
      target="uptime"
      url={process.env.NEXT_PUBLIC_UPTIME_KUMA_URL ?? "http://localhost:3001"}
    />
  );
}
