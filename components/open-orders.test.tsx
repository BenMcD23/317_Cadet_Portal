// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { OpenOrders } from "@/components/open-orders"
import { renderWithQuery } from "@/tests/render-with-query"

type Item = { givenAt?: string | null; readyToCollect?: string | null; needSizing?: boolean }
const uniform = (id: string, ts: string, items: (Item & { itemType: string })[], completed = false) => ({
  id,
  timestamp: ts,
  completed,
  items: items.map((i, n) => ({ id: `${id}${n}`, givenAt: null, needSizing: false, ...i })),
})
const badges = (id: string, ts: string, items: (Item & { badgeName: string })[]) => ({
  id,
  timestamp: ts,
  completed: false,
  items: items.map((i, n) => ({ id: `${id}${n}`, givenAt: null, ...i })),
})

/** Answers by path; anything unlisted is a 404. */
function api(routes: Record<string, { status?: number; body: unknown }>) {
  const fn = vi.fn(async (url: string) => {
    const r = routes[url]
    return new Response(JSON.stringify(r ? r.body : { detail: "Not found" }), {
      status: r ? (r.status ?? 200) : 404,
    })
  })
  vi.stubGlobal("fetch", fn)
  return fn
}
const CADET = { "/api/cadet/me": { body: { cin: 1, phone_number: "x" } } }
const rows = () =>
  within(screen.getByRole("list"))
    .getAllByRole("link")
    .map((l) => l.textContent)

describe("Your orders on Home", () => {
  it("puts what's ready to collect first, and says what to do about each", async () => {
    api({
      ...CADET,
      "/api/cadet/orders": {
        body: [
          uniform("1", "2026-11-10T10:00:00Z", [{ itemType: "Jumper" }]),
          uniform("2", "2026-11-01T10:00:00Z", [{ itemType: "Beret", needSizing: true }]),
        ],
      },
      "/api/cadet/badge-orders": {
        body: [
          badges("3", "2026-10-01T10:00:00Z", [{ badgeName: "Leadership – Bronze", readyToCollect: "x" }]),
        ],
      },
    })
    renderWithQuery(<OpenOrders />)
    expect(await screen.findByRole("heading", { name: "Your orders" })).toBeInTheDocument()
    expect(rows()).toEqual([
      expect.stringMatching(/^Leadership – BronzeReady to collectBadges · Collect it from the stores/),
      expect.stringMatching(/^BeretNeeds sizingUniform · Ask an NCO to measure you/),
      expect.stringMatching(/^JumperWith the storesUniform · The stores are sorting it/),
    ])
    for (const link of within(screen.getByRole("list")).getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/my-orders")
    }
  })

  it("leaves out orders that have all been issued, and what's already been given", async () => {
    api({
      ...CADET,
      "/api/cadet/orders": {
        body: [
          uniform("1", "2026-11-10T10:00:00Z", [{ itemType: "Tie", givenAt: "x" }]),
          uniform("2", "2026-11-11T10:00:00Z", [{ itemType: "Belt", givenAt: "x" }, { itemType: "Jumper" }]),
          uniform("3", "2026-11-12T10:00:00Z", [{ itemType: "Beret" }], true),
        ],
      },
      "/api/cadet/badge-orders": { body: [] },
    })
    renderWithQuery(<OpenOrders />)
    await screen.findByRole("heading", { name: "Your orders" })
    expect(rows()).toEqual([expect.stringMatching(/^JumperWith the stores/)])
    expect(screen.getByText("1 still open")).toBeInTheDocument()
  })

  it("shows the three most urgent and links to the rest", async () => {
    api({
      ...CADET,
      "/api/cadet/orders": {
        body: ["A", "B", "C", "D"].map((x, n) =>
          uniform(x, `2026-11-0${n + 1}T10:00:00Z`, [{ itemType: x }])
        ),
      },
      "/api/cadet/badge-orders": { body: [] },
    })
    renderWithQuery(<OpenOrders />)
    expect(await screen.findByRole("link", { name: /See all 4 open orders/ })).toHaveAttribute(
      "href",
      "/my-orders"
    )
    expect(rows()).toHaveLength(4) // three orders and "See all"
  })

  it("shows nothing when nothing is open", async () => {
    const fetch = api({
      ...CADET,
      "/api/cadet/orders": { body: [] },
      "/api/cadet/badge-orders": { body: [] },
    })
    const { container } = renderWithQuery(<OpenOrders />)
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/cadet/badge-orders"))
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  // The My Orders link below still works; Home doesn't need an error banner for this.
  it("shows nothing, rather than an error, when the orders can't be loaded", async () => {
    const fetch = api({ ...CADET, "/api/cadet/orders": { status: 500, body: { detail: "boom" } } })
    const { container } = renderWithQuery(<OpenOrders />)
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/cadet/orders"))
    await new Promise((r) => setTimeout(r, 50))
    expect(container).toBeEmptyDOMElement()
  })

  it("shows an adult with no cadet record their own uniform orders", async () => {
    const fetch = api({
      "/api/user/orders": { body: [uniform("9", "2026-11-01T10:00:00Z", [{ itemType: "Fleece" }])] },
    })
    renderWithQuery(<OpenOrders />)
    expect(await screen.findByText("Fleece")).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalledWith("/api/cadet/orders")
  })
})
