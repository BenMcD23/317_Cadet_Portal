import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const ALLOWED_DOMAIN = "317atc.co.uk"

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
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account }) {
      if (account) {
        console.log("[auth] account.id_token present:", !!account.id_token)
        token.id_token = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      session.id_token = token.id_token as string
      return session
    },
    async signIn({ user }) {
      const email = user.email ?? ""
      return email.endsWith(`@${ALLOWED_DOMAIN}`)
    },
  },
})
