// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StrictMode } from "react"
import { describe, expect, it, vi } from "vitest"

import NightCheckInPage from "@/app/check-in/[code]/page"

const params = vi.hoisted(() => ({ value: { code: "door-code-123" } as { code?: string } }))
vi.mock("next/navigation", () => ({ useParams: () => params.value }))

const IN = { date: "2026-11-09", checked_in_at: "2026-11-09T19:05:00", already: false, first_name: "Kian" }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function tap(...responses: (() => Response | Promise<Response>)[]) {
  const queue = [...responses]
  const fetchMock = vi.fn(async () => (queue.length > 1 ? queue.shift()! : queue[0])())
  vi.stubGlobal("fetch", fetchMock)
  params.value = { code: "door-code-123" }
  render(
    <StrictMode>
      <NightCheckInPage />
    </StrictMode>
  )
  return fetchMock
}

describe("night check-in page", () => {
  it("checks the cadet in once, even though React runs the effect twice in development", async () => {
    const fetchMock = tap(() => json(IN))
    expect(screen.getByText("Checking you in…")).toBeVisible()
    expect(await screen.findByRole("heading", { name: "You're in, Kian" })).toBeVisible()
    expect(screen.getByText("Checked in at 19:05. Staff can see you're here.")).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/api/cadet/check-in/door-code-123", { method: "POST" })
  })

  it("the time is the squadron's as sent, never shifted by a time zone", async () => {
    tap(() => json({ ...IN, checked_in_at: "2026-07-01T00:30:00" }))
    expect(await screen.findByText(/Checked in at 00:30/)).toBeVisible()
  })

  it("tapping again says they're already in and when", async () => {
    tap(() => json({ ...IN, already: true }))
    expect(await screen.findByRole("heading", { name: "Already checked in" })).toBeVisible()
    expect(screen.getByText(/You checked in at 19:05/)).toBeVisible()
  })

  it("the wrong code shows the API's reason, with no point retrying", async () => {
    tap(() => json({ detail: "That isn't the squadron's check-in code. Ask an NCO to check you in." }, 404))
    expect(await screen.findByRole("heading", { name: "Couldn't check you in" })).toBeVisible()
    expect(screen.getByText(/Ask an NCO to check you in/)).toBeVisible()
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()
  })

  it("a signed-in adult with no cadet record is told so", async () => {
    tap(() =>
      json({ detail: "You are not registered in the system. Please speak to a member of staff." }, 404)
    )
    expect(await screen.findByText(/not registered in the system/)).toBeVisible()
  })

  it("an API outage can be retried, and the retry checks them in", async () => {
    const user = userEvent.setup()
    const fetchMock = tap(
      () => json({ error: "API unreachable" }, 503),
      () => json(IN)
    )
    expect(await screen.findByText("The server can't be reached right now.")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(await screen.findByRole("heading", { name: "You're in, Kian" })).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("an expired session (401) is an error to retry, not a crash", async () => {
    tap(() => json({ error: "Not authenticated" }, 401))
    expect(await screen.findByText("Something went wrong.")).toBeVisible()
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible()
  })

  it("no signal at all says so", async () => {
    tap(() => Promise.reject(new TypeError("Failed to fetch")))
    expect(await screen.findByText(/Couldn't reach the server/)).toBeVisible()
  })

  it("a 200 that isn't a check-in is treated as a failure", async () => {
    tap(() => json({ detail: "odd" }))
    expect(await screen.findByText("odd")).toBeVisible()
  })

  it("with no code in the link it asks for a rescan and calls nothing", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    params.value = {}
    render(<NightCheckInPage />)
    expect(screen.getByText(/isn't the squadron check-in/)).toBeVisible()
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled())
  })
})
