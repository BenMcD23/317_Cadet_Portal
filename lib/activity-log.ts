import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { LucideIcon } from "lucide-react"
import { Dumbbell, HandHeart, Lightbulb } from "lucide-react"

/**
 * The cadet's DofE activity log, as the API sends it (`/cadets/me/activity-log`),
 * plus the plain-words helpers its pages share. One query key, so saving on a
 * section page updates the hub, the sidebar link and the dashboard prompt too.
 */

export type SectionKey = "skills" | "volunteering" | "physical"

export type Week = { week_start: string; minutes: number; done: boolean }

export type Entry = { id: number; date: string; description: string; minutes: number; created_at: string }

export type SectionLog = {
  id: number
  activity: string
  goal: string
  assessor_name: string
  assessor_role: string
  duration_months: number
  start_date: string
  end_date: string
  completed_at: string | null
  /** Newest first. */
  entries: Entry[]
  weeks_done: number
  weeks_needed: number
  complete: boolean
  this_week_minutes: number
  started: boolean
  /** Every week from the start to this one. */
  weeks: Week[]
  /** Past weeks still under an hour: what a catch-up fills in. */
  missed: string[]
}

export type ActivityLog = {
  enabled: boolean
  cin: number
  name: string
  level?: string
  sections: { section: SectionKey; label: string; log: SectionLog | null }[]
}

export const WEEKLY_MINUTES = 60
export const DURATIONS = [3, 6, 12, 18] as const

export const SECTION_INFO: Record<SectionKey, { label: string; icon: LucideIcon; hint: string }> = {
  skills: {
    label: "Skills",
    icon: Lightbulb,
    hint: "Learn something new or get better at it, like an instrument, cooking or coding.",
  },
  volunteering: {
    label: "Volunteering",
    icon: HandHeart,
    hint: "Give your time to help other people, your community or the environment.",
  },
  physical: {
    label: "Physical",
    icon: Dumbbell,
    hint: "Get active with a sport, dance or fitness activity.",
  },
}

export function isSection(value: unknown): value is SectionKey {
  return typeof value === "string" && value in SECTION_INFO
}

export const ACTIVITY_LOG_KEY = ["activity-log"]

/** Thrown for a non-OK answer, keeping the status so a page can tell "you're
 *  not a cadet" (404) apart from "the server's broken". */
export class ActivityLogError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

/** FastAPI's `detail` is a string, or a list of validation errors that would
 *  otherwise show as "[object Object]". */
export function errorMessage(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown } | null)?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => (d as { msg?: string })?.msg).filter(Boolean)
    if (msgs.length) return msgs.join(". ")
  }
  return fallback
}

async function fetchActivityLog(): Promise<ActivityLog> {
  const res = await fetch("/api/cadet/activity-log")
  const data = await res.json().catch(() => null)
  if (!res.ok || !data || !Array.isArray(data.sections)) {
    throw new ActivityLogError(errorMessage(data, "Couldn't load your activity log."), res.status)
  }
  return data
}

export function useActivityLog() {
  return useQuery<ActivityLog, ActivityLogError>({
    queryKey: ACTIVITY_LOG_KEY,
    queryFn: fetchActivityLog,
    // A 404 means "not a cadet", which retrying won't change.
    retry: (count, err) => err.status >= 500 && count < 1,
  })
}

/**
 * Sends a change and puts the log the API answers with straight into the
 * cache, so every page showing it is current without a second request.
 * Rejects with the API's own message.
 */
export function useActivityLogSave() {
  const client = useQueryClient()
  return async (path: string, method: string, body?: unknown): Promise<ActivityLog> => {
    let res: Response
    try {
      res = await fetch(`/api/cadet/activity-log/${path}`, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new Error("Couldn't reach the server. Check your signal and try again.")
    }
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || !Array.isArray(data.sections)) {
      throw new Error(errorMessage(data, "That didn't save. Try again."))
    }
    client.setQueryData(ACTIVITY_LOG_KEY, data)
    return data
  }
}

/** Sections that have started, aren't finished, and are under an hour this week. */
export function sectionsDueThisWeek(log: ActivityLog | undefined): SectionKey[] {
  if (!log?.enabled) return []
  return log.sections
    .filter(({ log: s }) => s && s.started && !s.complete && s.this_week_minutes < WEEKLY_MINUTES)
    .map(({ section }) => section)
}

/** "45 min", "1 hour", "1 hr 30 min", "2 hours". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  if (!m) return h === 1 ? "1 hour" : `${h} hours`
  return `${h} hr ${m} min`
}

/** "YYYY-MM-DD" as a local date: `new Date("2026-10-13")` is UTC midnight,
 *  which is the 12th anywhere west of Greenwich. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** "Wed 15 Oct" */
export function dayLabel(iso: string): string {
  return parseDay(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

/** "Week of 13 Oct" */
export function weekLabel(weekStart: string): string {
  return `Week of ${parseDay(weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
}

export type SectionStatus = { label: string; tone: "done" | "todo" | "idle"; detail: string }

/** One line a 12-year-old can act on, for a section's row on the hub. */
export function sectionStatus(log: SectionLog | null, formatDay: (iso: string) => string): SectionStatus {
  if (!log) return { label: "Not set up", tone: "idle", detail: "Tap to choose your activity" }
  const weeks = `${log.weeks_done} of ${log.weeks_needed} weeks done`
  if (log.complete) return { label: "Finished", tone: "done", detail: `${weeks}. Well done!` }
  if (!log.started) return { label: `Starts ${formatDay(log.start_date)}`, tone: "idle", detail: weeks }
  const catchUp = log.missed.length
    ? `. ${log.missed.length} ${log.missed.length === 1 ? "week" : "weeks"} to catch up`
    : ""
  if (log.this_week_minutes >= WEEKLY_MINUTES) {
    return { label: "Done this week", tone: "done", detail: `${weeks}${catchUp}` }
  }
  const left = WEEKLY_MINUTES - log.this_week_minutes
  return {
    label: log.this_week_minutes ? `${left} min to go` : "Not done this week",
    tone: "todo",
    detail: `${weeks}${catchUp}`,
  }
}
