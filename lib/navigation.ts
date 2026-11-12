import type { LucideIcon } from "lucide-react"
import {
  Award,
  ClipboardCheck,
  ClipboardList,
  FileText,
  House,
  NotebookPen,
  Shirt,
  UserRound,
} from "lucide-react"

/**
 * The site map behind the sidebar, the phone's bottom bar, the header title
 * and each page's back link. One definition so they agree.
 *
 * Three places: Home, Orders and Me. Orders and Me each have a hub page
 * (`/orders`, `/me`) listing their pages; the bottom bar opens the hub, and
 * each page links back to it on a phone. On a laptop the sidebar lists the
 * pages under their place instead. It's the same shape as the SMS site.
 */
export type NavPage = {
  label: string
  href: string
  icon: LucideIcon
  /** One line for the hub's row: what you do there. */
  desc: string
  /** Only listed once staff have switched this on for the cadet. */
  onlyIf?: "activityLog"
}

export type NavLink = {
  label: string
  /** Home, or the place's hub. */
  href: string
  icon: LucideIcon
  pages?: NavPage[]
}

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/", icon: House },
  {
    label: "Orders",
    href: "/orders",
    icon: ClipboardList,
    pages: [
      {
        label: "My orders",
        href: "/my-orders",
        icon: ClipboardList,
        desc: "What you've ordered and where it's got to.",
      },
      {
        label: "Order uniform",
        href: "/uniform-order",
        icon: Shirt,
        desc: "New items, or a bigger size when something no longer fits.",
      },
      {
        label: "Order badges",
        href: "/badge-order",
        icon: Award,
        desc: "Badges you've qualified for.",
      },
    ],
  },
  {
    label: "Me",
    href: "/me",
    icon: UserRound,
    pages: [
      {
        label: "My details",
        href: "/my-details",
        icon: UserRound,
        desc: "Your phone number for parade night texts.",
      },
      {
        label: "My inspections",
        href: "/my-inspections",
        icon: ClipboardCheck,
        desc: "Your uniform inspection scores and comments.",
      },
      {
        label: "DofE activity log",
        href: "/activity-log",
        icon: NotebookPen,
        desc: "Log your skills, volunteering and physical hours.",
        onlyIf: "activityLog",
      },
      {
        label: "Documents",
        href: "/documents",
        icon: FileText,
        desc: "Kit lists and forms to download.",
      },
    ],
  },
]

export function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

/** A place is current on its hub and on every page in it. */
export function isNavLinkActive(pathname: string, link: NavLink): boolean {
  if (isLinkActive(pathname, link.href)) return true
  return (link.pages ?? []).some((p) => isLinkActive(pathname, p.href))
}

/** The place whose hub a page links back to on a phone. Null on Home, a hub, or a page outside the map. */
export function hubFor(pathname: string): NavLink | null {
  return NAV_LINKS.find((l) => (l.pages ?? []).some((p) => isLinkActive(pathname, p.href))) ?? null
}

/** The pages of a place this cadet has: the DofE log only once staff switch it on. */
export function shownPages(link: NavLink, flags: { activityLog: boolean }): NavPage[] {
  return (link.pages ?? []).filter((p) => !p.onlyIf || flags[p.onlyIf])
}

/** The header's title: the place's name (Orders, Me), or Home. */
export function pageTitle(pathname: string): string | null {
  return NAV_LINKS.find((l) => isNavLinkActive(pathname, l))?.label ?? null
}
