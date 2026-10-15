// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StrictMode } from "react"
import { describe, expect, it, vi } from "vitest"

import LessonCheckInPage from "@/app/lesson/[code]/page"

const params = vi.hoisted(() => ({ value: { code: "navtwo02" } as { code?: string } }))
vi.mock("next/navigation", () => ({ useParams: () => params.value }))

const NAV = { key: "acp_32_2", name: "Basic Navigation", category: "Leading", parts: 3 }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function scan(...responses: (() => Response | Promise<Response>)[]) {
  const queue = [...responses]
  const fetchMock = vi.fn(async () => (queue.length > 1 ? queue.shift()! : queue[0])())
  vi.stubGlobal("fetch", fetchMock)
  params.value = { code: "navtwo02" }
  render(
    <StrictMode>
      <LessonCheckInPage />
    </StrictMode>
  )
  return fetchMock
}

describe("lesson check-in page", () => {
  it("checks the cadet in once, even though React runs the effect twice in development", async () => {
    const fetchMock = scan(() => json({ ...NAV, part: 2, already: false, lessons: [1, 2], complete: false }))
    expect(screen.getByText("Checking you in…")).toBeVisible()
    expect(await screen.findByRole("heading", { name: "You're checked in" })).toBeVisible()
    expect(screen.getByText("Basic Navigation, lesson 2 of 3")).toBeVisible()
    expect(screen.getByText("2 of 3 lessons done")).toBeVisible()
    expect(screen.getByText("1 more lesson to go. Scan the code at each one.")).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/api/cadet/lessons/navtwo02", { method: "POST" })
  })

  it("the last lesson says they're ready for the exam", async () => {
    scan(() => json({ ...NAV, part: 3, already: false, lessons: [1, 2, 3], complete: true }))
    expect(await screen.findByText(/every Basic Navigation lesson — you're ready for the exam/)).toBeVisible()
  })

  it("scanning again says they were already checked in", async () => {
    scan(() => json({ ...NAV, part: 2, already: true, lessons: [2], complete: false }))
    expect(await screen.findByRole("heading", { name: "Already checked in" })).toBeVisible()
  })

  it("badge theory is one scan and done", async () => {
    scan(() =>
      json({
        key: "blue_radio",
        name: "Blue Radio",
        category: "Badges",
        parts: 1,
        part: 1,
        already: false,
        lessons: [1],
        complete: true,
      })
    )
    expect(await screen.findByText("Blue Radio theory")).toBeVisible()
    expect(screen.getByText("Theory done.")).toBeVisible()
    expect(screen.queryByText(/lessons done/)).toBeNull()
  })

  it("an unknown code shows the API's reason, with no point retrying", async () => {
    scan(() => json({ detail: "That QR code isn't a lesson we know. Ask a member of staff." }, 404))
    expect(await screen.findByRole("heading", { name: "Couldn't check you in" })).toBeVisible()
    expect(screen.getByText(/isn't a lesson we know/)).toBeVisible()
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()
  })

  it("a signed-in adult with no cadet record is told so", async () => {
    scan(() =>
      json({ detail: "You are not registered in the system. Please speak to a member of staff." }, 404)
    )
    expect(await screen.findByText(/not registered in the system/)).toBeVisible()
  })

  it("an API outage can be retried, and the retry checks them in", async () => {
    const user = userEvent.setup()
    const fetchMock = scan(
      () => json({ error: "API unreachable" }, 503),
      () => json({ ...NAV, part: 2, already: false, lessons: [2], complete: false })
    )
    expect(await screen.findByText("The server can't be reached right now.")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(await screen.findByRole("heading", { name: "You're checked in" })).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("an expired session (401) is an error to retry, not a crash", async () => {
    scan(() => json({ error: "Not authenticated" }, 401))
    expect(await screen.findByText("Something went wrong.")).toBeVisible()
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible()
  })

  it("no signal at all says so", async () => {
    scan(() => Promise.reject(new TypeError("Failed to fetch")))
    expect(await screen.findByText(/Couldn't reach the server/)).toBeVisible()
  })

  it("a 200 that isn't a check-in is treated as a failure", async () => {
    scan(() => json({ detail: "odd" }))
    expect(await screen.findByText("odd")).toBeVisible()
  })

  it("with no code in the link it asks for a rescan and calls nothing", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    params.value = {}
    render(<LessonCheckInPage />)
    expect(screen.getByText(/isn't a lesson. Scan the QR code/)).toBeVisible()
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled())
  })
})
