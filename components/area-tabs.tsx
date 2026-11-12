"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useActivityLog } from "@/lib/activity-log"
import { areaFor, isLinkActive, shownTabs, type NavLink } from "@/lib/navigation"
import { cn } from "@/lib/utils"

/**
 * The tab row of the current page's area (Orders, Me in lib/navigation.ts):
 * real links, so each page keeps its own URL and the back button works.
 * Scrolls sideways on a phone if it has to, with the current tab brought into
 * view. Nothing on a page outside an area, or with only one tab to show.
 */
export function AreaTabs() {
  // Null outside the app router (a component rendered on its own in a test).
  const pathname = usePathname() ?? ""
  const area = areaFor(pathname)
  // Home and pages outside an area ask nothing of the API for a row they don't show.
  return area ? <AreaTabRow area={area} pathname={pathname} /> : null
}

function AreaTabRow({ area, pathname }: { area: NavLink; pathname: string }) {
  // The DofE tab only once staff have switched the log on; an adult or an API
  // hiccup just leaves it out.
  const activityLog = useActivityLog().data?.enabled === true
  const nav = useRef<HTMLElement>(null)

  useEffect(() => {
    const current = nav.current?.querySelector<HTMLElement>('[aria-current="page"]')
    current?.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }, [pathname])

  const tabs = shownTabs(area, { activityLog })
  if (tabs.length < 2) return null

  return (
    <nav ref={nav} aria-label={area.label} className="overflow-x-auto">
      <div className="flex min-w-max gap-1 border-b">
        {tabs.map((tab) => {
          const active = isLinkActive(pathname, tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
