"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SizeCombobox } from "@/components/size-combobox"
import { ITEM_TYPES, NO_SIZE_ITEMS, WAIST_LEG_ITEMS, CHEST_ITEMS, COLLAR_ITEMS, SEAT_ITEMS, HIPS_ITEMS } from "@/lib/uniform-items"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Plus, Trash2, PackageCheck, Pencil, X, Shirt, Award } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BADGE_CATEGORIES, BadgeCategory, buildBadgeName } from "@/lib/badge-types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

interface QmNote {
  id: string
  content: string
  timestamp: string
  addedBy: string
}

interface OrderItem {
  id: string
  itemType: string
  size: string
  needSizing: boolean
  sizingDetails: string
  qmNotes: QmNote[]
  givenAt: string | null
  givenBy: string | null
}

interface Order {
  id: string
  cadetName: string
  cadetCin: number
  timestamp: string
  completed: boolean
  items: OrderItem[]
}

interface BadgeItem {
  id: string
  badgeName: string
  qmNotes: QmNote[]
  givenAt: string | null
  givenBy: string | null
}

interface BadgeOrder {
  id: string
  cadetName: string
  cadetCin: number
  timestamp: string
  completed: boolean
  items: BadgeItem[]
}

interface SizingDetailsJSON {
  currentSize?: string
  currentSizeUnknown?: boolean
  biggerSmaller?: "" | "bigger" | "smaller" | "same"
  chest?: string
  collar?: string
  waist?: string
  leg?: string
  seat?: string
  hips?: string
  notes?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSizingDetails(str: string): SizingDetailsJSON | null {
  if (!str) return null
  try {
    return JSON.parse(str) as SizingDetailsJSON
  } catch {
    return null
  }
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
}

const FIT_LABELS: Record<string, string> = { bigger: "Bigger", smaller: "Smaller", same: "Same size" }

// ─── Sizing display ───────────────────────────────────────────────────────────

function SizingDetailsDisplay({ raw }: { raw: string }) {
  const parsed = parseSizingDetails(raw)

  if (!parsed) {
    return <p className="text-xs text-muted-foreground">{raw}</p>
  }

  const rows: { label: string; value: string }[] = []

  if (parsed.currentSizeUnknown) {
    rows.push({ label: "Current size", value: "Unknown" })
  } else if (parsed.currentSize) {
    rows.push({ label: "Current size", value: parsed.currentSize })
  }
  if (parsed.biggerSmaller) rows.push({ label: "Overall fit", value: FIT_LABELS[parsed.biggerSmaller] ?? parsed.biggerSmaller })
  if (parsed.chest)  rows.push({ label: "Chest",  value: parsed.chest })
  if (parsed.collar) rows.push({ label: "Collar", value: parsed.collar })
  if (parsed.waist)  rows.push({ label: "Waist",  value: parsed.waist })
  if (parsed.leg)    rows.push({ label: "Leg",    value: parsed.leg })
  if (parsed.seat)   rows.push({ label: "Seat",   value: parsed.seat })
  if (parsed.hips)   rows.push({ label: "Hips",   value: parsed.hips })
  if (parsed.notes)  rows.push({ label: "Notes",  value: parsed.notes })

  if (rows.length === 0) return <p className="text-xs text-muted-foreground italic">No sizing details provided</p>

  return (
    <div className="space-y-0.5">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-2 text-xs">
          <span className="text-muted-foreground w-24 shrink-0">{label}</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Inline sizing editor ─────────────────────────────────────────────────────

type DraftItem = { itemType: string; size: string; needSizing: boolean; sizingDetails: string }

function emptyDraft(itemType = ""): DraftItem {
  return { itemType, size: "", needSizing: false, sizingDetails: "" }
}

const OVERALL_FIT_OPTIONS = [
  { value: "bigger",  label: "Bigger" },
  { value: "smaller", label: "Smaller" },
  { value: "same",    label: "Same size" },
] as const

function SizingEditor({
  itemType,
  initial,
  onSave,
  onCancel,
}: {
  itemType: string
  initial: { size: string; sizingDetails: string; needSizing: boolean }
  onSave: (draft: DraftItem) => void
  onCancel: () => void
}) {
  const parsed = initial.needSizing ? parseSizingDetails(initial.sizingDetails) : null
  const [mode, setMode] = useState<"known" | "needs-sizing">(initial.needSizing ? "needs-sizing" : "known")
  const [size, setSize] = useState(initial.size)
  const [unknownSize, setUnknownSize] = useState(parsed?.currentSizeUnknown ?? false)
  const [currentSize, setCurrentSize] = useState(parsed?.currentSize ?? "")
  const [fit, setFit] = useState<"" | "bigger" | "smaller" | "same">(parsed?.biggerSmaller ?? "")
  const [chest, setChest] = useState(parsed?.chest ?? "")
  const [collar, setCollar] = useState(parsed?.collar ?? "")
  const [waist, setWaist] = useState(parsed?.waist ?? "")
  const [leg, setLeg] = useState(parsed?.leg ?? "")
  const [seat, setSeat] = useState(parsed?.seat ?? "")
  const [hips, setHips] = useState(parsed?.hips ?? "")
  const [notes, setNotes] = useState(parsed?.notes ?? "")

  const noSize = NO_SIZE_ITEMS.has(itemType)
  const showChest = CHEST_ITEMS.has(itemType)
  const showCollar = COLLAR_ITEMS.has(itemType)
  const showWaistLeg = WAIST_LEG_ITEMS.has(itemType)
  const showSeat = SEAT_ITEMS.has(itemType)
  const showHips = HIPS_ITEMS.has(itemType)

  function handleSave() {
    if (noSize) {
      onSave(emptyDraft(itemType))
      return
    }
    if (mode === "known") {
      onSave({ itemType, size, needSizing: false, sizingDetails: "" })
    } else {
      const sd: SizingDetailsJSON = { currentSize, currentSizeUnknown: unknownSize, biggerSmaller: fit, chest, collar, waist, leg, seat, hips, notes }
      onSave({ itemType, size: "", needSizing: true, sizingDetails: JSON.stringify(sd) })
    }
  }

  if (noSize) {
    return (
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="h-7 px-3 text-xs" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-1">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["known", "needs-sizing"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={cn("flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"
            )}>
            {m === "known" ? "I know my size" : "Need sizing"}
          </button>
        ))}
      </div>

