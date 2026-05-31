# Aniyume Admin

Минимальный scaffold будущей отдельной admin панели на Next.js. Приложение не связано со старым user frontend и сейчас использует ограниченный набор admin API endpoints. Это transitional scaffold, а не полная замена legacy Blade-admin.

## Что есть

- Next.js App Router + TypeScript.
- Временный client-side auth shell без `localStorage` для bearer token.
- API client layer для текущего admin API subset.
- Базовые страницы:
  - `/login`
  - `/dashboard`
  - `/anime`
  - `/imports`
  - `/imports/logs`

## Используемые backend endpoints

- `GET /api/v1/admin/auth/me`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/anime`
- `POST /api/v1/admin/anime`
- `PUT/PATCH /api/v1/admin/anime/{anime}`
- `DELETE /api/v1/admin/anime/{anime}`
- `POST /api/v1/admin/tags`
- `PUT/PATCH /api/v1/admin/tags/{tag}`
- `DELETE /api/v1/admin/tags/{tag}`
- `GET /api/v1/admin/imports/dashboard`
- `GET /api/v1/admin/imports/logs`
- `POST /api/v1/admin/imports/run`

## Auth shell

Полноценный backend-driven admin login/logout endpoint в scaffold не добавлен. Экран `/login` временно принимает admin token и проверяет доступ через `/api/v1/admin/auth/me`.

Текущая transitional-схема:

- основной режим: token хранится только in-memory в React/AuthProvider и передаётся API client'у как `Authorization: Bearer ...`;
- после reload страницы in-memory token теряется, protected layout заново проверяет `/me` и, если backend не держит cookie/session, отправляет на `/login`;
- опциональный checkbox на `/login` включает `sessionStorage` fallback только до закрытия вкладки;
- `localStorage` больше не используется для admin token;
- API client продолжает отправлять `credentials: "include"`, чтобы backend HttpOnly cookie/session auth мог работать без переписывания страниц.

Это не полноценная замена backend session auth: при XSS token, находящийся в памяти JS или в `sessionStorage` fallback, всё ещё может быть украден. Более безопасный целевой вариант — backend-issued HttpOnly Secure SameSite cookie + server-side login/logout/session invalidation.

API client также отправляет `credentials: "include"`, чтобы позже можно было перейти на cookie/session-based login без переписывания страниц.

## Запуск

```bash
cd D:\Aniyume\aniyume-admin-web
npm install
copy .env.example .env.local
npm run dev
```

По умолчанию приложение стартует на `http://localhost:3001`.

В `.env.local` настройте backend URL:

```env
NEXT_PUBLIC_ADMIN_API_BASE_URL=http://localhost:8080
```

Не записывайте реальные секреты в `.env.example` или репозиторий.

## CI/CD readiness

Репозиторий подготовлен как отдельное приложение для проверок на ветках `dev` и `release`, а также как участник release image flow для multi-repo release pipeline.

GitHub Actions workflows:

- `.github/workflows/ci.yml` — обычные проверки scaffold на `dev`/`release` и pull requests.
- `.github/workflows/release-image.yml` — release branch pipeline для сборки и публикации admin Docker image.

Доступные CI jobs:

- `build` — `npm ci`, TypeScript check через `npx tsc --noEmit`, production build через `npm run build`.
- `lint` — non-blocking readiness job. Текущий `npm run lint` вызывает `next lint`, который в этом scaffold интерактивно предлагает создать ESLint config. Поэтому lint пока зафиксирован как ограничение и не блокирует CI до безопасного добавления явной ESLint конфигурации.
- `docker` — smoke build Docker image после успешного `build` job.

Release image pipeline (`.github/workflows/release-image.yml`) запускается на push в ветку `release` и вручную через `workflow_dispatch`:

1. `verify` job выполняет `npm ci`, `npx tsc --noEmit --incremental false`, `npm run build`.
2. `release-image` job собирает Docker image через Buildx с `NEXT_PUBLIC_ADMIN_API_BASE_URL` как build arg.
3. На push в `release` image публикуется в GHCR как `ghcr.io/<owner>/<repo>:release` и `ghcr.io/<owner>/<repo>:release-<sha>`.
4. При ручном запуске можно переопределить `next_public_admin_api_base_url` и отключить publish флагом `push_image=false`.

Workflow не делает production deploy автоматически: он только готовит image, который может быть использован внешним production deploy skeleton.

Локальные команды для проверки:

```bash
npm ci
npx tsc --noEmit --incremental false
npm run build
docker build --build-arg NEXT_PUBLIC_ADMIN_API_BASE_URL=http://localhost:8080 -t aniyume-admin-web:local .
```

## Docker

Добавлен production-oriented multi-stage `Dockerfile` на `node:20-alpine`:

- зависимости ставятся через `npm ci`;
- Next.js собирается в `output: "standalone"`;
- runtime image запускает standalone server от non-root пользователя;
- приложение слушает `PORT=3001`.

Пример сборки и запуска:

```bash
docker build \
  --build-arg NEXT_PUBLIC_ADMIN_API_BASE_URL=https://api.example.com \
  -t aniyume-admin-web:local .

docker run --rm -p 3001:3001 aniyume-admin-web:local
```

`NEXT_PUBLIC_ADMIN_API_BASE_URL` — публичное build-time значение Next.js. Для разных окружений image нужно собирать с соответствующим public backend origin либо позже перейти на runtime config/proxy схему.

## Secrets / env

Сейчас нужен только публичный env/build arg:

- `NEXT_PUBLIC_ADMIN_API_BASE_URL` — public origin backend API, например `https://api.example.com`.

Для GitHub Actions release image flow значение берётся в таком порядке:

1. manual input `next_public_admin_api_base_url` для `workflow_dispatch`;
2. repository/environment variable `NEXT_PUBLIC_ADMIN_API_BASE_URL`;
3. fallback `https://api.example.com`, который нужно заменить перед реальным production release.

GHCR publish использует стандартный `GITHUB_TOKEN` с `packages: write`; отдельный registry secret не требуется для публикации в package namespace этого repo.

Реальные admin tokens, passwords, API keys, cookie/session secrets в этот frontend repo не записываются. Когда backend реализует production login/session flow, секреты должны оставаться на backend/infra стороне; frontend должен получать только публичные URL/feature flags.

## Ограничения текущего scaffold

- Нет полноценного login/logout flow на backend.
- Bearer-token режим остаётся transitional: он уменьшает долговременное хранение секрета в браузере, но не устраняет XSS-риск полностью.
- `sessionStorage` fallback нужен только для удобства в текущем scaffold и должен быть убран после перехода на backend session/cookie auth.
- Protected pages сейчас зависят от client-side auth shell; после reload in-memory token теряется, если backend не держит HttpOnly cookie/session.
- Production auth в этой задаче не внедрялся намеренно: нужен backend-issued HttpOnly Secure SameSite cookie, server-side login/logout и session invalidation.
- Write операции в API subset есть, но UI/UX parity с Blade-admin ещё неполная.
- Нет нормализованных DTO под все реальные ответы API: часть страниц пока показывает JSON ответа.
- Нет сложного UI, таблиц, фильтров, пагинации и форм.
- Нет интеграции со старым frontend app.
- Lint пока не является blocking CI gate, потому что явная ESLint конфигурация ещё не добавлена.
