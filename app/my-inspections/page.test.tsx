// @vitest-environment jsdom
import { screen } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"

import MyInspectionsPage from "@/app/my-inspections/page"
import { renderWithQuery } from "@/tests/render-with-query"

const HISTORY = {
  cin: 1,
  name: "Cara Cadet",
  rank: "Cdt",
  flight: "A",
  inspection_count: 2,
  present_count: 2,
  attendance_avg: 100,
  score_avg: 8.5,
  overall: 8.5,
  timeline: [
    { date: "2026-10-01", uniform: "blues", score: 8, absent: false, awol: false, faults: [], positives: [] },
    {
      date: "2026-11-05",
      uniform: "mtp",
      score: 9,
      absent: false,
      awol: false,
      faults: [{ region: null, text: "Boots need a polish" }],
      positives: [],
    },
  ],
}

function answer(status: number, body: unknown) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal("fetch", fn)
  return fn
}

describe("My Inspections", () => {
  it("shows the average and what the inspector wrote", async () => {
    answer(200, HISTORY)
    renderWithQuery(<MyInspectionsPage />)
    expect(await screen.findByText("8.5/10")).toBeInTheDocument()
    expect(screen.getByText("Boots need a polish")).toBeInTheDocument()
  })

  it("says there's nothing yet for a cadet who hasn't been inspected", async () => {
    answer(200, { ...HISTORY, inspection_count: 0, present_count: 0, timeline: [] })
    renderWithQuery(<MyInspectionsPage />)
    expect(await screen.findByText("No inspections yet")).toBeInTheDocument()
  })

  it("explains, without an error, that a staff account has no inspection record", async () => {
    answer(404, { detail: "Not registered" })
    renderWithQuery(<MyInspectionsPage />)
    expect(await screen.findByText("No inspection record")).toBeInTheDocument()
    expect(screen.queryByText("Could not load your inspections")).toBeNull()
  })

  it("shows the API's reason when the history can't be loaded", async () => {
    answer(500, { detail: "Inspections are down" })
    renderWithQuery(<MyInspectionsPage />)
    expect(await screen.findByText("Inspections are down")).toBeInTheDocument()
    expect(screen.queryByText("No inspection record")).toBeNull()
  })

  it("says the server couldn't be reached when the request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("Failed to fetch")))
    )
    renderWithQuery(<MyInspectionsPage />)
    expect(await screen.findByText("Could not reach the server.")).toBeInTheDocument()
  })

  it("shows the history straight away on a return visit, without asking again", async () => {
    const fetchMock = answer(200, HISTORY)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } })
    client.setQueryData(["cadet", "inspections"], HISTORY)
    renderWithQuery(<MyInspectionsPage />, client)
    expect(screen.getByText("8.5/10")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
