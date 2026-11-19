"use client"

import { useState } from "react"
import { Button } from "@317/ui-common/components/ui/button"
import { Label } from "@317/ui-common/components/ui/label"
import { Checkbox } from "@317/ui-common/components/ui/checkbox"
import { SizeCombobox } from "@/components/size-combobox"
import { cn } from "@317/ui-common/lib/utils"
import { Input } from "@317/ui-common/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@317/ui-common/components/ui/select"
import { useReference } from "@/lib/reference"
import { type DraftItem, emptyDraft } from "../types"

/*
 * How a cadet says what size they need: a known size, or "needs sizing" with
 * their measurements, plus the read-only view of those measurements on an
 * order. Split out of My Orders, which had grown to 1,500 lines.
 */

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

const FIT_LABELS: Record<string, string> = { bigger: "Bigger", smaller: "Smaller", same: "Same size" }

// ─── Sizing display ───────────────────────────────────────────────────────────

export function SizingDetailsDisplay({ raw }: { raw: string }) {
  const parsed = parseSizingDetails(raw)

  if (!parsed) {
    return <p className="text-muted-foreground text-xs">{raw}</p>
  }

  const rows: { label: string; value: string }[] = []

  if (parsed.currentSizeUnknown) {
    rows.push({ label: "Current size", value: "Unknown" })
  } else if (parsed.currentSize) {
    rows.push({ label: "Current size", value: parsed.currentSize })
  }
  if (parsed.biggerSmaller)
    rows.push({ label: "Overall fit", value: FIT_LABELS[parsed.biggerSmaller] ?? parsed.biggerSmaller })
  if (parsed.chest) rows.push({ label: "Chest", value: parsed.chest })
  if (parsed.collar) rows.push({ label: "Collar", value: parsed.collar })
  if (parsed.waist) rows.push({ label: "Waist", value: parsed.waist })
  if (parsed.leg) rows.push({ label: "Leg", value: parsed.leg })
  if (parsed.seat) rows.push({ label: "Seat", value: parsed.seat })
  if (parsed.hips) rows.push({ label: "Hips", value: parsed.hips })
  if (parsed.notes) rows.push({ label: "Notes", value: parsed.notes })

  if (rows.length === 0)
    return <p className="text-muted-foreground text-xs italic">No sizing details provided</p>

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

const OVERALL_FIT_OPTIONS = [
  { value: "bigger", label: "Bigger" },
  { value: "smaller", label: "Smaller" },
  { value: "same", label: "Same size" },
] as const

export function SizingEditor({
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

  const { noSizeItems, sizingFields } = useReference()
  const fields = sizingFields[itemType] ?? []
  const noSize = noSizeItems.has(itemType)
  const showChest = fields.includes("chest")
  const showCollar = fields.includes("collar")
  const showWaistLeg = fields.includes("waist")
  const showSeat = fields.includes("seat")
  const showHips = fields.includes("hips")

  function handleSave() {
    if (noSize) {
      onSave(emptyDraft(itemType))
      return
    }
    if (mode === "known") {
      onSave({ itemType, size, needSizing: false, sizingDetails: "" })
    } else {
      const sd: SizingDetailsJSON = {
        currentSize,
        currentSizeUnknown: unknownSize,
        biggerSmaller: fit,
        chest,
        collar,
        waist,
        leg,
        seat,
        hips,
        notes,
      }
      onSave({ itemType, size: "", needSizing: true, sizingDetails: JSON.stringify(sd) })
    }
  }

  if (noSize) {
    return (
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="h-7 px-3 text-xs" onClick={handleSave}>
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-1">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["known", "needs-sizing"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"
            )}
          >
            {m === "known" ? "I know my size" : "Need sizing"}
          </button>
        ))}
      </div>

      {mode === "known" && <SizeCombobox strict itemType={itemType} value={size} onChange={setSize} />}

      {mode === "needs-sizing" && (
        <div className="space-y-3">
          {/* Current size */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">What is your current size?</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`unk-${itemType}`}
                checked={unknownSize}
                onCheckedChange={(c) => {
                  setUnknownSize(!!c)
                  if (!!c) setCurrentSize("")
                }}
              />
              <Label htmlFor={`unk-${itemType}`} className="cursor-pointer text-xs">
                I don&apos;t know my current size
              </Label>
            </div>
            {!unknownSize && (
              <SizeCombobox
                strict
                itemType={itemType}
                value={currentSize}
                onChange={setCurrentSize}
                placeholder="Current size…"
              />
            )}
          </div>

          {/* Adjustments — only shown when current size is known */}
          {!unknownSize && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Adjustments needed</Label>
              <div className="bg-muted/30 space-y-3 rounded-md border p-3">
                {/* Overall fit */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Overall fit</Label>
                  <div className="flex gap-2">
                    {OVERALL_FIT_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFit(fit === value ? "" : value)}
                        className={cn(
                          "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                          fit === value
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
                    <Label className="text-xs">Chest</Label>
                    <Input
                      placeholder="e.g. slightly bigger"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                {showCollar && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Collar</Label>
                    <Input
                      placeholder="e.g. one size bigger"
                      value={collar}
                      onChange={(e) => setCollar(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                {showWaistLeg && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Waist (W)</Label>
                      <Input
                        placeholder="e.g. 2cm bigger"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Leg (L)</Label>
                      <Input
                        placeholder="e.g. shorter"
                        value={leg}
                        onChange={(e) => setLeg(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
                {showSeat && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Seat (S)</Label>
                    <Input
                      placeholder="e.g. bigger"
                      value={seat}
                      onChange={(e) => setSeat(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                {showHips && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hips (H)</Label>
                    <Input
                      placeholder="e.g. bigger"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Any other notes</Label>
                  <Input
                    placeholder="e.g. longer in the body"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          disabled={mode === "known" && !size.trim()}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Add uniform item inline ──────────────────────────────────────────────────

export function AddItemRow({
  existingTypes,
  onAdd,
  onCancel,
}: {
  existingTypes: Set<string>
  onAdd: (draft: DraftItem) => void
  onCancel: () => void
}) {
  const [itemType, setItemType] = useState("")
  const { itemTypes } = useReference()
  const availableTypes = itemTypes.filter((t) => !existingTypes.has(t))

  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <p className="text-muted-foreground text-xs font-medium">Add item</p>
      <Select value={itemType} onValueChange={setItemType}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Select item…" />
        </SelectTrigger>
        <SelectContent>
          {availableTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
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
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  )
}

// ─── Badge picker ─────────────────────────────────────────────────────────────
