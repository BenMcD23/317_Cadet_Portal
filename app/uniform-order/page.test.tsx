// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() }
vi.mock("next/navigation", () => ({ useRouter: () => router }))
vi.mock("@/lib/reference", () => ({
  useReference: () => ({ itemTypes: ["Tie"], noSizeItems: new Set(["Tie"]), sizes: {}, sizingFields: {} }),
}))

import UniformOrderPage from "@/app/uniform-order/page"
import { renderWithQuery } from "@/tests/render-with-query"

beforeEach(() => {
  // Radix's checkbox measures itself; jsdom has no ResizeObserver.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

/** `/cadets/me` answers with `meStatus`; posting an order succeeds. Returns the fetch mock. */
function api(meStatus: number) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/cadet/me")
      return new Response(JSON.stringify(meStatus === 200 ? { cin: 1, phone_number: "" } : { detail: "x" }), {
        status: meStatus,
      })
    if (init?.method === "POST") return new Response(JSON.stringify({ id: "o1" }), { status: 201 })
    return new Response("{}", { status: 404 })
  })
  vi.stubGlobal("fetch", fn)
  return fn
}

async function orderATie(fetchMock: ReturnType<typeof api>) {
  renderWithQuery(<UniformOrderPage />)
  // Let the record lookup settle (including useCadetMe's one retry on a 5xx).
  await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => u === "/api/cadet/me")).toBe(true))
  await new Promise((r) => setTimeout(r, 1200))
  fireEvent.click(screen.getByLabelText("Tie"))
  fireEvent.click(screen.getByRole("button", { name: "Submit order" }))
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/my-orders?sent=uniform"))
  return fetchMock.mock.calls.find(([, init]) => init?.method === "POST")?.[0]
}

describe("Order Uniform, who the order is for", () => {
  it("sends a cadet's order to the cadet list", async () => {
    expect(await orderATie(api(200))).toBe("/api/cadet/orders")
  })

  it("sends an adult's order (no cadet record) to their own list", async () => {
    expect(await orderATie(api(404))).toBe("/api/user/orders")
  })

  // It used to treat any failed lookup as "not a cadet", so a cadet's order
  // went to the adult list whenever the API had a bad moment.
  it("still orders as a cadet when the record lookup fails", async () => {
    expect(await orderATie(api(500))).toBe("/api/cadet/orders")
  })
})
