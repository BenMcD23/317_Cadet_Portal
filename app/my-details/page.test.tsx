// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import MyDetailsPage from "@/app/my-details/page"
import { renderWithQuery } from "@/tests/render-with-query"

const ME = {
  cin: 123456,
  name: "Cara Cadet",
  email: "cara@example.com",
  phone_number: "07700900000",
  whatsapp_invite_url: "",
}

/** Answers each route from a table; a fresh Response per call, since a body reads once. */
function api(routes: Record<string, { status?: number; body: unknown } | (() => never)>) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`
    const r = routes[key]
    if (typeof r === "function") return r()
    return r
      ? new Response(JSON.stringify(r.body), { status: r.status ?? 200 })
      : new Response(JSON.stringify({ detail: "Not found" }), { status: 404 })
  })
  vi.stubGlobal("fetch", fn)
  return fn
}

describe("My Details", () => {
  it("shows the number on file once the record arrives", async () => {
    api({ "GET /api/cadet/me": { body: ME } })
    renderWithQuery(<MyDetailsPage />)
    expect(await screen.findByLabelText("Mobile number")).toHaveValue("07700900000")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("saves a new number into the shared record, so Home stops asking for one", async () => {
    api({
      "GET /api/cadet/me": { body: { ...ME, phone_number: "" } },
      "PATCH /api/cadet/phone-number": { body: { phone_number: "07700900111", whatsapp_invite_url: "" } },
    })
    const { client } = renderWithQuery(<MyDetailsPage />)
    fireEvent.change(await screen.findByLabelText("Mobile number"), { target: { value: "07700900111" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Saved — you're on the list.")).toBeInTheDocument()
    expect(client.getQueryData<typeof ME>(["cadet", "me"])?.phone_number).toBe("07700900111")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("says so when a cleared number is saved", async () => {
    api({
      "GET /api/cadet/me": { body: ME },
      "PATCH /api/cadet/phone-number": { body: { phone_number: "", whatsapp_invite_url: "" } },
    })
    renderWithQuery(<MyDetailsPage />)
    fireEvent.change(await screen.findByLabelText("Mobile number"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Saved — you'll no longer get the texts.")).toBeInTheDocument()
  })

  it("shows the API's reason when a number is refused, and keeps what was typed", async () => {
    api({
      "GET /api/cadet/me": { body: ME },
      "PATCH /api/cadet/phone-number": { status: 422, body: { detail: "That isn't a UK mobile number." } },
    })
    renderWithQuery(<MyDetailsPage />)
    fireEvent.change(await screen.findByLabelText("Mobile number"), { target: { value: "12345" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("That isn't a UK mobile number.")).toBeInTheDocument()
    expect(screen.getByLabelText("Mobile number")).toHaveValue("12345")
  })

  it("explains, without an error, that an adult has no cadet record to hold a number", async () => {
    api({ "GET /api/cadet/me": { status: 404, body: { detail: "Not registered" } } })
    renderWithQuery(<MyDetailsPage />)
    expect(await screen.findByText("No cadet record")).toBeInTheDocument()
    expect(screen.queryByLabelText("Mobile number")).toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("shows an error, not an empty form, when the record can't be loaded", async () => {
    api({ "GET /api/cadet/me": { status: 500, body: { detail: "Internal Server Error" } } })
    renderWithQuery(<MyDetailsPage />)
    // useCadetMe tries a 5xx once more (about a second) before giving up.
    expect(await screen.findByText("Internal Server Error", {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByLabelText("Mobile number")).toBeNull()
    expect(screen.queryByText("No cadet record")).toBeNull()
  })

  it("says the server couldn't be reached when the request itself fails", async () => {
    api({
      "GET /api/cadet/me": () => {
        throw new TypeError("Failed to fetch")
      },
    })
    renderWithQuery(<MyDetailsPage />)
    expect(await screen.findByText("Could not reach the server.", {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it("offers the WhatsApp invite only once a number is saved", async () => {
    api({ "GET /api/cadet/me": { body: { ...ME, whatsapp_invite_url: "https://chat.whatsapp.com/x" } } })
    renderWithQuery(<MyDetailsPage />)
    expect(await screen.findByRole("link", { name: /Open invite/ })).toHaveAttribute(
      "href",
      "https://chat.whatsapp.com/x"
    )
  })
})

describe("My Details, no invite without a number", () => {
  it("hides the invite while no number is on file", async () => {
    api({
      "GET /api/cadet/me": {
        body: { ...ME, phone_number: "", whatsapp_invite_url: "https://chat.whatsapp.com/x" },
      },
    })
    renderWithQuery(<MyDetailsPage />)
    await screen.findByLabelText("Mobile number")
    await waitFor(() => expect(screen.queryByRole("link", { name: /Open invite/ })).toBeNull())
  })
})
