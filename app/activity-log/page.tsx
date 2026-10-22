"use client"

import Link from "next/link"
import { ChevronRight, NotebookPen, UserRound } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { ErrorAlert } from "@/components/error-alert"
import { EmptyState } from "@/components/empty-state"
import { SectionStatusBadge } from "@/components/activity-log/section-status-badge"
import { SECTION_INFO, sectionStatus, useActivityLog } from "@/lib/activity-log"
import { formatDate } from "@/lib/format"

/**
 * The three DofE sections as three big rows: tap one to log it. No tabs or
 * menus to learn, and each row says what to do this week before it's opened.
 */
export default function ActivityLogPage() {
  const { data, error, isPending } = useActivityLog()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-16">
      <PageHeader
        title="DofE Activity Log"
        description={
          data?.enabled
            ? `Your ${data.level} DofE. Do at least 1 hour a week for each section, then add it here.`
            : "Log your DofE activities each week"
        }
      />

      {isPending && <Skeleton className="h-56" />}

      {error?.status === 404 ? (
        <EmptyState
          icon={UserRound}
          title="DofE activity logs are for cadets"
          description="Your account isn't linked to a cadet record."
        />
      ) : (
        <ErrorAlert message={error?.message} />
      )}

      {data && !data.enabled && (
        <EmptyState
          icon={NotebookPen}
          title="Your DofE activity log isn't switched on"
          description="Staff switch it on when you start your Duke of Edinburgh's Award. Speak to them if you think it should be on."
        />
      )}

      {data?.enabled && (
        <ul aria-label="Your sections" className="bg-card divide-y overflow-hidden rounded-lg border">
          {data.sections.map(({ section, log }) => {
            const { label, icon: Icon } = SECTION_INFO[section]
            const status = sectionStatus(log, (iso) => formatDate(iso))
            return (
              <li key={section}>
                <Link
                  href={`/activity-log/${section}`}
                  className="hover:bg-muted/50 focus-visible:ring-ring/50 flex min-h-16 items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
                >
                  <Icon className="text-primary size-6 shrink-0" aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{label}</span>
                      <SectionStatusBadge status={status} />
                    </span>
                    <span className="text-muted-foreground text-sm text-pretty">
                      {log ? `${log.activity}. ${status.detail}` : status.detail}
                    </span>
                  </span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
