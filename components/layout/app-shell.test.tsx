// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/page-header"
import { activityLog, json, sectionLog } from "@/tests/activity-log-fixtures"

const pathname = vi.hoisted(() => ({ current: "/" }))
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }))
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { name: "Cara Cadet", email: "c@317atc.co.uk" } },
    status: "authenticated",
  }),
  signOut: vi.fn(),
}))
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }) }))

beforeEach(() => {
  window.matchMedia ??= (q: string) =>
    ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList
})

/** The shell around a page with its own header, as every real page has. */
function renderShell(path: string, response: () => Response = () => json(activityLog({}, false))) {
  pathname.current = path
  const fetchMock = vi.fn(async () => response())
  vi.stubGlobal("fetch", fetchMock)
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AppShell>
        <PageHeader title="A page" />
      </AppShell>
    </QueryClientProvider>
  )
  return fetchMock
}

describe("getting around", () => {
  it("has three places on the phone's bottom bar, and More for the menu", () => {
    renderShell("/")
    const bar = screen.getByRole("navigation", { name: "Quick links" })
    expect(
      within(bar)
        .getAllByRole("link")
        .map((l) => [l.textContent, l.getAttribute("href")])
    ).toEqual([
      ["Home", "/"],
      ["Orders", "/my-orders"],
      ["Me", "/my-details"],
    ])
    expect(within(bar).getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "false")
  })

  it("lights Orders on every ordering page, so it's clear where you are", () => {
    renderShell("/uniform-order")
    const bar = screen.getByRole("navigation", { name: "Quick links" })
    expect(within(bar).getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page")
    expect(within(bar).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
  })

  it("puts placing an order one tap from the orders, with no dead end once you have some", () => {
    renderShell("/my-orders")
    const tabs = screen.getByRole("navigation", { name: "Orders" })
    expect(within(tabs).getByRole("link", { name: "My orders" })).toHaveAttribute("aria-current", "page")
    expect(within(tabs).getByRole("link", { name: "Order uniform" })).toHaveAttribute(
      "href",
      "/uniform-order"
    )
    expect(within(tabs).getByRole("link", { name: "Order badges" })).toHaveAttribute("href", "/badge-order")
  })

  it("shows no tab row on Home", () => {
    renderShell("/")
    expect(screen.queryByRole("navigation", { name: "Orders" })).toBeNull()
    expect(screen.queryByRole("navigation", { name: "Me" })).toBeNull()
  })

  it("More opens the menu", async () => {
    renderShell("/")
    const bar = screen.getByRole("navigation", { name: "Quick links" })
    await userEvent.click(within(bar).getByRole("button", { name: "More" }))
    expect(within(bar).getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "true")
  })
})

describe("the DofE log tab", () => {
  it("shows under Me once staff have switched the cadet's log on", async () => {
    renderShell("/my-details", () => json(activityLog({ skills: sectionLog() })))
    const tabs = screen.getByRole("navigation", { name: "Me" })
    expect(await within(tabs).findByRole("link", { name: "DofE log" })).toHaveAttribute(
      "href",
      "/activity-log"
    )
  })

  it.each([
    ["a cadet whose log is off", () => json(activityLog({}, false))],
    ["an adult with no cadet record", () => json({ detail: "You are not registered" }, 404)],
    ["the API being down", () => json({ detail: "Internal Server Error" }, 500)],
  ])("stays hidden for %s", async (_, response) => {
    const fetchMock = renderShell("/my-details", response)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cadet/activity-log"))
    // Let the answer land, so "hidden" isn't just "not loaded yet".
    await act(() => new Promise((r) => setTimeout(r, 20)))
    const tabs = screen.getByRole("navigation", { name: "Me" })
    expect(within(tabs).getByRole("link", { name: "Details" })).toBeInTheDocument()
    expect(within(tabs).queryByRole("link", { name: "DofE log" })).toBeNull()
  })
})
