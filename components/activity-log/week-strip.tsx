import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatMinutes, weekLabel, type SectionLog } from "@/lib/activity-log"

/**
 * Every week of a section as a numbered square: done, missed, this week, or
 * still to come. The gaps a cadet needs to fill are visible at a glance, and
 * each square says its state in words for a screen reader and in its shape
 * (tick, dashed outline) as well as its colour.
 */
export function WeekStrip({ log }: { log: SectionLog }) {
  const total = Math.max(log.weeks_needed, log.weeks.length)
  const current = log.weeks.length - 1
  return (
    <div className="flex flex-col gap-2">
      <ol aria-label="Your weeks" className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const week = log.weeks[i]
          const isNow = i === current
          const state = !week ? "to come" : week.done ? "done" : isNow ? "this week" : "missed"
          const label = week
            ? `Week ${i + 1}, ${weekLabel(week.week_start).toLowerCase()}: ${state}` +
              (week.minutes ? `, ${formatMinutes(week.minutes)}` : "")
            : `Week ${i + 1}: still to come`
          return (
            <li
              key={i}
              aria-label={label}
              title={label}
              className={cn(
                "flex size-8 items-center justify-center rounded-md border text-xs tabular-nums",
                state === "done" && "bg-primary text-primary-foreground border-transparent",
                state === "missed" && "border-warning text-warning border-dashed",
                state === "this week" && "border-primary text-foreground border-2 font-semibold",
                state === "to come" && "text-muted-foreground/60 border-border/60"
              )}
            >
              {state === "done" ? <Check className="size-4" aria-hidden /> : i + 1}
            </li>
          )
        })}
      </ol>
      <p className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <Check className="size-3" aria-hidden /> done
        </span>
        <span>dashed: missed, catch up</span>
        <span>bold: this week</span>
      </p>
    </div>
  )
}
