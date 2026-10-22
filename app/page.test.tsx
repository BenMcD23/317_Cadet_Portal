// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const SESSION = { data: { id_token: "tok", user: { name: "Cara Cadet" } }, status: "authenticated" }
vi.mock("next-auth/react", () => ({ useSession: () => SESSION }))
vi.mock("@/lib/reference", () => ({
  useReference: () => ({ issuanceCategories: ["Beret", "Jumper", "Tie"] }),
}))

import HomePage from "@/app/page"
import { activityLog, sectionLog } from "@/tests/activity-log-fixtures"

/** Answers each portal route from a table; anything unlisted is a 404. */
function api(routes: Record<string, { status?: number; body: unknown }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const r = routes[url]
      return r
        ? new Response(JSON.stringify(r.body), { status: r.status ?? 200 })
        : new Response(JSON.stringify({ detail: "Not found" }), { status: 404 })
    })
  )
}

const ISSUED = [
  { id: 1, itemCategory: "Beret", lastGiven: "2026-03-14", sizeGiven: "55" },
  { id: 2, itemCategory: "Tie", lastGiven: "2025-09-01", sizeGiven: null },
]

describe("portal home", () => {
  it("greets the cadet by first name and links to every order page", async () => {
    api({ "/api/cadet/me": { body: { phone_number: "07700900000" } }, "/api/cadet/issuances": { body: [] } })
    render(<HomePage />)
    expect(screen.getByRole("heading", { name: "Hello, Cara" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Order Uniform/ })).toHaveAttribute("href", "/uniform-order")
    expect(screen.getByRole("link", { name: /Order Badges/ })).toHaveAttribute("href", "/badge-order")
    expect(screen.getByRole("link", { name: /My Orders/ })).toHaveAttribute("href", "/my-orders")
  })

  it("asks a cadet with no mobile number to add one, linking to My Details", async () => {
    api({ "/api/cadet/me": { body: { phone_number: "" } }, "/api/cadet/issuances": { body: [] } })
    render(<HomePage />)
    expect(await screen.findByRole("link", { name: /Add your mobile number/ })).toHaveAttribute(
      "href",
      "/my-details"
    )
  })

  it("doesn't nag a cadet who already gets the texts", async () => {
    api({
      "/api/cadet/me": { body: { phone_number: "07700900000" } },
      "/api/cadet/issuances": { body: ISSUED },
    })
    render(<HomePage />)
    await screen.findByText("Uniform issued to you")
    expect(screen.queryByText("Add your mobile number")).toBeNull()
  })

  it("shows the last size issued of each item, and says when something was never issued", async () => {
    api({ "/api/cadet/me": { body: { phone_number: "x" } }, "/api/cadet/issuances": { body: ISSUED } })
    render(<HomePage />)
    const list = within(await screen.findByRole("list", { name: "Uniform issued to you" }))
    const row = (name: string) => within(list.getByText(name).closest("li")!)
    expect(row("Beret").getByText("55")).toBeInTheDocument()
    expect(row("Beret").getByText("14 Mar 2026")).toBeInTheDocument()
    // A sizeless item still reads as issued rather than blank.
    expect(row("Tie").getByText("Issued")).toBeInTheDocument()
    expect(row("Jumper").getByText("Not issued")).toBeInTheDocument()
  })

  // Staff sign in to order their own kit: no cadet record, so the adult list.
  it("falls back to the adult's own issued kit when there's no cadet record", async () => {
    api({ "/api/user/issuances": { body: [ISSUED[0]] } })
    render(<HomePage />)
    expect(await screen.findByText("55")).toBeInTheDocument()
    expect(screen.queryByText("Add your mobile number")).toBeNull()
  })

  it("leaves the issued section out rather than crashing when it can't be loaded", async () => {
    api({ "/api/cadet/issuances": { status: 500, body: { detail: "boom" } } })
    render(<HomePage />)
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull())
    expect(screen.queryByText("Uniform issued to you")).toBeNull()
    expect(screen.getByRole("link", { name: /My Orders/ })).toBeInTheDocument()
  })

  it("reminds a cadet doing their DofE which sections still need this week's hour", async () => {
    api({
      "/api/cadet/me": { body: { phone_number: "x" } },
      "/api/cadet/issuances": { body: [] },
      "/api/cadet/activity-log": {
        body: activityLog({
          skills: sectionLog(),
          volunteering: sectionLog({ this_week_minutes: 60 }),
          physical: sectionLog({ this_week_minutes: 20 }),
        }),
      },
    })
    render(<HomePage />)
    const prompt = await screen.findByRole("link", { name: /Log this week's DofE/ })
    expect(prompt).toHaveAttribute("href", "/activity-log")
    expect(prompt).toHaveTextContent("Skills and Physical still need an hour this week.")
  })

  it.each([
    ["isn't doing their DofE", { body: activityLog({}, false) }],
    ["has done this week", { body: activityLog({ skills: sectionLog({ this_week_minutes: 90 }) }) }],
    ["is an adult with no cadet record", { status: 404, body: { detail: "Not registered" } }],
    ["can't be checked (API down)", { status: 500, body: { detail: "Internal Server Error" } }],
  ])("doesn't remind someone who %s", async (_, answer) => {
    api({
      "/api/cadet/me": { body: { phone_number: "x" } },
      "/api/cadet/issuances": { body: ISSUED },
      "/api/cadet/activity-log": answer,
    })
    render(<HomePage />)
    await screen.findByText("Uniform issued to you")
    expect(screen.queryByText("Log this week's DofE")).toBeNull()
  })
})
