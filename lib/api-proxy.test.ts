import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.fn()
vi.mock("@/auth", () => ({ auth: () => auth() }))

import { API_BASE } from "@/lib/config"
import { proxyToApi } from "@/lib/api-proxy"

beforeEach(() => {
  auth.mockResolvedValue({ id_token: "tok" })
})

function backend(answer: Response | Error) {
  const fn = vi.fn<(...args: unknown[]) => Promise<Response>>(async () => {
    if (answer instanceof Error) throw answer
    return answer
  })
  vi.stubGlobal("fetch", fn)
  return fn
}

describe("proxyToApi", () => {
  it("refuses without a session token rather than forwarding anonymously", async () => {
    const fetchMock = backend(new Response("{}"))
    for (const session of [null, {}, { error: "RefreshAccessTokenError" }]) {
      auth.mockResolvedValueOnce(session)
      expect((await proxyToApi("/cadets/me")).status).toBe(401)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("forwards method, token and JSON body", async () => {
    const fetchMock = backend(new Response(JSON.stringify({ id: 4 }), { status: 201 }))
    const res = await proxyToApi("/cadets/me/orders", { method: "POST", body: { items: [] } })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 4 })
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/cadets/me/orders`, {
      method: "POST",
      headers: { Authorization: "Bearer tok", "Content-Type": "application/json" },
      body: '{"items":[]}',
    })
  })

  it("GETs without a body or content type", async () => {
    const fetchMock = backend(new Response("[]"))
    await proxyToApi("/cadets/me/orders")
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: "GET",
      headers: { Authorization: "Bearer tok" },
      body: undefined,
    })
  })

  it("passes errors through, keeps 204 empty, and wraps non-JSON", async () => {
    backend(new Response(JSON.stringify({ detail: "Cannot edit a completed order" }), { status: 400 }))
    let res = await proxyToApi("/x", { method: "PATCH", body: {} })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ detail: "Cannot edit a completed order" })

    backend(new Response(null, { status: 204 }))
    res = await proxyToApi("/x", { method: "DELETE" })
    expect(res.status).toBe(204)

    backend(new Response("<html/>", { status: 502, statusText: "Bad Gateway" }))
    res = await proxyToApi("/x")
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: "Bad Gateway" })
  })

  it("an unreachable backend is a clean 503", async () => {
    backend(new TypeError("fetch failed"))
    const res = await proxyToApi("/x")
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: "API unreachable" })
  })
})
