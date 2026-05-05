"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SizeCombobox } from "@/components/size-combobox"
import { ITEM_TYPES, NO_SIZE_ITEMS, WAIST_LEG_ITEMS, CHEST_ITEMS, COLLAR_ITEMS, SEAT_ITEMS, HIPS_ITEMS } from "@/lib/uniform-items"
import { cn } from "@/lib/utils"
import { Shirt, ChevronDown, ChevronUp } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type SizingMode = "known" | "needs-sizing"

type SizingDetails = {
  currentSizeUnknown: boolean
  currentSize: string
  biggerSmaller: "" | "bigger" | "smaller" | "same"
  waist: string
  leg: string
  chest: string
  collar: string
  seat: string
  hips: string
  notes: string
}

type ItemEntry = {
  itemType: string
  mode: SizingMode
  size: string
  sizing: SizingDetails
}

function defaultSizing(): SizingDetails {
  return {
    currentSizeUnknown: false,
    currentSize: "",
    biggerSmaller: "",
    waist: "",
    leg: "",
    chest: "",
    collar: "",
    seat: "",
    hips: "",
    notes: "",
  }
}

function defaultEntry(itemType: string): ItemEntry {
  return {
    itemType,
    mode: "known",
    size: "",
    sizing: defaultSizing(),
  }
}

// ─── Adjustment fields per item ───────────────────────────────────────────────

const OVERALL_FIT_OPTIONS = [
  { value: "bigger", label: "Bigger" },
  { value: "smaller", label: "Smaller" },
  { value: "same", label: "Same size" },
] as const

