import { Card, PageHeader } from "@/components/ui";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="page">
      <PageHeader kicker="раздел админки" title={title} description={description} />
      <Card>
        <div className="state-card">
          <div>
            <h3>Модуль заложен в навигацию</h3>
            <p className="muted">
              Следующий этап — подключение API, таблиц, фильтров, действий, подтверждений и журнала изменений.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
