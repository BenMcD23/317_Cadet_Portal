"use client"

import { createContext, createElement, useContext, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

/**
 * Reference data served by the API's GET /reference (via /api/reference) —
 * the uniform catalogue and the badge catalogue. The SMS site reads the same
 * endpoint, so the two apps can no longer drift apart on item names, sizes or
 * the "gained where" rules.
 *
 * `useReference()` returns empty lists until the first fetch resolves; forms
 * render immediately and their pickers fill a moment later.
 */

export type BadgeCategory = {
  id: string
  name: string
  /** Fixed item names — no level selection */
  items?: string[]
  /** Sub-types that each take a level; the badge name is "<subType> – <level>" */
  subTypes?: string[]
  /** Levels directly on the category; the badge name is "<prefix> – <level>" */
  levels?: string[]
  prefix?: string
}

export type GainedWhereOption = { value: string; label: string }

type ReferencePayload = {
  uniform: {
    itemTypes: string[]
    noSizeItems: string[]
    sizes: Record<string, string[]>
    sizingFields: Record<string, string[]>
    issuanceCategories: string[]
  }
  badges: {
    categories: BadgeCategory[]
    categoriesWithoutGainedWhere: string[]
    gainedWhereOptions: GainedWhereOption[]
  }
}

export type Reference = {
  loaded: boolean
  itemTypes: string[]
  noSizeItems: Set<string>
  sizes: Record<string, string[]>
  /** Measurement fields the sizing form asks for, per item: chest, collar, waist, leg, seat, hips. */
  sizingFields: Record<string, string[]>
  issuanceCategories: string[]
  badgeCategories: BadgeCategory[]
  categoriesWithoutGainedWhere: Set<string>
  gainedWhereOptions: GainedWhereOption[]
}

const EMPTY: Reference = {
  loaded: false,
  itemTypes: [],
  noSizeItems: new Set(),
  sizes: {},
  sizingFields: {},
  issuanceCategories: [],
  badgeCategories: [],
  categoriesWithoutGainedWhere: new Set(),
  gainedWhereOptions: [],
}

const ReferenceContext = createContext<Reference>(EMPTY)

export function ReferenceProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery<ReferencePayload>({
    queryKey: ["reference"],
    queryFn: async () => {
      const res = await fetch("/api/reference")
      if (!res.ok) throw new Error("Could not load reference data")
      return res.json()
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const value = useMemo<Reference>(
    () =>
      data
        ? {
            loaded: true,
            itemTypes: data.uniform.itemTypes,
            noSizeItems: new Set(data.uniform.noSizeItems),
            sizes: data.uniform.sizes,
            sizingFields: data.uniform.sizingFields,
            issuanceCategories: data.uniform.issuanceCategories,
            badgeCategories: data.badges.categories,
            categoriesWithoutGainedWhere: new Set(data.badges.categoriesWithoutGainedWhere),
            gainedWhereOptions: data.badges.gainedWhereOptions,
          }
        : EMPTY,
    [data]
  )
  return createElement(ReferenceContext.Provider, { value }, children)
}

export function useReference(): Reference {
  return useContext(ReferenceContext)
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function buildBadgeName(
  category: BadgeCategory,
  subType: string | null,
  level: string | null
): string | null {
  if (category.items) return subType ?? null
  if (category.subTypes) return subType && level ? `${subType} – ${level}` : null
  if (category.levels) return level ? `${category.prefix} – ${level}` : null
  return null
}

export function gainedWhereLabel(
  options: GainedWhereOption[],
  value: string | null | undefined
): string | null {
  return options.find((o) => o.value === value)?.label ?? null
}

/** Replacements and the automatically-awarded categories don't record where a badge was gained. */
export function needsGainedWhere(
  categoriesWithoutGainedWhere: Set<string>,
  categoryId: string | null | undefined,
  replacement: boolean
): boolean {
  if (replacement) return false
  return !categoryId || !categoriesWithoutGainedWhere.has(categoryId)
}
