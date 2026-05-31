"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { acceptToken, refreshMe, clearAuth, status, persistForTab, setPersistForTab } = useAuth();
  const [token, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmedToken = token.trim();
    acceptToken(trimmedToken);

    const result = await refreshMe(trimmedToken);
    if (!result.ok) {
      clearAuth();
      setError(result.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="auth-screen">
      <section className="card auth-card">
        <div className="card-content" style={{ padding: 34 }}>
          <p className="kicker">secure operator console</p>
          <h1 className="page-title" style={{ fontSize: "clamp(42px, 9vw, 72px)" }}>Aniyume Admin</h1>
          <p className="page-subtitle">
            Временный auth shell для разработки: token хранится в памяти вкладки и отправляется как Bearer. Если backend
            уже выставляет HttpOnly cookie, оставь поле пустым и проверь текущую admin-сессию через /me.
          </p>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 16, marginTop: 28 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="stat-card-label">Admin token</span>
              <input
                className="input"
                value={token}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Bearer token / временный токен"
                type="password"
              />
            </label>
            <label className="muted" style={{ alignItems: "flex-start", display: "flex", gap: 10, fontSize: 14, lineHeight: 1.55 }}>
              <input checked={persistForTab} onChange={(event) => setPersistForTab(event.target.checked)} type="checkbox" />
              <span>
                Сохранить token только до закрытия вкладки (sessionStorage fallback). По умолчанию token не пишется в Web
                Storage и теряется после перезагрузки страницы.
              </span>
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="button" disabled={status === "loading"} type="submit">
              Проверить /me и войти
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
