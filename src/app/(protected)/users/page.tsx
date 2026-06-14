"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, formatDate, formatNumber } from "@/components/ui";
import { AdminUser, PaginationMeta, banAdminUser, getAdminUsers, grantAdminPremiumByNickname, unbanAdminUser, updateAdminUserPremium } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

type Filters = { search: string; role: string; banned: string; premium: string; online: string };
const initialFilters: Filters = { search: "", role: "", banned: "", premium: "", online: "" };

function formatBanUntil(value?: string | null) {
  return value ? `до ${formatDate(value)}` : "навсегда";
}

function parseBanDuration(input: string) {
  const value = input.trim().toLowerCase();
  if (!value || ["forever", "permanent", "навсегда"].includes(value)) return null;

  const relative = value.match(/^(\d+)\s*(m|min|мин|h|ч|d|д|day|days|w|н|week|weeks)$/i);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2];
    const minutes = unit.startsWith("m") || unit.startsWith("мин") ? amount : unit.startsWith("h") || unit.startsWith("ч") ? amount * 60 : unit.startsWith("w") || unit.startsWith("н") ? amount * 7 * 24 * 60 : amount * 24 * 60;
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export default function UsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const ui = useUi();

  function load() {
    setLoading(true);
    getAdminUsers({ ...applied, page, per_page: 20 })
      .then((result) => {
        if (result.ok) { setItems(result.data.data); setMeta(result.data.meta); setError(null); }
        else setError(result.message);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [applied, page]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPage(1); setApplied(filters);
  }

  async function toggleBan(user: AdminUser) {
    let reason = "";
    let expiresAt: string | null | undefined = null;

    if (!user.is_banned) {
      reason = await ui.prompt({ title: "Забанить пользователя", message: `Причина бана для ${user.email ?? user.name}?`, defaultValue: "Moderation action", confirmLabel: "Дальше", danger: true }) ?? "";
      if (!reason.trim()) return;

      const duration = await ui.prompt({ title: "Срок бана", message: "Например: 30m, 12h, 7d, 2w, дата 2026-06-30 18:00 или пусто/навсегда.", placeholder: "7d", confirmLabel: "Ban", danger: true }) ?? "";
      expiresAt = parseBanDuration(duration);
      if (expiresAt === undefined) { ui.toast({ tone: "error", title: "Неверный срок", message: "Используй формат 30m, 12h, 7d, 2w или дату." }); return; }
    }

    const result = user.is_banned ? await unbanAdminUser(user.id) : await banAdminUser(user.id, reason.trim(), expiresAt);
    if (result.ok) { const title = user.is_banned ? "Пользователь разблокирован" : "Пользователь заблокирован"; setNotice(title); ui.toast({ tone: "success", title }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  async function grantPremiumByNickname() {
    const nickname = await ui.prompt({ title: "Выдать Premium", message: "Ник пользователя из Boosty", confirmLabel: "Выдать" }) ?? "";
    if (!nickname.trim()) return;
    const result = await grantAdminPremiumByNickname(nickname.trim());
    if (result.ok) { const title = `Premium выдан: ${result.data.data.name ?? nickname}`; setNotice(title); ui.toast({ tone: "success", title }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  async function togglePremium(user: AdminUser) {
    const next = !user.is_premium;
    const result = await updateAdminUserPremium(user.id, next);
    if (result.ok) { const title = next ? "Premium выдан" : "Premium снят"; setNotice(title); ui.toast({ tone: "success", title }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  return (
    <section className="page">
      <PageHeader kicker="пользователи и модерация" title="Пользователи" description="Управление ролями, Premium-статусом, блокировками и активностью." />
      <div className="toolbar" style={{ marginBottom: 16 }}><button className="button" type="button" onClick={grantPremiumByNickname}>Выдать Premium по нику</button></div>
      <Card>
        <form className="filter-row" onSubmit={submit}>
          <input className="input" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="ID / name / email" />
          <select className="select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}><option value="">Любая роль</option><option value="admin">Администратор</option><option value="moderator">Модератор</option></select>
          <select className="select" value={filters.banned} onChange={(e) => setFilters({ ...filters, banned: e.target.value })}><option value="">Любая блокировка</option><option value="1">Заблокированные</option><option value="0">Не заблокированные</option></select>
          <select className="select" value={filters.premium} onChange={(e) => setFilters({ ...filters, premium: e.target.value })}><option value="">Любой тариф</option><option value="1">Premium</option><option value="0">Стандартный</option></select>
          <select className="select" value={filters.online} onChange={(e) => setFilters({ ...filters, online: e.target.value })}><option value="">Любой статус</option><option value="1">Онлайн</option><option value="0">Офлайн</option></select>
          <button className="button secondary" type="submit">Фильтровать</button>
        </form>
      </Card>
      {notice ? <div className="pill" style={{ borderColor: "rgba(52,211,153,.35)", color: "var(--success)" }}>{notice}</div> : null}
      {loading ? <LoadingState label="Загружаем пользователей…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="Пользователей не найдено" /> : null}
      {!loading && !error && items.length > 0 ? <Card>
        <div className="toolbar" style={{ marginBottom: 16 }}><h2 style={{ margin: 0 }}>Users table</h2><span className="pill">{formatNumber(meta?.total)} users</span></div>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>User</th><th>Roles</th><th>Status</th><th>Activity</th><th>Registered</th><th>Last login</th><th>Actions</th></tr></thead><tbody>
          {items.map((user) => <tr key={user.id}>
            <td>#{user.id}</td>
            <td><Link href={`/users/${user.id}`}><strong>{user.name ?? "—"}</strong><br /><span className="muted">{user.email ?? "—"}</span></Link></td>
            <td>{(user.roles ?? []).map((role) => <Badge key={role} tone={role === "admin" ? "brand" : "default"}>{role}</Badge>)}</td>
            <td><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{user.is_online ? <Badge tone="success">online</Badge> : <Badge>offline</Badge>}{user.is_premium ? <Badge tone="brand">premium</Badge> : null}{user.is_banned ? <Badge tone="danger">banned · {formatBanUntil(user.ban_expires_at)}</Badge> : null}</div>{user.ban_reason ? <div className="muted" style={{ marginTop: 6 }}>Причина: {user.ban_reason}</div> : null}</td>
            <td><span className="muted">comments</span> {user.comments_count ?? 0}<br /><span className="muted">ratings</span> {user.ratings_count ?? 0}</td>
            <td>{formatDate(user.created_at)}</td><td>{formatDate(user.last_login_at)}</td>
            <td><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="button secondary" onClick={() => togglePremium(user)} type="button">{user.is_premium ? "Revoke Premium" : "Grant Premium"}</button><button className="button secondary" onClick={() => toggleBan(user)} type="button">{user.is_banned ? "Unban" : "Ban"}</button></div></td>
          </tr>)}
        </tbody></table></div>
        <div className="toolbar" style={{ marginTop: 16 }}><button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Назад</button><span className="muted">Страница {meta?.current_page ?? page} из {meta?.last_page ?? 1}</span><button className="button secondary" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((p) => p + 1)}>Вперёд →</button></div>
      </Card> : null}
    </section>
  );
}
