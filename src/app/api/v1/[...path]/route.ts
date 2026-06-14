import { NextRequest, NextResponse } from "next/server";

const BACKEND_ORIGIN =
  process.env.ADMIN_BACKEND_ORIGIN ??
  process.env.ADMIN_BACKEND_URL ??
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ??
  "http://localhost:8088";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetUrl = new URL(`/api/v1/${path.join("/")}`, BACKEND_ORIGIN);
  request.nextUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

  const headers = new Headers(request.headers);
  headers.set("Accept", "application/json");
  headers.delete("host");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    credentials: "include",
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
