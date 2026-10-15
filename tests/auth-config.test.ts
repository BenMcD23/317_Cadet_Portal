import { afterEach, describe, expect, it, vi } from "vitest"

import { authConfig, DEV_USERS, devBypassEnabled } from "@/auth.config"

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
    expect(visit("/my-orders", null)).toBe("redirect:/login?callbackUrl=%2Fmy-orders")
    expect(visit("/my-orders", cadet())).toBe(true)
    expect(visit("/unauthorized", cadet("x@gmail.com"))).toBe(true)
  })

  it("a signed-out scan of a lesson QR comes back to that lesson after signing in", () => {
    expect(visit("/lesson/abc123", null)).toBe("redirect:/login?callbackUrl=%2Flesson%2Fabc123")
    expect(visit("/my-orders?x=1", null)).toBe("redirect:/login?callbackUrl=%2Fmy-orders%3Fx%3D1")
    // The dashboard is where sign-in goes anyway; no need to say so.
    expect(visit("/", null)).toBe("redirect:/login")
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

describe("dev sign-in", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("is off unless asked for", () => {
    vi.stubEnv("AUTH_DEV_BYPASS", "")
    expect(devBypassEnabled()).toBe(false)
  })

  it("is on with the flag outside production", () => {
    vi.stubEnv("AUTH_DEV_BYPASS", "1")
    vi.stubEnv("NODE_ENV", "development")
    expect(devBypassEnabled()).toBe(true)
  })

  // A stray env var on a deployed build must not hand out fake sessions.
  it("stays off in production even with the flag set", () => {
    vi.stubEnv("AUTH_DEV_BYPASS", "1")
    vi.stubEnv("NODE_ENV", "production")
    expect(devBypassEnabled()).toBe(false)
  })

  it("signs in as accounts the API's dev seed knows, all inside the allowed domain", () => {
    expect(DEV_USERS.snco.email).toBe("dev.snco@317atc.co.uk")
    expect(DEV_USERS.nco.email).toBe("dev.nco@317atc.co.uk")
    for (const u of Object.values(DEV_USERS)) expect(u.email.endsWith("@317atc.co.uk")).toBe(true)
  })
})
