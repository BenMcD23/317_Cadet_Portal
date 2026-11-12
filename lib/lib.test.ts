import fs from "node:fs"
import path from "node:path"

import { describe, expect, it, vi } from "vitest"

import { formatDate } from "@/lib/format"
import {
  areaFor,
  isLinkActive,
  isNavLinkActive,
  NAV_LINKS,
  NAV_SECTIONS,
  pageTitle,
  shownTabs,
} from "@/lib/navigation"
import { buildBadgeName, gainedWhereLabel, needsGainedWhere, type BadgeCategory } from "@/lib/reference"
import { cn } from "@/lib/utils"

describe("formatDate", () => {
  it("formats British style with a fallback for missing dates", () => {
    expect(formatDate("2026-01-05")).toBe("5 Jan 2026")
    expect(formatDate(null)).toBe("—")
    expect(formatDate(undefined, "Never")).toBe("Never")
    expect(formatDate("")).toBe("—")
  })
})

describe("config", () => {
  it("defaults to localhost and the squadron's domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "")
    vi.stubEnv("NEXT_PUBLIC_ALLOWED_DOMAIN", "")
    vi.resetModules()
    const config = await import("@/lib/config")
    expect(config.API_BASE).toBe("http://localhost:8000")
    expect(config.ALLOWED_DOMAIN).toBe("317atc.co.uk")
  })

  // One preview image runs in many cluster stacks, each with its own API.
  it("API_INTERNAL_BASE, read at runtime, wins over the build-time address", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "https://smsapi.317atc.co.uk")
    vi.stubEnv("API_INTERNAL_BASE", "http://api:8000")
    vi.resetModules()
    expect((await import("@/lib/config")).API_BASE).toBe("http://api:8000")
  })
})

describe("navigation", () => {
  const links = NAV_SECTIONS.flatMap((s) => s.links)

  it.each(links.map((l) => [l.href]))("%s is a real page", (href) => {
    const page = path.join(process.cwd(), "app", href, "page.tsx")
    expect(fs.existsSync(page), `${page} missing — the sidebar would 404`).toBe(true)
  })

  it("lists every page once", () => {
    expect(new Set(links.map((l) => l.href)).size).toBe(links.length)
  })

  it("matches whole path segments and treats / as exact", () => {
    expect(isLinkActive("/", "/")).toBe(true)
    expect(isLinkActive("/my-orders", "/")).toBe(false)
    expect(isLinkActive("/my-orders/3", "/my-orders")).toBe(true)
    expect(isLinkActive("/my-ordersX", "/my-orders")).toBe(false)
  })

  it("titles each page from its place in the nav, and nothing for unknown paths", () => {
    expect(pageTitle("/")).toBe("Home")
    expect(pageTitle("/badge-order")).toBe("Orders")
    expect(pageTitle("/my-inspections")).toBe("Me")
    expect(pageTitle("/activity-log/skills")).toBe("Me")
    expect(pageTitle("/nowhere")).toBeNull()
  })

  it("has three places, two of them areas whose row opens their first page", () => {
    expect(NAV_LINKS.map((l) => l.label)).toEqual(["Home", "Orders", "Me"])
    for (const link of NAV_LINKS.filter((l) => l.tabs)) expect(link.href).toBe(link.tabs![0].href)
  })

  it("puts ordering beside the orders, and lights the area on each of its pages", () => {
    expect(areaFor("/uniform-order")?.label).toBe("Orders")
    expect(areaFor("/my-orders")?.label).toBe("Orders")
    expect(areaFor("/activity-log/physical")?.label).toBe("Me")
    expect(areaFor("/")).toBeNull()
    const orders = NAV_LINKS.find((l) => l.label === "Orders")!
    expect(isNavLinkActive("/badge-order", orders)).toBe(true)
    expect(isNavLinkActive("/my-details", orders)).toBe(false)
  })

  it("shows the DofE tab only once staff have switched the log on", () => {
    const me = NAV_LINKS.find((l) => l.label === "Me")!
    expect(shownTabs(me, { activityLog: false }).map((t) => t.label)).toEqual([
      "Details",
      "Inspections",
      "Documents",
    ])
    expect(shownTabs(me, { activityLog: true }).map((t) => t.label)).toContain("DofE log")
  })
})

describe("badge names", () => {
  const core: BadgeCategory = { id: "core", name: "Core", items: ["Squadron"] }
  const levelled: BadgeCategory = { id: "lead", name: "Leadership", prefix: "Leadership", levels: ["Blue"] }
  const sub: BadgeCategory = { id: "music", name: "Music", subTypes: ["Drums"], levels: ["Gold"] }

  it("builds each kind of name, and null until the choice is complete", () => {
    expect(buildBadgeName(core, "Squadron", null)).toBe("Squadron")
    expect(buildBadgeName(levelled, null, "Blue")).toBe("Leadership – Blue")
    expect(buildBadgeName(sub, "Drums", "Gold")).toBe("Drums – Gold")
    expect(buildBadgeName(core, null, null)).toBeNull()
    expect(buildBadgeName(levelled, null, null)).toBeNull()
    expect(buildBadgeName(sub, "Drums", null)).toBeNull()
    expect(buildBadgeName({ id: "x", name: "X" }, "a", "b")).toBeNull()
  })

  it("gained-where label and when it's asked for", () => {
    const options = [{ value: "camp", label: "Camp" }]
    expect(gainedWhereLabel(options, "camp")).toBe("Camp")
    expect(gainedWhereLabel(options, "elsewhere")).toBeNull()
    expect(needsGainedWhere(new Set(["core"]), "lead", false)).toBe(true)
    expect(needsGainedWhere(new Set(["core"]), "lead", true)).toBe(false)
    expect(needsGainedWhere(new Set(["core"]), "core", false)).toBe(false)
    expect(needsGainedWhere(new Set(["core"]), null, false)).toBe(true)
  })
})

describe("cn", () => {
  it("merges conflicting tailwind classes, last wins", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4")
  })
})
