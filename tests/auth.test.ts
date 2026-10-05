// auth.ts — who may sign in and how a session's Google tokens are renewed.
import { beforeEach, describe, expect, it, vi } from "vitest"

type Callbacks = {
  jwt: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  signIn: (args: Record<string, unknown>) => Promise<boolean>
  session: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
}
let config: { callbacks: Callbacks; session: { maxAge: number }; cookies: Record<string, { name: string }> }

vi.mock("next-auth", () => ({
  default: (cfg: typeof config) => {
    config = cfg
    return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() }
  },
}))

const now = () => Math.floor(Date.now() / 1000)
const idToken = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.sig`

async function load() {
  vi.resetModules()
  await import("@/auth")
  return config.callbacks
}

let google: ReturnType<typeof vi.fn>
function googleAnswers(make: () => Response) {
  google = vi.fn(async () => make())
  vi.stubGlobal("fetch", google)
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("signIn", () => {
  it("only admits accounts in the squadron's domain, whatever the case", async () => {
    const cb = await load()
    expect(await cb.signIn({ user: { email: "cadet@317atc.co.uk" } })).toBe(true)
    expect(await cb.signIn({ user: { email: "Cadet@317ATC.co.uk" } })).toBe(true)
    expect(await cb.signIn({ user: { email: "someone@gmail.com" } })).toBe(false)
    expect(await cb.signIn({ user: { email: "x@317atc.co.uk.evil.com" } })).toBe(false)
    expect(await cb.signIn({ user: {} })).toBe(false)
  })
})

describe("jwt", () => {
  const fresh =
    (exp = now() + 3600, extra: Record<string, unknown> = {}) =>
    () =>
      new Response(JSON.stringify({ id_token: idToken(exp), access_token: "a", ...extra }), { status: 200 })

  it("on sign-in keeps the id_token and its own expiry, not the access token", async () => {
    const cb = await load()
    const exp = now() + 3600
    const token = await cb.jwt({
      token: { email: "c@317atc.co.uk" },
      account: { id_token: idToken(exp), access_token: "secret", refresh_token: "r", expires_at: 1 },
    })
    expect(token).toMatchObject({ id_token: idToken(exp), refresh_token: "r", expires_at: exp })
    expect(token).not.toHaveProperty("access_token")
  })

  it("leaves a token with plenty of life alone", async () => {
    const cb = await load()
    googleAnswers(fresh())
    const token = { expires_at: now() + 3000, refresh_token: "r" }
    expect(await cb.jwt({ token })).toBe(token)
    expect(google).not.toHaveBeenCalled()
  })

  it("renews near expiry using the new id_token's expiry", async () => {
    const cb = await load()
    const exp = now() + 3600
    googleAnswers(fresh(exp, { expires_in: undefined }))
    const token = await cb.jwt({ token: { expires_at: now() + 100, refresh_token: "r", id_token: "old" } })
    expect(token).toMatchObject({ id_token: idToken(exp), expires_at: exp, refresh_token: "r" })
    expect(Number.isNaN(token.expires_at)).toBe(false)
    expect(token.error).toBeUndefined()
  })

  it("a Google blip while the token still works doesn't sign the cadet out", async () => {
    const cb = await load()
    googleAnswers(() => new Response("err", { status: 503 }))
    const token = { expires_at: now() + 200, refresh_token: "r" }
    expect(await cb.jwt({ token })).toBe(token)
  })

  it("a failed renewal after the token has died is flagged", async () => {
    const cb = await load()
    googleAnswers(() => new Response("err", { status: 400 }))
    const token = await cb.jwt({ token: { expires_at: now() - 5, refresh_token: "r" } })
    expect(token.error).toBe("RefreshAccessTokenError")
  })

  it("a renewal that returns an already-stale id_token isn't accepted", async () => {
    const cb = await load()
    googleAnswers(fresh(now() + 10))
    const token = await cb.jwt({ token: { expires_at: now() - 5, refresh_token: "r" } })
    expect(token.error).toBe("RefreshAccessTokenError")
  })

  it("without a refresh token the session lasts as long as the id_token", async () => {
    const cb = await load()
    const usable = { expires_at: now() + 200 }
    expect(await cb.jwt({ token: usable })).toBe(usable)
    expect((await cb.jwt({ token: { expires_at: now() + 10 } })).error).toBe("RefreshTokenMissing")
  })
})

describe("session", () => {
  it("exposes the id_token and only a real error", async () => {
    const cb = await load()
    expect(
      await cb.session({ session: { user: {} }, token: { id_token: "t", refresh_token: "secret" } })
    ).toEqual({
      user: {},
      id_token: "t",
    })
    const withError = await cb.session({
      session: {},
      token: { id_token: "t", error: "RefreshTokenMissing" },
    })
    expect(withError.error).toBe("RefreshTokenMissing")
  })

  it("uses its own cookie names so it can't collide with the SMS site", async () => {
    await load()
    for (const cookie of Object.values(config.cookies)) expect(cookie.name.startsWith("cadet.")).toBe(true)
    expect(config.session.maxAge).toBe(30 * 24 * 60 * 60)
  })
})