      {mode === "known" && (
        <SizeCombobox itemType={itemType} value={size} onChange={setSize} />
      )}

      {mode === "needs-sizing" && (
        <div className="space-y-3">
          {/* Current size */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">What is your current size?</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`unk-${itemType}`}
                checked={unknownSize}
                onCheckedChange={(c) => { setUnknownSize(!!c); if (!!c) setCurrentSize("") }}
              />
              <Label htmlFor={`unk-${itemType}`} className="text-xs cursor-pointer">
                I don&apos;t know my current size
              </Label>
            </div>
            {!unknownSize && (
              <SizeCombobox itemType={itemType} value={currentSize} onChange={setCurrentSize} placeholder="Current size…" />
            )}
          </div>

          {/* Adjustments — only shown when current size is known */}
          {!unknownSize && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Adjustments needed</Label>
              <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                {/* Overall fit */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Overall fit</Label>
                  <div className="flex gap-2">
                    {OVERALL_FIT_OPTIONS.map(({ value, label }) => (
                      <button key={value} type="button"
                        onClick={() => setFit(fit === value ? "" : value)}
                        className={cn(
                          "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                          fit === value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"
                        )}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {showChest && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Chest</Label>
                    <Input placeholder="e.g. slightly bigger" value={chest} onChange={(e) => setChest(e.target.value)} className="h-8 text-sm" />
                  </div>
                )}
                {showCollar && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Collar</Label>
                    <Input placeholder="e.g. one size bigger" value={collar} onChange={(e) => setCollar(e.target.value)} className="h-8 text-sm" />
                  </div>
                )}
                {showWaistLeg && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Waist (W)</Label>
                      <Input placeholder="e.g. 2cm bigger" value={waist} onChange={(e) => setWaist(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Leg (L)</Label>
                      <Input placeholder="e.g. shorter" value={leg} onChange={(e) => setLeg(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                )}
                {showSeat && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Seat (S)</Label>
                    <Input placeholder="e.g. bigger" value={seat} onChange={(e) => setSeat(e.target.value)} className="h-8 text-sm" />
                  </div>
                )}
                {showHips && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hips (H)</Label>
                    <Input placeholder="e.g. bigger" value={hips} onChange={(e) => setHips(e.target.value)} className="h-8 text-sm" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Any other notes</Label>
                  <Input placeholder="e.g. longer in the body" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" className="h-7 px-3 text-xs"
          disabled={mode === "known" && !size.trim()}
          onClick={handleSave}>Save</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── Add uniform item inline ──────────────────────────────────────────────────

function AddItemRow({ existingTypes, onAdd, onCancel }: {
  existingTypes: Set<string>
  onAdd: (draft: DraftItem) => void
  onCancel: () => void
}) {
  const [itemType, setItemType] = useState("")
  const availableTypes = ITEM_TYPES.filter((t) => !existingTypes.has(t))

  return (
    <div className="rounded-md border border-dashed p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Add item</p>
      <Select value={itemType} onValueChange={setItemType}>
        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select item…" /></SelectTrigger>
        <SelectContent>
          {availableTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      {itemType && (
        <SizingEditor
          itemType={itemType}
          initial={{ size: "", sizingDetails: "", needSizing: false }}
          onSave={onAdd}
          onCancel={onCancel}
        />
      )}
      {!itemType && (
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>Cancel</Button>
      )}
    </div>
  )
}

// ─── Badge picker ─────────────────────────────────────────────────────────────

function BadgePicker({
  category, subType, level, onCategory, onSubType, onLevel,
}: {
  category: BadgeCategory | null
  subType: string | null
  level: string | null
  onCategory: (c: BadgeCategory | null) => void
  onSubType: (s: string | null) => void
  onLevel: (l: string | null) => void
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Badge type</Label>
        <Select
          value={category?.id ?? ""}
          onValueChange={(v) => onCategory(BADGE_CATEGORIES.find((c) => c.id === v) ?? null)}
        >
          <SelectTrigger className="h-9"><SelectValue placeholder="Select type…" /></SelectTrigger>
          <SelectContent>
            {BADGE_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category && (category.subTypes || category.items) && (
        <div className="space-y-1.5">
          <Label className="text-xs">{category.subTypes ? "Sub-type" : "Badge"}</Label>
          <Select value={subType ?? ""} onValueChange={onSubType}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {(category.subTypes ?? category.items ?? []).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {category?.levels && (!category.subTypes || subType) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Level</Label>
          <Select value={level ?? ""} onValueChange={onLevel}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select level…" /></SelectTrigger>
            <SelectContent>
              {category.levels.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

// ─── Add badge inline ─────────────────────────────────────────────────────────

function AddBadgeRow({ onAdd, onCancel }: { onAdd: (badgeName: string) => void; onCancel: () => void }) {
  const [category, setCategory] = useState<BadgeCategory | null>(null)
  const [subType, setSubType] = useState<string | null>(null)
  const [level, setLevel] = useState<string | null>(null)

  const badgeName = category ? buildBadgeName(category, subType, level) : null

  return (
    <div className="rounded-md border border-dashed p-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Add badge</p>
      <BadgePicker
        category={category}
        subType={subType}
        level={level}
        onCategory={(c) => { setCategory(c); setSubType(null); setLevel(null) }}
        onSubType={(s) => { setSubType(s); setLevel(null) }}
        onLevel={setLevel}
      />
      <div className="flex gap-2">
        <Button size="sm" className="h-7 px-3 text-xs"
          disabled={!badgeName}
          onClick={() => { if (badgeName) onAdd(badgeName) }}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Badge
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Entry =
  | { key: string; ts: number; kind: "uniform"; order: Order }
  | { key: string; ts: number; kind: "badge"; order: BadgeOrder }

export default function MyOrdersPage() {
  const [uniformOrders, setUniformOrders] = useState<Order[]>([])
  const [badgeOrders, setBadgeOrders] = useState<BadgeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [uRes, bRes] = await Promise.all([
        fetch("/api/cadet/orders"),
        fetch("/api/cadet/badge-orders"),
      ])
      if (!uRes.ok) throw new Error("Failed to load uniform orders")
      if (!bRes.ok) throw new Error("Failed to load badge orders")
      setUniformOrders(await uRes.json())
      setBadgeOrders(await bRes.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  function toggleExpand(key: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ─── Uniform order actions ──────────────────────────────────────────────────

  async function patchOrder(orderId: string, items: DraftItem[]) {
    setSavingId(orderId)
    try {
      const res = await fetch(`/api/cadet/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error("Failed to update order")
      const updated: Order = await res.json()
      setUniformOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSavingId(null)
    }
  }

  async function cancelOrder(orderId: string) {
    setSavingId(orderId)
    try {
      const res = await fetch(`/api/cadet/orders/${orderId}`, { method: "DELETE" })
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
      .map((i) => ({ itemType: i.itemType, size: i.size, needSizing: i.needSizing, sizingDetails: i.sizingDetails }))
    patchOrder(order.id, [...nonGivenItems, draft])
    setAddingToId(null)
  }

  function handleRemoveItem(order: Order, itemId: string) {
    const remaining: DraftItem[] = order.items
      .filter((i) => !i.givenAt && i.id !== itemId)
      .map((i) => ({ itemType: i.itemType, size: i.size, needSizing: i.needSizing, sizingDetails: i.sizingDetails }))
    patchOrder(order.id, remaining)
  }

  function handleEditSave(order: Order, itemId: string, draft: DraftItem) {
    const items: DraftItem[] = order.items
      .filter((i) => !i.givenAt)
      .map((i) => i.id === itemId
        ? draft
        : { itemType: i.itemType, size: i.size, needSizing: i.needSizing, sizingDetails: i.sizingDetails }
      )
    patchOrder(order.id, items)
    setEditingItemId(null)
  }

  // ─── Badge order actions ────────────────────────────────────────────────────

  async function patchBadgeOrder(orderId: string, items: { badgeName: string }[]) {
    setSavingBadgeId(orderId)
    try {
      const res = await fetch(`/api/cadet/badge-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error("Failed to update badge order")
      const updated: BadgeOrder = await res.json()
      setBadgeOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o))
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

  function handleAddBadge(order: BadgeOrder, badgeName: string) {
    const nonGiven = order.items.filter((i) => !i.givenAt).map((i) => ({ badgeName: i.badgeName }))
    patchBadgeOrder(order.id, [...nonGiven, { badgeName }])
    setAddingToBadgeId(null)
  }

  function handleRemoveBadge(order: BadgeOrder, itemId: string) {
    const remaining = order.items
      .filter((i) => !i.givenAt && i.id !== itemId)
      .map((i) => ({ badgeName: i.badgeName }))
    patchBadgeOrder(order.id, remaining)
  }

  // ─── Combined sorted lists ──────────────────────────────────────────────────

  const allActive: Entry[] = [
    ...uniformOrders.filter((o) => !o.completed).map((o) => ({ key: `u-${o.id}`, ts: new Date(o.timestamp).getTime(), kind: "uniform" as const, order: o })),
    ...badgeOrders.filter((o) => !o.completed).map((o) => ({ key: `b-${o.id}`, ts: new Date(o.timestamp).getTime(), kind: "badge" as const, order: o })),
  ].sort((a, b) => b.ts - a.ts)

  const allCompleted: Entry[] = [
    ...uniformOrders.filter((o) => o.completed).map((o) => ({ key: `u-${o.id}`, ts: new Date(o.timestamp).getTime(), kind: "uniform" as const, order: o })),
    ...badgeOrders.filter((o) => o.completed).map((o) => ({ key: `b-${o.id}`, ts: new Date(o.timestamp).getTime(), kind: "badge" as const, order: o })),
  ].sort((a, b) => b.ts - a.ts)

  const totalCount = uniformOrders.length + badgeOrders.length

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          {!loading && <p className="text-sm text-muted-foreground">{totalCount} order{totalCount !== 1 ? "s" : ""}</p>}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading your orders…</p>}

      {!loading && totalCount === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">You have no orders yet.</p>
          <div className="flex justify-center gap-2">
            <Link href="/uniform-order">
              <Button size="sm" variant="outline">
                <Shirt className="mr-1.5 h-4 w-4" />
                Place Uniform Order
              </Button>
            </Link>
            <Link href="/badge-order">
              <Button size="sm" variant="outline">
                <Award className="mr-1.5 h-4 w-4" />
                Place Badge Order
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Active orders */}
      {allActive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active</h2>
          {allActive.map((entry) => {
            const expanded = expandedIds.has(entry.key)

            if (entry.kind === "uniform") {
              const order = entry.order
              const noneGiven = order.items.every((i) => !i.givenAt)
              const existingTypes = new Set(order.items.map((i) => i.itemType))
              const isSaving = savingId === order.id

              return (
                <Card key={entry.key}>
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-[10px] font-medium">
                          <Shirt className="h-3 w-3" /> Uniform
                        </span>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(order.timestamp)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </Badge>
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => toggleExpand(entry.key)}>
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expanded && (
                    <CardContent className="pt-4 space-y-3">
                      <ul className="space-y-2">
                        {order.items.map((item) => {
                          const isEditing = editingItemId === item.id
                          const canEdit = !item.givenAt

                          return (
                            <li key={item.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0 space-y-1">
                                  <p className="text-sm font-medium">{item.itemType}</p>
                                  {item.needSizing ? (
                                    <SizingDetailsDisplay raw={item.sizingDetails} />
                                  ) : (
                                    <p className="text-xs text-muted-foreground">Size: {item.size || "—"}</p>
                                  )}
                                </div>
                                {canEdit && !isEditing && (
                                  <div className="flex gap-1.5 shrink-0">
                                    <Button size="icon" variant="ghost" className="h-7 w-7"
                                      onClick={() => { setEditingItemId(item.id); setAddingToId(null) }}
                                      aria-label="Edit sizing">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost"
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      disabled={isSaving}
                                      onClick={() => setPendingRemove({ kind: "uniform", order, itemId: item.id, label: item.itemType })}
                                      aria-label="Remove item">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {item.givenAt && (
                                <div className="flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1.5">
                                  <PackageCheck className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                                  <p className="text-xs text-green-700 dark:text-green-400">
                                    Issued {formatTimestamp(item.givenAt)}
                                    {item.givenBy && <> · {item.givenBy}</>}
                                  </p>
                                </div>
                              )}

                              {isEditing && (
                                <SizingEditor
                                  itemType={item.itemType}
                                  initial={{ size: item.size, sizingDetails: item.sizingDetails, needSizing: item.needSizing }}
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
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs"
                          disabled={isSaving || existingTypes.size >= ITEM_TYPES.length}
                          onClick={() => { setAddingToId(order.id); setEditingItemId(null) }}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add Item
                        </Button>
                      )}

                      {confirmCancelId === order.id ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                          <p className="text-sm font-medium text-destructive">Cancel this order?</p>
                          <p className="text-xs text-muted-foreground">This cannot be undone. Any items not yet issued will be removed.</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" className="h-7 px-3 text-xs"
                              disabled={isSaving}
                              onClick={() => cancelOrder(order.id)}>
                              {isSaving ? "Cancelling…" : "Yes, cancel order"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                              onClick={() => setConfirmCancelId(null)}>
                              Keep order
                            </Button>
                          </div>
                        </div>
                      ) : noneGiven ? (
                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={isSaving}
                            onClick={() => setConfirmCancelId(order.id)}>
                            <X className="mr-1 h-3.5 w-3.5" />
                            Cancel order
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  )}
                </Card>
              )
            }

            // Badge order card
            const order = entry.order
            const noneGiven = order.items.every((i) => !i.givenAt)
            const isSaving = savingBadgeId === order.id

            return (
              <Card key={entry.key}>
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-medium">
                        <Award className="h-3 w-3" /> Badge
                      </span>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(order.timestamp)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {order.items.length} badge{order.items.length !== 1 ? "s" : ""}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => toggleExpand(entry.key)}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-4 space-y-3">
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{item.badgeName}</p>
                            {!item.givenAt && (
                              <Button size="icon" variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={isSaving}
                                onClick={() => setPendingRemove({ kind: "badge", order, itemId: item.id, label: item.badgeName })}
                                aria-label="Remove badge">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {item.givenAt && (
                            <div className="flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1.5">
                              <PackageCheck className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                              <p className="text-xs text-green-700 dark:text-green-400">
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
                        onAdd={(badgeName) => handleAddBadge(order, badgeName)}
                        onCancel={() => setAddingToBadgeId(null)}
                      />
                    ) : (
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs"
                        disabled={isSaving}
                        onClick={() => { setAddingToBadgeId(order.id); setAddingToId(null) }}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Badge
                      </Button>
                    )}

                    {confirmCancelBadgeId === order.id ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                        <p className="text-sm font-medium text-destructive">Cancel this badge order?</p>
                        <p className="text-xs text-muted-foreground">This cannot be undone.</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" className="h-7 px-3 text-xs"
                            disabled={isSaving}
                            onClick={() => cancelBadgeOrder(order.id)}>
                            {isSaving ? "Cancelling…" : "Yes, cancel order"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => setConfirmCancelBadgeId(null)}>
                            Keep order
                          </Button>
                        </div>
                      </div>
                    ) : noneGiven ? (
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isSaving}
                          onClick={() => setConfirmCancelBadgeId(order.id)}>
                          <X className="mr-1 h-3.5 w-3.5" />
                          Cancel order
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </section>
      )}

      {/* Completed orders */}
      {allCompleted.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Completed</h2>
          {allCompleted.map((entry) => {
            const expanded = expandedIds.has(entry.key)

            if (entry.kind === "uniform") {
              const order = entry.order
              return (
                <Card key={entry.key} className="opacity-75">
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-[10px] font-medium">
                          <Shirt className="h-3 w-3" /> Uniform
                        </span>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(order.timestamp)}</p>
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </Badge>
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => toggleExpand(entry.key)}>
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {expanded && (
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        {order.items.map((item) => (
                          <li key={item.id} className="rounded-md border bg-muted/30 p-3 space-y-1">
                            <p className="text-sm font-medium">{item.itemType}</p>
                            {item.needSizing
                              ? <SizingDetailsDisplay raw={item.sizingDetails} />
                              : <p className="text-xs text-muted-foreground">Size: {item.size || "—"}</p>}
                            {item.givenAt && (
                              <div className="flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1.5">
                                <PackageCheck className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  Issued {formatTimestamp(item.givenAt)}
                                  {item.givenBy && <> · {item.givenBy}</>}
                                </p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              )
            }

            // Completed badge order
            const order = entry.order
            return (
              <Card key={entry.key} className="opacity-75">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-medium">
                        <Award className="h-3 w-3" /> Badge
                      </span>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(order.timestamp)}</p>
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Completed
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {order.items.length} badge{order.items.length !== 1 ? "s" : ""}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => toggleExpand(entry.key)}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expanded && (
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="rounded-md border bg-muted/30 p-3 space-y-1">
                          <p className="text-sm font-medium">{item.badgeName}</p>
                          {item.givenAt && (
                            <div className="flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1.5">
                              <PackageCheck className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                              <p className="text-xs text-green-700 dark:text-green-400">
                                Issued {formatTimestamp(item.givenAt)}
                                {item.givenBy && <> · {item.givenBy}</>}
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </section>
      )}

      {/* Confirm remove item dialog */}
      <Dialog open={!!pendingRemove} onOpenChange={(open) => { if (!open) setPendingRemove(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove item?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{pendingRemove?.label}</span> will be removed from your order. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>Keep it</Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
