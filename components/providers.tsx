"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"

import { ApiStatusOverlay } from "@/components/api-status-overlay"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        {children}
        <Toaster position="top-right" richColors />
        <ApiStatusOverlay />
      </ThemeProvider>
    </SessionProvider>
  )
}
