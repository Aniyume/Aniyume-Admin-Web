"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatCard, formatDate, formatNumber } from "@/components/ui";
import { AdminAnime, AdminComment, AdminEpisode, AdminTag, approveAdminComment, deleteAdminAnime, deleteAdminAnimeImage, getAdminAnimeDetail, getAdminComments, getAdminEpisodes, getAdminTags, importEpisodesForAnime, rejectAdminComment, updateAdminAnime, uploadAdminAnimeImage } from "@/lib/admin-api";
import { useUi } from "@/features/ui/ui-provider";

type AnimeForm = {
  title: string;
  description: string;
  poster_url: string;
  rating: string;
  year: string;
  status: string;
  type: string;
  number_of_episodes: string;
  nsfw_flag: boolean;
  tags: number[];
};

function toForm(anime: AdminAnime): AnimeForm {
  return {
    title: anime.title ?? "",
    description: anime.description ?? "",
    poster_url: anime.poster_url ?? "",
    rating: anime.rating === null || anime.rating === undefined ? "" : String(anime.rating),
    year: anime.year === null || anime.year === undefined ? "" : String(anime.year),
    status: anime.status ?? "planned",
    type: anime.type ?? "tv",
    number_of_episodes: anime.number_of_episodes === null || anime.number_of_episodes === undefined ? "" : String(anime.number_of_episodes),
    nsfw_flag: Boolean(anime.nsfw_flag),
    tags: (anime.tags ?? []).map((tag) => tag.id),
  };
}

