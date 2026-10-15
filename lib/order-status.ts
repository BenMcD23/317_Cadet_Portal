/**
 * What a cadet needs to know about an order without opening it: where it's
 * up to, and what's in it. Shared by the uniform and badge orders on My
 * Orders so both say it the same way.
 */

export type OrderStatusTone = "ready" | "waiting" | "done" | "progress"

export type OrderStatus = { label: string; tone: OrderStatusTone }

type StatusItem = {
  givenAt: string | null
  readyToCollect?: string | null
  needSizing?: boolean
}

/**
 * The single most useful thing to say, most actionable first: something to
 * collect beats something to be measured for, which beats "in progress".
 */
export function orderStatus(order: { completed: boolean; items: StatusItem[] }): OrderStatus {
  const waiting = order.items.filter((i) => !i.givenAt)
  if (order.completed || (order.items.length > 0 && waiting.length === 0)) {
    return { label: "All issued", tone: "done" }
  }
  const ready = waiting.filter((i) => i.readyToCollect).length
  if (ready > 0) {
    return {
      label: ready === waiting.length ? "Ready to collect" : `${ready} ready to collect`,
      tone: "ready",
    }
  }
  if (waiting.some((i) => i.needSizing)) return { label: "Needs sizing", tone: "waiting" }
  return { label: "With the stores", tone: "progress" }
}

/** "Beret, Belt and Jumper", or "Beret, Belt and 3 more" once it gets long. */
export function itemSummary(names: string[], shown = 2): string {
  if (names.length === 0) return "No items"
  if (names.length <= shown + 1) {
    return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
  }
  return `${names.slice(0, shown).join(", ")} and ${names.length - shown} more`
}
