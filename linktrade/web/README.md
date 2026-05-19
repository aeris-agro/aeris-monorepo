# LinkTrade Web

Next.js web app for the LinkTrade market intelligence and trading surface.

## Stack

- Next.js 16 App Router, Turbopack, port 3000
- React 19 + TypeScript
- Tailwind v4

## Routes

| Route | Purpose |
|---|---|
| `/` | LinkTrade web UI |
| `/api/health` | Frontend health check that also probes the configured backend |

## Backend Proxy

The app rewrites browser requests from `/api/v1/*` to the LinkTrade backend's `/api/v1/*` routes.

```ts
NEXT_PUBLIC_LINKTRADE_API_URL=http://localhost:8002
```

If unset, the backend defaults to `http://localhost:8002`.

Current implemented backend path:

```text
GET /api/v1/health
```

The marketplace, order, payment, price, transport, quality, and dispute routers are currently scaffolded but do not expose behavior yet.

## Local Development

From the monorepo root:

```sh
pnpm install
pnpm --filter linktrade-web dev
```

Runs on `http://localhost:3000`.

Run the backend separately:

```sh
cd linktrade/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8002
```

## Production

Deploy as a Vercel project with root directory `linktrade/web`.

Required env var:

- `NEXT_PUBLIC_LINKTRADE_API_URL` - deployed LinkTrade backend URL
