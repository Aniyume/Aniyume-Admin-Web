"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, formatDate, formatNumber } from "@/components/ui";
import { AdminComment, AdminReport, AdminUser, banAdminUser, getAdminComments, getAdminReports, getAdminUserDetail, unbanAdminUser } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params?.id;
  const ui = useUi();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!userId) return;
    setLoading(true);
    Promise.all([getAdminUserDetail(userId), getAdminComments({ user_id: userId, per_page: 8 }), getAdminReports({ reporter_id: userId, per_page: 8 })])
      .then(([userResult, commentsResult, reportsResult]) => {
        if (userResult.ok) setUser(userResult.data.data); else setError(userResult.message);
        if (commentsResult.ok) setComments(commentsResult.data.data);
        if (reportsResult.ok) setReports(reportsResult.data.data);
      }).finally(() => setLoading(false));
  }
  useEffect(load, [userId]);

  async function toggleBan() {
    if (!user) return;
    const reason = user.is_banned ? "" : await ui.prompt({ title: "Забанить пользователя", message: user.email ?? user.name ?? `User #${user.id}`, defaultValue: "Moderation action", confirmLabel: "Ban", danger: true }) ?? "";
    if (!user.is_banned && !reason.trim()) return;
    const result = user.is_banned ? await unbanAdminUser(user.id) : await banAdminUser(user.id, reason.trim());
    if (result.ok) { ui.toast({ tone: "success", title: user.is_banned ? "User unbanned" : "User banned" }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  if (loading) return <LoadingState label="Загружаем user dossier…" />;
  if (error && !user) return <ErrorState message={error} />;
  if (!user) return <EmptyState title="Пользователь не найден" />;

  return <section className="page"><PageHeader kicker="user dossier" title={user.name ?? `User #${user.id}`} description={`${user.email ?? "no email"} · user profile, moderation context, comments and reports.`} actions={<Link className="button secondary" href="/users">← Users</Link>} />
    {error ? <div className="pill" style={{ borderColor: "rgba(251,113,133,.35)", color: "var(--danger)" }}>{error}</div> : null}
    <div className="grid"><StatCard label="Comments" value={formatNumber(user.comments_count)} caption="Оставленные комментарии" /><StatCard label="Ratings" value={formatNumber(user.ratings_count)} caption="Оценки anime" /><StatCard label="Favorites" value={formatNumber(user.favorites_count)} caption="Избранное" /><StatCard label="Status" value={user.is_banned ? "Banned" : user.is_online ? "Online" : "Offline"} caption={user.is_premium ? "Premium account" : "Standard account"} /></div>
    <div className="grid" style={{ gridTemplateColumns: "minmax(300px, .8fr) minmax(320px, 1.2fr)" }}><Card><div style={{ display: "grid", gap: 14 }}><p className="kicker">identity</p><h2 style={{ margin: 0 }}>{user.name ?? "—"}</h2><p className="muted">{user.email ?? "—"}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(user.roles ?? []).map((role) => <Badge key={role} tone={role === "admin" ? "brand" : "default"}>{role}</Badge>)}{user.is_premium ? <Badge tone="brand">premium</Badge> : null}{user.is_online ? <Badge tone="success">online</Badge> : <Badge>offline</Badge>}{user.is_banned ? <Badge tone="danger">banned</Badge> : null}</div><p><span className="muted">Registered:</span> {formatDate(user.created_at)}</p><p><span className="muted">Last login:</span> {formatDate(user.last_login_at)}</p>{user.ban_reason ? <p className="error">Ban reason: {user.ban_reason}</p> : null}<button className="button secondary" onClick={toggleBan} type="button">{user.is_banned ? "Unban user" : "Ban user"}</button></div></Card>
    <Card><p className="kicker">recent comments</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Text</th><th>Anime</th><th>Status</th><th>Date</th></tr></thead><tbody>{comments.map((comment) => <tr key={comment.id}><td>#{comment.id}</td><td>{comment.comment.slice(0, 160)}{comment.comment.length > 160 ? "…" : ""}</td><td>{comment.anime?.title ?? "—"}</td><td><Badge tone={comment.is_approved ? "success" : "danger"}>{comment.status}</Badge></td><td>{formatDate(comment.created_at)}</td></tr>)}</tbody></table></div></Card></div>
    <Card><div className="toolbar" style={{ marginBottom: 16 }}><div><p className="kicker">reports by user</p><h2 style={{ margin: 0 }}>Жалобы пользователя</h2></div><button className="button secondary" onClick={() => router.push(`/reports?reporter_id=${user.id}`)} type="button">Открыть reports</button></div>{reports.length === 0 ? <p className="muted">Пользователь ещё не отправлял жалобы.</p> : <div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Status</th><th>Category</th><th>Reason</th><th>Date</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td>#{report.id}</td><td><Badge tone={report.status === "resolved" ? "success" : report.status === "rejected" ? "danger" : "brand"}>{report.status}</Badge></td><td>{report.category}</td><td>{report.reason}</td><td>{formatDate(report.created_at)}</td></tr>)}</tbody></table></div>}</Card>
  </section>;
}
