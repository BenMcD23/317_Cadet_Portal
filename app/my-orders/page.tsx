"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderDisclosure, OrderList } from "@/components/order-disclosure"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { itemSummary, orderStatus } from "@/lib/order-status"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ErrorAlert } from "@/components/error-alert"
import { Plus, Trash2, PackageCheck, Pencil, X, Shirt, Award, ClipboardList } from "lucide-react"
import { OrderSentNotice } from "@/components/order-sent-notice"
import { useReference } from "@/lib/reference"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/responsive-dialog"
import { SectionHeading } from "@/components/section-heading"
import { formatTimestamp } from "@/lib/format"
import { useCadetMe } from "@/lib/cadet-me"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AddBadgeRow, type GainedWhereState, gainedWhereSummary } from "./components/badge-fields"
import { AddItemRow, SizingDetailsDisplay, SizingEditor } from "./components/sizing"
import { type BadgeItem, type BadgeOrder, type DraftItem, type Order } from "./types"

// ─── Page ─────────────────────────────────────────────────────────────────────

type MyOrders = { uniform: Order[]; badge: BadgeOrder[] }
const NO_ORDERS: MyOrders = { uniform: [], badge: [] }

/**
 * A cadet's own uniform and badge orders, or an adult's own uniform orders
 * (adults have no badge orders). Which list depends on the cadet record, and
 * only a definite "not a cadet" (null) reads the adult one.
 */
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

type Entry =
  | { key: string; ts: number; kind: "uniform"; order: Order }
  | { key: string; ts: number; kind: "badge"; order: BadgeOrder }

