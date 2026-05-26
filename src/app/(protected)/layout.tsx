"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/anime", label: "Anime" },
  { href: "/imports", label: "Imports" },
  { href: "/imports/logs", label: "Import logs" },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, refreshMe, clearAuth } = useAuth();

  useEffect(() => {
    refreshMe().then((result) => {
      if (!result.ok) router.replace("/login");
    });
  }, [refreshMe, router]);

  if (status === "idle" || status === "loading" || status === "anonymous") {
    return <main style={{ padding: 24 }}>Проверяем admin сессию…</main>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid var(--border)", padding: 20, background: "var(--panel)" }}>
        <h2 style={{ marginTop: 0 }}>Aniyume Admin</h2>
        <p className="muted" style={{ fontSize: 14 }}>
          {user ? `Signed in: ${user.name ?? user.email ?? user.id ?? "admin"}` : "Auth shell"}
        </p>
        <p className="muted" style={{ fontSize: 12 }}>
          Token хранится в памяти вкладки{status === "authenticated" ? "; cookie auth также поддержан" : ""}.
        </p>
        <nav style={{ display: "grid", gap: 8, marginTop: 24 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: pathname === item.href ? "var(--panel-soft)" : "transparent",
                border: "1px solid var(--border)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="button secondary"
          onClick={() => {
            clearAuth();
            router.replace("/login");
          }}
          style={{ marginTop: 24, width: "100%" }}
          type="button"
        >
          Выйти локально
        </button>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
