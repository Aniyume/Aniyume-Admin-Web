"use client";

import { useEffect, useState } from "react";
import type { AdminApiResult } from "@/lib/admin-api";

type EndpointPanelProps = {
  title: string;
  loader: () => Promise<AdminApiResult<unknown>>;
};

export function EndpointPanel({ title, loader }: EndpointPanelProps) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loader()
      .then((result) => {
        if (!mounted) return;
        if (result.ok) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.message);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [loader]);

  return (
    <article className="card">
      <h2>{title}</h2>
      {loading ? <p className="muted">Загрузка…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error ? <pre>{JSON.stringify(data, null, 2)}</pre> : null}
    </article>
  );
}
