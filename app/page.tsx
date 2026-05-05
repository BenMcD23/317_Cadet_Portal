"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shirt, Award, ClipboardList } from "lucide-react"

const QUICK_LINKS = [
  { href: "/orders/uniform", icon: Shirt, title: "Uniform Order", desc: "Request new uniform items or replacements." },
  { href: "/orders/badges", icon: Award, title: "Badge Order", desc: "Order proficiency badges you have qualified for." },
  { href: "/orders/my-orders", icon: ClipboardList, title: "My Orders", desc: "View and manage your submitted orders." },
]

export default function HomePage() {
  const { data: session } = useSession()

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
    </div>
  )
}
