import { MonitoringToolPage } from "@/components/monitoring-tool-page";

export default function UnderstandAnythingPage() {
  return (
    <MonitoringToolPage
      description="Интерактивная карта архитектуры и связей в кодовой базе Aniyume."
      embed={process.env.NEXT_PUBLIC_UNDERSTAND_ANYTHING_EMBED === "true"}
      name="Understand Anything"
      repositoryUrl="https://github.com/Egonex-AI/Understand-Anything"
      target="understand-anything"
      url={process.env.NEXT_PUBLIC_UNDERSTAND_ANYTHING_URL ?? ""}
    />
  );
}
