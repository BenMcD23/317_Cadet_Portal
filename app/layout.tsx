import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AppShell } from "@/components/layout/app-shell"

// Same face as the SMS site. Atkinson Hyperlegible was drawn for low-vision
// readers — distinct 1/l/I and 0/O — which suits cadets reading sizes and
// order numbers off a phone.
// Self-hosted (variable Latin files from the Fontsource packages, OFL licence
// beside them), as the SMS site is, rather than next/font/google: that
// downloads from Google at build time, and a failed download broke the
// preview image build with "next/font/google queries have exactly one entry".
const uiSans = localFont({
  src: "./fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2",
  variable: "--font-ui-sans",
  weight: "200 800",
  display: "swap",
})

const uiMono = localFont({
  src: "./fonts/atkinson-hyperlegible-mono-latin-wght-normal.woff2",
  variable: "--font-ui-mono",
  weight: "200 800",
  display: "swap",
})

export const metadata: Metadata = {
  title: "317 Cadet Portal",
  description: "317 ATC Cadet Portal",
  icons: { icon: "/icon.png" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${uiSans.variable} ${uiMono.variable}`}>
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
