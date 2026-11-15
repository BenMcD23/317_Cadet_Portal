"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  type BadgeCategory,
  type GainedWhereOption,
  buildBadgeName,
  gainedWhereLabel,
  needsGainedWhere,
  useReference,
} from "@/lib/reference"

/*
 * Adding a badge to an order: the badge picker and, for badges that need it,
 * where and when it was gained. Split out of My Orders, which had grown to
 * 1,500 lines.
 */

function BadgePicker({
  category,
  subType,
  level,
  onCategory,
  onSubType,
  onLevel,
}: {
  category: BadgeCategory | null
  subType: string | null
  level: string | null
  onCategory: (c: BadgeCategory | null) => void
  onSubType: (s: string | null) => void
  onLevel: (l: string | null) => void
}) {
  const { badgeCategories } = useReference()
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Badge type</Label>
        <Select
          value={category?.id ?? ""}
          onValueChange={(v) => onCategory(badgeCategories.find((c) => c.id === v) ?? null)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent>
            {badgeCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category && (category.subTypes || category.items) && (
        <div className="space-y-1.5">
          <Label className="text-xs">{category.subTypes ? "Sub-type" : "Badge"}</Label>
          <Select value={subType ?? ""} onValueChange={onSubType}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {(category.subTypes ?? category.items ?? []).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {category?.levels && (!category.subTypes || subType) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Level</Label>
          <Select value={level ?? ""} onValueChange={onLevel}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select level…" />
            </SelectTrigger>
            <SelectContent>
              {category.levels.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

// ─── Gained where ─────────────────────────────────────────────────────────────

export type GainedWhereState = {
  gainedWhere: string | null
  gainedWhereDetail: string
  gainedDateFrom: string
  gainedDateTo: string
}

function emptyGainedWhere(): GainedWhereState {
  return { gainedWhere: null, gainedWhereDetail: "", gainedDateFrom: "", gainedDateTo: "" }
}

function isGainedWhereComplete(g: GainedWhereState): boolean {
  if (!g.gainedWhere) return false
  if (g.gainedWhere === "other" && !g.gainedWhereDetail.trim()) return false
  if (!g.gainedDateFrom || !g.gainedDateTo) return false
  return true
}

function GainedWhereFields({
  value,
  onChange,
}: {
  value: GainedWhereState
  onChange: (v: GainedWhereState) => void
}) {
  const { gainedWhereOptions } = useReference()
  // Every option records the dates attended.
  const needsDates = !!value.gainedWhere
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Gained where</Label>
        <Select
          value={value.gainedWhere ?? ""}
          onValueChange={(v) =>
            onChange({
              ...value,
              gainedWhere: v,
              gainedWhereDetail: "",
              gainedDateFrom: "",
              gainedDateTo: "",
            })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {gainedWhereOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.gainedWhere === "other" && (
        <div className="space-y-1.5">
          <Label className="text-xs">What was it?</Label>
          <Input
            className="h-9"
            placeholder="e.g. Regional shooting competition"
            value={value.gainedWhereDetail}
            onChange={(e) => onChange({ ...value, gainedWhereDetail: e.target.value })}
          />
        </div>
      )}

      {needsDates && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              className="h-9"
              value={value.gainedDateFrom}
              max={value.gainedDateTo || undefined}
              onChange={(e) => onChange({ ...value, gainedDateFrom: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              className="h-9"
              value={value.gainedDateTo}
              min={value.gainedDateFrom || undefined}
              onChange={(e) => onChange({ ...value, gainedDateTo: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function gainedWhereSummary(
  options: GainedWhereOption[],
  g: {
    gainedWhere?: string | null
    gainedWhereDetail?: string | null
    gainedDateFrom?: string | null
    gainedDateTo?: string | null
  }
): string | null {
  const label = g.gainedWhere === "other" ? g.gainedWhereDetail : gainedWhereLabel(options, g.gainedWhere)
  if (!label) return null
  if (g.gainedDateFrom && g.gainedDateTo) {
    return `${label} (${g.gainedDateFrom.slice(0, 10)} – ${g.gainedDateTo.slice(0, 10)})`
  }
  return label
}

// ─── Add badge inline ─────────────────────────────────────────────────────────

export function AddBadgeRow({
  onAdd,
  onCancel,
}: {
  onAdd: (badgeName: string, replacement: boolean, gainedWhere: GainedWhereState) => void
  onCancel: () => void
}) {
  const [category, setCategory] = useState<BadgeCategory | null>(null)
  const [subType, setSubType] = useState<string | null>(null)
  const [level, setLevel] = useState<string | null>(null)
  const [replacement, setReplacement] = useState(false)
  const [gainedWhere, setGainedWhere] = useState<GainedWhereState>(emptyGainedWhere())

  const { categoriesWithoutGainedWhere } = useReference()
  const badgeName = category ? buildBadgeName(category, subType, level) : null
  const gainedWhereApplies = needsGainedWhere(categoriesWithoutGainedWhere, category?.id, replacement)

  function handleAdd() {
    if (!badgeName) return
    if (gainedWhereApplies && !isGainedWhereComplete(gainedWhere)) return
    onAdd(badgeName, replacement, gainedWhereApplies ? gainedWhere : emptyGainedWhere())
  }

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <p className="text-muted-foreground text-xs font-medium">Add badge</p>
      <BadgePicker
        category={category}
        subType={subType}
        level={level}
        onCategory={(c) => {
          setCategory(c)
          setSubType(null)
          setLevel(null)
        }}
        onSubType={(s) => {
          setSubType(s)
          setLevel(null)
        }}
        onLevel={setLevel}
      />
      {badgeName && (
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={replacement} onCheckedChange={(v) => setReplacement(v === true)} />
          Replacement for a lost/damaged badge (£2 fee)
        </label>
      )}
      {badgeName && gainedWhereApplies && <GainedWhereFields value={gainedWhere} onChange={setGainedWhere} />}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          disabled={!badgeName || (gainedWhereApplies && !isGainedWhereComplete(gainedWhere))}
          onClick={handleAdd}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Badge
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
