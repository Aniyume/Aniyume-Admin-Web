import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="kicker">{kicker}</p>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-subtitle">{description}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <article className={`card ${className}`}>
      <div className="card-content">{children}</div>
    </article>
  );
}

export function StatCard({ label, value, caption }: { label: string; value: ReactNode; caption?: string }) {
  return (
    <article className="card stat-card">
      <div className="card-content" style={{ padding: 0 }}>
        <p className="stat-card-label">{label}</p>
        <div className="stat-card-value">{value}</div>
        {caption ? <p className="stat-card-caption">{caption}</p> : null}
      </div>
    </article>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "brand" }) {
  return <span className={`badge ${tone === "default" ? "" : tone}`}>{children}</span>;
}

export function LoadingState({ label = "Загрузка данных…" }: { label?: string }) {
  return (
    <Card>
      <div style={{ display: "grid", gap: 12 }}>
        <div className="skeleton" style={{ height: 24, width: "40%" }} />
        <div className="skeleton" style={{ height: 140 }} />
        <div className="skeleton" style={{ height: 18, width: "65%" }} />
        <p className="muted" style={{ margin: 0 }}>{label}</p>
      </div>
    </Card>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card>
      <div className="state-card">
        <div>
          <h3>{title}</h3>
          {description ? <p className="muted">{description}</p> : null}
        </div>
      </div>
    </Card>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <div className="state-card">
        <div>
          <h3>Не удалось загрузить данные</h3>
          <p className="error">{message}</p>
        </div>
      </div>
    </Card>
  );
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("ru-RU").format(value ?? 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
