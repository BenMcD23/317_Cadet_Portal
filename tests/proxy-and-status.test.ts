import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

describe("middleware matcher", () => {
  it("runs on pages but not on API routes, Next internals or images", async () => {
    const { config } = await import("@/proxy")
    const matcher = new RegExp(`^${config.matcher[0]}$`)
    for (const p of ["/", "/my-orders", "/badge-order"]) expect(matcher.test(p)).toBe(true)
    for (const p of ["/api/cadet/me", "/api/auth/session", "/_next/static/a.js", "/favicon.ico", "/x.png"]) {
      expect(matcher.test(p)).toBe(false)
    }
  })
})

describe("/api/status", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  const load = async () => (await import("@/app/api/status/route")).GET

  it("reports up, not-ready and unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}"))
    )
    let res = await (await load())()
    expect([res.status, await res.json()]).toEqual([200, { ok: true }])
    expect(res.headers.get("cache-control")).toBe("no-store")

    vi.resetModules()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 }))
    )
    res = await (await load())()
    expect([res.status, await res.json()]).toEqual([503, { ok: false, reason: "not-ready" }])

    vi.resetModules()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("down")))
    )
    res = await (await load())()
    expect(await res.json()).toEqual({ ok: false, reason: "unreachable" })
  })

  it("caches a healthy answer briefly but never a failure", async () => {
    const GET = await load()
    const ok = vi.fn(async () => new Response("{}"))
    vi.stubGlobal("fetch", ok)
    await GET()
    await GET()
    expect(ok).toHaveBeenCalledOnce()

    vi.resetModules()
    const GET2 = await load()
    const bad = vi.fn(async () => new Response("{}", { status: 500 }))
    vi.stubGlobal("fetch", bad)
    await GET2()
    await GET2()
    expect(bad).toHaveBeenCalledTimes(2)
  })
})
