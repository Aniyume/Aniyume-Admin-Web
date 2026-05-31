"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/anime", label: "Anime", icon: "▣" },
  { href: "/episodes", label: "Episodes", icon: "▶" },
  { href: "/users", label: "Users", icon: "◎" },
  { href: "/comments", label: "Comments", icon: "✦" },
  { href: "/reports", label: "Reports", icon: "!" },
  { href: "/contacts", label: "Contacts", icon: "✉" },
  { href: "/ratings", label: "Ratings", icon: "★" },
  { href: "/tags", label: "Tags / Genres", icon: "#" },
  { href: "/imports", label: "Imports", icon: "⇣" },
  { href: "/imports/logs", label: "Import logs", icon: "≡" },
  { href: "/audit-logs", label: "Audit logs", icon: "⌁" },
  { href: "/settings", label: "Settings", icon: "⚙" },
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
              <p className="kicker">secure console</p>
              <h1 className="page-title" style={{ fontSize: 42 }}>Aniyume Admin</h1>
              <p className="muted">Проверяем admin-сессию и права доступа…</p>
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
          <span className="muted" style={{ fontSize: 12 }}>Operations · Moderation · Media</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
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
            Token shell временный: Bearer хранится в памяти вкладки; cookie/session auth уже поддерживается через credentials.
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
            Выйти локально
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="search-shell">
            <span className="search-icon">⌕</span>
            <input className="input" placeholder="Быстрый поиск: anime, user, comment, report…" />
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
