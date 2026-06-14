const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "";

let adminToken = "";
let clerkTokenProvider: (() => Promise<string | null>) | null = null;

export type AdminApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; message: string; status?: number };

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  links?: Record<string, string | null>;
  meta?: PaginationMeta;
};

export type ApiDataResponse<T> = { data: T };

export const adminApiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);
export const adminStorageUrl = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("//")) return value;

  const path = value
    .replace(/^\/+/, "")
    .replace(/^api-storage\//, "")
    .replace(/^storage\//, "");

  if (!API_BASE_URL) return `/api-storage/${path}`;

  const origin = new URL(API_BASE_URL, typeof window === "undefined" ? "http://localhost" : window.location.origin).origin;
  return `${origin}/storage/${path}`;
};

export type AdminTag = {
  id: number;
  name: string;
  slug: string;
};

export type AdminAnime = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  poster_url?: string | null;
  cover_url?: string | null;
  cover_source?: string | null;
  cover_locked?: boolean;
  cover_updated_at?: string | null;
  rating?: number | null;
  status?: string | null;
  type?: string | null;
  year?: number | null;
  nsfw_flag?: boolean;
  external_id?: string | number | null;
  external_source?: string | null;
  episodes_count?: number | null;
  comments_count?: number | null;
  ratings_count?: number | null;
  number_of_episodes?: number | null;
  tags?: AdminTag[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminImportLog = {
  id: number;
  import_type?: string | null;
  status?: string | null;
  message?: string | null;
  errors?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  finished_at?: string | null;
  total_processed?: number;
  total_created?: number;
  total_updated?: number;
  total_skipped?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminDashboard = {
  summary: Record<string, number>;
  recent_imports?: AdminImportLog[];
  anime_by_status?: Array<{ status?: string | null; count: number }>;
  anime_by_type?: Array<{ type?: string | null; count: number }>;
  latest_anime?: AdminAnime[];
  top_anime_by_rating?: AdminAnime[];
  activity?: Array<{ label: string; users?: number; comments?: number; anime?: number }>;
};

export type AdminImportsDashboard = {
  latest_import?: AdminImportLog | null;
  stats: Record<string, number>;
};

export type AdminUser = {
  id: number;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  custom_status?: string | null;
  selected_profile_frame?: string | null;
  admin_granted_profile_frames?: string[];
  roles?: string[];
  is_admin?: boolean;
  is_online?: boolean;
  is_premium?: boolean;
  is_active?: boolean;
  is_banned?: boolean;
  ban_reason?: string | null;
  ban_expires_at?: string | null;
  last_login_at?: string | null;
  comments_count?: number | null;
  ratings_count?: number | null;
  favorites_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminComment = {
  id: number;
  comment: string;
  is_approved: boolean;
  status: "approved" | "rejected" | string;
  likes_count?: number;
  dislikes_count?: number;
  admin_hearted?: boolean;
  admin_hearted_at?: string | null;
  admin_hearted_by?: number | null;
  user?: Pick<AdminUser, "id" | "name" | "email" | "avatar" | "is_banned"> | null;
  anime?: Pick<AdminAnime, "id" | "title" | "slug" | "poster_url"> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminAuditLog = {
  id: number;
  action: string;
  description?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  entity_label?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  user?: Pick<AdminUser, "id" | "name" | "email"> | null;
  created_at?: string | null;
};

export type AdminEpisode = {
  id: number;
  anime_id: number;
  episode_number: number;
  season_number?: number | null;
  title?: string | null;
  player_url?: string | null;
  player_iframe?: string | null;
  aired_at?: string | null;
  release_date?: string | null;
  duration?: number | null;
  thumbnail_url?: string | null;
  translator?: string | null;
  translation_type?: string | null;
  quality?: string | null;
  source?: string | null;
  priority?: number | null;
  anime?: Pick<AdminAnime, "id" | "title" | "slug" | "poster_url"> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminReport = {
  id: number;
  category: string;
  reason: string;
  details?: string | null;
  status: "pending" | "reviewed" | "resolved" | "rejected" | string;
  target_type: string;
  target_id: number;
  target?: Record<string, unknown> | null;
  reporter?: Pick<AdminUser, "id" | "name" | "email"> | null;
  admin?: Pick<AdminUser, "id" | "name" | "email"> | null;
  resolution_note?: string | null;
  resolved_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminRating = {
  id: number;
  rating: number;
  user?: Pick<AdminUser, "id" | "name" | "email" | "is_banned"> | null;
  anime?: Pick<AdminAnime, "id" | "title" | "slug" | "poster_url" | "rating"> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminRatingStats = {
  total: number;
  average: number;
  suspicious_low: number;
  suspicious_high: number;
  distribution: Array<{ bucket: number; count: number }>;
};

export type AdminRatingsResponse = PaginatedResponse<AdminRating> & { stats: AdminRatingStats };

export type AdminBannerCandidate = {
  source: string;
  source_id?: string | number | null;
  url: string;
  score: number;
  title?: string | null;
  year?: number | null;
  format?: string | null;
  episodes?: number | null;
  color?: string | null;
};

export type AdminContactMessage = {
  id: number;
  name?: string | null;
  email?: string | null;
  category: string;
  subject: string;
  message: string;
  status: "new" | "reviewed" | "resolved" | "archived" | string;
  photo?: { name?: string | null; mime?: string | null; size?: number | null; url?: string | null } | null;
  admin_note?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  user?: Pick<AdminUser, "id" | "name" | "email"> | null;
  admin?: Pick<AdminUser, "id" | "name" | "email"> | null;
  resolved_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminSetting = {
  id: number;
  key: string;
  value: string | number | boolean | Record<string, unknown> | unknown[] | null;
  raw_value?: string | null;
  type: "string" | "boolean" | "integer" | "float" | "json" | string;
  group: string;
  is_public: boolean;
  is_encrypted: boolean;
  description?: string | null;
  updated_at?: string | null;
};

export type AdminDiagnostics = {
  app: Record<string, string | boolean | number | null>;
  drivers: Record<string, string | boolean | number | null>;
  storage: Record<string, string | boolean | number | null>;
  health: Record<string, string | boolean | number | null>;
};

export type AdminPlayerDiagnostics = {
  anime: { id: number; title: string; shikimori_id?: number | null } | null;
  providers: Array<{ source: string; name: string; enabled: boolean; has_template: boolean; translator: string; preview_url?: string | null; valid_preview: boolean }>;
};

export type AdminMonitoringHealth = {
  configured: boolean;
  ok: boolean;
  status: number | null;
  message?: string;
};

export function setAdminToken(token: string) {
  adminToken = token;
}

export function clearAdminToken() {
  adminToken = "";
}

export function setAdminClerkTokenProvider(provider: (() => Promise<string | null>) | null) {
  clerkTokenProvider = provider;
}

async function requestAdmin<T>(path: string, init?: RequestInit): Promise<AdminApiResult<T>> {
  try {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    const clerkToken = clerkTokenProvider ? await clerkTokenProvider() : null;
    const token = clerkToken || adminToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
    const response = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: typeof body === "string" ? body : body?.message ?? `Admin API error ${response.status}`,
      };
    }

    return { ok: true, data: body as T, status: response.status };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown admin API error",
    };
  }
}

function toQueryString(params?: Record<string, string | number | boolean | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const getAdminMe = () => requestAdmin<unknown>("/api/v1/admin/auth/me");
export const toggleGlobalBroadcast = (active: boolean) =>
  requestAdmin<ApiDataResponse<{ active: boolean }>>("/api/v1/admin/broadcast/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
export const getAdminDashboard = () => requestAdmin<ApiDataResponse<AdminDashboard>>("/api/v1/admin/dashboard");
export const getAdminMonitoringHealth = (target: "uptime" | "grafana" | "nocodb") =>
  requestAdmin<ApiDataResponse<AdminMonitoringHealth>>(`/api/v1/admin/monitoring/health${toQueryString({ target })}`);
export const getAdminAnime = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminAnime>>(`/api/v1/admin/anime${toQueryString(params)}`);
export const getAdminAnimeDetail = (animeId: number | string) =>
  requestAdmin<ApiDataResponse<AdminAnime>>(`/api/v1/admin/anime/${animeId}`);
export type AdminAnimeUpdatePayload = Omit<Partial<AdminAnime>, "tags"> & { tags?: number[] };
export const updateAdminAnime = (animeId: number | string, payload: AdminAnimeUpdatePayload) =>
  requestAdmin<ApiDataResponse<AdminAnime>>(`/api/v1/admin/anime/${animeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
export const deleteAdminAnime = (animeId: number | string) =>
  requestAdmin<null>(`/api/v1/admin/anime/${animeId}`, { method: "DELETE" });
export const uploadAdminAnimeImage = (animeId: number | string, kind: "poster" | "cover", file: File) => {
  const body = new FormData();
  body.set("image", file);
  return requestAdmin<ApiDataResponse<AdminAnime>>(`/api/v1/admin/anime/${animeId}/${kind}`, { method: "POST", body });
};
export const deleteAdminAnimeImage = (animeId: number | string, kind: "poster" | "cover") =>
  requestAdmin<ApiDataResponse<AdminAnime>>(`/api/v1/admin/anime/${animeId}/${kind}`, { method: "DELETE" });
export const getAdminAnimeBannerCandidates = (animeId: number | string) =>
  requestAdmin<ApiDataResponse<AdminBannerCandidate[]>>(`/api/v1/admin/anime/${animeId}/banner-candidates`);
export const applyAdminAnimeBanner = (animeId: number | string, candidate: Pick<AdminBannerCandidate, "url" | "source">, force = false) =>
  requestAdmin<ApiDataResponse<AdminAnime>>(`/api/v1/admin/anime/${animeId}/banner/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: candidate.url, source: candidate.source, force }),
  });
export const lockAdminAnimeCover = (animeId: number | string, locked: boolean) =>
  requestAdmin<ApiDataResponse<AdminAnime>>(`/api/v1/admin/anime/${animeId}/cover-lock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locked }),
  });
export const enrichAdminAnimeBanners = (payload?: { limit?: number; only_missing?: boolean; force?: boolean }) =>
  requestAdmin<ApiDataResponse<{ message: string; limit: number }>>("/api/v1/admin/anime/banners/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 100, only_missing: true, force: false, ...(payload ?? {}) }),
  });
export const getAdminImportsDashboard = () =>
  requestAdmin<ApiDataResponse<AdminImportsDashboard>>("/api/v1/admin/imports/dashboard");
export const getAdminImportLogs = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminImportLog>>(`/api/v1/admin/imports/logs${toQueryString(params)}`);
export const runAdminImport = (type: "initial" | "update") =>
  requestAdmin<ApiDataResponse<AdminImportLog>>("/api/v1/admin/imports/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
export const getAdminUsers = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminUser>>(`/api/v1/admin/users${toQueryString(params)}`);
export const getAdminUserDetail = (userId: number | string) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}`);
export const banAdminUser = (userId: number, reason: string, expiresAt?: string | null) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, expires_at: expiresAt || null }),
  });
export const unbanAdminUser = (userId: number) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/unban`, { method: "POST" });
export const grantAdminPremiumByNickname = (nickname: string) =>
  requestAdmin<ApiDataResponse<AdminUser>>("/api/v1/admin/users/premium/grant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
export const updateAdminUserPremium = (userId: number, isPremium: boolean) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/premium`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_premium: isPremium }),
  });
