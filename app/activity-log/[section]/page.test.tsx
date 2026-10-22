// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import ActivityLogSectionPage from "@/app/activity-log/[section]/page"
import type { ActivityLog } from "@/lib/activity-log"
import { TODAY, activityLog, json, sectionLog } from "@/tests/activity-log-fixtures"

const params = vi.hoisted(() => ({ value: { section: "volunteering" } as { section?: string } }))
vi.mock("next/navigation", () => ({ useParams: () => params.value }))

type Call = { url: string; method: string; body: unknown }
let calls: Call[]
/** Answers the GET with `current`, and any write with `onWrite`'s response. */
let current: () => Response
let onWrite: (call: Call) => Response

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(TODAY)
  calls = []
  // jsdom has no layout, so no scrolling; "Catch up" scrolls to the form.
  Element.prototype.scrollIntoView = vi.fn()
  params.value = { section: "volunteering" }
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const call = {
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      }
      calls.push(call)
      return call.method === "GET" ? current() : onWrite(call)
    })
  )
})

afterEach(() => {
  vi.useRealTimers()
})

const writes = () => calls.filter((c) => c.method !== "GET")

function show(log: ActivityLog) {
  current = () => json(log)
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ActivityLogSectionPage />
    </QueryClientProvider>
  )
}

describe("setting a section up", () => {
  it("asks what they're doing, and says what's missing before sending anything", async () => {
    show(activityLog())
    const user = userEvent.setup()
    await user.click(await screen.findByRole("button", { name: "Start my log" }))
    expect(screen.getByText("Say what your activity is")).toBeInTheDocument()
    expect(screen.getByText("Say what you want to get better at or achieve")).toBeInTheDocument()
    expect(screen.getByText("Pick how long you're doing it for")).toBeInTheDocument()
    expect(writes()).toEqual([])
  })

  it("saves the plan, starting today unless they change it, then shows the log", async () => {
    show(activityLog())
    const user = userEvent.setup()
    onWrite = () => json(activityLog({ volunteering: sectionLog({ entries: [] }) }))
    await user.type(await screen.findByLabelText("What's your volunteering activity?"), "Charity shop")
    await user.type(screen.getByLabelText("What's your goal?"), "Run the till")
    await user.click(
      within(screen.getByRole("group", { name: "How long for?" })).getByRole("button", { name: "6 months" })
    )
    await user.click(screen.getByRole("button", { name: "Start my log" }))

    expect(writes()).toEqual([
      {
        url: "/api/cadet/activity-log/volunteering",
        method: "PUT",
        body: {
          activity: "Charity shop",
          goal: "Run the till",
          assessor_name: "",
          assessor_role: "",
          duration_months: 6,
          start_date: "2026-10-21",
        },
      },
    ])
    expect(await screen.findByRole("heading", { name: "Add what you did" })).toBeInTheDocument()
  })

  it("shows the API's reason when the plan is refused", async () => {
    show(activityLog())
    const user = userEvent.setup()
    onWrite = () => json({ detail: "Pick a start date within the last three years." }, 400)
    await user.type(await screen.findByLabelText("What's your volunteering activity?"), "Shop")
    await user.type(screen.getByLabelText("What's your goal?"), "Till")
    await user.click(screen.getByRole("button", { name: "3 months" }))
    await user.click(screen.getByRole("button", { name: "Start my log" }))
    expect(await screen.findByText("Pick a start date within the last three years.")).toBeInTheDocument()
  })
})

describe("logging a week", () => {
  it("a normal week is one tap: last time's words, an hour and today are already filled in", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => json(activityLog({ volunteering: sectionLog({ this_week_minutes: 60 }) }))
    expect(await screen.findByLabelText("What did you do?")).toHaveValue("Sorted donations")
    expect(screen.getByRole("button", { name: "1 hour", pressed: true })).toBeInTheDocument()
    expect(screen.getByLabelText("When?")).toHaveValue("2026-10-21")

    await user.click(screen.getByRole("button", { name: "Save to my log" }))
    expect(writes()).toEqual([
      {
        url: "/api/cadet/activity-log/volunteering/entries",
        method: "POST",
        body: { entries: [{ date: "2026-10-21", description: "Sorted donations", minutes: 60 }] },
      },
    ])
    expect(await screen.findByRole("status")).toHaveTextContent("Saved. This week is done.")
  })

  it("says how many minutes are left when they've done less than an hour", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => json(activityLog({ volunteering: sectionLog({ this_week_minutes: 30 }) }))
    await user.click(await screen.findByRole("button", { name: "30 min" }))
    await user.click(screen.getByRole("button", { name: "Save to my log" }))
    expect((writes()[0].body as { entries: { minutes: number }[] }).entries[0].minutes).toBe(30)
    expect(await screen.findByRole("status")).toHaveTextContent("30 more minutes to do this week.")
  })

  it("catching up fills in a day for every missed week and saves them together", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => json(activityLog({ volunteering: sectionLog({ missed: [], weeks_done: 12 }) }))
    expect(await screen.findByText("You missed 2 weeks")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Catch up all 2" }))

    expect(screen.getByRole("group", { name: "Week of 17 Aug" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Week of 21 Sept" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save 2 days to my log" }))
    expect(writes()[0].body).toEqual({
      entries: [
        { date: "2026-08-17", description: "Sorted donations", minutes: 60 },
        { date: "2026-09-21", description: "Sorted donations", minutes: 60 },
      ],
    })
    expect(await screen.findByRole("status")).toHaveTextContent("Saved 2 days.")
  })

  it("an extra day can be added, and removed again", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    await user.click(await screen.findByRole("button", { name: "Add another day" }))
    expect(screen.getByRole("group", { name: "Day 2" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Remove day 2" }))
    expect(screen.queryByRole("group", { name: "Day 2" })).toBeNull()
    expect(screen.getByRole("button", { name: "Save to my log" })).toBeInTheDocument()
  })

  it("says what to fix instead of sending a blank, a future day or no time", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    await user.clear(await screen.findByLabelText("What did you do?"))
    const when = screen.getByLabelText("When?")
    await user.clear(when)
    await user.type(when, "2026-10-30")
    await user.type(screen.getByLabelText("Or type the minutes"), "700")
    await user.click(screen.getByRole("button", { name: "Save to my log" }))
    expect(screen.getByText("Say what you did")).toBeInTheDocument()
    expect(screen.getByText("Pick today or an earlier day")).toBeInTheDocument()
    expect(screen.getByText("That's over 10 hours. Split it into separate days.")).toBeInTheDocument()
    expect(writes()).toEqual([])
  })

  it("keeps what they typed and shows the API's reason when the save is refused", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => json({ detail: [{ msg: "Input should be greater than or equal to 1" }] }, 422)
    await user.click(await screen.findByRole("button", { name: "Save to my log" }))
    expect(await screen.findByText("Input should be greater than or equal to 1")).toBeInTheDocument()
    expect(screen.getByLabelText("What did you do?")).toHaveValue("Sorted donations")
  })

  it("no signal is an error they can retry, not a crash", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => {
      throw new TypeError("Failed to fetch")
    }
    await user.click(await screen.findByRole("button", { name: "Save to my log" }))
    expect(await screen.findByText(/Couldn't reach the server/)).toBeInTheDocument()
  })
})