function AdjustmentFields({
  itemType,
  sizing,
  onChange,
}: {
  itemType: string
  sizing: SizingDetails
  onChange: (patch: Partial<SizingDetails>) => void
}) {
  const showWaistLeg = WAIST_LEG_ITEMS.has(itemType)
  const showChest = CHEST_ITEMS.has(itemType)
  const showCollar = COLLAR_ITEMS.has(itemType)
  const showSeat = SEAT_ITEMS.has(itemType)
  const showHips = HIPS_ITEMS.has(itemType)

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Overall fit</Label>
        <div className="flex gap-2">
          {OVERALL_FIT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ biggerSmaller: sizing.biggerSmaller === value ? "" : value })}
              className={cn(
                "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                sizing.biggerSmaller === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {showChest && (
        <div className="space-y-1.5">
          <Label htmlFor={`chest-${itemType}`} className="text-xs">Chest</Label>
          <Input
            id={`chest-${itemType}`}
            placeholder="e.g. slightly bigger"
            value={sizing.chest}
            onChange={(e) => onChange({ chest: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      {showCollar && (
        <div className="space-y-1.5">
          <Label htmlFor={`collar-${itemType}`} className="text-xs">Collar</Label>
          <Input
            id={`collar-${itemType}`}
            placeholder="e.g. one size bigger"
            value={sizing.collar}
            onChange={(e) => onChange({ collar: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      {showWaistLeg && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`waist-${itemType}`} className="text-xs">Waist (W)</Label>
            <Input
              id={`waist-${itemType}`}
              placeholder="e.g. 2cm bigger"
              value={sizing.waist}
              onChange={(e) => onChange({ waist: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`leg-${itemType}`} className="text-xs">Leg (L)</Label>
            <Input
              id={`leg-${itemType}`}
              placeholder="e.g. shorter"
              value={sizing.leg}
              onChange={(e) => onChange({ leg: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {showSeat && (
        <div className="space-y-1.5">
          <Label htmlFor={`seat-${itemType}`} className="text-xs">Seat (S)</Label>
          <Input
            id={`seat-${itemType}`}
            placeholder="e.g. bigger"
            value={sizing.seat}
            onChange={(e) => onChange({ seat: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      {showHips && (
        <div className="space-y-1.5">
          <Label htmlFor={`hips-${itemType}`} className="text-xs">Hips (H)</Label>
          <Input
            id={`hips-${itemType}`}
            placeholder="e.g. bigger"
            value={sizing.hips}
            onChange={(e) => onChange({ hips: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`notes-${itemType}`} className="text-xs">Any other notes</Label>
        <Input
          id={`notes-${itemType}`}
          placeholder="e.g. longer in the body"
          value={sizing.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}

// ─── Per-item sizing card ─────────────────────────────────────────────────────

function ItemSizingCard({
  entry,
  onChange,
}: {
  entry: ItemEntry
  onChange: (patch: Partial<ItemEntry>) => void
}) {
  const noSize = NO_SIZE_ITEMS.has(entry.itemType)

  function patchSizing(patch: Partial<SizingDetails>) {
    onChange({ sizing: { ...entry.sizing, ...patch } })
  }

  if (noSize) {
    return (
      <div className="rounded-md border bg-muted/20 px-3 py-2">
        <p className="text-sm font-medium">{entry.itemType}</p>
        <p className="text-xs text-muted-foreground mt-0.5">No sizing required</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <p className="text-sm font-semibold">{entry.itemType}</p>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ mode: "known" })}
          className={cn(
            "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            entry.mode === "known"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent"
          )}
        >
          I know my size
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: "needs-sizing" })}
          className={cn(
            "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            entry.mode === "needs-sizing"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent"
          )}
        >
          Need sizing
        </button>
      </div>

      {/* Known size */}
      {entry.mode === "known" && (
        <SizeCombobox
          itemType={entry.itemType}
          value={entry.size}
          onChange={(v) => onChange({ size: v })}
        />
      )}

      {/* Needs sizing */}
      {entry.mode === "needs-sizing" && (
        <div className="space-y-3">
          {/* Current size */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">What is your current size?</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`unknown-${entry.itemType}`}
                checked={entry.sizing.currentSizeUnknown}
                onCheckedChange={(c) =>
                  patchSizing({ currentSizeUnknown: !!c, currentSize: !!c ? "" : entry.sizing.currentSize })
                }
              />
              <Label htmlFor={`unknown-${entry.itemType}`} className="text-xs cursor-pointer">
                I don&apos;t know my current size
              </Label>
            </div>
            {!entry.sizing.currentSizeUnknown && (
              <SizeCombobox
                itemType={entry.itemType}
                value={entry.sizing.currentSize}
                onChange={(v) => patchSizing({ currentSize: v })}
                placeholder="Current size…"
              />
            )}
          </div>

          {/* Adjustments — only if current size is known */}
          {!entry.sizing.currentSizeUnknown && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Adjustments needed</Label>
              <AdjustmentFields
                itemType={entry.itemType}
                sizing={entry.sizing}
                onChange={patchSizing}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UniformOrderPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [entries, setEntries] = useState<Record<string, ItemEntry>>({})
  const [selectorOpen, setSelectorOpen] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function toggleItem(itemType: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemType)) {
        next.delete(itemType)
        setEntries((e) => {
          const copy = { ...e }
          delete copy[itemType]
          return copy
        })
      } else {
        next.add(itemType)
        setEntries((e) => ({ ...e, [itemType]: defaultEntry(itemType) }))
      }
      return next
    })
  }

  function updateEntry(itemType: string, patch: Partial<ItemEntry>) {
    setEntries((prev) => ({ ...prev, [itemType]: { ...prev[itemType], ...patch } }))
  }

  function isValid() {
    if (selectedItems.size === 0) return false
    for (const itemType of selectedItems) {
      const entry = entries[itemType]
      if (!entry) return false
      if (NO_SIZE_ITEMS.has(itemType)) continue
      if (entry.mode === "known" && !entry.size.trim()) return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setSubmitting(true)
    // TODO: POST to API
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <div className="text-4xl">✓</div>
            <h2 className="text-xl font-semibold">Order submitted</h2>
            <p className="text-sm text-muted-foreground">
              Your uniform order has been received. The QM will be in touch.
            </p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setSelectedItems(new Set()); setEntries({}) }}>
              Submit another order
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const orderedSelected = ITEM_TYPES.filter((t) => selectedItems.has(t))

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Shirt className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Uniform Order</h1>
          <p className="text-sm text-muted-foreground">Select the items you need below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item selector */}
        <Card>
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setSelectorOpen((v) => !v)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Items needed
                {selectedItems.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({selectedItems.size} selected)
                  </span>
                )}
              </CardTitle>
              {selectorOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
          {selectorOpen && (
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {ITEM_TYPES.map((itemType) => (
                  <div key={itemType} className="flex items-center gap-2">
                    <Checkbox
                      id={`item-${itemType}`}
                      checked={selectedItems.has(itemType)}
                      onCheckedChange={() => toggleItem(itemType)}
                    />
                    <Label htmlFor={`item-${itemType}`} className="text-sm cursor-pointer leading-tight">
                      {itemType}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Per-item sizing */}
        {orderedSelected.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Sizing details
            </h2>
            {orderedSelected.map((itemType) => (
              <ItemSizingCard
                key={itemType}
                entry={entries[itemType]}
                onChange={(patch) => updateEntry(itemType, patch)}
              />
            ))}
          </div>
        )}

        {orderedSelected.length > 0 && (
          <Button type="submit" className="w-full" disabled={!isValid() || submitting}>
            {submitting ? "Submitting…" : "Submit Order"}
          </Button>
        )}
      </form>
    </div>
  )
}
