"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { SectionHeading } from "@/components/section-heading"
import { ActionList, type ActionLink } from "@/components/action-list"
import { useReference } from "@/lib/reference"
import { formatDate } from "@/lib/format"
import { SECTION_INFO, sectionsDueThisWeek, type SectionKey } from "@/lib/activity-log"
import { Shirt, Award, ClipboardList, ChevronRight, MessageSquare, NotebookPen } from "lucide-react"

const QUICK_LINKS: ActionLink[] = [
  {
    href: "/uniform-order",
    icon: Shirt,
    title: "Order Uniform",
    desc: "New items, or a bigger size when something no longer fits.",
  },
  {
    href: "/badge-order",
    icon: Award,
    title: "Order Badges",
    desc: "Proficiency badges you've qualified for.",
  },
  {
    href: "/my-orders",
    icon: ClipboardList,
    title: "My Orders",
    desc: "See where your orders are up to and when they're ready.",
  },
]

type Issuance = {
  id: number
  itemCategory: string
  lastGiven: string
  sizeGiven: string | null
}

/** "Skills", "Skills and Physical", "Skills, Volunteering and Physical". */
function listSections(keys: SectionKey[]): string {
  const names = keys.map((k) => SECTION_INFO[k].label)
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0]
}

export default function HomePage() {
  const { data: session } = useSession()
  const { issuanceCategories } = useReference()
  const [issuances, setIssuances] = useState<Issuance[] | null>(null)
  const [loading, setLoading] = useState(true)
  // Only ever true for a cadet with no number saved — staff and adults have no
  // /cadets/me record, so they never see the prompt.
  const [needsPhone, setNeedsPhone] = useState(false)
  // DofE sections still under an hour this week. Empty for anyone staff
  // haven't switched on, so the reminder only reaches cadets doing it.
  const [dofeDue, setDofeDue] = useState<SectionKey[]>([])

  useEffect(() => {
    async function loadActivityLog() {
      try {
        const res = await fetch("/api/cadet/activity-log")
        if (!res.ok) return
        setDofeDue(sectionsDueThisWeek(await res.json()))
      } catch {
        // A reminder isn't worth an error banner.
      }
    }
    loadActivityLog()
  }, [])

  useEffect(() => {
    async function loadPhone() {
      try {
        const res = await fetch("/api/cadet/me")
        if (!res.ok) return
        const me = await res.json()
        setNeedsPhone(!me.phone_number)
      } catch {
        // A dashboard prompt isn't worth an error banner.
      }
    }
    loadPhone()
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const cadetRes = await fetch("/api/cadet/issuances").catch(() => null)
        if (cadetRes?.ok) {
          const data = await cadetRes.json()
          setIssuances(Array.isArray(data) ? data : null)
          return
        }
        const userRes = await fetch("/api/user/issuances").catch(() => null)
        if (userRes?.ok) {
          const data = await userRes.json()
          setIssuances(Array.isArray(data) ? data : null)
        } else {
          setIssuances(null)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const firstName = session?.user?.name?.split(" ")[0]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-16">
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : "Dashboard"}
        description="Order uniform and badges, and see what you've been issued"
      />

      {needsPhone && (
        <Link
          href="/my-details"
          className="group border-primary/40 bg-primary/5 hover:border-primary focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg border px-4 py-3 outline-none focus-visible:ring-2"
        >
          <MessageSquare className="text-primary size-5 shrink-0" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">Add your mobile number</span>
            <span className="text-muted-foreground text-xs text-pretty">
              You&apos;re not getting the parade night texts yet. Add a number in My Details.
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </Link>
      )}

      {dofeDue.length > 0 && (
        <Link
          href="/activity-log"
          className="group border-primary/40 bg-primary/5 hover:border-primary focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg border px-4 py-3 outline-none focus-visible:ring-2"
        >
          <NotebookPen className="text-primary size-5 shrink-0" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">Log this week&apos;s DofE</span>
            <span className="text-muted-foreground text-xs text-pretty">
              {listSections(dofeDue)} {dofeDue.length === 1 ? "still needs" : "still need"} an hour this week.
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </Link>
      )}

      <ActionList links={QUICK_LINKS} />

      {loading && <Skeleton className="h-72" />}

      {!loading && issuances !== null && (
        <section className="flex flex-col gap-3">
          <SectionHeading
            title={<span id="issued-heading">Uniform issued to you</span>}
            description="The last size you were given of each item, so you know what to order."
          />
          <ul aria-labelledby="issued-heading" className="bg-card divide-y overflow-hidden rounded-lg border">
            {issuanceCategories.map((category) => {
              const record = issuances.find((i) => i.itemCategory === category)
              return (
                <li key={category} className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <span className="text-sm">{category}</span>
                  {record ? (
                    <span className="flex flex-col items-end gap-0.5 text-right">
                      <span className="text-sm font-medium">{record.sizeGiven ?? "Issued"}</span>
                      <span className="text-muted-foreground text-xs">{formatDate(record.lastGiven)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Not issued</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