export type AdminUserProfileUpdatePayload = {
  name?: string;
  custom_status?: string | null;
  selected_profile_frame?: string | null;
};
export const updateAdminUserProfile = (userId: number, payload: AdminUserProfileUpdatePayload) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
export const updateAdminUserFrameAccess = (userId: number, frameKey: string, enabled: boolean) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/frames/${encodeURIComponent(frameKey)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
export const uploadAdminUserAvatar = (userId: number, file: File) => {
  const body = new FormData();
  body.set("avatar", file);
  return requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/avatar`, { method: "POST", body });
};
export const deleteAdminUserAvatar = (userId: number) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/avatar`, { method: "DELETE" });
export const deleteAdminUser = (userId: number) =>
  requestAdmin<null>(`/api/v1/admin/users/${userId}`, { method: "DELETE" });
export const getAdminComments = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminComment>>(`/api/v1/admin/comments${toQueryString(params)}`);
export const approveAdminComment = (commentId: number) =>
  requestAdmin<ApiDataResponse<AdminComment>>(`/api/v1/admin/comments/${commentId}/approve`, { method: "POST" });
export const rejectAdminComment = (commentId: number) =>
  requestAdmin<ApiDataResponse<AdminComment>>(`/api/v1/admin/comments/${commentId}/reject`, { method: "POST" });
export const toggleAdminCommentHeart = (commentId: number) =>
  requestAdmin<ApiDataResponse<AdminComment>>(`/api/v1/admin/comments/${commentId}/heart`, { method: "POST" });
export const getAdminAuditLogs = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminAuditLog>>(`/api/v1/admin/audit-logs${toQueryString(params)}`);
export const getAdminTags = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminTag>>(`/api/v1/admin/tags${toQueryString(params)}`);
export const createAdminTag = (name: string) =>
  requestAdmin<ApiDataResponse<AdminTag>>("/api/v1/admin/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
export const updateAdminTag = (tagId: number, name: string) =>
  requestAdmin<ApiDataResponse<AdminTag>>(`/api/v1/admin/tags/${tagId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
export const deleteAdminTag = (tagId: number) =>
  requestAdmin<null>(`/api/v1/admin/tags/${tagId}`, { method: "DELETE" });
export const getAdminEpisodes = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminEpisode>>(`/api/v1/admin/episodes${toQueryString(params)}`);
export const updateAdminEpisode = (episodeId: number, payload: Partial<AdminEpisode>) =>
  requestAdmin<ApiDataResponse<AdminEpisode>>(`/api/v1/admin/episodes/${episodeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
export const deleteAdminEpisode = (episodeId: number) =>
  requestAdmin<null>(`/api/v1/admin/episodes/${episodeId}`, { method: "DELETE" });
export type EpisodesImportOptions = { source?: string; only_missing?: boolean; update?: boolean; limit?: number; anime_ids?: number[] };
export const importEpisodesForAnime = (animeId: number, options: EpisodesImportOptions = {}) =>
  requestAdmin<ApiDataResponse<{ message: string; anime_id: number; source?: string }>>(`/api/v1/admin/episodes/import/${animeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
export const importAllEpisodes = (options: EpisodesImportOptions = {}) =>
  requestAdmin<ApiDataResponse<{ message: string; queued_count: number; source?: string }>>("/api/v1/admin/episodes/import-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
export const getAdminReports = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminReport>>(`/api/v1/admin/reports${toQueryString(params)}`);
export const updateAdminReportStatus = (reportId: number, status: string, resolutionNote?: string) =>
  requestAdmin<ApiDataResponse<AdminReport>>(`/api/v1/admin/reports/${reportId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, resolution_note: resolutionNote }),
  });
export const deleteAdminReport = (reportId: number) =>
  requestAdmin<null>(`/api/v1/admin/reports/${reportId}`, { method: "DELETE" });
export const getAdminRatings = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<AdminRatingsResponse>(`/api/v1/admin/ratings${toQueryString(params)}`);
export const deleteAdminRating = (ratingId: number) =>
  requestAdmin<null>(`/api/v1/admin/ratings/${ratingId}`, { method: "DELETE" });
export const getAdminContacts = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminContactMessage>>(`/api/v1/admin/contacts${toQueryString(params)}`);
export const updateAdminContactStatus = (contactId: number, status: string, adminNote?: string) =>
  requestAdmin<ApiDataResponse<AdminContactMessage>>(`/api/v1/admin/contacts/${contactId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, admin_note: adminNote }),
  });
export const deleteAdminContact = (contactId: number) =>
  requestAdmin<null>(`/api/v1/admin/contacts/${contactId}`, { method: "DELETE" });
export async function getAdminContactPhotoObjectUrl(contactId: number): Promise<AdminApiResult<string>> {
  try {
    const headers = new Headers({ Accept: "image/*" });
    const clerkToken = clerkTokenProvider ? await clerkTokenProvider() : null;
    const token = clerkToken || adminToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(adminApiUrl(`/api/v1/admin/contacts/${contactId}/photo`), {
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, status: response.status, message: `Photo error ${response.status}` };
    return { ok: true, status: response.status, data: URL.createObjectURL(await response.blob()) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unknown photo error" };
  }
}
export const getAdminSettings = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<ApiDataResponse<AdminSetting[]>>(`/api/v1/admin/settings${toQueryString(params)}`);
export const updateAdminSettings = (settings: Array<{ key: string; value: unknown }>) =>
  requestAdmin<ApiDataResponse<AdminSetting[]>>("/api/v1/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
export const getAdminDiagnostics = () =>
  requestAdmin<ApiDataResponse<AdminDiagnostics>>("/api/v1/admin/settings/diagnostics");
export const getAdminPlayerDiagnostics = (animeId?: number | string) =>
  requestAdmin<ApiDataResponse<AdminPlayerDiagnostics>>(`/api/v1/admin/episodes/player-diagnostics${toQueryString({ anime_id: animeId })}`);
