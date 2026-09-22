"use client"

import { AlertTriangle, CircleCheck, Clock } from "lucide-react"

import { type BadgeQualStatus, qualStatusLabel } from "@/lib/badge-quals"
import { cn } from "@/lib/utils"

function StatusIcon({ status, className }: { status: BadgeQualStatus["status"]; className?: string }) {
  if (status === "held") return <CircleCheck className={className} />
  if (status === "expired") return <Clock className={className} />
  return <AlertTriangle className={className} />
}

/**
 * The API's verdict on whether SMS backs up the badge being ordered.
 *
 * Renders nothing for a status of "unknown" or a check that hasn't loaded —
 * the form must look the same as it always did when we simply couldn't check,
 * rather than implying something is wrong.
 */
export function BadgeQualNotice({
  check,
  className,
}: {
  check: BadgeQualStatus | undefined
  className?: string
}) {
  if (!check || check.status === "unknown") return null

  const held = check.status === "held"

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
        held
          ? "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
          : "border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
        className
      )}
    >
      <StatusIcon status={check.status} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-medium">{qualStatusLabel(check.status)}</span> — {check.reason}
      </span>
    </div>
  )
}
