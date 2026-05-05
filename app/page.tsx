"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shirt, Award } from "lucide-react"

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

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shirt className="h-6 w-6 text-primary" />
              <CardTitle>Uniform Order</CardTitle>
            </div>
            <CardDescription>
              Request new uniform items or replacements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Form coming soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <CardTitle>Badge Order</CardTitle>
            </div>
            <CardDescription>
              Order proficiency badges you have qualified for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Form coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
