# Aeryion Dashboard

Government-facing environmental intelligence dashboard for AERIS. It reads Aeryion backend data through Next.js rewrites and renders NDVI, rainfall, soil, alerts, fire, station, and forecast views.

## Stack

- Next.js 16 App Router, Turbopack, port 3001
- React 19 + TypeScript
- Tailwind v4
- `lucide-react` icons

## Routes

| Route | Purpose |
|---|---|
| `/` | Dashboard UI |
| `/api/health` | Frontend health check that also probes the configured backend |

## Backend Proxy

The dashboard rewrites browser requests from `/api/v1/*` to the Aeryion backend's `/v1/*` routes.

```ts
NEXT_PUBLIC_AERYION_API_URL=http://localhost:8000
```

If unset, the backend defaults to `http://localhost:8000`.

Useful backend paths:

```text
GET /health
GET /v1/ndvi/latest
GET /v1/rainfall/current
GET /v1/soil/latest
GET /v1/alerts/active
GET /v1/forecast/7day?sub_county=Lira
```

## Local Development

From the monorepo root:

```sh
pnpm install
pnpm --filter aeryion-dashboard dev
```

Runs on `http://localhost:3001`.

Run the backend separately:

```sh
cd aeryion/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## Production

Deploy as a Vercel project with root directory `aeryion/dashboard`.

Required env var:

- `NEXT_PUBLIC_AERYION_API_URL` - deployed Aeryion backend URL
