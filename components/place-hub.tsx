"use client"

import { ActionList } from "@/components/action-list"
import { PageHeader } from "@/components/page-header"
import { useActivityLog } from "@/lib/activity-log"
import { NAV_LINKS, shownPages } from "@/lib/navigation"

/**
 * A place's hub (Orders, Me): its pages as big rows, which the bottom bar
 * opens. Shared by both hubs so they read the same. The DofE log is listed
 * only once staff switch it on; an adult or an API hiccup just leaves it out.
 */
export function PlaceHub({ label, description }: { label: string; description: string }) {
  const place = NAV_LINKS.find((l) => l.label === label)!
  const activityLog = useActivityLog().data?.enabled === true
  const pages = shownPages(place, { activityLog })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-16">
      <PageHeader title={label} description={description} />
      <ActionList links={pages.map((p) => ({ href: p.href, icon: p.icon, title: p.label, desc: p.desc }))} />
    </div>
  )
}
