import { MonitoringToolPage } from "@/components/monitoring-tool-page";

export default function NocoDBPage() {
  return (
    <MonitoringToolPage
      description="Управление базами данных и таблицами."
      embed={process.env.NEXT_PUBLIC_NOCODB_EMBED === "true"}
      name="NocoDB"
      repositoryUrl="https://github.com/nocodb/nocodb"
      target="nocodb"
      url={process.env.NEXT_PUBLIC_NOCODB_URL ?? "http://localhost:8080"}
    />
  );
}
