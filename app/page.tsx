"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { Shirt, Award, ClipboardList, ArrowRight } from "lucide-react"

const ISSUANCE_CATEGORIES = [
  "Beret",
  "Wedgewood Shirt",
  "Working Blue Shirt",
  "Jumper",
  "Slacks/Trousers",
  "Skirt",
  "Tie",
  "Brassard",
  "Belt",
]

const QUICK_LINKS = [
  { href: "/uniform-order", icon: Shirt, title: "Uniform Order", desc: "Request new uniform items or replacements." },
  { href: "/badge-order", icon: Award, title: "Badge Order", desc: "Order proficiency badges you have qualified for." },
  { href: "/my-orders", icon: ClipboardList, title: "My Orders", desc: "View and manage your submitted orders." },
]

type Issuance = {
  id: number
  itemCategory: string
  lastGiven: string
  sizeGiven: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function HomePage() {
  const { data: session } = useSession()
  const [issuances, setIssuances] = useState<Issuance[] | null>(null)
  const [loading, setLoading] = useState(true)

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

      <div className="grid gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full gap-2 py-5 transition-colors group-hover:border-primary/40">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <Icon className="size-4 text-muted-foreground" />
                  <ArrowRight className="size-3.5 text-muted-foreground/0 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
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
              <Shirt className="size-4 text-muted-foreground" />
              Uniform issued to you
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {ISSUANCE_CATEGORIES.map((category) => {
                const record = issuances.find((i) => i.itemCategory === category)
                return (
                  <div key={category} className="flex items-center justify-between gap-4 px-6 py-3">
                    <span className="text-sm font-medium">{category}</span>
                    {record ? (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{formatDate(record.lastGiven)}</p>
                        {record.sizeGiven && (
                          <p className="text-xs text-muted-foreground">Size: {record.sizeGiven}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not issued</span>
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
