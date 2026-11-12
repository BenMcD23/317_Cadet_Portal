// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/me" }))

import MePage from "@/app/me/page"
import OrdersPage from "@/app/orders/page"
import { activityLog, json, sectionLog } from "@/tests/activity-log-fixtures"

function renderPage(page: React.ReactElement, response: () => Response) {
  const fetchMock = vi.fn(async () => response())
  vi.stubGlobal("fetch", fetchMock)
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {page}
    </QueryClientProvider>
  )
  return fetchMock
}

describe("the Orders hub", () => {
  it("lists checking an order and placing one, as big rows", () => {
    renderPage(<OrdersPage />, () => json(activityLog({}, false)))
    expect(screen.getByRole("heading", { level: 1, name: "Orders" })).toBeInTheDocument()
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"))
    expect(hrefs).toEqual(["/my-orders", "/uniform-order", "/badge-order"])
    expect(screen.getByRole("link", { name: /Order uniform/ })).toHaveTextContent(/bigger size/)
  })
})

describe("the Me hub", () => {
  it("lists the DofE log once staff have switched it on", async () => {
    renderPage(<MePage />, () => json(activityLog({ skills: sectionLog() })))
    expect(await screen.findByRole("link", { name: /DofE activity log/ })).toHaveAttribute(
      "href",
      "/activity-log"
    )
  })

  it.each([
    ["a cadet whose log is off", () => json(activityLog({}, false))],
    ["an adult with no cadet record", () => json({ detail: "You are not registered" }, 404)],
    ["the API being down", () => json({ detail: "Internal Server Error" }, 500)],
  ])("still lists the rest, without the DofE log, for %s", async (_, response) => {
    const fetchMock = renderPage(<MePage />, response)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cadet/activity-log"))
    await act(() => new Promise((r) => setTimeout(r, 20)))
    expect(screen.getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual([
      "/my-details",
      "/my-inspections",
      "/documents",
    ])
  })
})
