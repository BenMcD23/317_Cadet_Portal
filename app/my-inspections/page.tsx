"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ErrorAlert } from "@/components/error-alert"
import { SectionHeading } from "@/components/section-heading"
import { formatDate } from "@/lib/format"
import { ClipboardCheck, TriangleAlert, ThumbsUp, UserX, CalendarDays } from "lucide-react"

// One note left on a cadet during an inspection — where on the uniform it was
// and what the inspector wrote.
type Note = { region: string | null; text: string | null }

type Entry = {
  date: string
  uniform: string
  score: number | null
  absent: boolean
  awol: boolean
  faults: Note[]
  positives: Note[]
}

type History = {
  cin: number
  name: string
  rank: string | null
  flight: string | null
  inspection_count: number
  present_count: number
  attendance_avg: number
  score_avg: number
  overall: number
  timeline: Entry[]
}

const UNIFORM_LABELS: Record<string, string> = { blues: "Blues", mtp: "MTP" }

function uniformLabel(uniform: string): string {
  return UNIFORM_LABELS[uniform] ?? uniform
}

/** One headline number with its label — the row above the timeline. */
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col gap-0.5">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function NoteList({ notes, kind }: { notes: Note[]; kind: "fault" | "positive" }) {
  const fault = kind === "fault"
  const Icon = fault ? TriangleAlert : ThumbsUp
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-xs font-medium">{fault ? "Faults" : "Done well"}</p>
      <ul className="flex flex-col gap-1.5">
        {notes.map((note, i) => (
          <li
            key={i}
            className={
              fault
                ? "border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-md border px-2.5 py-1.5"
                : "border-success/30 bg-success/5 flex items-start gap-2 rounded-md border px-2.5 py-1.5"
            }
          >
            <Icon className={`mt-0.5 size-3.5 shrink-0 ${fault ? "text-destructive" : "text-success"}`} />
            <div className="min-w-0 text-xs">
              {note.region && <span className="font-medium">{note.region}: </span>}
              <span className="text-muted-foreground">{note.text || "No detail given"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MyInspectionsPage() {
  const [history, setHistory] = useState<History | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Staff and adult volunteers have no Cadet record, so there is nothing to
  // show them here — that's an explanation, not an error.
  const [notACadet, setNotACadet] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cadet/inspections")
        const data = await res.json()
        if (res.status === 404) {
          setNotACadet(true)
          return
        }
        if (!res.ok) {
          setError(data.detail ?? "Could not load your inspections.")
          return
        }
        setHistory(data)
      } catch {
        setError("Could not reach the server.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Newest first — the last inspection is the one you came to read.
  const timeline = [...(history?.timeline ?? [])].reverse()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-16">
      <PageHeader
        title="My Inspections"
        description="Your own uniform inspection scores and everything the inspecting staff wrote"
      />

      <ErrorAlert message={error} title="Could not load your inspections" />

      {loading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      )}

      {!loading && notACadet && (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspection record"
          description="Inspections are recorded against cadets, so there's nothing here for a staff account."
        />
      )}

      {!loading && history && history.inspection_count === 0 && (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspections yet"
          description="Once you've been inspected on a parade night, your score and the notes will show up here."
        />
      )}

      {!loading && history && history.inspection_count > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Average score"
              value={`${history.score_avg}/10`}
              hint={`Over ${history.present_count} inspection${history.present_count !== 1 ? "s" : ""}`}
            />
            <Stat
              label="Attendance"
              value={`${history.attendance_avg}%`}
              hint={`Present ${history.present_count} of ${history.inspection_count}`}
            />
            <Stat label="Overall" value={`${history.overall}`} hint="Attendance × average score" />
          </div>

          <section className="flex flex-col gap-3">
            <SectionHeading
              title="Every inspection"
              description={`${history.inspection_count} night${history.inspection_count !== 1 ? "s" : ""} on record, newest first`}
            />

            {timeline.map((entry) => (
              <Card key={entry.date} className="gap-0 py-0">
                <CardHeader className="border-b py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarDays className="text-muted-foreground size-4" />
                      {formatDate(entry.date)}
                    </CardTitle>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {uniformLabel(entry.uniform)}
                      </Badge>
                      {entry.absent ? (
                        <Badge
                          variant="outline"
                          className={
                            entry.awol
                              ? "border-destructive/40 bg-destructive/10 text-destructive text-xs"
                              : "text-xs"
                          }
                        >
                          <UserX />
                          {entry.awol ? "AWOL" : "Absent"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs tabular-nums">
                          {entry.score === null ? "Not scored" : `${entry.score}/10`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 py-4">
                  {entry.absent && (
                    <p className="text-muted-foreground text-sm">
                      {entry.awol
                        ? "Marked absent with no absence logged on SMS."
                        : "Marked absent — an absence was logged for this date."}
                    </p>
                  )}
                  {entry.faults.length > 0 && <NoteList notes={entry.faults} kind="fault" />}
                  {entry.positives.length > 0 && <NoteList notes={entry.positives} kind="positive" />}
                  {!entry.absent && entry.faults.length === 0 && entry.positives.length === 0 && (
                    <p className="text-muted-foreground text-sm">No notes left on this inspection.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>

          <p className="text-muted-foreground text-xs">
            Only your own inspections are shown — scores and notes for other cadets aren&apos;t available
            here. Speak to staff if something looks wrong.
          </p>
        </>
      )}
    </div>
  )
}
