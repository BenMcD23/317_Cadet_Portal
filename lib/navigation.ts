import type { LucideIcon } from "lucide-react"
import { ClipboardList, House, UserRound } from "lucide-react"

/**
 * The site map behind the sidebar, the phone's bottom bar, the header title
 * and the tab row at the top of a page. One definition so they agree.
 *
 * There are three places: Home, Orders and Me. Orders and Me each span a few
 * pages, listed as `tabs`; the tab row under each page's title moves between
 * them, so ordering and checking an order are one tap apart instead of three
 * sidebar rows. It's the same shape as the SMS site's areas.
 */
export type NavTab = {
  label: string
  href: string
  /** Only listed once staff have switched this on for the cadet. */
  onlyIf?: "activityLog"
}

export type NavLink = {
  label: string
  /** Where the sidebar row and the bottom-bar tab go: the area's first page. */
  href: string
  icon: LucideIcon
  tabs?: NavTab[]
}

export type NavSection = { label?: string; links: NavLink[] }

export const NAV_SECTIONS: NavSection[] = [
  {
    links: [
      { label: "Home", href: "/", icon: House },
      {
        label: "Orders",
        href: "/my-orders",
        icon: ClipboardList,
        tabs: [
          { label: "My orders", href: "/my-orders" },
          { label: "Order uniform", href: "/uniform-order" },
          { label: "Order badges", href: "/badge-order" },
        ],
      },
      {
        label: "Me",
        href: "/my-details",
        icon: UserRound,
        tabs: [
          { label: "Details", href: "/my-details" },
          { label: "Inspections", href: "/my-inspections" },
          { label: "DofE log", href: "/activity-log", onlyIf: "activityLog" },
          { label: "Documents", href: "/documents" },
        ],
      },
    ],
  },
]

export const NAV_LINKS: NavLink[] = NAV_SECTIONS.flatMap((s) => s.links)

export function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

/** A sidebar row or bottom-bar tab is current on any page of its area. */
export function isNavLinkActive(pathname: string, link: NavLink): boolean {
  return link.tabs ? link.tabs.some((t) => isLinkActive(pathname, t.href)) : isLinkActive(pathname, link.href)
}

/** The area (Orders, Me) a page belongs to, or null for Home and pages outside the map. */
export function areaFor(pathname: string): NavLink | null {
  return NAV_LINKS.find((l) => l.tabs && isNavLinkActive(pathname, l)) ?? null
}

/** The tabs of an area this cadet has: the DofE log only once staff switch it on. */
export function shownTabs(link: NavLink, flags: { activityLog: boolean }): NavTab[] {
  return (link.tabs ?? []).filter((t) => !t.onlyIf || flags[t.onlyIf])
}

/** The header's title: the area's name (Orders, Me), or Home. */
export function pageTitle(pathname: string): string | null {
  return NAV_LINKS.find((l) => isNavLinkActive(pathname, l))?.label ?? null
}
