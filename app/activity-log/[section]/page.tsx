"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, ChevronRight, History, NotebookPen, PartyPopper } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { SectionHeading } from "@/components/section-heading"
import { ErrorAlert } from "@/components/error-alert"
import { EmptyState } from "@/components/empty-state"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/responsive-dialog"
import { EntryDialog } from "@/components/activity-log/entry-dialog"
import { EntryForm, draftRows } from "@/components/activity-log/entry-form"
import { SetupForm } from "@/components/activity-log/setup-form"
import { WeekStrip } from "@/components/activity-log/week-strip"
import {
  SECTION_INFO,
  WEEKLY_MINUTES,
  dayLabel,
  formatMinutes,
  isSection,
  useActivityLog,
  type ActivityLog,
  type Entry,
  type SectionKey,
  type SectionLog,
} from "@/lib/activity-log"
import { formatDate } from "@/lib/format"

/** What to tell the cadet after saving, so they know whether they're done. */
function savedMessage(log: SectionLog | null | undefined, count: number): string {
  if (!log) return "Saved."
  if (log.complete) return "That's this section finished! Staff have been sent your log."
  const saved = count > 1 ? `Saved ${count} days.` : "Saved."
  if (log.this_week_minutes >= WEEKLY_MINUTES) return `${saved} This week is done.`
  return `${saved} ${WEEKLY_MINUTES - log.this_week_minutes} more minutes to do this week.`
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
      <Link href="/activity-log">
        <ArrowLeft />
        All sections
      </Link>
    </Button>
  )
}

export default function ActivityLogSectionPage() {
  const params = useParams<{ section?: string }>()
  const section = params?.section
  const { data, error, isPending } = useActivityLog()

  if (!isSection(section)) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-16">
        <BackLink />
        <EmptyState icon={NotebookPen} title="There's no section called that" />
      </div>
    )
  }

  const info = SECTION_INFO[section]
  const log = data?.sections.find((s) => s.section === section)?.log ?? null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-16">
      <BackLink />
      <PageHeader title={info.label} description={log?.activity ?? info.hint} className="-mt-4" />

      {isPending && <Skeleton className="h-72" />}
      <ErrorAlert message={error?.message} />

      {data && !data.enabled && (
        <EmptyState
          icon={NotebookPen}
          title="Your DofE activity log isn't switched on"
          description="Speak to a member of staff."
        />
      )}

      {data?.enabled && !log && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            title="Set up your section"
            description="Tell us what you're doing. You can change any of this later."
          />
          <SetupForm section={section} onSaved={() => {}} />
        </section>
      )}

      {data?.enabled && log && <SectionLogView key={section} section={section} log={log} />}
    </div>
  )
}

