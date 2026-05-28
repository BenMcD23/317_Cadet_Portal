import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const ALLOWED_DOMAIN = "317atc.co.uk"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
