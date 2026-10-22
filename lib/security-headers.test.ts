import { describe, expect, it } from "vitest"

import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers"

function directive(csp: string, name: string): string[] {
  const found = csp.split("; ").find((d) => d.startsWith(`${name} `))
  return found ? found.split(" ").slice(1) : []
}

describe("contentSecurityPolicy", () => {
  it("lets the browser talk only to this app, since the API call happens server side", () => {
    expect(directive(contentSecurityPolicy(false), "connect-src")).toEqual(["'self'"])
  })

  it("allows eval and websockets only in dev", () => {
    expect(directive(contentSecurityPolicy(false), "script-src")).not.toContain("'unsafe-eval'")
    expect(directive(contentSecurityPolicy(true), "script-src")).toContain("'unsafe-eval'")
    expect(directive(contentSecurityPolicy(false), "connect-src")).not.toContain("ws:")
    expect(directive(contentSecurityPolicy(true), "connect-src")).toContain("ws:")
  })

  it("lets the Google sign-in form redirect, forbids framing and plugins", () => {
    const csp = contentSecurityPolicy(false)
    expect(directive(csp, "form-action")).toContain("https://accounts.google.com")
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"])
    expect(directive(csp, "object-src")).toEqual(["'none'"])
  })
})

describe("securityHeaders", () => {
  it("sends the full set on every page", () => {
    expect(securityHeaders(false).map((h) => h.key)).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
      ])
    )
  })
})
