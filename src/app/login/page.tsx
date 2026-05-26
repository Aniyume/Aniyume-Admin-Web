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
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section className="card" style={{ width: "100%", maxWidth: 520 }}>
        <h1>Aniyume Admin</h1>
        <p className="muted">
          Временный auth shell: token держится в памяти вкладки и отправляется как Bearer только пока открыта
          текущая сессия UI. Если backend уже выставляет HttpOnly cookie, можно оставить поле пустым и проверить /me.
        </p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span>Admin token</span>
            <input
              className="input"
              value={token}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Bearer token / временный токен"
              type="password"
            />
          </label>
          <label className="muted" style={{ alignItems: "flex-start", display: "flex", gap: 8, fontSize: 14 }}>
            <input
              checked={persistForTab}
              onChange={(event) => setPersistForTab(event.target.checked)}
              type="checkbox"
            />
            <span>
              Сохранить token только до закрытия вкладки (sessionStorage fallback). По умолчанию token не пишется в
              Web Storage и теряется после перезагрузки страницы.
            </span>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="button" disabled={status === "loading"} type="submit">
            Проверить /me и войти
          </button>
        </form>
      </section>
    </main>
  );
}
