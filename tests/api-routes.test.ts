/// <reference types="vite/client" />
// Every app/api route is a thin proxy over proxyToApi. This calls every
// exported handler and pins the backend path and method it forwards to.
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const proxied: { path: string; init?: { method?: string; body?: unknown } }[] = []
vi.mock("@/lib/api-proxy", () => ({
  proxyToApi: async (p: string, init?: { method?: string; body?: unknown }) => {
    proxied.push({ path: p, init })
    return new Response("{}")
  },
}))

const NOT_PROXIES = new Set(["auth/[...nextauth]", "status"])
type RouteModule = Record<
  string,
  (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>
>
const MODULES = import.meta.glob<RouteModule>("../app/api/**/route.ts")
const load = (route: string) => MODULES[`../app/api/${route}/route.ts`]()
const ROUTES = Object.keys(MODULES)
  .map((file) => file.slice("../app/api/".length, -"/route.ts".length))
  .filter((route) => !NOT_PROXIES.has(route))
  .sort()
const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const

beforeEach(() => {
  proxied.length = 0
})

async function call(route: string, method: string, params: Record<string, string>) {
  const mod = await load(route)
  const hasBody = !["GET", "DELETE"].includes(method)
  const req = new NextRequest(`http://localhost/api/${route}`, {
    method,
    ...(hasBody
      ? { body: JSON.stringify({ probe: true }), headers: { "Content-Type": "application/json" } }
      : {}),
  })
  proxied.length = 0
  await mod[method](req, { params: Promise.resolve(params) })
  return proxied
}

describe("app/api route handlers", () => {
  it("finds the routes", () => {
    expect(ROUTES.length).toBeGreaterThan(8)
  })

  it.each(ROUTES)("%s forwards to the backend", async (route) => {
    const mod = await load(route)
    const params = Object.fromEntries([...route.matchAll(/\[([A-Za-z]+)\]/g)].map(([, n]) => [n, `<${n}>`]))
    const methods = METHODS.filter((m) => typeof mod[m] === "function")
    expect(methods.length).toBeGreaterThan(0)
    for (const method of methods) {
      const calls = await call(route, method, params)
      expect(calls).toHaveLength(1)
      for (const value of Object.values(params)) expect(calls[0].path).toContain(value)
      expect(calls[0].path).not.toMatch(/undefined|\[|\]|\$\{/)
      expect(calls[0].init?.method ?? "GET").toBe(method)
      if (calls[0].init?.body !== undefined) expect(calls[0].init.body).toEqual({ probe: true })
    }
  })

  it("only ever reaches the signed-in person's own records", async () => {
    for (const route of ROUTES) {
      if (route === "reference") continue
      const mod = await load(route)
      const params = Object.fromEntries([...route.matchAll(/\[([A-Za-z]+)\]/g)].map(([, n]) => [n, "1"]))
      for (const method of METHODS.filter((m) => typeof mod[m] === "function")) {
        const [first] = await call(route, method, params)
        expect(first.path, `${method} ${route}`).toMatch(/^\/(cadets|users)\/me(\/|$)/)
      }
    }
  })

  it("matches the pinned list of backend routes", async () => {
    const table: string[] = []
    for (const route of ROUTES) {
      const mod = await load(route)
      const params = Object.fromEntries([...route.matchAll(/\[([A-Za-z]+)\]/g)].map(([, n]) => [n, `:${n}`]))
      for (const method of METHODS.filter((m) => typeof mod[m] === "function")) {
        const [first] = await call(route, method, params)
        table.push(`${method} /api/${route} -> ${first.path}`)
      }
    }
    expect(table).toMatchSnapshot()
  })
})
