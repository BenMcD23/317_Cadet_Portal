<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tests are part of every change

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

- Match the repo style: no semicolons, double quotes (prettier enforces it).
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