describe("changing what's logged", () => {
  it("tapping an entry opens it to change", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => json(activityLog({ volunteering: sectionLog() }))
    await user.click(await screen.findByRole("button", { name: /Wed 14 Oct/ }))
    const dialog = within(await screen.findByRole("dialog", { name: "Change Wed 14 Oct" }))
    await user.click(dialog.getByRole("button", { name: "1 hr 30 min" }))
    await user.click(dialog.getByRole("button", { name: "Save changes" }))
    expect(writes()).toEqual([
      {
        url: "/api/cadet/activity-log/volunteering/entries/7",
        method: "PATCH",
        body: { date: "2026-10-14", description: "Sorted donations", minutes: 90 },
      },
    ])
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("removing an entry takes a second tap", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => json(activityLog({ volunteering: sectionLog({ entries: [] }) }))
    await user.click(await screen.findByRole("button", { name: /Wed 14 Oct/ }))
    const dialog = within(await screen.findByRole("dialog"))
    await user.click(dialog.getByRole("button", { name: "Remove" }))
    expect(writes()).toEqual([])
    await user.click(dialog.getByRole("button", { name: "Yes, remove it" }))
    expect(writes()).toEqual([
      { url: "/api/cadet/activity-log/volunteering/entries/7", method: "DELETE", body: undefined },
    ])
    expect(await screen.findByText("Nothing yet. What you add above shows here.")).toBeInTheDocument()
  })

  it("a cadet who changes their mind updates the plan, keeping what's logged", async () => {
    show(activityLog({ volunteering: sectionLog() }))
    const user = userEvent.setup()
    onWrite = () => json(activityLog({ volunteering: sectionLog({ activity: "Food bank" }) }))
    await user.click(await screen.findByRole("button", { name: "Change" }))
    const dialog = within(await screen.findByRole("dialog", { name: "Change your plan" }))
    const activity = dialog.getByLabelText("What's your volunteering activity?")
    expect(activity).toHaveValue("Helping at the charity shop")
    await user.clear(activity)
    await user.type(activity, "Food bank")
    await user.click(dialog.getByRole("button", { name: "Save changes" }))
    expect(writes()[0]).toMatchObject({
      method: "PUT",
      body: {
        activity: "Food bank",
        duration_months: 3,
        start_date: "2026-07-27",
        assessor_name: "Sarah Hughes",
      },
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(screen.getAllByText("Food bank").length).toBeGreaterThan(0)
  })
})

describe("other states", () => {
  it("a finished section says so and stops asking them to catch up", async () => {
    show(activityLog({ volunteering: sectionLog({ complete: true, weeks_done: 12 }) }))
    expect(await screen.findByText("Section finished")).toBeInTheDocument()
    expect(screen.queryByText(/You missed/)).toBeNull()
  })

  it("an assessor not filled in yet says to ask staff", async () => {
    show(activityLog({ volunteering: sectionLog({ assessor_name: "" }) }))
    expect(await screen.findByText("Not added yet. Ask staff who it is.")).toBeInTheDocument()
  })

  it("a log that's switched off says to speak to staff, with no form", async () => {
    show(activityLog({}, false))
    expect(await screen.findByText("Your DofE activity log isn't switched on")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Save|Start/ })).toBeNull()
  })

  it("an address that isn't a section says so", async () => {
    params.value = { section: "swimming" }
    show(activityLog())
    expect(screen.getByText("There's no section called that")).toBeInTheDocument()
  })
})
