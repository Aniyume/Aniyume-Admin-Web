const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "";

let adminToken = "";

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
  roles?: string[];
  is_admin?: boolean;
  is_online?: boolean;
  is_premium?: boolean;
  is_active?: boolean;
  is_banned?: boolean;
  ban_reason?: string | null;
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
  quality?: string | null;
  source?: string | null;
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

export function setAdminToken(token: string) {
  adminToken = token;
}

export function clearAdminToken() {
  adminToken = "";
}

async function requestAdmin<T>(path: string, init?: RequestInit): Promise<AdminApiResult<T>> {
  try {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (adminToken) headers.set("Authorization", `Bearer ${adminToken}`);

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
export const getAdminDashboard = () => requestAdmin<ApiDataResponse<AdminDashboard>>("/api/v1/admin/dashboard");
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
export const banAdminUser = (userId: number, reason: string) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
export const unbanAdminUser = (userId: number) =>
  requestAdmin<ApiDataResponse<AdminUser>>(`/api/v1/admin/users/${userId}/unban`, { method: "POST" });
export const getAdminComments = (params?: Record<string, string | number | boolean | undefined | null>) =>
  requestAdmin<PaginatedResponse<AdminComment>>(`/api/v1/admin/comments${toQueryString(params)}`);
export const approveAdminComment = (commentId: number) =>
  requestAdmin<ApiDataResponse<AdminComment>>(`/api/v1/admin/comments/${commentId}/approve`, { method: "POST" });
export const rejectAdminComment = (commentId: number) =>
  requestAdmin<ApiDataResponse<AdminComment>>(`/api/v1/admin/comments/${commentId}/reject`, { method: "POST" });
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
export const importEpisodesForAnime = (animeId: number) =>
  requestAdmin<ApiDataResponse<{ message: string; anime_id: number }>>(`/api/v1/admin/episodes/import/${animeId}`, { method: "POST" });
export const importAllEpisodes = () =>
  requestAdmin<ApiDataResponse<{ message: string; queued_count: number }>>("/api/v1/admin/episodes/import-all", { method: "POST" });
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
