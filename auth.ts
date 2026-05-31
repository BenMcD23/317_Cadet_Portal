import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const ALLOWED_DOMAIN = "317atc.co.uk"

async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error("Token refresh failed")
  return res.json()
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  cookies: {
    sessionToken: { name: "cadet.session-token", options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" } },
    callbackUrl: { name: "cadet.callback-url", options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" } },
    csrfToken: { name: "cadet.csrf-token", options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" } },
    pkceCodeVerifier: { name: "cadet.pkce.code_verifier", options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" } },
    state: { name: "cadet.state", options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" } },
    nonce: { name: "cadet.nonce", options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" } },
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account }) {
      // Initial sign-in — store all tokens
      if (account) {
        console.log("[auth] account.id_token present:", !!account.id_token)
        return {
          ...token,
          id_token: account.id_token,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          error: undefined,
        }
      }

      // Token still valid — return as-is
      const now = Math.floor(Date.now() / 1000)
      if (((token.expires_at as number) ?? 0) > now + 300) return token

      // No refresh token — cannot renew
      if (!token.refresh_token) return { ...token, error: "RefreshTokenMissing" }

      // Attempt refresh
      try {
        const refreshed = await refreshGoogleToken(token.refresh_token as string)
        return {
          ...token,
          id_token: refreshed.id_token ?? (token.id_token as string),
          access_token: refreshed.access_token,
          expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
          refresh_token: refreshed.refresh_token ?? token.refresh_token,
          error: undefined,
        }
      } catch (e) {
        console.error("[jwt] Token refresh failed:", e)
        return { ...token, error: "RefreshAccessTokenError" }
      }
    },
    async session({ session, token }) {
      session.id_token = token.id_token as string
      if (token.error) session.error = token.error as string
      return session
    },
    async signIn({ user }) {
      const email = user.email ?? ""
      return email.endsWith(`@${ALLOWED_DOMAIN}`)
    },
  },
})
