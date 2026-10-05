import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { ALLOWED_DOMAIN } from "@/lib/config"

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

/** The `exp` claim of a Google id_token, or 0 if it can't be read. The id_token
 *  is the credential the API checks, so its expiry — not the access token's
 *  `expires_in`, which Google may omit — decides when the session is stale. */
function idTokenExp(idToken: string | undefined): number {
  try {
    const payload = JSON.parse(Buffer.from((idToken ?? "").split(".")[1], "base64url").toString())
    return typeof payload.exp === "number" ? payload.exp : 0
  } catch {
    return 0
  }
}

// The API allows 60s of clock skew, so a token is still worth sending until
// this close to its own expiry.
const ID_TOKEN_GRACE_S = 60

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  cookies: {
    sessionToken: {
      name: "cadet.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "cadet.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "cadet.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: "cadet.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    state: {
      name: "cadet.state",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    nonce: {
      name: "cadet.nonce",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account }) {
      // Initial sign-in. The access token is never sent anywhere, so it isn't
      // kept: it only bloats the cookie towards the size where Auth.js splits
      // it into chunks, and stale chunks then break the session.
      if (account) {
        return {
          ...token,
          id_token: account.id_token,
          refresh_token: account.refresh_token ?? token.refresh_token,
          expires_at: idTokenExp(account.id_token) || account.expires_at,
          error: undefined,
        }
      }

      // Token still valid — return as-is
      const now = Math.floor(Date.now() / 1000)
      if (((token.expires_at as number) ?? 0) > now + 300) return token

      // Still inside the id_token's real life: a failed renewal costs nothing
      // yet. `error` makes middleware sign the cadet out, so it's only raised
      // once the session genuinely can't be used any more.
      const stillUsable = ((token.expires_at as number) ?? 0) > now + ID_TOKEN_GRACE_S

      // No refresh token — cannot renew
      if (!token.refresh_token) return stillUsable ? token : { ...token, error: "RefreshTokenMissing" }

      // Attempt refresh
      try {
        const refreshed = await refreshGoogleToken(token.refresh_token as string)
        const idToken = refreshed.id_token ?? (token.id_token as string)
        const expiresAt = idTokenExp(idToken)
        if (expiresAt < now + ID_TOKEN_GRACE_S) throw new Error("Token refresh produced a stale id_token")
        return {
          ...token,
          id_token: idToken,
          expires_at: expiresAt,
          refresh_token: refreshed.refresh_token ?? token.refresh_token,
          error: undefined,
        }
      } catch (e) {
        console.error("[jwt] Token refresh failed:", e)
        return stillUsable ? token : { ...token, error: "RefreshAccessTokenError" }
      }
    },
    async session({ session, token }) {
      session.id_token = token.id_token as string
      if (token.error) session.error = token.error as string
      return session
    },
    async signIn({ user }) {
      const email = (user.email ?? "").toLowerCase()
      return email.endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`)
    },
  },
})