function SectionLogView({ section, log }: { section: SectionKey; log: SectionLog }) {
  const lastWhat = log.entries[0]?.description ?? ""
  // Remounting the form with a new key is how "Catch up" refills it and how a
  // save clears it back to a single fresh day.
  const [form, setForm] = useState({ key: 0, rows: draftRows(lastWhat) })
  const [saved, setSaved] = useState<string | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [changing, setChanging] = useState(false)

  const onSaved = (updated: ActivityLog, count: number) => {
    const next = updated.sections.find((s) => s.section === section)?.log
    setSaved(savedMessage(next, count))
    setForm((f) => ({ key: f.key + 1, rows: draftRows(next?.entries[0]?.description ?? lastWhat) }))
  }

  const catchUp = () => {
    setSaved(null)
    setForm((f) => ({ key: f.key + 1, rows: draftRows(lastWhat, log.missed, log.start_date) }))
    document.getElementById("add-heading")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const thisWeekLeft = Math.max(0, WEEKLY_MINUTES - log.this_week_minutes)

  return (
    <>
      {log.complete && (
        <Alert className="border-success/40 text-success">
          <PartyPopper />
          <AlertTitle>Section finished</AlertTitle>
          <AlertDescription>
            You&apos;ve done {log.weeks_done} weeks. Staff have been sent your log for your assessor to sign.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="progress-heading" className="flex flex-col gap-4">
        <h2 id="progress-heading" className="sr-only">
          Your progress
        </h2>
        <div className="grid grid-cols-2 divide-x rounded-lg border">
          <div className="flex flex-col gap-1 p-4">
            <span className="text-muted-foreground text-sm">This week</span>
            <span className="text-xl font-semibold">{formatMinutes(log.this_week_minutes)}</span>
            <span className="text-muted-foreground text-xs">
              {!log.started
                ? `Starts ${formatDate(log.start_date)}`
                : thisWeekLeft
                  ? `${thisWeekLeft} min to go`
                  : "Done for this week"}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-4">
            <span className="text-muted-foreground text-sm">Weeks done</span>
            <span className="text-xl font-semibold">
              {log.weeks_done} of {log.weeks_needed}
            </span>
            <span className="text-muted-foreground text-xs">Ends {formatDate(log.end_date)}</span>
          </div>
        </div>
        <WeekStrip log={log} />
      </section>

      {log.missed.length > 0 && !log.complete && (
        <Alert className="border-warning/40">
          <History className="text-warning" />
          <AlertTitle>
            You missed {log.missed.length} {log.missed.length === 1 ? "week" : "weeks"}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>No problem. If you did your activity those weeks, add them now.</span>
            <Button type="button" variant="outline" onClick={catchUp} className="h-10 w-fit">
              Catch up {log.missed.length === 1 ? "that week" : `all ${log.missed.length}`}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="add-heading" className="flex flex-col gap-4">
        <SectionHeading title={<span id="add-heading">Add what you did</span>} />
        {saved && (
          <p role="status" className="text-success flex items-center gap-1.5 text-sm font-medium">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            {saved}
          </p>
        )}
        <EntryForm
          key={form.key}
          section={section}
          startDate={log.start_date}
          initialRows={form.rows}
          onSaved={onSaved}
        />
      </section>

      <section aria-labelledby="logged-heading" className="flex flex-col gap-3">
        <SectionHeading
          title={<span id="logged-heading">What you&apos;ve logged</span>}
          description={log.entries.length ? "Tap one to change or remove it." : undefined}
        />
        {log.entries.length ? (
          <ul aria-labelledby="logged-heading" className="bg-card divide-y overflow-hidden rounded-lg border">
            {log.entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setEditing(entry)}
                  className="hover:bg-muted/50 focus-visible:ring-ring/50 flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-sm font-medium">{dayLabel(entry.date)}</span>
                      <span className="text-muted-foreground text-sm">{formatMinutes(entry.minutes)}</span>
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-sm text-pretty">
                      {entry.description}
                    </span>
                  </span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Nothing yet. What you add above shows here.</p>
        )}
      </section>

      <section aria-labelledby="plan-heading" className="flex flex-col gap-3">
        <SectionHeading
          title={<span id="plan-heading">Your plan</span>}
          actions={
            <Button variant="outline" size="sm" onClick={() => setChanging(true)} className="h-9">
              Change
            </Button>
          }
        />
        <dl className="bg-card divide-y rounded-lg border text-sm">
          {[
            ["Activity", log.activity],
            ["Goal", log.goal],
            [
              "Assessor",
              log.assessor_name
                ? [log.assessor_name, log.assessor_role].filter(Boolean).join(", ")
                : "Not added yet. Ask staff who it is.",
            ],
            ["How long", `${log.duration_months} months (${log.weeks_needed} weeks)`],
            ["Dates", `${formatDate(log.start_date)} to ${formatDate(log.end_date)}`],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
              <dt className="text-muted-foreground sm:w-24 sm:shrink-0">{label}</dt>
              <dd className="text-pretty">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <EntryDialog
        section={section}
        startDate={log.start_date}
        entry={editing}
        onClose={() => setEditing(null)}
      />

      <ResponsiveDialog open={changing} onOpenChange={setChanging}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Change your plan</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Changed your mind? Update it here. What you&apos;ve logged stays.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="pb-2">
            {changing && (
              <SetupForm
                section={section}
                log={log}
                onSaved={() => setChanging(false)}
                onCancel={() => setChanging(false)}
              />
            )}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  )
}