export default function MyOrdersPage() {
  const { itemTypes, gainedWhereOptions } = useReference()
  const client = useQueryClient()
  // The cadet record is shared with Home and My Details, so it's usually cached.
  // 404 is the only answer that means "not a cadet"; anything else (the API
  // being down, say) must not quietly swap a cadet onto the adult order list
  // and show them nothing.
  const me = useCadetMe()
  const isCadet = me.data === undefined ? undefined : me.data !== null
  const ordersKey = ["my-orders", isCadet ? "cadet" : "adult"] as const
  const orders = useQuery({
    queryKey: ordersKey,
    queryFn: () => fetchMyOrders(!!isCadet),
    enabled: isCadet !== undefined,
  })
  const { uniform: uniformOrders, badge: badgeOrders } = orders.data ?? NO_ORDERS
  const loading = !me.error && (me.isPending || orders.isPending)
  // A failed save or cancel; the load's own failure comes from the queries.
  const [actionError, setError] = useState<string | null>(null)
  const loadError = me.error ? "Failed to load your orders" : (orders.error?.message ?? null)
  const error = actionError ?? loadError
  // Saves answer with the updated order, which goes straight into the cache.
  const setUniformOrders = (update: (prev: Order[]) => Order[]) =>
    client.setQueryData<MyOrders>(ordersKey, (prev) => prev && { ...prev, uniform: update(prev.uniform) })
  const setBadgeOrders = (update: (prev: BadgeOrder[]) => BadgeOrder[]) =>
    client.setQueryData<MyOrders>(ordersKey, (prev) => prev && { ...prev, badge: update(prev.badge) })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Uniform order editing state
  const [addingToId, setAddingToId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  // Badge order editing state
  const [addingToBadgeId, setAddingToBadgeId] = useState<string | null>(null)
  const [savingBadgeId, setSavingBadgeId] = useState<string | null>(null)
  const [confirmCancelBadgeId, setConfirmCancelBadgeId] = useState<string | null>(null)

  // Confirm remove item dialog
  type PendingRemove =
    | { kind: "uniform"; order: Order; itemId: string; label: string }
    | { kind: "badge"; order: BadgeOrder; itemId: string; label: string }
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null)

  function toggleExpand(key: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ─── Uniform order actions ──────────────────────────────────────────────────

  function orderEndpoint(orderId: string) {
    const order = uniformOrders.find((o) => o.id === orderId)
    const base =
      order && (order as { subjectType?: string }).subjectType === "user"
        ? "/api/user/orders"
        : "/api/cadet/orders"
    return `${base}/${orderId}`
  }

  async function patchOrder(orderId: string, items: DraftItem[]) {
    setSavingId(orderId)
    try {
      const res = await fetch(orderEndpoint(orderId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error("Failed to update order")
      const updated: Order = await res.json()
      setUniformOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSavingId(null)
    }
  }

  async function cancelOrder(orderId: string) {
    setSavingId(orderId)
    try {
      const res = await fetch(orderEndpoint(orderId), { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? "Failed to cancel order")
      }
      setUniformOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSavingId(null)
      setConfirmCancelId(null)
    }
  }

  function handleAddItem(order: Order, draft: DraftItem) {
    const nonGivenItems: DraftItem[] = order.items
      .filter((i) => !i.givenAt)
      .map((i) => ({
        itemType: i.itemType,
        size: i.size,
        needSizing: i.needSizing,
        sizingDetails: i.sizingDetails,
      }))
    patchOrder(order.id, [...nonGivenItems, draft])
    setAddingToId(null)
  }

  function handleRemoveItem(order: Order, itemId: string) {
    const remaining: DraftItem[] = order.items
      .filter((i) => !i.givenAt && i.id !== itemId)
      .map((i) => ({
        itemType: i.itemType,
        size: i.size,
        needSizing: i.needSizing,
        sizingDetails: i.sizingDetails,
      }))
    patchOrder(order.id, remaining)
  }

  function handleEditSave(order: Order, itemId: string, draft: DraftItem) {
    const items: DraftItem[] = order.items
      .filter((i) => !i.givenAt)
      .map((i) =>
        i.id === itemId
          ? draft
          : { itemType: i.itemType, size: i.size, needSizing: i.needSizing, sizingDetails: i.sizingDetails }
      )
    patchOrder(order.id, items)
    setEditingItemId(null)
  }

  // ─── Badge order actions ────────────────────────────────────────────────────

  type BadgeItemDraft = {
    badgeName: string
    replacement: boolean
    gainedWhere?: string | null
    gainedWhereDetail?: string | null
    gainedDateFrom?: string | null
    gainedDateTo?: string | null
  }

  function toBadgeItemDraft(i: BadgeItem): BadgeItemDraft {
    return {
      badgeName: i.badgeName,
      replacement: !!i.replacement,
      gainedWhere: i.gainedWhere,
      gainedWhereDetail: i.gainedWhereDetail,
      gainedDateFrom: i.gainedDateFrom,
      gainedDateTo: i.gainedDateTo,
    }
  }

  async function patchBadgeOrder(orderId: string, items: BadgeItemDraft[]) {
    setSavingBadgeId(orderId)
    try {
      const res = await fetch(`/api/cadet/badge-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error("Failed to update badge order")
      const updated: BadgeOrder = await res.json()
      setBadgeOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSavingBadgeId(null)
    }
  }

  async function cancelBadgeOrder(orderId: string) {
    setSavingBadgeId(orderId)
    try {
      const res = await fetch(`/api/cadet/badge-orders/${orderId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? "Failed to cancel badge order")
      }
      setBadgeOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSavingBadgeId(null)
      setConfirmCancelBadgeId(null)
    }
  }

  function handleAddBadge(
    order: BadgeOrder,
    badgeName: string,
    replacement: boolean,
    gainedWhere: GainedWhereState
  ) {
    const nonGiven = order.items.filter((i) => !i.givenAt).map(toBadgeItemDraft)
    patchBadgeOrder(order.id, [
      ...nonGiven,
      {
        badgeName,
        replacement,
        gainedWhere: gainedWhere.gainedWhere,
        gainedWhereDetail: gainedWhere.gainedWhereDetail,
        gainedDateFrom: gainedWhere.gainedDateFrom,
        gainedDateTo: gainedWhere.gainedDateTo,
      },
    ])
    setAddingToBadgeId(null)
  }

  function handleRemoveBadge(order: BadgeOrder, itemId: string) {
    const remaining = order.items.filter((i) => !i.givenAt && i.id !== itemId).map(toBadgeItemDraft)
    patchBadgeOrder(order.id, remaining)
  }

  // ─── Combined sorted lists ──────────────────────────────────────────────────

  const allActive: Entry[] = [
    ...uniformOrders
      .filter((o) => !o.completed)
      .map((o) => ({
        key: `u-${o.id}`,
        ts: new Date(o.timestamp).getTime(),
        kind: "uniform" as const,
        order: o,
      })),
    ...badgeOrders
      .filter((o) => !o.completed)
      .map((o) => ({
        key: `b-${o.id}`,
        ts: new Date(o.timestamp).getTime(),
        kind: "badge" as const,
        order: o,
      })),
  ].sort((a, b) => b.ts - a.ts)

  const allCompleted: Entry[] = [
    ...uniformOrders
      .filter((o) => o.completed)
      .map((o) => ({
        key: `u-${o.id}`,
        ts: new Date(o.timestamp).getTime(),
        kind: "uniform" as const,
        order: o,
      })),
    ...badgeOrders
      .filter((o) => o.completed)
      .map((o) => ({
        key: `b-${o.id}`,
        ts: new Date(o.timestamp).getTime(),
        kind: "badge" as const,
        order: o,
      })),
  ].sort((a, b) => b.ts - a.ts)

  const totalCount = uniformOrders.length + badgeOrders.length

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-16">
      <PageHeader
        title="My Orders"
        description={loading ? "Loading…" : `${totalCount} order${totalCount !== 1 ? "s" : ""}`}
      />

      <OrderSentNotice />

      <ErrorAlert message={error} title="Could not load your orders" />

      {loading && (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {!loading && totalCount === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Place an order and it will show up here."
        >
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/uniform-order">
                <Shirt data-icon="inline-start" />
                Uniform order
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/badge-order">
                <Award data-icon="inline-start" />
                Badge order
              </Link>
            </Button>
          </div>
        </EmptyState>
      )}

      {/* Active orders */}
      {allActive.length > 0 && (
        <section className="space-y-3">
          <SectionHeading title="Active" />
          <OrderList>
            {allActive.map((entry) => {
              const expanded = expandedIds.has(entry.key)

              if (entry.kind === "uniform") {
                const order = entry.order
                const noneGiven = order.items.every((i) => !i.givenAt)
                const existingTypes = new Set(order.items.map((i) => i.itemType))
                const isSaving = savingId === order.id

                return (
                  <OrderDisclosure
                    key={entry.key}
                    open={expanded}
                    onToggle={() => toggleExpand(entry.key)}
                    label={`uniform order from ${formatTimestamp(order.timestamp)}`}
                    muted={false}
                    title={itemSummary(order.items.map((i) => i.itemType))}
                    meta={`Uniform · ${formatTimestamp(order.timestamp)}`}
                    aside={<OrderStatusBadge status={orderStatus(order)} />}
                  >
                    <ul className="space-y-2">
                      {order.items.map((item) => {
                        const isEditing = editingItemId === item.id
                        const canEdit = !item.givenAt

                        return (
                          <li key={item.id} className="bg-muted/30 space-y-2 rounded-md border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-sm font-medium">{item.itemType}</p>
                                {item.needSizing ? (
                                  <SizingDetailsDisplay raw={item.sizingDetails} />
                                ) : (
                                  <p className="text-muted-foreground text-xs">Size: {item.size || "—"}</p>
                                )}
                              </div>
                              {canEdit && !isEditing && (
                                <div className="flex shrink-0 gap-1.5">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setEditingItemId(item.id)
                                      setAddingToId(null)
                                    }}
                                    aria-label="Edit sizing"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                                    disabled={isSaving}
                                    onClick={() =>
                                      setPendingRemove({
                                        kind: "uniform",
                                        order,
                                        itemId: item.id,
                                        label: item.itemType,
                                      })
                                    }
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {item.givenAt && (
                              <div className="bg-success/10 border-success/30 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5">
                                <PackageCheck className="text-success h-3 w-3 shrink-0" />
                                <p className="text-success text-xs">
                                  Issued {formatTimestamp(item.givenAt)}
                                  {item.givenBy && <> · {item.givenBy}</>}
                                </p>
                              </div>
                            )}

                            {isEditing && (
                              <SizingEditor
                                itemType={item.itemType}
                                initial={{
                                  size: item.size,
                                  sizingDetails: item.sizingDetails,
                                  needSizing: item.needSizing,
                                }}
                                onSave={(draft) => handleEditSave(order, item.id, draft)}
                                onCancel={() => setEditingItemId(null)}
                              />
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    {addingToId === order.id ? (
                      <AddItemRow
                        existingTypes={existingTypes}
                        onAdd={(draft) => handleAddItem(order, draft)}
                        onCancel={() => setAddingToId(null)}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-full text-xs"
                        disabled={isSaving || existingTypes.size >= itemTypes.length}
                        onClick={() => {
                          setAddingToId(order.id)
                          setEditingItemId(null)
                        }}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Item
                      </Button>
                    )}

                    {confirmCancelId === order.id ? (
                      <div className="border-destructive/30 bg-destructive/10 space-y-2 rounded-md border p-3">
                        <p className="text-destructive text-sm font-medium">Cancel this order?</p>
                        <p className="text-muted-foreground text-xs">
                          This cannot be undone. Any items not yet issued will be removed.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-3 text-xs"
                            disabled={isSaving}
                            onClick={() => cancelOrder(order.id)}
                          >
                            {isSaving ? "Cancelling…" : "Yes, cancel order"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmCancelId(null)}
                          >
                            Keep order
                          </Button>
                        </div>
                      </div>
                    ) : noneGiven ? (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 text-xs"
                          disabled={isSaving}
                          onClick={() => setConfirmCancelId(order.id)}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Cancel order
                        </Button>
                      </div>
                    ) : null}
                  </OrderDisclosure>
                )
              }

              // Badge order card
              const order = entry.order
              const noneGiven = order.items.every((i) => !i.givenAt)
              const isSaving = savingBadgeId === order.id

              return (
                <OrderDisclosure
                  key={entry.key}
                  open={expanded}
                  onToggle={() => toggleExpand(entry.key)}
                  label={`badges order from ${formatTimestamp(order.timestamp)}`}
                  muted={false}
                  title={itemSummary(order.items.map((i) => i.badgeName))}
                  meta={`Badges · ${formatTimestamp(order.timestamp)}`}
                  aside={<OrderStatusBadge status={orderStatus(order)} />}
                >
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="bg-muted/30 space-y-2 rounded-md border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {item.badgeName}
                              {item.replacement && (
                                <span className="border-warning/40 bg-warning/10 text-warning ml-2 rounded-md border px-1.5 py-0.5 text-xs font-normal">
                                  Replacement — £2 fee
                                </span>
                              )}
                            </p>
                            {gainedWhereSummary(gainedWhereOptions, item) && (
                              <p className="text-muted-foreground text-xs">
                                {gainedWhereSummary(gainedWhereOptions, item)}
                              </p>
                            )}
                          </span>
                          {!item.givenAt && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                              disabled={isSaving}
                              onClick={() =>
                                setPendingRemove({
                                  kind: "badge",
                                  order,
                                  itemId: item.id,
                                  label: item.badgeName,
                                })
                              }
                              aria-label="Remove badge"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {item.givenAt && (
                          <div className="bg-success/10 border-success/30 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5">
                            <PackageCheck className="text-success h-3 w-3 shrink-0" />
                            <p className="text-success text-xs">
                              Issued {formatTimestamp(item.givenAt)}
                              {item.givenBy && <> · {item.givenBy}</>}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  {addingToBadgeId === order.id ? (
                    <AddBadgeRow
                      onAdd={(badgeName, replacement, gainedWhere) =>
                        handleAddBadge(order, badgeName, replacement, gainedWhere)
                      }
                      onCancel={() => setAddingToBadgeId(null)}
                    />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-full text-xs"
                      disabled={isSaving}
                      onClick={() => {
                        setAddingToBadgeId(order.id)
                        setAddingToId(null)
                      }}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Badge
                    </Button>
                  )}

                  {confirmCancelBadgeId === order.id ? (
                    <div className="border-destructive/30 bg-destructive/10 space-y-2 rounded-md border p-3">
                      <p className="text-destructive text-sm font-medium">Cancel this badge order?</p>
                      <p className="text-muted-foreground text-xs">This cannot be undone.</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-3 text-xs"
                          disabled={isSaving}
                          onClick={() => cancelBadgeOrder(order.id)}
                        >
                          {isSaving ? "Cancelling…" : "Yes, cancel order"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setConfirmCancelBadgeId(null)}
                        >
                          Keep order
                        </Button>
                      </div>
                    </div>
                  ) : noneGiven ? (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 text-xs"
                        disabled={isSaving}
                        onClick={() => setConfirmCancelBadgeId(order.id)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Cancel order
                      </Button>
                    </div>
                  ) : null}
                </OrderDisclosure>
              )
            })}
          </OrderList>
        </section>
      )}

      {/* Completed orders */}
      {allCompleted.length > 0 && (
        <section className="space-y-3">
          <SectionHeading title="Completed" />
          <OrderList>
            {allCompleted.map((entry) => {
              const expanded = expandedIds.has(entry.key)

              if (entry.kind === "uniform") {
                const order = entry.order
                return (
                  <OrderDisclosure
                    key={entry.key}
                    open={expanded}
                    onToggle={() => toggleExpand(entry.key)}
                    label={`uniform order from ${formatTimestamp(order.timestamp)}`}
                    muted={true}
                    title={itemSummary(order.items.map((i) => i.itemType))}
                    meta={`Uniform · ${formatTimestamp(order.timestamp)}`}
                    aside={<OrderStatusBadge status={orderStatus(order)} />}
                  >
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="bg-muted/30 space-y-1 rounded-md border p-3">
                          <p className="text-sm font-medium">{item.itemType}</p>
                          {item.needSizing ? (
                            <SizingDetailsDisplay raw={item.sizingDetails} />
                          ) : (
                            <p className="text-muted-foreground text-xs">Size: {item.size || "—"}</p>
                          )}
                          {item.givenAt && (
                            <div className="bg-success/10 border-success/30 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5">
                              <PackageCheck className="text-success h-3 w-3 shrink-0" />
                              <p className="text-success text-xs">
                                Issued {formatTimestamp(item.givenAt)}
                                {item.givenBy && <> · {item.givenBy}</>}
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </OrderDisclosure>
                )
              }

              // Completed badge order
              const order = entry.order
              return (
                <OrderDisclosure
                  key={entry.key}
                  open={expanded}
                  onToggle={() => toggleExpand(entry.key)}
                  label={`badges order from ${formatTimestamp(order.timestamp)}`}
                  muted={true}
                  title={itemSummary(order.items.map((i) => i.badgeName))}
                  meta={`Badges · ${formatTimestamp(order.timestamp)}`}
                  aside={<OrderStatusBadge status={orderStatus(order)} />}
                >
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="bg-muted/30 space-y-1 rounded-md border p-3">
                        <p className="text-sm font-medium">
                          {item.badgeName}
                          {item.replacement && (
                            <span className="border-warning/40 bg-warning/10 text-warning ml-2 rounded-md border px-1.5 py-0.5 text-xs font-normal">
                              Replacement — £2 fee
                            </span>
                          )}
                        </p>
                        {gainedWhereSummary(gainedWhereOptions, item) && (
                          <p className="text-muted-foreground text-xs">
                            {gainedWhereSummary(gainedWhereOptions, item)}
                          </p>
                        )}
                        {item.givenAt && (
                          <div className="bg-success/10 border-success/30 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5">
                            <PackageCheck className="text-success h-3 w-3 shrink-0" />
                            <p className="text-success text-xs">
                              Issued {formatTimestamp(item.givenAt)}
                              {item.givenBy && <> · {item.givenBy}</>}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </OrderDisclosure>
              )
            })}
          </OrderList>
        </section>
      )}

      {/* Confirm remove item dialog */}
      <ResponsiveDialog
        open={!!pendingRemove}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
      >
        <ResponsiveDialogContent className="max-w-sm">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Remove item?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              <span className="text-foreground font-medium">{pendingRemove?.label}</span> will be removed from
              your order. This cannot be undone.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!pendingRemove) return
                if (pendingRemove.kind === "uniform") {
                  handleRemoveItem(pendingRemove.order, pendingRemove.itemId)
                } else {
                  handleRemoveBadge(pendingRemove.order, pendingRemove.itemId)
                }
                setPendingRemove(null)
              }}
            >
              Remove
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
