import { Card, PageHeader } from "@/components/ui";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="page">
      <PageHeader kicker="module foundation" title={title} description={description} />
      <Card>
        <div className="state-card">
          <div>
            <h3>Модуль заложен в навигацию</h3>
            <p className="muted">
              Следующий этап — подключение admin API, таблиц, фильтров, actions, confirm dialogs и audit coverage.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
