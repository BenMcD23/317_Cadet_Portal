import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

import { ALLOWED_DOMAIN } from "@/lib/config"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === "/login"
      const isUnauthorizedPage = nextUrl.pathname === "/unauthorized"

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl))
        return true
      }

      if (!isLoggedIn) {
        // Remember where they were going, so a cadet who scans a lesson's QR
        // while signed out is checked in after signing in, not dropped on the
        // dashboard.
        const login = new URL("/login", nextUrl)
        const target = nextUrl.pathname + nextUrl.search
        if (target !== "/") login.searchParams.set("callbackUrl", target)
        return Response.redirect(login)
      }
      if (isUnauthorizedPage) return true

      // Token has expired and could not be refreshed — force re-login
      if (auth.error) {
        const signOutUrl = new URL("/api/auth/signout", nextUrl)
        signOutUrl.searchParams.set("callbackUrl", "/login")
        return Response.redirect(signOutUrl)
      }

      const email = (auth.user?.email ?? "").toLowerCase()
      if (!email.endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`)) {
        return Response.redirect(new URL("/unauthorized", nextUrl))
      }

      return true
    },
  },
}
