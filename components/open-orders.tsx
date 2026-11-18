"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { OrderStatusBadge } from "@/components/order-status-badge"
import { SectionHeading } from "@317/ui-common/components/section-heading"
import { useMyOrders } from "@/lib/my-orders"
import { itemSummary, orderStatus, type OrderStatus } from "@/lib/order-status"

/** What the cadet does next, in words a 12-year-old gets, for each kind of status. */
const NEXT: Record<OrderStatus["tone"], string> = {
  ready: "Collect it from the stores on parade night.",
  waiting: "Ask an NCO to measure you on parade night.",
  progress: "The stores are sorting it. It'll show here when it's ready.",
  done: "",
}
// Something to collect first, then something to do, then the waiting.
const RANK: Record<OrderStatus["tone"], number> = { ready: 0, waiting: 1, progress: 2, done: 3 }
const SHOWN = 3

type Row = { key: string; what: string; kind: string; status: OrderStatus; ts: number }

/**
 * "Your orders" at the top of Home: each order still open, most urgent first,
 * with where it's up to and what happens next, so a cadet sees "Ready to
 * collect" without opening My Orders. Every row goes to My Orders. Nothing
 * shows when there's nothing open, or if the orders can't be loaded: the My
 * Orders link below is still there.
 */
export function OpenOrders() {
  const { uniform, badge, loading, error } = useMyOrders()
  if (loading || error) return null

  const rows: Row[] = [
    ...uniform.map((o) => ({
      key: `u-${o.id}`,
      what: itemSummary(o.items.filter((i) => !i.givenAt).map((i) => i.itemType)),
      kind: "Uniform",
      status: orderStatus(o),
      ts: Date.parse(o.timestamp),
    })),
    ...badge.map((o) => ({
      key: `b-${o.id}`,
      what: itemSummary(o.items.filter((i) => !i.givenAt).map((i) => i.badgeName)),
      kind: "Badges",
      status: orderStatus(o),
      ts: Date.parse(o.timestamp),
    })),
  ]
    .filter((r) => r.status.tone !== "done")
    .sort((a, b) => RANK[a.status.tone] - RANK[b.status.tone] || b.ts - a.ts)

  if (rows.length === 0) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="open-orders-heading">
      <SectionHeading
        title={<span id="open-orders-heading">Your orders</span>}
        description={`${rows.length} still open`}
      />
      <ul className="bg-card divide-y overflow-hidden rounded-lg border">
        {rows.slice(0, SHOWN).map((r) => (
          <li key={r.key}>
            <Link
              href="/my-orders"
              className="hover:bg-muted/50 focus-visible:ring-ring/50 flex min-h-14 items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{r.what}</span>
                  <OrderStatusBadge status={r.status} />
                </span>
                <span className="text-muted-foreground text-xs text-pretty">
                  {r.kind} · {NEXT[r.status.tone]}
                </span>
              </span>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
        {rows.length > SHOWN && (
          <li>
            <Link
              href="/my-orders"
              className="text-primary hover:bg-muted/50 flex min-h-12 items-center justify-between px-4 py-3 text-sm font-medium"
            >
              See all {rows.length} open orders
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </li>
        )}
      </ul>
    </section>
  )
}
