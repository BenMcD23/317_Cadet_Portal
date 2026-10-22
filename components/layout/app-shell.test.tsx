// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppShell } from "@/components/layout/app-shell"
import { activityLog, json, sectionLog } from "@/tests/activity-log-fixtures"

vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
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

function renderShell(response: () => Response) {
  const fetchMock = vi.fn(async () => response())
  vi.stubGlobal("fetch", fetchMock)
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AppShell>page</AppShell>
    </QueryClientProvider>
  )
  return fetchMock
}

describe("the Activity Log link", () => {
  it("shows once staff have switched the cadet's log on", async () => {
    renderShell(() => json(activityLog({ skills: sectionLog() })))
    expect(await screen.findByRole("link", { name: "Activity Log" })).toHaveAttribute("href", "/activity-log")
  })

  it.each([
    ["a cadet whose log is off", () => json(activityLog({}, false))],
    ["an adult with no cadet record", () => json({ detail: "You are not registered" }, 404)],
    ["the API being down", () => json({ detail: "Internal Server Error" }, 500)],
  ])("stays hidden for %s", async (_, response) => {
    const fetchMock = renderShell(response)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cadet/activity-log"))
    // Let the answer land, so "hidden" isn't just "not loaded yet".
    await act(() => new Promise((r) => setTimeout(r, 20)))
    expect(screen.getByRole("link", { name: "My Details" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Activity Log" })).toBeNull()
  })
})
