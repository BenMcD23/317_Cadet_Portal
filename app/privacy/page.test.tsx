// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/privacy" }))

import PrivacyPage from "@/app/privacy/page"
import LoginPage from "@/app/login/page"
import { AppShell } from "@/components/layout/app-shell"

vi.mock("next-auth/react", () => ({ signIn: vi.fn(), signOut: vi.fn(), useSession: () => ({}) }))

function section(name: string) {
  return screen.getByRole("heading", { level: 2, name }).closest("section")!
}

describe("privacy notice", () => {
  it("covers every part UK GDPR requires a notice to have", () => {
    render(<PrivacyPage />)
    expect(screen.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeTruthy()
    for (const heading of [
      "Who we are",
      "What we hold about you",
      "Medical and allergy information",
      "Why we hold it",
      "Where it comes from",
      "Who we share it with",
      "How long we keep it",
      "Your rights",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeTruthy()
    }
    expect(screen.getByText(/Last updated \d+ \w+ \d{4}/)).toBeTruthy()
  })

  it("says medical data is copied from Bader, used only for event checks, and kept from NCOs and AI", () => {
    render(<PrivacyPage />)
    const medical = within(section("Medical and allergy information"))
    expect(medical.getByText(/copy it from your Bader record/)).toBeTruthy()
    expect(medical.getByText(/one thing only: so staff can check before an event/)).toBeTruthy()
    expect(medical.getByText(/Cadet NCOs\s+cannot/)).toBeTruthy()
    expect(medical.getByText(/never sent to the AI services/)).toBeTruthy()
  })

  it("states the 14-day backup retention", () => {
    render(<PrivacyPage />)
    expect(within(section("How long we keep it")).getByText(/from our backups within 14 days/)).toBeTruthy()
  })

  it("names every outside service that receives cadet data, and that some are in the US", () => {
    render(<PrivacyPage />)
    const sharing = within(section("Who we share it with"))
    for (const who of ["RAF Air Cadets", "Google", "GOV.UK Notify", "Vercel", "AI services"]) {
      expect(sharing.getByText(who)).toBeTruthy()
    }
    expect(sharing.getByText(/NVIDIA, Google Gemini or Groq/)).toBeTruthy()
    expect(sharing.getByText(/based in the United States/)).toBeTruthy()
    expect(sharing.getByText(/encrypted so Google cannot read it/)).toBeTruthy()
  })

  it("tells people how to complain to the ICO", () => {
    render(<PrivacyPage />)
    const link = screen.getByRole("link", { name: "ico.org.uk/make-a-complaint" })
    expect(link.getAttribute("href")).toBe("https://ico.org.uk/make-a-complaint/")
  })

  it("renders without the sidebar, since signed-out visitors and parents read it", () => {
    render(
      <AppShell>
        <PrivacyPage />
      </AppShell>
    )
    expect(screen.queryByRole("button", { name: /toggle sidebar/i })).toBeNull()
    expect(screen.getByRole("link", { name: /Back to the Cadet Portal/ }).getAttribute("href")).toBe("/")
  })

  it("is linked from the login page", () => {
    render(<LoginPage />)
    expect(screen.getByRole("link", { name: "Privacy notice" }).getAttribute("href")).toBe("/privacy")
  })
})
