"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Shirt, Award, ClipboardList } from "lucide-react"

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

  useEffect(() => {
    fetch("/api/cadet/issuances")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setIssuances(Array.isArray(data) ? data : null))
      .catch(() => setIssuances(null))
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome</h1>
        {session?.user && (
          <p className="text-muted-foreground">Hello, {session.user.name}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {QUICK_LINKS.map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href}>
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {issuances !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shirt className="h-4 w-4 text-muted-foreground" />
              Uniform Issuances
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
                      <span className="text-xs text-muted-foreground italic">N/A</span>
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
