"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, Info, RotateCcw, ScanLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/** What the API sends back for a check-in. */
type CheckIn = {
  date: string
  checked_in_at: string
  already: boolean
  first_name: string
}

type State =
  | { kind: "checking" }
  | { kind: "done"; result: CheckIn }
  // A 404 (the wrong code, or no cadet record) won't fix itself on retry.
  | { kind: "failed"; message: string; retry: boolean }

/** "19:05" from the API's UK-local "2026-11-09T19:05:00", without a Date: the
 * time is already the squadron's, so no time zone may shift it. */
function clock(at: string) {
  return at.slice(11, 16)
}

/**
 * Where the squadron's door QR code and NFC tag land. Opening it checks the
 * signed-in cadet in for tonight: the code says it's the real door, the
 * session says who. It's a head count for the night, not the register.
 */
export default function NightCheckInPage() {
  const { code } = useParams<{ code?: string }>() ?? {}
  const [state, setState] = useState<State>({ kind: "checking" })
  // React runs effects twice in development; one tap should be one request.
  const sent = useRef<string | null>(null)

  const checkIn = useCallback(async (c: string) => {
    setState({ kind: "checking" })
    try {
      const res = await fetch(`/api/cadet/check-in/${encodeURIComponent(c)}`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || typeof data.checked_in_at !== "string") {
        const detail = typeof data?.detail === "string" ? data.detail : null
        setState({
          kind: "failed",
          message:
            detail ??
            (res.status === 503 ? "The server can't be reached right now." : "Something went wrong."),
          retry: res.status !== 404,
        })
        return
      }
      setState({ kind: "done", result: data })
    } catch {
      setState({ kind: "failed", message: "Couldn't reach the server. Check your signal.", retry: true })
    }
  }, [])

  useEffect(() => {
    if (!code || sent.current === code) return
    sent.current = code
    // Kicked off by the scan or tap itself, not a click.
    checkIn(code)
  }, [code, checkIn])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-6">
      <Card>
        <CardContent className="flex flex-col gap-5 py-4 text-center">
          {!code ? (
            <p className="text-muted-foreground">
              This link isn&apos;t the squadron check-in. Scan the QR code by the door again.
            </p>
          ) : state.kind === "checking" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner className="size-8" />
              <p className="text-muted-foreground">Checking you in…</p>
            </div>
          ) : state.kind === "done" ? (
            <>
              <div
                className={cn(
                  "mx-auto flex size-16 items-center justify-center rounded-full",
                  state.result.already ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"
                )}
              >
                {state.result.already ? <Info className="size-8" /> : <CheckCircle2 className="size-8" />}
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {state.result.already ? "Already checked in" : `You're in, ${state.result.first_name}`}
                </h1>
                <p className="text-muted-foreground">
                  {state.result.already
                    ? `You checked in at ${clock(state.result.checked_in_at)}. You don't need to do it again.`
                    : `Checked in at ${clock(state.result.checked_in_at)}. Staff can see you're here.`}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-destructive/10 text-destructive mx-auto flex size-16 items-center justify-center rounded-full">
                <ScanLine className="size-8" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">Couldn&apos;t check you in</h1>
                <p className="text-muted-foreground">{state.message}</p>
              </div>
              {state.retry && (
                <Button onClick={() => checkIn(code)}>
                  <RotateCcw />
                  Try again
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Button variant="ghost" asChild>
        <Link href="/">Back to the dashboard</Link>
      </Button>
    </div>
  )
}
