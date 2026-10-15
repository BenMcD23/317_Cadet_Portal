import type { Metadata } from "next"
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AppShell } from "@/components/layout/app-shell"

// Same face as the SMS site. Atkinson Hyperlegible was drawn for low-vision
// readers — distinct 1/l/I and 0/O — which suits cadets reading sizes and
// order numbers off a phone.
const uiSans = Atkinson_Hyperlegible_Next({
  variable: "--font-ui-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const uiMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
