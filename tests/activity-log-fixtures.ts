// A cadet's activity log as the API sends it, for the activity log tests.
// "Today" in these tests is Wednesday 21 Oct 2026; the log started on Monday
// 27 Jul, so this is week 13 of a 12-week (3-month) section.
import type { ActivityLog, SectionLog } from "@/lib/activity-log"

export const TODAY = new Date(2026, 9, 21, 12)

function weeks(done: boolean[]) {
  return done.map((d, i) => {
    const day = new Date(2026, 6, 27 + 7 * i)
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
    return { week_start: iso, minutes: d ? 60 : 0, done: d }
  })
}

export function sectionLog(overrides: Partial<SectionLog> = {}): SectionLog {
  // Ten weeks done; weeks 4 and 9 missed; nothing yet this week.
  const w = weeks([true, true, true, false, true, true, true, true, false, true, true, true, false])
  return {
    id: 1,
    activity: "Helping at the charity shop",
    goal: "Run the till on my own",
    assessor_name: "Sarah Hughes",
    assessor_role: "Shop manager",
    duration_months: 3,
    start_date: "2026-07-27",
    end_date: "2026-10-27",
    completed_at: null,
    entries: [
      {
        id: 7,
        date: "2026-10-14",
        description: "Sorted donations",
        minutes: 60,
        created_at: "2026-10-14T19:00:00",
      },
    ],
    weeks_done: 10,
    weeks_needed: 12,
    complete: false,
    this_week_minutes: 0,
    started: true,
    weeks: w,
    missed: [w[3].week_start, w[8].week_start],
    ...overrides,
  }
}

export function activityLog(
  logs: Partial<Record<"skills" | "volunteering" | "physical", SectionLog | null>> = {},
  enabled = true
): ActivityLog {
  if (!enabled) return { enabled: false, cin: 1, name: "Cpl Cara Cadet", sections: [] }
  return {
    enabled: true,
    cin: 1,
    name: "Cpl Cara Cadet",
    level: "Bronze",
    sections: (["skills", "volunteering", "physical"] as const).map((section) => ({
      section,
      label: section[0].toUpperCase() + section.slice(1),
      log: logs[section] ?? null,
    })),
  }
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}
