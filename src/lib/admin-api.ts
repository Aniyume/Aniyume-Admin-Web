const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:8080";

let adminToken = "";

export type AdminApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; message: string; status?: number };

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

    const response = await fetch(`${API_BASE_URL}${path}`, {
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

export const getAdminMe = () => requestAdmin<unknown>("/api/v1/admin/auth/me");
export const getAdminDashboard = () => requestAdmin<unknown>("/api/v1/admin/dashboard");
export const getAdminAnime = () => requestAdmin<unknown>("/api/v1/admin/anime");
export const getAdminImportsDashboard = () => requestAdmin<unknown>("/api/v1/admin/imports/dashboard");
export const getAdminImportLogs = () => requestAdmin<unknown>("/api/v1/admin/imports/logs");
