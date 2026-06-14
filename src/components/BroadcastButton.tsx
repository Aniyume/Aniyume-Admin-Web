"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toggleGlobalBroadcast } from "@/lib/admin-api";

// Глобальную рассылку триггерит только основной администратор.
const OWNER_EMAIL = "zanshugurov07@gmail.com";

/**
 * Тумблер общесайтовой real-time рассылки.
 * Виден только основному администратору; дёргает POST /admin/broadcast/toggle.
 */
export function BroadcastButton() {
  const { user, isLoaded } = useUser();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  if (!isLoaded || email !== OWNER_EMAIL) return null;

  const handleClick = async () => {
    const next = !active;
    setBusy(true);
    setError(null);
    const result = await toggleGlobalBroadcast(next);
    setBusy(false);
    if (result.ok) {
      setActive(next);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        title={active ? "Остановить глобальную рассылку" : "Запустить глобальную рассылку"}
        style={{
          position: "relative",
          overflow: "hidden",
          minWidth: 120,
          height: 64,
          padding: "0 22px",
          borderRadius: 16,
          border: "none",
          cursor: busy ? "wait" : "pointer",
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: 1,
          color: "#fff",
          background: active
            ? "linear-gradient(135deg, #ff2d55, #7b2ff7)"
            : "linear-gradient(135deg, #2b2f3a, #4b3fb0)",
          boxShadow: active ? "0 0 24px rgba(255,45,85,0.6)" : "0 6px 18px rgba(0,0,0,0.3)",
          transition: "all .2s ease",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 6px",
            fontSize: 70,
            fontWeight: 900,
            color: "rgba(255,255,255,0.12)",
            pointerEvents: "none",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          <span>67</span>
          <span>67</span>
        </span>
        <span style={{ position: "relative" }}>{busy ? "…" : "67"}</span>
      </button>
      {error ? <span style={{ color: "#ff5470", fontSize: 12 }}>{error}</span> : null}
    </div>
  );
}
