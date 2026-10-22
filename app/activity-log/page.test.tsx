// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import ActivityLogPage from "@/app/activity-log/page"
import { activityLog, json, sectionLog } from "@/tests/activity-log-fixtures"

function renderWith(response: () => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => response())
  )
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ActivityLogPage />
    </QueryClientProvider>
  )
}

describe("Activity Log hub", () => {
  it("lists the three sections, each saying what to do this week", async () => {
    renderWith(() =>
      json(
        activityLog({
          volunteering: sectionLog(),
          physical: sectionLog({ this_week_minutes: 75, missed: [] }),
        })
      )
    )
    const list = within(await screen.findByRole("list", { name: "Your sections" }))
    const row = (name: RegExp) => list.getByRole("link", { name })
    expect(row(/Skills/)).toHaveAttribute("href", "/activity-log/skills")
    expect(row(/Skills/)).toHaveTextContent("Not set up")
    expect(row(/Volunteering/)).toHaveTextContent("Not done this week")
    expect(row(/Volunteering/)).toHaveTextContent("2 weeks to catch up")
    expect(row(/Physical/)).toHaveTextContent("Done this week")
    expect(screen.getByText(/Your Bronze DofE/)).toBeInTheDocument()
  })

  it("tells a cadet whose log is off to speak to staff, with no sections to tap", async () => {
    renderWith(() => json(activityLog({}, false)))
    expect(await screen.findByText("Your DofE activity log isn't switched on")).toBeInTheDocument()
    expect(screen.queryByRole("list", { name: "Your sections" })).toBeNull()
  })

  it("tells a signed-in adult it's for cadets, not that something broke", async () => {
    renderWith(() => json({ detail: "You are not registered in the system." }, 404))
    expect(await screen.findByText("DofE activity logs are for cadets")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("shows the API's error when it fails", async () => {
    const fetchMock = vi.fn(async () => json({ detail: "Database unavailable" }, 500))
    renderWith(fetchMock)
    // A 5xx is tried once more (a 404 isn't), a second later.
    expect(await screen.findByText("Database unavailable", undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("treats an error body where a log was expected as an error, not a blank page", async () => {
    renderWith(() => json([]))
    expect(await screen.findByText("Couldn't load your DofE activity log.")).toBeInTheDocument()
  })
})
