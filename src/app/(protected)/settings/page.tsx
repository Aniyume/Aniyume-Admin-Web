"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate } from "@/components/ui";
import { AdminDiagnostics, AdminSetting, getAdminDiagnostics, getAdminSettings, updateAdminSettings } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

function stringifyValue(value: AdminSetting["value"]) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseValue(setting: AdminSetting, value: string | boolean) {
  if (setting.type === "boolean") return Boolean(value);
  if (setting.type === "integer") return value === "" ? null : Number.parseInt(String(value), 10);
  if (setting.type === "float") return value === "" ? null : Number.parseFloat(String(value));
  if (setting.type === "json") return value === "" ? null : JSON.parse(String(value));
  return value;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [diagnostics, setDiagnostics] = useState<AdminDiagnostics | null>(null);
  const [activeGroup, setActiveGroup] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ui = useUi();

  const groups = useMemo(() => Array.from(new Set(settings.map((setting) => setting.group))).sort(), [settings]);
  const groupSettings = settings.filter((setting) => setting.group === activeGroup);
  const dirty = settings.filter((setting) => values[setting.key] !== undefined && values[setting.key] !== (setting.type === "boolean" ? Boolean(setting.value) : stringifyValue(setting.value)));

  function load() {
    setLoading(true);
    Promise.all([getAdminSettings(), getAdminDiagnostics()]).then(([settingsResult, diagnosticsResult]) => {
      if (settingsResult.ok) {
        setSettings(settingsResult.data.data);
        setValues(Object.fromEntries(settingsResult.data.data.map((setting) => [setting.key, setting.type === "boolean" ? Boolean(setting.value) : stringifyValue(setting.value)])));
        if (!settingsResult.data.data.some((setting) => setting.group === activeGroup)) setActiveGroup(settingsResult.data.data[0]?.group ?? "general");
      } else setError(settingsResult.message);
      if (diagnosticsResult.ok) setDiagnostics(diagnosticsResult.data.data);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = dirty.map((setting) => ({ key: setting.key, value: parseValue(setting, values[setting.key]) }));
      const result = await updateAdminSettings(payload);
      if (result.ok) { ui.toast({ tone: "success", title: "Settings saved", message: `${payload.length} changes applied` }); load(); }
      else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid setting value";
      setError(message); ui.toast({ tone: "error", title: "Ошибка", message });
    } finally { setSaving(false); }
  }

  if (loading) return <LoadingState label="Загружаем settings center…" />;
  if (error && settings.length === 0) return <ErrorState message={error} />;
  if (settings.length === 0) return <EmptyState title="Settings not configured" />;

  return <section className="page"><PageHeader kicker="system control" title="Settings" description="Центр управления Aniyume: feature flags, moderation rules, uploads, imports и diagnostics. Изменения пишутся в audit log." actions={<button className="button secondary" onClick={load} type="button">↻ Refresh</button>} />
    {error ? <div className="pill" style={{ borderColor: "rgba(251,113,133,.35)", color: "var(--danger)" }}>{error}</div> : null}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{groups.map((group) => <button className={`badge ${activeGroup === group ? "brand" : ""}`} key={group} onClick={() => setActiveGroup(group)} type="button">{group}</button>)}</div>
    <div className="grid" style={{ gridTemplateColumns: "minmax(340px, 1.1fr) minmax(320px, .9fr)" }}>
      <Card><form className="form-grid" onSubmit={save}><div className="toolbar"><div><p className="kicker">{activeGroup}</p><h2 style={{ margin: 0 }}>Editable settings</h2></div><Badge tone={dirty.length ? "warning" : "success"}>{dirty.length} changed</Badge></div>{groupSettings.map((setting) => <div key={setting.key} style={{ border: "1px solid var(--border)", borderRadius: 18, padding: 14, background: "rgba(255,255,255,.035)" }}><div className="toolbar" style={{ marginBottom: 10 }}><div><strong>{setting.key}</strong><p className="muted" style={{ margin: "4px 0 0" }}>{setting.description ?? "—"}</p></div><div style={{ display: "flex", gap: 6 }}><Badge>{setting.type}</Badge>{setting.is_public ? <Badge tone="brand">public</Badge> : null}</div></div>{setting.type === "boolean" ? <label className="pill" style={{ justifyContent: "flex-start" }}><input checked={Boolean(values[setting.key])} onChange={(e) => setValues({ ...values, [setting.key]: e.target.checked })} type="checkbox" /> Enabled</label> : setting.type === "json" ? <textarea className="input" rows={6} value={String(values[setting.key] ?? "")} onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })} /> : <input className="input" value={String(values[setting.key] ?? "")} onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })} /> }<p className="muted" style={{ fontSize: 12 }}>Updated: {formatDate(setting.updated_at)}</p></div>)}<button className="button" disabled={saving || dirty.length === 0} type="submit">{saving ? "Saving…" : `Save ${dirty.length} changes`}</button></form></Card>
      <Card><p className="kicker">diagnostics</p><h2 style={{ marginTop: 0 }}>Environment health</h2>{diagnostics ? <div style={{ display: "grid", gap: 16 }}>{Object.entries(diagnostics).map(([group, entries]) => <div key={group}><h3 style={{ marginBottom: 8 }}>{group}</h3><div style={{ display: "grid", gap: 8 }}>{Object.entries(entries).map(([key, value]) => <div className="pill" key={key} style={{ justifyContent: "space-between", borderRadius: 14 }}><span>{key}</span><strong style={{ color: typeof value === "boolean" ? value ? "var(--success)" : "var(--danger)" : "var(--text)" }}>{String(value)}</strong></div>)}</div></div>)}</div> : <p className="muted">Diagnostics unavailable.</p>}</Card>
    </div>
  </section>;
}
