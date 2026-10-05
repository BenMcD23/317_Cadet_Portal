"use client"

import Image from "next/image"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

function GoogleIcon() {
  return (
    <svg data-icon="inline-start" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[5fr_4fr]">
      {/* Brand panel: a wash of the sidebar accent, nothing busier. */}
      <div className="bg-sidebar text-sidebar-foreground relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="from-sidebar-primary/25 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />
        <div className="relative flex items-center gap-3">
          <Image src="/317_logo.png" alt="" width={40} height={40} className="object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">317 (Failsworth) Squadron</p>
            <p className="text-sidebar-foreground/60 text-xs">Royal Air Force Air Cadets</p>
          </div>
        </div>
        <div className="relative flex max-w-md flex-col gap-3">
          <p className="text-sidebar-accent-foreground text-3xl font-semibold tracking-tight text-balance">
            Cadet Portal
          </p>
          <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
            Order uniform and badges, keep your details current, and find the documents you need for
            classification exams.
          </p>
        </div>
        <p className="text-sidebar-foreground/50 relative text-xs">For 317 Squadron cadets and staff.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            <Image
              src="/317_logo.png"
              alt="317 Squadron crest"
              width={80}
              height={80}
              className="object-contain lg:hidden"
              priority
            />
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-muted-foreground text-sm">Use your 317 ATC Google account to continue.</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { redirectTo: "/" })}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <p className="text-muted-foreground text-center text-xs lg:text-left">
            Access is restricted to @317atc.co.uk accounts.
          </p>
        </div>
      </div>
    </div>
  )
}