export default function AnimeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const animeId = params?.id;
  const [anime, setAnime] = useState<AdminAnime | null>(null);
  const [form, setForm] = useState<AnimeForm | null>(null);
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"poster" | "cover" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const ui = useUi();

  const selectedTagSet = useMemo(() => new Set(form?.tags ?? []), [form?.tags]);

  function load() {
    if (!animeId) return;
    setLoading(true);
    Promise.all([
      getAdminAnimeDetail(animeId),
      getAdminTags({ per_page: 100 }),
      getAdminEpisodes({ anime_id: animeId, per_page: 8, sort: "episode_number", direction: "desc" }),
      getAdminComments({ anime_id: animeId, per_page: 8 }),
    ]).then(([animeResult, tagsResult, episodesResult, commentsResult]) => {
      if (animeResult.ok) { setAnime(animeResult.data.data); setForm(toForm(animeResult.data.data)); } else setError(animeResult.message);
      if (tagsResult.ok) setTags(tagsResult.data.data);
      if (episodesResult.ok) setEpisodes(episodesResult.data.data);
      if (commentsResult.ok) setComments(commentsResult.data.data);
    }).finally(() => setLoading(false));
  }

  useEffect(load, [animeId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!animeId || !form) return;
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      poster_url: form.poster_url || null,
      rating: form.rating === "" ? null : Number(form.rating),
      year: form.year === "" ? null : Number(form.year),
      status: form.status,
      type: form.type,
      number_of_episodes: form.number_of_episodes === "" ? null : Number(form.number_of_episodes),
      nsfw_flag: form.nsfw_flag,
      tags: form.tags,
    };
    const result = await updateAdminAnime(animeId, payload);
    if (result.ok) { setAnime(result.data.data); setForm(toForm(result.data.data)); setNotice("Anime updated"); setError(null); ui.toast({ tone: "success", title: "Anime updated" }); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
    setSaving(false);
  }

  async function removeAnime() {
    if (!animeId || !anime) return;
    if (!await ui.confirm({ title: "Удалить anime", message: `${anime.title} будет удалён и добавлен в blacklist, если есть external_id.`, confirmLabel: "Delete", danger: true })) return;
    const result = await deleteAdminAnime(animeId);
    if (result.ok) router.replace("/anime");
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  async function moderateComment(comment: AdminComment, action: "approve" | "reject") {
    const result = action === "approve" ? await approveAdminComment(comment.id) : await rejectAdminComment(comment.id);
    if (result.ok) { const title = `Comment ${action}d`; setNotice(title); ui.toast({ tone: "success", title }); load(); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  async function importEpisodes() {
    if (!anime?.id) return;
    const result = await importEpisodesForAnime(anime.id);
    if (result.ok) { setNotice("Episodes import queued"); ui.toast({ tone: "success", title: "Episodes import queued" }); } else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
  }

  async function uploadImage(kind: "poster" | "cover", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!animeId || !file) return;
    setUploading(kind);
    const result = await uploadAdminAnimeImage(animeId, kind, file);
    if (result.ok) { setAnime(result.data.data); setForm(toForm(result.data.data)); ui.toast({ tone: "success", title: `${kind} uploaded` }); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
    setUploading(null);
  }

  async function removeImage(kind: "poster" | "cover") {
    if (!animeId || !await ui.confirm({ title: `Удалить ${kind}`, message: `Изображение ${kind} будет удалено из storage, если оно было загружено локально.`, confirmLabel: "Delete", danger: true })) return;
    setUploading(kind);
    const result = await deleteAdminAnimeImage(animeId, kind);
    if (result.ok) { setAnime(result.data.data); setForm(toForm(result.data.data)); ui.toast({ tone: "success", title: `${kind} deleted` }); }
    else { setError(result.message); ui.toast({ tone: "error", title: "Ошибка", message: result.message }); }
    setUploading(null);
  }

  if (loading) return <LoadingState label="Загружаем anime workspace…" />;
  if (error && !anime) return <ErrorState message={error} />;
  if (!anime || !form) return <EmptyState title="Anime не найдено" />;

  return <section className="page">
    <PageHeader kicker="anime workspace" title={anime.title} description={`ID #${anime.id} · /${anime.slug} · полноценная карточка управления metadata, tags, episodes и moderation.`} actions={<Link className="button secondary" href="/anime">← Назад</Link>} />
    {notice ? <div className="pill" style={{ borderColor: "rgba(52,211,153,.35)", color: "var(--success)" }}>{notice}</div> : null}
    {error ? <div className="pill" style={{ borderColor: "rgba(251,113,133,.35)", color: "var(--danger)" }}>{error}</div> : null}

    <div className="grid" style={{ gridTemplateColumns: "minmax(280px, .75fr) minmax(320px, 1.25fr)" }}>
      <Card>
        <div style={{ display: "grid", gap: 16 }}>
          {anime.poster_url ? <img alt={anime.title} style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 22, border: "1px solid var(--border)" }} src={anime.poster_url} /> : <div className="state-card" style={{ minHeight: 420 }}><h3>Нет постера</h3></div>}
          <div className="grid">
            <label className="button secondary" style={{ cursor: "pointer" }}>{uploading === "poster" ? "Uploading…" : "Upload poster"}<input accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => uploadImage("poster", event)} type="file" /></label>
            <button className="button secondary" disabled={!anime.poster_url || uploading === "poster"} onClick={() => removeImage("poster")} type="button">Remove poster</button>
          </div>
          <Card><div style={{ display: "grid", gap: 12 }}><p className="kicker">cover / banner</p>{anime.cover_url ? <img alt="cover" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 18, border: "1px solid var(--border)" }} src={anime.cover_url} /> : <p className="muted">Баннер пока не загружен.</p>}<div className="grid"><label className="button secondary" style={{ cursor: "pointer" }}>{uploading === "cover" ? "Uploading…" : "Upload cover"}<input accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => uploadImage("cover", event)} type="file" /></label><button className="button secondary" disabled={!anime.cover_url || uploading === "cover"} onClick={() => removeImage("cover")} type="button">Remove cover</button></div></div></Card>
          <div className="grid">
            <StatCard label="Rating" value={`★ ${anime.rating ?? "—"}`} caption={`${formatNumber(anime.ratings_count)} ratings`} />
            <StatCard label="Episodes" value={formatNumber(anime.episodes_count ?? anime.number_of_episodes)} caption="Связанных серий" />
            <StatCard label="Comments" value={formatNumber(anime.comments_count)} caption="Обсуждения" />
          </div>
          <button className="button secondary" onClick={removeAnime} type="button">Удалить anime</button>
        </div>
      </Card>

      <Card>
        <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
          <div className="grid"><label><span className="stat-card-label">Title</span><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label><span className="stat-card-label">Poster URL</span><input className="input" value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} /></label></div>
          <label><span className="stat-card-label">Description</span><textarea className="input" rows={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="grid"><label><span className="stat-card-label">Status</span><select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="planned">planned</option><option value="ongoing">ongoing</option><option value="finished">finished</option><option value="paused">paused</option></select></label><label><span className="stat-card-label">Type</span><select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="tv">tv</option><option value="movie">movie</option><option value="ova">ova</option><option value="ona">ona</option><option value="special">special</option><option value="music">music</option></select></label><label><span className="stat-card-label">Year</span><input className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></label><label><span className="stat-card-label">Rating</span><input className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></label></div>
          <div className="grid"><label><span className="stat-card-label">Episodes planned</span><input className="input" value={form.number_of_episodes} onChange={(e) => setForm({ ...form, number_of_episodes: e.target.value })} /></label><label className="pill" style={{ alignSelf: "end", justifyContent: "flex-start" }}><input checked={form.nsfw_flag} onChange={(e) => setForm({ ...form, nsfw_flag: e.target.checked })} type="checkbox" /> NSFW</label></div>
          <div><p className="stat-card-label">Tags</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{tags.map((tag) => <button className={`badge ${selectedTagSet.has(tag.id) ? "brand" : ""}`} key={tag.id} onClick={() => setForm({ ...form, tags: selectedTagSet.has(tag.id) ? form.tags.filter((id) => id !== tag.id) : [...form.tags, tag.id] })} type="button">{tag.name}</button>)}</div></div>
          <button className="button" disabled={saving} type="submit">{saving ? "Сохраняем…" : "Сохранить изменения"}</button>
        </form>
      </Card>
    </div>

    <div className="grid" style={{ gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1fr)" }}>
      <Card><div className="toolbar" style={{ marginBottom: 16 }}><div><p className="kicker">episodes</p><h2 style={{ margin: 0 }}>Последние серии</h2></div><button className="button secondary" onClick={importEpisodes} type="button">Import episodes</button></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Episode</th><th>Title</th><th>Source</th><th>Player</th></tr></thead><tbody>{episodes.map((episode) => <tr key={episode.id}><td>#{episode.id}</td><td><Badge tone="brand">EP {episode.episode_number}</Badge></td><td>{episode.title ?? "—"}</td><td>{episode.source ?? "—"}</td><td>{episode.player_url || episode.player_iframe ? <Badge tone="success">ready</Badge> : <Badge tone="warning">missing</Badge>}</td></tr>)}</tbody></table></div></Card>
      <Card><div className="toolbar" style={{ marginBottom: 16 }}><div><p className="kicker">moderation</p><h2 style={{ margin: 0 }}>Комментарии</h2></div><Link className="button secondary" href={`/comments?anime_id=${anime.id}`}>Все comments</Link></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Text</th><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>{comments.map((comment) => <tr key={comment.id}><td>#{comment.id}</td><td>{comment.comment.slice(0, 120)}{comment.comment.length > 120 ? "…" : ""}</td><td>{comment.user?.name ?? comment.user?.email ?? "—"}</td><td><Badge tone={comment.is_approved ? "success" : "danger"}>{comment.status}</Badge></td><td><div style={{ display: "flex", gap: 8 }}><button className="button secondary" onClick={() => moderateComment(comment, "approve")} type="button">Approve</button><button className="button secondary" onClick={() => moderateComment(comment, "reject")} type="button">Reject</button></div></td></tr>)}</tbody></table></div></Card>
    </div>
  </section>;
}
