import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

import { ALLOWED_DOMAIN, devSignInBuild } from "@/lib/config"

/** Accounts the dev sign-in can use. Must match the API's `_dev_fake_email`
 *  so the fake token resolves to the same account there: the cadet, SNCO and
 *  NCO are cadets in the dev seed (they have a /cadets/me record), staff is an
 *  adult. The cadet is an ordinary Cdt with no NCO role, named as seeded. */
export const DEV_USERS = {
  cadet: { email: "dev.cadet@317atc.co.uk", name: "Kian Ashworth" },
  snco: { email: "dev.snco@317atc.co.uk", name: "Dev SNCO" },
  nco: { email: "dev.nco@317atc.co.uk", name: "Dev NCO" },
  staff: { email: "ci.mcdonald@317atc.co.uk", name: "Dev Staff" },
} as const

export type DevRole = keyof typeof DEV_USERS

/** Dev sign-in needs the flag AND a build that allows it (`next dev` or the
 *  preview image), so a stray env var on a deployed build can't switch it on. */
export const devBypassEnabled = () => process.env.AUTH_DEV_BYPASS === "1" && devSignInBuild()

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
    // Local preview only: the API accepts the matching dev-fake-token solely
    // when its own DEV_FAKE_AUTH=1 is set.
    ...(devBypassEnabled()
      ? [
          Credentials({
            credentials: { role: {} },
            authorize: (c) => {
              const role = String(c?.role ?? "snco")
              return { id: role, ...(DEV_USERS[role as DevRole] ?? DEV_USERS.snco) }
            },
          }),
        ]
      : []),
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
