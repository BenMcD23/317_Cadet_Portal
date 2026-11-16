/** "5 Jan 2026", or the fallback when the date is missing. */
export function formatDate(iso: string | null | undefined, fallback = "—"): string {
  if (!iso) return fallback
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/**
 * Today as "YYYY-MM-DD" in the cadet's own time zone, for a date input's value
 * and max. `toISOString()` is UTC, which is still yesterday just after
 * midnight in summer.
 */
export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** "14 Mar 2026, 18:30": when an order or a hand-over happened. */
export function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
