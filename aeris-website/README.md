# AERIS Agro — Corporate Website

Parent brand site for AERIS Agro. Communicates mission, routes visitors to
the three product pillars (Aeryion, Coltiva, LinkTrade), and captures
partnership leads via KYC form.

## Routes

| Route | Purpose |
|---|---|
| `/` | Single-page landing: hero, stats, 3 pillars, closed-loop cycle, KYC form, footer |
| `POST /api/kyc/lead` | Server action — validates + inserts into `shared.kyc_leads` |

## Tech

- Next.js 16 (App Router, Turbopack, port 3004)
- React 19 + TypeScript
- Tailwind v4
- AERIS design tokens (dark-first, Manrope, AERIS green/gold)
- `lucide-react` icons

## How KYC submission works

1. Visitor fills `<KycForm />` (6 categories, name/email/phone/country, optional message)
2. Form POSTs to `/api/kyc/lead` (server route)
3. Server validates, captures `submitted_ip` + `user_agent`, inserts into `shared.kyc_leads` via Supabase REST using `SUPABASE_SERVICE_KEY`
4. Success: form replaced by a confirmation panel
5. Sales follows up via Supabase Dashboard

## Local development

From the monorepo root:

```sh
pnpm install
cp aeris-website/.env.local.example aeris-website/.env.local
# Edit aeris-website/.env.local — set SUPABASE_SERVICE_KEY
pnpm --filter aeris-website dev
```

Runs on **http://localhost:3004**.

## Required env vars

| Key | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | server | Supabase REST endpoint |
| `SUPABASE_SERVICE_KEY` | server | Used by `/api/kyc/lead`; never exposed to client |
| `NEXT_PUBLIC_SITE_URL` | client+server | Canonical URL for OG/sitemap |
| `NEXT_PUBLIC_COLTIVA_WEBSITE_URL` | client | Outbound link from Coltiva pillar |
| `NEXT_PUBLIC_AERYION_DASHBOARD_URL` | client | Outbound link from Aeryion pillar |
| `NEXT_PUBLIC_LINKTRADE_URL` | client | Outbound link from LinkTrade pillar (empty = "coming soon") |

## Out of scope (parked)

- Custom domain `aerisagro.com` — Vercel default URL initially
- Admin UI for processing KYC leads (use Supabase Dashboard until Sales workflow is defined)
- Multi-language (English only first)
- Blog / news section
- Case studies / press
