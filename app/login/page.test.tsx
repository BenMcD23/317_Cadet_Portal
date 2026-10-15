// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import LoginPage from "@/app/login/page"

const auth = vi.hoisted(() => ({ signIn: vi.fn() }))
vi.mock("next-auth/react", () => auth)
const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))

async function signInFrom(query: string) {
  search.value = query
  const user = userEvent.setup()
  render(<LoginPage />)
  await user.click(await screen.findByRole("button", { name: "Continue with Google" }))
  return auth.signIn.mock.calls.at(-1)
}

describe("login page", () => {
  it("returns a cadet to the lesson QR they scanned", async () => {
    expect(await signInFrom("?callbackUrl=%2Flesson%2Fabc123")).toEqual([
      "google",
      { redirectTo: "/lesson/abc123" },
    ])
  })

  it("goes to the dashboard with no callback, or one that points off the site", async () => {
    expect(await signInFrom("")).toEqual(["google", { redirectTo: "/" }])
  })

  it("never follows a callback to another site", async () => {
    expect(await signInFrom("?callbackUrl=https%3A%2F%2Fevil.example")).toEqual([
      "google",
      { redirectTo: "/" },
    ])
  })
})
