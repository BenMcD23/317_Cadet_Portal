import type { LucideIcon } from "lucide-react"
import { Award, ClipboardList, FileText, LayoutDashboard, Shirt, UserRound } from "lucide-react"

/** The site map behind the sidebar and the header title. */
export type NavLink = { label: string; href: string; icon: LucideIcon }
export type NavSection = { label?: string; links: NavLink[] }

export const NAV_SECTIONS: NavSection[] = [
  { links: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }] },
  {
    label: "Orders",
    links: [
      { label: "Order Uniform", href: "/uniform-order", icon: Shirt },
      { label: "Order Badges", href: "/badge-order", icon: Award },
      { label: "My Orders", href: "/my-orders", icon: ClipboardList },
    ],
  },
  {
    label: "Me",
    links: [
      { label: "My Details", href: "/my-details", icon: UserRound },
      { label: "Documents", href: "/documents", icon: FileText },
    ],
  },
]

export function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export function pageTitle(pathname: string): string | null {
  for (const section of NAV_SECTIONS) {
    const link = section.links.find((l) => isLinkActive(pathname, l.href))
    if (link) return link.label
  }
  return null
}
