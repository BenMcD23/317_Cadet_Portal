import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

const ALLOWED_DOMAIN = "317atc.co.uk"

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

      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl))
      if (isUnauthorizedPage) return true

      // Token has expired and could not be refreshed — force re-login
      if (auth.error) {
        const signOutUrl = new URL("/api/auth/signout", nextUrl)
        signOutUrl.searchParams.set("callbackUrl", "/login")
        return Response.redirect(signOutUrl)
      }

      const email = auth.user?.email ?? ""
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return Response.redirect(new URL("/unauthorized", nextUrl))
      }

      return true
    },
  },
}
