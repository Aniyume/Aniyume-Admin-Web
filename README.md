# AniYume Admin

Next.js 16 administration interface for AniYume. It communicates with the Laravel backend exclusively through `/api/v1/admin/*`.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Clerk authentication

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

The development server runs on `http://localhost:3001`.

Configure the backend origin:

```env
NEXT_PUBLIC_ADMIN_API_BASE_URL=http://localhost:8000
```

When the public API base URL is empty, requests use the local Next.js `/api/v1/*` proxy.

## Available Areas

- dashboard and monitoring;
- anime, episodes, tags, and imports;
- users, comments, ratings, reports, and contacts;
- audit logs and application settings.

## Contract

The typed admin API client is in `src/lib/admin-api.ts`. Its paths must stay aligned with the Laravel routes in `aniyume-api/routes/api.php`.

## Quality Checks

```bash
npx tsc --noEmit --incremental false
npm run build
```

## Operations Tools

The protected admin area links Uptime Kuma, Grafana, NocoDB, and Understand Anything.

- `NEXT_PUBLIC_*_URL` is the address opened by an administrator's browser.
- `*_INTERNAL_URL` is configured in the Laravel backend and used for health checks.
- `NEXT_PUBLIC_*_EMBED=true` enables an iframe only after the service itself is configured to allow embedding.

Embedding is disabled by default. Grafana additionally requires `allow_embedding` when an iframe is enabled.

Understand Anything is different from the other tools: it is installed into an AI coding client, analyzes a repository, and then starts a dashboard. Configure its public and internal dashboard URLs only after that dashboard is running.
