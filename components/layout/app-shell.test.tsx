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
  it("has Home and the Orders and Me hubs on the phone's bottom bar, and More for the menu", () => {
    renderShell("/")
    const bar = screen.getByRole("navigation", { name: "Quick links" })
    expect(
      within(bar)
        .getAllByRole("link")
        .map((l) => [l.textContent, l.getAttribute("href")])
    ).toEqual([
      ["Home", "/"],
      ["Orders", "/orders"],
      ["Me", "/me"],
    ])
    expect(within(bar).getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "false")
  })

  it("lights Orders on every ordering page, so it's clear where you are", () => {
    renderShell("/uniform-order")
    const bar = screen.getByRole("navigation", { name: "Quick links" })
    expect(within(bar).getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page")
    expect(within(bar).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
  })

  it("gives a page inside a place the way back to its hub, and no tab row", () => {
    renderShell("/uniform-order")
    const back = screen
      .getAllByRole("link", { name: "Orders" })
      .find((l) => !l.closest("nav[aria-label='Quick links']"))!
    expect(back).toHaveAttribute("href", "/orders")
    expect(back).toHaveClass("md:hidden")
  })

  it("lists every page in the sidebar under its place, so a laptop needs no hubs", () => {
    renderShell("/my-orders")
    for (const [name, href] of [
      ["My orders", "/my-orders"],
      ["Order uniform", "/uniform-order"],
      ["Order badges", "/badge-order"],
      ["My details", "/my-details"],
      ["Documents", "/documents"],
    ])
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
  })

  it("More opens the menu", async () => {
    renderShell("/")
    const bar = screen.getByRole("navigation", { name: "Quick links" })
    await userEvent.click(within(bar).getByRole("button", { name: "More" }))
    expect(within(bar).getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "true")
  })
})

describe("the DofE log in the sidebar", () => {
  it("shows once staff have switched the cadet's log on", async () => {
    renderShell("/my-details", () => json(activityLog({ skills: sectionLog() })))
    expect(await screen.findByRole("link", { name: "DofE activity log" })).toHaveAttribute(
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
    expect(screen.getByRole("link", { name: "My details" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "DofE activity log" })).toBeNull()
  })
})
