import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type ActionLink = { href: string; icon: LucideIcon; title: string; desc: string }

/**
 * A short list of places to go, as one framed list of full-width rows — the
 * settings-list pattern every phone uses. Each row is at least 56px tall so
 * it's an easy thumb target, and the chevron is always visible (a hover-only
 * arrow never shows on a phone).
 */
export function ActionList({ links, className }: { links: ActionLink[]; className?: string }) {
  return (
    <ul className={cn("bg-card divide-y overflow-hidden rounded-lg border", className)}>
      {links.map(({ href, icon: Icon, title, desc }) => (
        <li key={href}>
          <Link
            href={href}
            className="hover:bg-muted/50 focus-visible:ring-ring/50 flex min-h-14 items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
          >
            <Icon className="text-primary size-5 shrink-0" aria-hidden />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{title}</span>
              <span className="text-muted-foreground text-xs text-pretty">{desc}</span>
            </span>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}
