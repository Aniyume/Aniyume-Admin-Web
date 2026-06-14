"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-provider";

type NavItem =
  | { href: string; label: string; icon: string }
  | { type: "divider"; id: string; label: string };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Главная", icon: "⌂" },
  { href: "/anime", label: "Аниме", icon: "▣" },
  { href: "/episodes", label: "Серии", icon: "▶" },
  { href: "/users", label: "Пользователи", icon: "◎" },
  { href: "/comments", label: "Комментарии", icon: "✦" },
  { href: "/reports", label: "Жалобы", icon: "!" },
  { href: "/contacts", label: "Обращения", icon: "✉" },
  { href: "/ratings", label: "Оценки", icon: "★" },
  { href: "/tags", label: "Теги и жанры", icon: "#" },
  { href: "/imports", label: "Импорт", icon: "⇣" },
  { href: "/imports/logs", label: "Логи импорта", icon: "≡" },
  { href: "/audit-logs", label: "Журнал действий", icon: "⌁" },
  { href: "/settings", label: "Настройки", icon: "⚙" },
  { type: "divider", id: "operations-tools", label: "Мониторинг" },
  { href: "/monitoring/uptime", label: "Доступность", icon: "◉" },
  { href: "/monitoring/grafana", label: "Метрики", icon: "◈" },
  { href: "/monitoring/nocodb", label: "База данных", icon: "⊞" },
];

function displayUserName(user: unknown) {
  if (!user || typeof user !== "object") return "Admin";
  const data = user as { data?: unknown; name?: unknown; email?: unknown; id?: unknown };
  const nested = data.data && typeof data.data === "object" ? (data.data as typeof data) : data;
  return String(nested.name ?? nested.email ?? nested.id ?? "Admin");
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const router = useRouter();
  const { user, status, refreshMe, clearAuth } = useAuth();

  useEffect(() => {
    refreshMe().then((result) => {
      if (!result.ok) router.replace("/login");
    });
  }, [refreshMe, router]);

  if (status === "idle" || status === "loading" || status === "anonymous") {
    return (
      <main className="auth-screen">
        <section className="card auth-card">
          <div className="card-content state-card">
            <div>
              <p className="kicker">защищённая панель</p>
              <h1 className="page-title" style={{ fontSize: 42 }}>Aniyume Admin</h1>
              <p className="muted">Проверяем сессию и права доступа…</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/dashboard">
          <span className="admin-logo-mark">A</span>
          <span className="admin-logo-title">Aniyume Admin</span>
          <span className="muted" style={{ fontSize: 12 }}>Управление · Модерация · Контент</span>
        </Link>

        <nav className="admin-nav" aria-label="Навигация администратора">
          {navItems.map((item) => {
            if ("type" in item) {
              return (
                <div key={item.id} className="admin-nav-section">
                  <span>{item.label}</span>
                </div>
              );
            }
            const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(`${item.href}/`));
            return (
              <Link className={`admin-nav-item ${isActive ? "active" : ""}`} href={item.href} key={item.href}>
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-user-card">
          <div className="pill" style={{ width: "100%" }}>● {displayUserName(user)}</div>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            Вы вошли в защищённую панель управления Aniyume.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              clearAuth();
              router.replace("/login");
            }}
            style={{ width: "100%" }}
            type="button"
          >
            Выйти
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="search-shell">
            <span className="search-icon">⌕</span>
            <input className="input" placeholder="Быстрый поиск по панели…" />
          </div>
          <div className="topbar-actions">
            <span className="pill">0 уведомлений</span>
            <span className="pill">{displayUserName(user)}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
