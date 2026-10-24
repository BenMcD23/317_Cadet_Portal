# 317 Cadet Portal

Cadet-facing web app for 317 (Failsworth) Squadron RAFAC: order uniform and
badges, track orders, see what has been issued, keep a mobile number on file.
Next.js (App Router) + TypeScript + shadcn/ui, talking to the
[SMS Scrapers API](https://github.com/BenMcD23/SMS_Scrapers_API) through its
own server routes (the browser never calls the API directly).

The staff app is [317 SMS](https://github.com/BenMcD23/317_SMS_Site).

## Running locally

### Preview: seeded data, no setup

The preview lives in the [SMS site](https://github.com/BenMcD23/317_SMS_Site)
repo, because it starts all three apps. With this repo cloned beside it as
`317_cadet_portal` and the API as `SMS_Scrapers_API`:

```bash
cd ../317_SMS_Site
scripts/preview.sh             # API :8000, SMS site :3000, this portal :3001
scripts/preview.sh --reset     # re-seed the API database
```

It needs no Google, Postgres or cluster access. On
`http://localhost:3001/login`, SNCO and NCO sign in as cadets with a record
(orders, issued kit, details). STAFF is an adult with no cadet record, which
is the other code path.

### Against a real API

```bash
cp .env.local.tmpl .env.local   # Google OAuth client + API base
npm install
npm run dev                     # http://localhost:3001
```

The API must be running too (see its README). With `AUTH_DEV_BYPASS=1` in
`.env.local` and `DEV_FAKE_AUTH=1` on the API, the login page shows the same
fake sign-in buttons instead of Google.

## Checks

```bash
npm run check          # lint + typecheck + tests, run before committing
npm run format         # prettier (CI fails on unformatted files)
npm run build          # full production build
npm run test:watch     # vitest while you work
```

CI (`.github/workflows/ci.yml`) runs lint, formatting, typecheck, tests and the
build on every push and pull request. `security.yml` runs `npm audit` on pull
requests and weekly. It doesn't block merging, but a red audit should be fixed.

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

## Contributing

- Branch off `main` and open a pull request back into it. `main` only accepts
  pull requests: no direct pushes, force-pushes or deletion.
- The CI `check` job must pass before merging.
- Changes under `.github/` need a review from @BenMcD23
  (`.github/CODEOWNERS`). Everything else merges on green CI.
- Every change ships with tests, and UI changes are checked in the preview at
  phone width. [`CLAUDE.md`](CLAUDE.md) has the conventions.
