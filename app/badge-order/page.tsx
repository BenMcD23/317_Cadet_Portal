"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { PageHeader } from "@/components/page-header"
import { ErrorAlert } from "@/components/error-alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BADGE_CATEGORIES, BadgeCategory, buildBadgeName } from "@/lib/badge-types"

// ─── Badge picker ─────────────────────────────────────────────────────────────

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
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Badge type</Label>
        <Select
          value={category?.id ?? ""}
          onValueChange={(v) => onCategory(BADGE_CATEGORIES.find((c) => c.id === v) ?? null)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
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
          <Select value={subType ?? ""} onValueChange={(v) => onSubType(v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
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
          <Select value={level ?? ""} onValueChange={(v) => onLevel(v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select level…" />
            </SelectTrigger>
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

const LEVEL_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  Blue:              { border: "border-blue-400/50",   bg: "bg-blue-50 dark:bg-blue-950/40",     text: "text-blue-900 dark:text-blue-100" },
  Bronze:            { border: "border-amber-600/50",  bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-900 dark:text-amber-100" },
  Silver:            { border: "border-slate-400/50",  bg: "bg-slate-50 dark:bg-slate-800/40",   text: "text-slate-800 dark:text-slate-100" },
  Gold:              { border: "border-yellow-500/50", bg: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-900 dark:text-yellow-100" },
  "Gold (Nijmegen)": { border: "border-yellow-500/50", bg: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-900 dark:text-yellow-100" },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SelectedBadge = { badgeName: string; replacement: boolean }

export default function BadgeOrderPage() {
  const router = useRouter()

  const [selectorOpen, setSelectorOpen] = useState(true)
  const [badges, setBadges] = useState<SelectedBadge[]>([])

  const [category, setCategory] = useState<BadgeCategory | null>(null)
  const [subType, setSubType] = useState<string | null>(null)
  const [level, setLevel] = useState<string | null>(null)
  const [replacement, setReplacement] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentBadgeName = category ? buildBadgeName(category, subType, level) : null
  const replacementCount = badges.filter((b) => b.replacement).length

  function handleAddBadge() {
    if (!currentBadgeName) return
    setBadges((prev) => [...prev, { badgeName: currentBadgeName, replacement }])
    setCategory(null)
    setSubType(null)
    setLevel(null)
    setReplacement(false)
  }

  function handleRemoveBadge(idx: number) {
    setBadges((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (badges.length === 0) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/cadet/badge-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: badges }),
      })
      if (res.status === 404) {
        setError("You are not registered in the system. Please speak to a member of staff.")
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? "Something went wrong. Please try again.")
        return
      }
      router.push("/my-orders")
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-16">
      <PageHeader title="Badge Order" description="Select the badges you need below" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Badge selector card */}
        <Card>
          <CardHeader
            className="pb-2 cursor-pointer"
            onClick={() => setSelectorOpen((v) => !v)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Badges needed
                {badges.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({badges.length} selected)
                  </span>
                )}
              </CardTitle>
              {selectorOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              }
            </div>
          </CardHeader>

          {selectorOpen && (
            <CardContent className="space-y-4">
              {/* Added badges list */}
              {badges.length > 0 && (
                <ul className="space-y-1.5">
                  {badges.map((badge, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        {badge.badgeName}
                        {badge.replacement && (
                          <Badge variant="outline" className="border-amber-500/50 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                            Replacement — £2 fee
                          </Badge>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBadge(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove badge"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Badge picker */}
              <div className="rounded-md border border-dashed p-3 space-y-3">
                <BadgePicker
                  category={category}
                  subType={subType}
                  level={level}
                  onCategory={(c) => { setCategory(c); setSubType(null); setLevel(null) }}
                  onSubType={(s) => { setSubType(s); setLevel(null) }}
                  onLevel={setLevel}
                />
                {currentBadgeName && (() => {
                  const s = level ? LEVEL_STYLES[level] : null
                  return (
                    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${s ? `${s.border} ${s.bg}` : "border-primary/30 bg-primary/10"}`}>
                      <span className={`text-sm font-medium ${s ? s.text : "text-foreground"}`}>{currentBadgeName}</span>
                    </div>
                  )
                })()}
                {currentBadgeName && (
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <Checkbox
                      checked={replacement}
                      onCheckedChange={(v) => setReplacement(v === true)}
                      className="mt-0.5"
                    />
                    <span>
                      This is a replacement for a lost or damaged badge
                      <span className="block text-xs text-muted-foreground">
                        Replacement badges cost £2
                      </span>
                    </span>
                  </label>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!currentBadgeName}
                  onClick={handleAddBadge}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Badge to Order
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <ErrorAlert message={error} title="Could not submit order" />

        {replacementCount > 0 && (
          <p className="rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Replacement badges cost £2 each — please bring £{replacementCount * 2} to stores when
            collecting.
          </p>
        )}

        {badges.length > 0 && (
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Spinner data-icon="inline-start" />}
            {submitting ? "Submitting…" : "Submit order"}
          </Button>
        )}
      </form>
    </div>
  )
}
