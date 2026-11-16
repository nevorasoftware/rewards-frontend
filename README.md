# rewards-wallet-web

Web app for the multi-tenant rewards cards SaaS (Apple Wallet + Google Wallet).
The UI is in Spanish; code and comments are in English.

Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui-style components (Radix) ·
React Query · Recharts · html5-qrcode · react-easy-crop · qrcode.react.

Backend: [`rewards-wallet-api`](../rewards-wallet-api).

## Screens

| Route | Who | What |
|---|---|---|
| `/` | public | Landing |
| `/login`, `/register` | public | Login and business sign-up (creates business + owner + default program) |
| `/dashboard` | owner | Metrics (cards issued, active, points/stamps, redemptions) and daily chart with table view |
| `/dashboard/card` | owner | Brand & card editor: colors, logo/icon/strip upload with cropping, program type, texts, back fields, links. **Live Apple Wallet and Google Wallet previews side by side.** *Publicar* updates existing passes |
| `/dashboard/customers` | owner | Customer table with search and pagination |
| `/dashboard/customers/[id]` | owner | Customer detail, transaction history, wallet install status, manual adjustment |
| `/dashboard/scanner` | owner, staff | Mobile-first camera QR scanner, shows customer and balance, add / redeem |
| `/dashboard/qr` | owner | Printable / downloadable QR poster pointing to the join page |
| `/dashboard/team` | owner | Staff users |
| `/admin` | super admin | Businesses list, platform stats, activate / deactivate |
| `/join/[slug]` | customers | Branded public page: form and *Add to Apple/Google Wallet* buttons (iOS shows Apple first, Android shows Google first) |

**Dynamic theming:** the public page and previews use the business colors through CSS
variables (`--brand-bg`, `--brand-fg`, `--brand-label`, exposed in Tailwind as
`bg-brand-bg`, `text-brand-fg`, `text-brand-label`) — see `src/components/brand-theme.tsx`.

**Previews** (`src/components/wallet/`) mirror the backend's pass content
(`buildCardContent`), so what the owner sees is what customers get. Google Wallet picks
the text color from the background automatically, so its preview ignores text/label colors.

**Wallet buttons** (`wallet-buttons.tsx`) follow the badge layout of each brand. For
production you can replace them with the official localized artwork:
[Apple Wallet guidelines](https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/) ·
[Google Wallet brand guidelines](https://developers.google.com/wallet/generic/resources/brand-guidelines).

## Local setup

Requirements: Node.js 20+ and the API running (see its README).

```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3100
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the API (default `http://localhost:4100`) |
| `NEXT_PUBLIC_WEB_URL` | Optional public URL of this app, used in the counter QR (defaults to the current origin) |

`NEXT_PUBLIC_*` variables are inlined **at build time**: rebuild after changing them.

Demo logins (from the API seed): `owner@demo.local` / `Demo1234!`, `staff@demo.local` / `Demo1234!`,
`admin@rewards.local` / `Admin123!`. Public demo page: `/join/cafe-aroma`.

The camera scanner needs HTTPS (or `localhost`). To test it from a phone on your network,
use an HTTPS tunnel (`cloudflared tunnel --url http://localhost:3100`).

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## Deploy on Railway

1. In the same Railway project as the API: *+ Create → GitHub Repo* → `rewards-wallet-web`
   (push this folder to its own repo). Railway builds the `Dockerfile` (Next.js standalone output).
2. **Variables:**
   - `NEXT_PUBLIC_API_URL` = public URL of the API service (e.g. `https://api.yourdomain.com`)
   - `NEXT_PUBLIC_WEB_URL` = public URL of this service
   The Dockerfile declares them as `ARG`, so Railway passes them to the build.
3. **Domain:** *Settings → Networking → Generate Domain* or add a custom domain (CNAME).
4. In the **API** service set `WEB_URL` to this domain (CORS and Google Wallet `origins`) and redeploy it.
5. Redeploy the web service whenever `NEXT_PUBLIC_API_URL` changes (it's baked into the bundle).

## Structure

```
src/
  app/
    (auth)/login, (auth)/register
    dashboard/  page (metrics), card (editor), customers, scanner, qr, team
    admin/      super admin
    join/[slug] public page (server-rendered with business branding)
  components/
    ui/         button, input, label, card, tabs, dialog, table, badge…
    wallet/     Apple & Google previews, wallet buttons
    app-shell, image-uploader, qr-scanner, activity-chart, stamp-grid…
  lib/          api client (token refresh), auth context, types, utils
```
