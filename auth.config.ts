import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

const ALLOWED_DOMAIN = "317atc.co.uk"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

      const email = auth.user?.email ?? ""
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return Response.redirect(new URL("/unauthorized", nextUrl))
      }

      return true
    },
  },
}
