@AGENTS.md

# 317 Cadet Portal conventions

Next.js (App Router) + TypeScript + shadcn/ui, for cadets. It talks to the
[SMS Scrapers API](https://github.com/BenMcD23/SMS_Scrapers_API) only through
its own server routes. The conventions below are what the codebase follows;
match them rather than introducing new patterns. The staff SMS site
(`../317_SMS_Site`) shares the look and most components, and its CLAUDE.md has
the full UI rules.

## Tests are part of every change

Every change ships with tests — a feature with tests for what it does, a bug fix
with a test that fails without the fix (run it against the old code once to
prove it). Test the unhappy paths as hard as the happy one: the API answering
4xx/5xx or not at all, an error body (`{detail}`) where a list was expected,
empty and missing data, an expired session, and a signed-in adult who has no
cadet record. "It renders" is not a test of a feature.

**Tooling.** Vitest + Testing Library. `npm test` runs once (CI runs it);
`npm run test:watch` while working; `npm run test:coverage` for a report.
`npm run check` is lint + typecheck + tests — run it before committing.

**Where tests live.** Next to the code (`lib/api-proxy.ts` →
`lib/api-proxy.test.ts`, `app/my-orders/page.tsx` → `app/my-orders/page.test.tsx`).
Cross-cutting suites live in `tests/`: auth and middleware, every API route,
every page.

**How to write them.**

- Tests run in Node. A test that needs a DOM starts with
  `// @vitest-environment jsdom` on line 1.
- Mock the edges, not our own code: `fetch` via `vi.stubGlobal("fetch", …)`,
  `next-auth/react`, `next/navigation`, `@/auth`. Return a _fresh_ `Response`
  per call — a body can only be read once.
- Never hit the network or the real API. Nothing may depend on the time zone
  (the setup pins `Europe/London`) or on test order — mocks, env and globals are
  restored after each test, so don't rely on leftovers.
- `useSession` mocks must return one stable object; pages key effects on it.
- Query by role and accessible name. If a control can't be found that way, give
  it an accessible name — that's an accessibility bug, not a test problem.
- Name a test after the behaviour ("an API outage is an error, not a silent
  switch to the adult list"), not the function.

**What's already covered for you** (keep it that way):

- `tests/api-routes.test.ts` calls every `app/api/**/route.ts` handler, pins the
  backend path in a snapshot, and fails if any route reaches anything other
  than `/cadets/me` or `/users/me` — a cadet must never be able to name
  someone else's record. A new route shows up as a snapshot diff; check it,
  then `npx vitest run -u` to accept.
- `tests/pages-smoke.test.tsx` renders every page while loading and after the
  API returns 500. A new page must survive both — check `res.ok` before using a
  response body.
- `lib/lib.test.ts` fails if a sidebar link has no page.

## UI: how it should look and feel

Read `PRODUCT.md` first. The users are cadets aged 12–18 on their own phones,
doing one short task: order kit, check an order, check in to a lesson. The look
is the same 317 identity as the staff SMS site (`../317_SMS_Site`, whose
CLAUDE.md has the full UI rules: tokens not literal colours, flat cards, no
nested cards, no decoration, reuse before you build). What differs here:

- **Phone first, one thumb, one task per screen.** Design at 390px and widen.
  Lists of places to go are `ActionList` (full-width rows, 56px minimum, the
  chevron always visible); a long list of records is a framed list, not cards.
- **Plain words a 12-year-old understands.** "Ready to collect", "Needs
  sizing", "With the stores" — not "Pending" or "Awaiting QM action". Nav
  label, page title and button text agree ("Order Uniform"). Say what happens
  next after an action.
- **Orders** are `OrderDisclosure` rows in an `OrderList` showing what's in the
  order and its status (`lib/order-status.ts`) _before_ it's opened. The
  component is the same one the SMS site uses; keep the two copies in step.
- **A dialog is a `ResponsiveDialog`** (bottom sheet on a phone).
- **Colour:** tokens only (`text-warning`, `bg-primary/10`); status colours
  mean a state. Nothing is conveyed by colour alone: the badge says the word.
- **Motion** is for state (an order opening), 150–250ms, via `motion/react`
  (already honours reduced motion); tests skip animations.
- Prettier here is no-semicolons; match it (`npm run format`).

## Style

- No semicolons, double quotes, two-space indent: prettier enforces it
  (`npm run format`), and CI fails on unformatted files.
- Always use the `@/` path alias, never deep relative paths.
- Route `params` are a `Promise` in this Next version, so always `await` them.

## Looking at the UI (works in a cloud session too)

Run `scripts/preview.sh` from the SMS site repo: it starts
the seeded API, both sites and fake sign-in. On `http://localhost:3001/login`
use SNCO or NCO (cadets with a record) or STAFF (an adult with none, the
other code path). The dev sign-in only exists with `AUTH_DEV_BYPASS=1` and
never in a production build. Check pages at 390 and 1440, light and dark.

```bash
# from ../317_SMS_Site
scripts/preview.sh                                              # API :8000, SMS :3000, portal :3001
node scripts/screenshot.mjs --base http://localhost:3001 --mobile /my-orders
```

Before calling UI work done: `npm run check`, a screenshot at phone width, and
`/impeccable detect` over the changed files.

## Branches and pull requests

- Branch off `main` and open a pull request into it. `main` takes nothing else:
  no direct pushes, force-pushes or deletion.
- CI must pass to merge: the `check` job (lint, prettier, typecheck, tests,
  build). `npm-audit` doesn't block, but fix a red one. Changes under
  `.github/` also need @BenMcD23's review (`.github/CODEOWNERS`).
- Fill in the pull request template: what changed, why, and how you checked it.
  A UI change includes phone and desktop screenshots from the preview.
- Before pushing: `npm run check && npm run format:check`, plus
  `npm run build` for anything that touches routing or config.
