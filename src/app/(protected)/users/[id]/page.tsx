"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, formatDate, formatNumber } from "@/components/ui";
import { AdminComment, AdminReport, AdminUser, adminStorageUrl, banAdminUser, deleteAdminUser, deleteAdminUserAvatar, getAdminComments, getAdminReports, getAdminUserDetail, unbanAdminUser, updateAdminUserFrameAccess, updateAdminUserPremium, updateAdminUserProfile, uploadAdminUserAvatar } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

const PROFILE_FRAME_OPTIONS = [
  { key: "none", label: "No frame" },
  { key: "ramka1000people", label: "First 1000" },
  { key: "ramka1-10lvl", label: "Level 1-10" },
  { key: "ramka11-20lvl", label: "Level 11-20" },
  { key: "ramka21-30lvl", label: "Level 21-30" },
  { key: "ramka31-40lvl", label: "Level 31-40" },
  { key: "ramka41-50lvl", label: "Level 41-50" },
  { key: "ramka51-60lvl", label: "Level 51-60" },
  { key: "ramka61-70lvl", label: "Level 61-70" },
  { key: "ramka67", label: "Secret 67" },
  { key: "ramka+5friend", label: "5 friends" },
  { key: "ramka+10friend", label: "10 friends" },
  { key: "ramka+25friend", label: "25 friends" },
  { key: "ramkaShark", label: "Shark" },
  { key: "ramkaUborka", label: "Uborka" },
];

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

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params?.id;
  const ui = useUi();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [profileForm, setProfileForm] = useState({ name: "", custom_status: "", selected_profile_frame: "none" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPremium, setSavingPremium] = useState(false);
  const [savingFrameKey, setSavingFrameKey] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!userId) return;
    setLoading(true);
    Promise.all([getAdminUserDetail(userId), getAdminComments({ user_id: userId, per_page: 8 }), getAdminReports({ reporter_id: userId, per_page: 8 })])
      .then(([userResult, commentsResult, reportsResult]) => {
        if (userResult.ok) {
          const nextUser = userResult.data.data;
          setUser(nextUser);
          setProfileForm({
            name: nextUser.name ?? "",
            custom_status: nextUser.custom_status ?? "",
            selected_profile_frame: nextUser.selected_profile_frame ?? "none",
          });
        } else setError(userResult.message);
        if (commentsResult.ok) setComments(commentsResult.data.data);
        if (reportsResult.ok) setReports(reportsResult.data.data);
      }).finally(() => setLoading(false));
  }
  useEffect(load, [userId]);

  async function toggleBan() {
    if (!user) return;
    let reason = "";
    let expiresAt: string | null | undefined = null;
    if (!user.is_banned) {
      reason = await ui.prompt({ title: "Забанить пользователя", message: user.email ?? user.name ?? `User #${user.id}`, defaultValue: "Moderation action", confirmLabel: "Дальше", danger: true }) ?? "";
      if (!reason.trim()) return;
      const duration = await ui.prompt({ title: "Срок бана", message: "Например: 30m, 12h, 7d, 2w, дата 2026-06-30 18:00 или пусто/навсегда.", placeholder: "7d", confirmLabel: "Ban", danger: true }) ?? "";
      expiresAt = parseBanDuration(duration);
      if (expiresAt === undefined) { ui.toast({ tone: "error", title: "Неверный срок", message: "Используй формат 30m, 12h, 7d, 2w или дату." }); return; }
    }
    const result = user.is_banned ? await unbanAdminUser(user.id) : await banAdminUser(user.id, reason.trim(), expiresAt);
    if (result.ok) { ui.toast({ tone: "success", title: user.is_banned ? "User unbanned" : "User banned" }); load(); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const result = await updateAdminUserProfile(user.id, {
      name: profileForm.name.trim(),
      custom_status: profileForm.custom_status.trim() || null,
    });
    setSavingProfile(false);
    if (result.ok) {
      setUser(result.data.data);
      ui.toast({ tone: "success", title: "Profile updated" });
      load();
    } else {
      setError(result.message);
      ui.toast({ tone: "error", title: "Error", message: result.message });
    }
  }

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    setAvatarFile(event.target.files?.[0] ?? null);
  }

  async function saveAvatar() {
    if (!user || !avatarFile) return;
    setSavingAvatar(true);
    const result = await uploadAdminUserAvatar(user.id, avatarFile);
    setSavingAvatar(false);
    if (result.ok) {
      setAvatarFile(null);
      setUser(result.data.data);
      ui.toast({ tone: "success", title: "Avatar updated" });
      load();
    } else {
      setError(result.message);
      ui.toast({ tone: "error", title: "Error", message: result.message });
    }
  }

  async function removeAvatar() {
    if (!user) return;
    setSavingAvatar(true);
    const result = await deleteAdminUserAvatar(user.id);
    setSavingAvatar(false);
    if (result.ok) {
      setAvatarFile(null);
      setUser(result.data.data);
      ui.toast({ tone: "success", title: "Avatar removed" });
      load();
    } else {
      setError(result.message);
      ui.toast({ tone: "error", title: "Error", message: result.message });
    }
  }

  async function togglePremium() {
    if (!user) return;
    setSavingPremium(true);
    const result = await updateAdminUserPremium(user.id, !user.is_premium);
    setSavingPremium(false);
    if (result.ok) {
      setUser(result.data.data);
      ui.toast({ tone: "success", title: user.is_premium ? "Premium снят" : "Premium выдан" });
      load();
    } else {
      setError(result.message);
      ui.toast({ tone: "error", title: "Error", message: result.message });
    }
  }

  async function setFrameAccess(frameKey: string, enabled: boolean) {
    if (!user) return;
    setSavingFrameKey(frameKey);
    const result = await updateAdminUserFrameAccess(user.id, frameKey, enabled);
    setSavingFrameKey(null);
    if (result.ok) {
      setUser(result.data.data);
      ui.toast({ tone: "success", title: enabled ? "Рамка выдана" : "Рамка отозвана" });
    } else {
      setError(result.message);
      ui.toast({ tone: "error", title: "Error", message: result.message });
    }
  }

  async function clearProfileField(field: "custom_status" | "selected_profile_frame") {
    if (!user) return;
    setSavingProfile(true);
    const result = await updateAdminUserProfile(user.id, field === "custom_status" ? { custom_status: null } : { selected_profile_frame: "none" });
    setSavingProfile(false);
    if (result.ok) {
      const nextUser = result.data.data;
      setUser(nextUser);
      setProfileForm({
        name: nextUser.name ?? "",
        custom_status: nextUser.custom_status ?? "",
        selected_profile_frame: nextUser.selected_profile_frame ?? "none",
      });
      ui.toast({ tone: "success", title: field === "custom_status" ? "Статус убран" : "Рамка убрана" });
    } else {
      setError(result.message);
      ui.toast({ tone: "error", title: "Error", message: result.message });
    }
  }

  async function removeUser() {
    if (!user) return;
    const ok = await ui.confirm({ title: "Удалить пользователя?", message: `${user.email ?? user.name ?? `User #${user.id}`} будет удалён безвозвратно вместе со всеми данными.`, confirmLabel: "Удалить", danger: true });
    if (!ok) return;
    setDeletingUser(true);
    const result = await deleteAdminUser(user.id);
    setDeletingUser(false);
    if (result.ok) {
      ui.toast({ tone: "success", title: "Пользователь удалён" });
      router.push("/users");
    } else {
      setError(result.message);
      ui.toast({ tone: "error", title: "Error", message: result.message });
    }
  }

  if (loading) return <LoadingState label="Загружаем user dossier…" />;
  if (error && !user) return <ErrorState message={error} />;
  if (!user) return <EmptyState title="Пользователь не найден" />;

  return <section className="page"><PageHeader kicker="user dossier" title={user.name ?? `User #${user.id}`} description={`${user.email ?? "no email"} · user profile, moderation context, comments and reports.`} actions={<Link className="button secondary" href="/users">← Users</Link>} />
    {error ? <div className="pill" style={{ borderColor: "rgba(251,113,133,.35)", color: "var(--danger)" }}>{error}</div> : null}
    <div className="grid"><StatCard label="Comments" value={formatNumber(user.comments_count)} caption="Оставленные комментарии" /><StatCard label="Ratings" value={formatNumber(user.ratings_count)} caption="Оценки anime" /><StatCard label="Favorites" value={formatNumber(user.favorites_count)} caption="Избранное" /><StatCard label="Status" value={user.is_banned ? "Banned" : user.is_online ? "Online" : "Offline"} caption={user.is_premium ? "Premium account" : "Standard account"} /></div>
    <Card>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div><p className="kicker">quick profile access</p><h2 style={{ margin: 0 }}>Name, status, frame, avatar</h2></div>
        <Badge tone="brand">{profileForm.selected_profile_frame || "none"}</Badge>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "140px minmax(280px, 1fr)" }}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div style={{ width: 112, height: 112, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}>
            {user.avatar ? <img src={adminStorageUrl(user.avatar) ?? ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 34, fontWeight: 800 }}>{(user.name ?? "?")[0]?.toUpperCase()}</div>}
          </div>
          <input className="input" type="file" accept="image/*" onChange={selectAvatar} />
          <button className="button secondary" type="button" onClick={saveAvatar} disabled={!avatarFile || savingAvatar}>{savingAvatar ? "Saving..." : "Upload avatar"}</button>
          <button className="button secondary" type="button" onClick={removeAvatar} disabled={savingAvatar || !user.avatar}>Remove avatar</button>
        </div>
        <form className="form-grid" onSubmit={saveProfile}>
          <label><span className="muted">Name</span><input className="input" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></label>
          <label><span className="muted">Status</span><input className="input" value={profileForm.custom_status} onChange={(event) => setProfileForm({ ...profileForm, custom_status: event.target.value })} placeholder="Custom status" /></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="button secondary" type="button" onClick={() => clearProfileField("custom_status")} disabled={savingProfile || !user.custom_status}>Убрать статус</button>
            <button className="button secondary" type="button" onClick={() => clearProfileField("selected_profile_frame")} disabled={savingProfile || !user.selected_profile_frame || user.selected_profile_frame === "none"}>Убрать рамку</button>
          </div>
          <button className="button" type="submit" disabled={savingProfile || !profileForm.name.trim()}>{savingProfile ? "Saving..." : "Save profile fields"}</button>
        </form>
      </div>
    </Card>
    <Card>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div><p className="kicker">profile frame access</p><h2 style={{ margin: 0 }}>Выдача рамок</h2></div>
        <Badge tone="brand">Надета: {user.selected_profile_frame || "none"}</Badge>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {PROFILE_FRAME_OPTIONS.filter((frame) => frame.key !== "none").map((frame) => {
          const enabled = user.admin_granted_profile_frames?.includes(frame.key) ?? false;
          return <div key={frame.key} style={{ display: "grid", gap: 10, padding: 12, border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }}>
            <strong>{frame.label}</strong>
            <div style={{ display: "flex", gap: 14 }}>
              <label><input type="radio" name={`frame-${frame.key}`} checked={enabled} onChange={() => setFrameAccess(frame.key, true)} disabled={savingFrameKey === frame.key} /> Вкл</label>
              <label><input type="radio" name={`frame-${frame.key}`} checked={!enabled} onChange={() => setFrameAccess(frame.key, false)} disabled={savingFrameKey === frame.key} /> Выкл</label>
            </div>
          </div>;
        })}
      </div>
    </Card>
    <div className="grid" style={{ gridTemplateColumns: "minmax(300px, .8fr) minmax(320px, 1.2fr)" }}><Card><div style={{ display: "grid", gap: 14 }}><p className="kicker">identity</p><h2 style={{ margin: 0 }}>{user.name ?? "—"}</h2><p className="muted">{user.email ?? "—"}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(user.roles ?? []).map((role) => <Badge key={role} tone={role === "admin" ? "brand" : "default"}>{role}</Badge>)}{user.is_premium ? <Badge tone="brand">premium</Badge> : null}{user.is_online ? <Badge tone="success">online</Badge> : <Badge>offline</Badge>}{user.is_banned ? <Badge tone="danger">banned · {formatBanUntil(user.ban_expires_at)}</Badge> : null}</div><p><span className="muted">Registered:</span> {formatDate(user.created_at)}</p><p><span className="muted">Last login:</span> {formatDate(user.last_login_at)}</p>{user.ban_reason ? <p className="error">Ban reason: {user.ban_reason}</p> : null}<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="button secondary" onClick={togglePremium} type="button" disabled={savingPremium}>{savingPremium ? "..." : user.is_premium ? "Снять premium" : "Выдать premium"}</button><button className="button secondary" onClick={toggleBan} type="button">{user.is_banned ? "Unban user" : "Ban user"}</button><button className="button secondary" onClick={removeUser} type="button" disabled={deletingUser} style={{ borderColor: "rgba(251,113,133,.45)", color: "var(--danger)" }}>{deletingUser ? "Удаление..." : "Удалить пользователя"}</button></div></div></Card>
    <Card><p className="kicker">recent comments</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Text</th><th>Anime</th><th>Status</th><th>Date</th></tr></thead><tbody>{comments.map((comment) => <tr key={comment.id}><td>#{comment.id}</td><td>{comment.comment.slice(0, 160)}{comment.comment.length > 160 ? "…" : ""}</td><td>{comment.anime?.title ?? "—"}</td><td><Badge tone={comment.is_approved ? "success" : "danger"}>{comment.status}</Badge></td><td>{formatDate(comment.created_at)}</td></tr>)}</tbody></table></div></Card></div>
    <Card><div className="toolbar" style={{ marginBottom: 16 }}><div><p className="kicker">reports by user</p><h2 style={{ margin: 0 }}>Жалобы пользователя</h2></div><button className="button secondary" onClick={() => router.push(`/reports?reporter_id=${user.id}`)} type="button">Открыть reports</button></div>{reports.length === 0 ? <p className="muted">Пользователь ещё не отправлял жалобы.</p> : <div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Status</th><th>Category</th><th>Reason</th><th>Date</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td>#{report.id}</td><td><Badge tone={report.status === "resolved" ? "success" : report.status === "rejected" ? "danger" : "brand"}>{report.status}</Badge></td><td>{report.category}</td><td>{report.reason}</td><td>{formatDate(report.created_at)}</td></tr>)}</tbody></table></div>}</Card>
  </section>;
}
