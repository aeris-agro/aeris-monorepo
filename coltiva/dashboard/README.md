# Coltiva Dashboard

The authenticated app farmers and cooperative admins land on after signup
or login. Sister to **coltiva/website** (the marketing site).

## Routes

| Route | Purpose |
|---|---|
| `/` | Home — greeting, quick alerts/forecast/market cards, CTAs |
| `/farm` | Your farm — district, sub-county, plots (read-only) |
| `/chat` | Ask Coltiva — skeleton chatbot, real LLM coming in v2 |
| `/profile` | View / edit profile (name, district, preferred language) |

## How auth works

The dashboard is gated by `AuthGate`, which on mount:

1. Reads `#access_token=...&refresh_token=...` from the URL fragment
   (set by `coltiva/website`'s verify-otp redirect)
2. Stores tokens in `localStorage`
3. Strips the fragment from the URL
4. Checks `exp` claim on the access token
5. If invalid → redirects to `coltiva.aeris.agro/login`

Tokens are Supabase-compatible JWTs signed by the Coltiva backend with
`SUPABASE_JWT_SECRET`. RLS policies on `coltiva.user_profiles` validate
them transparently.

## Stack

- Next.js 16 (App Router, Turbopack, port 3003)
- React 19, TypeScript
- Tailwind v4
- AERIS design tokens (Manrope, AERIS green)
- `lucide-react` icons

## Local development

```sh
# From the monorepo root
pnpm install
pnpm --filter coltiva-dashboard dev
```

Runs on **http://localhost:3003**.

You'll need:

- Coltiva backend on `localhost:8001` (`coltiva/backend`)
- Coltiva website on `localhost:3002` (`coltiva/website`)
- Tokens in localStorage — easiest to get them by logging in on the website
  at `localhost:3002/login`, which redirects here with tokens in the fragment

## Production

Deploys to Vercel at **app.coltiva.aeris.agro** (or
`coltiva-dashboard.vercel.app` until the custom domain is set).

Required env vars:

- `NEXT_PUBLIC_COLTIVA_API_URL` — Railway URL of the Coltiva backend
- `NEXT_PUBLIC_COLTIVA_WEBSITE_URL` — Vercel URL of the marketing site

## v2 (not in this card)

- Real LLM-backed chatbot with grounding on user's farm + advisory engine
- Plot registration with GPS picker
- Push notifications for advisories
- Backend PATCH /me endpoint for profile updates (currently saves to
  localStorage only)
- Sync banner: "Your profile changes haven't been sent to the server yet"
