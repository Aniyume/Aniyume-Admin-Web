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
cd D:\Aniyume\aniyume-admin
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

## Ограничения текущего scaffold

- Нет полноценного login/logout flow на backend.
- Bearer-token режим остаётся transitional: он уменьшает долговременное хранение секрета в браузере, но не устраняет XSS-риск полностью.
- `sessionStorage` fallback нужен только для удобства в текущем scaffold и должен быть убран после перехода на backend session/cookie auth.
- Write операции в API subset есть, но UI/UX parity с Blade-admin ещё неполная.
- Нет нормализованных DTO под все реальные ответы API: часть страниц пока показывает JSON ответа.
- Нет сложного UI, таблиц, фильтров, пагинации и форм.
- Нет интеграции со старым frontend app.
