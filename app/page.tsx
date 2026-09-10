"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { useReference } from "@/lib/reference"
import { formatDate } from "@/lib/format"
import { Shirt, Award, ClipboardList, ArrowRight, MessageSquare } from "lucide-react"

const QUICK_LINKS = [
  {
    href: "/uniform-order",
    icon: Shirt,
    title: "Uniform Order",
    desc: "Request new uniform items or replacements.",
  },
  {
    href: "/badge-order",
    icon: Award,
    title: "Badge Order",
    desc: "Order proficiency badges you have qualified for.",
  },
  {
    href: "/my-orders",
    icon: ClipboardList,
    title: "My Orders",
    desc: "View and manage your submitted orders.",
  },
]

type Issuance = {
  id: number
  itemCategory: string
  lastGiven: string
  sizeGiven: string | null
}

export default function HomePage() {
  const { data: session } = useSession()
  const { issuanceCategories } = useReference()
  const [issuances, setIssuances] = useState<Issuance[] | null>(null)
  const [loading, setLoading] = useState(true)
  // Only ever true for a cadet with no number saved — staff and adults have no
  // /cadets/me record, so they never see the prompt.
  const [needsPhone, setNeedsPhone] = useState(false)

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : "Dashboard"}
        description="Order uniform and badges, and see what you've been issued"
      />

      {needsPhone && (
        <Link href="/my-details" className="group">
          <Card className="border-primary/40 group-hover:border-primary gap-2 py-4 transition-colors">
            <CardContent className="flex items-center gap-3">
              <MessageSquare className="text-muted-foreground size-4 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Add your mobile number</p>
                <p className="text-muted-foreground text-xs">
                  You&apos;re not getting the parade night texts yet — add a number in My Details.
                </p>
              </div>
              <ArrowRight className="text-muted-foreground ml-auto size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="group">
            <Card className="group-hover:border-primary/40 h-full gap-2 py-5 transition-colors">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <Icon className="text-muted-foreground size-4" />
                  <ArrowRight className="text-muted-foreground/0 group-hover:text-muted-foreground size-3.5 transition-all group-hover:translate-x-0.5" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground text-xs">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {loading && <Skeleton className="h-72" />}

      {!loading && issuances !== null && (
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shirt className="text-muted-foreground size-4" />
              Uniform issued to you
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {issuanceCategories.map((category) => {
                const record = issuances.find((i) => i.itemCategory === category)
                return (
                  <div key={category} className="flex items-center justify-between gap-4 px-6 py-3">
                    <span className="text-sm font-medium">{category}</span>
                    {record ? (
                      <div className="text-right">
                        <p className="text-muted-foreground text-sm">{formatDate(record.lastGiven)}</p>
                        {record.sizeGiven && (
                          <p className="text-muted-foreground text-xs">Size: {record.sizeGiven}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not issued</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
