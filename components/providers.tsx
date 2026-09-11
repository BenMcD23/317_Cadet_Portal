"use client"

import { useState } from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"

import { ApiStatusOverlay } from "@/components/api-status-overlay"
import { ReferenceProvider } from "@/lib/reference"

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session; created lazily so it isn't shared
  // between server renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false, retry: 1 } },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <ReferenceProvider>{children}</ReferenceProvider>
          <Toaster position="top-right" richColors />
          <ApiStatusOverlay />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
