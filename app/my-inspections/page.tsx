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
import { cn } from "@/lib/utils"
import { ClipboardCheck, UserX, CalendarDays } from "lucide-react"

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

// Same figures the inspecting staff mark up on the inspection sheet, so a cadet
// reads their faults in the place they were put.
const UNIFORM_FIGURES: Record<string, string> = {
  blues: "/inspection-figure.png",
  mtp: "/inspection-figure-mtp.png",
}

// Bands down the figure, as percentages of its height. Positions are the same
// for either uniform; only the shirt/footwear labels differ.
type Band = { top: number; height: number }
const REGIONS_BY_UNIFORM: Record<string, Record<string, Band>> = {
  blues: {
    "Beret / Headdress": { top: 0, height: 14 },
    "Hair / Face": { top: 14, height: 6 },
    "Jumper / Shirt / Tie": { top: 20, height: 27 },
    Trousers: { top: 47, height: 42 },
    Shoes: { top: 89, height: 11 },
  },
  mtp: {
    "Beret / Headdress": { top: 0, height: 14 },
    "Hair / Face": { top: 14, height: 6 },
    "Undershirt / Overshirt": { top: 20, height: 27 },
    Trousers: { top: 47, height: 42 },
    Boots: { top: 89, height: 11 },
  },
}

type NumberedNote = { n: number; type: "fault" | "positive"; region: string | null; text: string | null }

function numberNotes(faults: Note[], positives: Note[]): NumberedNote[] {
  let n = 1
  return [
    ...faults.map((f) => ({ n: n++, type: "fault" as const, region: f.region, text: f.text })),
    ...positives.map((p) => ({ n: n++, type: "positive" as const, region: p.region, text: p.text })),
  ]
}

/** The uniform figure with a numbered marker sat on each noted region. */
function InspectionFigure({ notes, uniform }: { notes: NumberedNote[]; uniform: string }) {
  const regions = REGIONS_BY_UNIFORM[uniform] ?? REGIONS_BY_UNIFORM.blues
  const figureSrc = UNIFORM_FIGURES[uniform] ?? UNIFORM_FIGURES.blues

  // Notes with no region, or one this uniform doesn't know, fall to the torso.
  const fallback = uniform === "mtp" ? "Undershirt / Overshirt" : "Jumper / Shirt / Tie"
  const byRegion = new Map<string, NumberedNote[]>()
  for (const note of notes) {
    const r = note.region && regions[note.region] ? note.region : fallback
    if (!byRegion.has(r)) byRegion.set(r, [])
    byRegion.get(r)!.push(note)
  }

  return (
    <div className="relative w-[90px] shrink-0 select-none" style={{ aspectRatio: "512 / 1536" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={figureSrc}
        alt={`Cadet in ${uniformLabel(uniform)}`}
        className="h-full w-full object-contain dark:opacity-90 dark:invert"
        draggable={false}
      />
      {[...byRegion.entries()].map(([region, items]) =>
        items.map((note, j) => (
          <span
            key={note.n}
            className={cn(
              "ring-background absolute left-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2",
              note.type === "fault" ? "bg-destructive" : "bg-success"
            )}
            style={{
              top: `${regions[region].top + (regions[region].height * (j + 1)) / (items.length + 1)}%`,
            }}
            title={note.text ?? undefined}
          >
            {note.n}
          </span>
        ))
      )}
    </div>
  )
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

function NumberedNotes({ notes }: { notes: NumberedNote[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {notes.map((note) => (
        <li key={note.n} className="flex items-start gap-2 text-xs">
          <span
            className={cn(
              "mt-px flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
              note.type === "fault" ? "bg-destructive" : "bg-success"
            )}
          >
            {note.n}
          </span>
          <span className="min-w-0 flex-1 break-words">
            {note.region && <span className="font-medium">{note.region}: </span>}
            <span className="text-muted-foreground">{note.text || "No detail given"}</span>
          </span>
        </li>
      ))}
    </ul>
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

            {timeline.map((entry) => {
              const notes = numberNotes(entry.faults, entry.positives)
              return (
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

                  <CardContent className="py-4">
                    {entry.absent ? (
                      <p className="text-muted-foreground text-sm">
                        {entry.awol
                          ? "Marked absent with no absence logged on SMS."
                          : "Marked absent — an absence was logged for this date."}
                      </p>
                    ) : (
                      <div className="flex gap-4">
                        <InspectionFigure notes={notes} uniform={entry.uniform} />
                        <div className="min-w-0 flex-1">
                          {notes.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No notes left on this inspection.</p>
                          ) : (
                            <NumberedNotes notes={notes} />
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}
