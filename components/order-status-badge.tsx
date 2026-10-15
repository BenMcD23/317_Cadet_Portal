import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/order-status"

// "Ready to collect" is the only state that asks the cadet to do something,
// so it's the only solid one; the rest are quiet outlines.
const TONE: Record<OrderStatus["tone"], string> = {
  ready: "bg-primary text-primary-foreground border-transparent",
  waiting: "border-warning/40 bg-warning/10 text-warning",
  done: "border-success/40 bg-success/10 text-success",
  progress: "text-muted-foreground",
}

/** Where an order is up to, as a badge for the order's header row. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs", TONE[status.tone])}>
      {status.label}
    </Badge>
  )
}
