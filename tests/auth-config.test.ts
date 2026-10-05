import { describe, expect, it } from "vitest"

import { authConfig } from "@/auth.config"

type Authorized = (args: { auth: unknown; request: { nextUrl: URL } }) => boolean | Response
const authorized = authConfig.callbacks!.authorized as unknown as Authorized

function visit(path: string, auth: unknown) {
  const out = authorized({ auth, request: { nextUrl: new URL(`https://cadets.test${path}`) } })
  if (!(out instanceof Response)) return out
  const to = new URL(out.headers.get("location")!)
  return `redirect:${to.pathname}${to.search}`
}

const cadet = (email = "cadet@317atc.co.uk", error?: string) => ({ user: { email }, error })

describe("middleware authorized()", () => {
  it("login page: open to the signed out, bounces the signed in", () => {
    expect(visit("/login", null)).toBe(true)
    expect(visit("/login", cadet())).toBe("redirect:/")
  })

  it("everything else needs a session", () => {
    expect(visit("/my-orders", null)).toBe("redirect:/login")
    expect(visit("/my-orders", cadet())).toBe(true)
    expect(visit("/unauthorized", cadet("x@gmail.com"))).toBe(true)
  })

  it("an outside account is turned away, whatever the case of the domain", () => {
    expect(visit("/", cadet("x@gmail.com"))).toBe("redirect:/unauthorized")
    expect(visit("/", cadet("Cadet@317ATC.CO.UK"))).toBe(true)
  })

  it("a dead session is signed out to the login page", () => {
    expect(visit("/my-orders", cadet("cadet@317atc.co.uk", "RefreshAccessTokenError"))).toBe(
      "redirect:/api/auth/signout?callbackUrl=%2Flogin"
    )
  })

  it("asks Google for a refresh token on every sign-in", () => {
    const params = (
      authConfig.providers[0] as unknown as { options: { authorization: { params: Record<string, string> } } }
    ).options.authorization.params
    expect(params).toMatchObject({ access_type: "offline", prompt: "consent" })
  })
})
