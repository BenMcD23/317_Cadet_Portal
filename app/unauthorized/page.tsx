"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ShieldX } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldX />
          </EmptyMedia>
          <EmptyTitle>Access denied</EmptyTitle>
          <EmptyDescription>
            Your account does not have access to the 317 Cadet Portal. You must sign in with a
            @317atc.co.uk account.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out and try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
