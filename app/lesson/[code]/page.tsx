"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, GraduationCap, Info, QrCode, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/** What the API sends back for a scan. */
type CheckIn = {
  key: string
  name: string
  category: string
  parts: number
  part: number
  already: boolean
  lessons: number[]
  complete: boolean
}

type State =
  | { kind: "checking" }
  | { kind: "done"; result: CheckIn }
  // 404s (a code we don't know, or no cadet record) won't fix themselves on retry.
  | { kind: "failed"; message: string; retry: boolean }

function Pips({ result }: { result: CheckIn }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {Array.from({ length: result.parts }, (_, i) => i + 1).map((n) => (
        <span
          key={n}
          className={cn(
            "h-2.5 w-10 rounded-full",
            result.lessons.includes(n) ? (result.complete ? "bg-success" : "bg-primary") : "bg-muted",
            n === result.part && "ring-primary/40 ring-2 ring-offset-2 ring-offset-transparent"
          )}
        />
      ))}
    </div>
  )
}

function Done({ result }: { result: CheckIn }) {
  const single = result.parts === 1
  const what = single ? `${result.name} theory` : `${result.name}, lesson ${result.part} of ${result.parts}`
  const left = result.parts - result.lessons.length
  return (
    <>
      <div
        className={cn(
          "mx-auto flex size-16 items-center justify-center rounded-full",
          result.already ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"
        )}
      >
        {result.already ? <Info className="size-8" /> : <CheckCircle2 className="size-8" />}
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {result.already ? "Already checked in" : "You're checked in"}
        </h1>
        <p className="text-muted-foreground">{what}</p>
      </div>
      {!single && (
        <div className="flex flex-col gap-2">
          <Pips result={result} />
          <p className="text-muted-foreground text-sm">
            {result.lessons.length} of {result.parts} lessons done
          </p>
        </div>
      )}
      {result.complete ? (
        <p className="bg-success/10 text-success flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium">
          <GraduationCap className="size-4 shrink-0" />
          {single ? "Theory done." : `That's every ${result.name} lesson — you're ready for the exam.`}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          {left} more {left === 1 ? "lesson" : "lessons"} to go. Scan the code at each one.
        </p>
      )}
    </>
  )
}

/**
 * Where a lesson's QR code lands. Opening it checks the signed-in cadet in to
 * that lesson; the code says which lesson, the session says who.
 */
export default function LessonCheckInPage() {
  const { code } = useParams<{ code?: string }>() ?? {}
  const [state, setState] = useState<State>({ kind: "checking" })
  // React runs effects twice in development; one scan should be one request.
  const sent = useRef<string | null>(null)

  const checkIn = useCallback(async (c: string) => {
    setState({ kind: "checking" })
    try {
      const res = await fetch(`/api/cadet/lessons/${encodeURIComponent(c)}`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || typeof data.name !== "string") {
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
    // Kicked off by the scan itself, not a click.
    checkIn(code)
  }, [code, checkIn])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-6">
      <Card>
        <CardContent className="flex flex-col gap-5 py-4 text-center">
          {!code ? (
            <p className="text-muted-foreground">
              This link isn&apos;t a lesson. Scan the QR code on the slide again.
            </p>
          ) : state.kind === "checking" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner className="size-8" />
              <p className="text-muted-foreground">Checking you in…</p>
            </div>
          ) : state.kind === "done" ? (
            <Done result={state.result} />
          ) : (
            <>
              <div className="bg-destructive/10 text-destructive mx-auto flex size-16 items-center justify-center rounded-full">
                <QrCode className="size-8" />
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
