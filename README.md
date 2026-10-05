# 317 Cadet Portal

Cadet-facing web app for 317 (Failsworth) Squadron RAFAC: order uniform and
badges, track orders, see what has been issued, keep a mobile number on file.
Next.js (App Router) + TypeScript + shadcn/ui, talking to the
[SMS Scrapers API](https://github.com/BenMcD23/SMS_Scrapers_API) through its
own server routes (the browser never calls the API directly).

The staff app is [317 SMS](https://github.com/BenMcD23/317_SMS_Site).

## Running locally

```bash
cp .env.local.tmpl .env.local   # Google OAuth client + API base
npm install
npm run dev                     # http://localhost:3001
```

The API must be running too. To test as a cadet, insert a cadet row whose
email matches your Google account (see the API README, "Seeding a test cadet").

## Checks

```bash
npm run check         # lint + typecheck — run before committing
npm run build
npm run format
```

CI runs all three on every push and pull request.

## How it fits together

- **Auth** — Google sign-in restricted to the squadron Workspace domain
  (`lib/config.ts`). The session carries a Google `id_token`; `auth.ts`
  renews it from the refresh token.
- **Server routes** — everything under `app/api/**` is a one-line wrapper
  over `lib/api-proxy.ts`, which adds the token and turns an unreachable API
  into a 503 the outage overlay understands.
- **Reference data** — item types, sizes, sizing fields and the badge
  catalogue come from the API's `/reference` via `lib/reference.ts`. The SMS
  site reads the same endpoint, so the two never disagree.
- **Navigation** — `lib/navigation.ts`; layout in `components/layout/*`.

## Deployment

Vercel, from `main` (production) and `development` (preview).
