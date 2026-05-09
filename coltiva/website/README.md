# Coltiva Website

Public marketing site + signup/login flow for **Coltiva** — AERIS Group's
agricultural intelligence platform for Ugandan smallholder farmers.

## Stack

- **Next.js 16** + App Router + Turbopack
- **React 19** + TypeScript
- **Tailwind v4**
- AERIS design tokens lifted from `colors_and_type.css`

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page (hero, value props, how it works, CTA) |
| `/signup` | Phone entry → request OTP → push to `/verify` |
| `/login` | Same as signup, framed for returning users |
| `/verify` | OTP entry, then either profile completion (new user) or redirect to dashboard (existing) |

## Auth flow

The site **does not** call Supabase Auth directly. It calls the Coltiva
backend's auth endpoints, which run a custom OTP flow over Africa's Talking:

1. `POST /api/v1/auth/request-otp { phone }` → 6-digit code via SMS
2. `POST /api/v1/auth/verify-otp { phone, code }`
   - existing user → `{ access_token, refresh_token, user_profile }`
   - new user → `{ signup_token, requires_profile_completion: true }`
3. `POST /api/v1/auth/signup-complete { signup_token, full_name, role, district }`
   → `{ access_token, refresh_token, user_profile }`

Tokens are Supabase-compatible JWTs signed by the backend with
`SUPABASE_JWT_SECRET`. The dashboard accepts them transparently because
PostgREST validates against the same secret.

## Local development

```sh
# From the monorepo root
pnpm install
pnpm --filter coltiva-website dev
```

Runs on **http://localhost:3002**.

Make sure the Coltiva backend is also running on **localhost:8001**:

```sh
cd coltiva/backend
source ../../aeris-venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

Set up `.env.local` from `.env.local.example` if you need to point at a
different backend or dashboard URL.

## Production

Deployed to Vercel at **coltiva.aeris.agro**.

Required env vars:

- `NEXT_PUBLIC_COLTIVA_API_URL` — Railway URL of the Coltiva backend
- `NEXT_PUBLIC_COLTIVA_DASHBOARD_URL` — Vercel URL of the Coltiva dashboard
- `NEXT_PUBLIC_SITE_URL` — for OpenGraph metadata

## Design tokens

All colours, typography, spacing, and component styles come from
`/design-system/colors_and_type.css` — the source of truth for AERIS Group
brand. The site uses the **light theme** by default; the CTA section uses
`.theme-dark` locally for visual contrast.
