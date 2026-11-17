import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { BadgeOrder, Order } from "@/app/my-orders/types"
import { useCadetMe } from "@/lib/cadet-me"

/**
 * The signed-in person's own orders: a cadet's uniform and badge orders, or
 * an adult's own uniform orders (adults have no badge orders). Home shows the
 * open ones and My Orders shows them all, from this one cached query, so
 * tapping through from Home is instant.
 *
 * Which list depends on the cadet record, and only a definite "not a cadet"
 * (null from useCadetMe) reads the adult one: the API being down mustn't
 * quietly swap a cadet onto the adult list and show them nothing.
 */
export type MyOrders = { uniform: Order[]; badge: BadgeOrder[] }
const NO_ORDERS: MyOrders = { uniform: [], badge: [] }

async function fetchMyOrders(isCadet: boolean): Promise<MyOrders> {
  const [uRes, bRes] = await Promise.all([
    fetch(isCadet ? "/api/cadet/orders" : "/api/user/orders"),
    isCadet ? fetch("/api/cadet/badge-orders") : Promise.resolve(new Response("[]")),
  ])
  if (!uRes.ok) throw new Error("Failed to load uniform orders")
  const uniform = await uRes.json()
  const badge = bRes.ok ? await bRes.json() : []
  return { uniform: Array.isArray(uniform) ? uniform : [], badge: Array.isArray(badge) ? badge : [] }
}

export function useMyOrders() {
  const client = useQueryClient()
  const me = useCadetMe()
  const isCadet = me.data === undefined ? undefined : me.data !== null
  const key = ["my-orders", isCadet ? "cadet" : "adult"] as const
  const orders = useQuery({
    queryKey: key,
    queryFn: () => fetchMyOrders(!!isCadet),
    enabled: isCadet !== undefined,
  })
  const { uniform, badge } = orders.data ?? NO_ORDERS
  return {
    uniform,
    badge,
    loading: !me.error && (me.isPending || orders.isPending),
    error: me.error ? "Failed to load your orders" : (orders.error?.message ?? null),
    /** Saves answer with the updated order, which goes straight into the cache. */
    setUniform: (update: (prev: Order[]) => Order[]) =>
      client.setQueryData<MyOrders>(key, (prev) => prev && { ...prev, uniform: update(prev.uniform) }),
    setBadge: (update: (prev: BadgeOrder[]) => BadgeOrder[]) =>
      client.setQueryData<MyOrders>(key, (prev) => prev && { ...prev, badge: update(prev.badge) }),
  }
}
