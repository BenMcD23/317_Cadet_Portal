"use client"

import { useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const SENT: Record<string, string> = {
  uniform: "Your uniform order has gone to stores.",
  badge: "Your badge order has gone to stores.",
}

/**
 * Straight after an order is sent (the order pages come here with `?sent=`):
 * says it went and where to watch it, instead of dropping the cadet on a list
 * with no sign anything happened.
 */
export function OrderSentNotice() {
  const sent = SENT[useSearchParams()?.get("sent") ?? ""]
  if (!sent) return null
  return (
    <Alert role="status">
      <CheckCircle2 className="text-success" />
      <AlertTitle>{sent}</AlertTitle>
      <AlertDescription>
        It&apos;s under Active below, and its status changes here as stores get it ready. You can change or
        cancel it there until it&apos;s handed out.
      </AlertDescription>
    </Alert>
  )
}
