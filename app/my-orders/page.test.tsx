// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/reference", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/reference")>()),
  useReference: () => ({
    itemTypes: [],
    noSizeItems: new Set(),
    sizes: {},
    sizingFields: {},
    badgeCategories: [],
    categoriesWithoutGainedWhere: new Set(),
    gainedWhereOptions: [],
  }),
}))

import MyOrdersPage from "@/app/my-orders/page"

let answers: Record<string, () => Response>
let requested: string[]

beforeEach(() => {
  requested = []
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requested.push(url)
      return (answers[url] ?? (() => new Response("[]")))()
    })
  )
})

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MyOrdersPage />
    </QueryClientProvider>
  )
}

describe("My Orders", () => {
  it("loads a cadet's own uniform and badge orders", async () => {
    answers = { "/api/cadet/me": () => new Response(JSON.stringify({ cin: 1 })) }
    renderPage()
    await waitFor(() => expect(requested).toContain("/api/cadet/badge-orders"))
    expect(requested).toContain("/api/cadet/orders")
    expect(requested).not.toContain("/api/user/orders")
  })

  it("an adult with no cadet record gets the adult order list", async () => {
    answers = {
      "/api/cadet/me": () => new Response(JSON.stringify({ detail: "not registered" }), { status: 404 }),
    }
    renderPage()
    await waitFor(() => expect(requested).toContain("/api/user/orders"))
    expect(requested).not.toContain("/api/cadet/badge-orders")
  })

  it("an API outage is an error, not a silent switch to the adult list", async () => {
    answers = {
      "/api/cadet/me": () => new Response(JSON.stringify({ error: "API unreachable" }), { status: 503 }),
    }
    renderPage()
    expect(await screen.findByText("Failed to load your orders")).toBeInTheDocument()
    expect(requested).not.toContain("/api/user/orders")
  })
})
