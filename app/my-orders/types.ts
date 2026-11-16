// The shapes My Orders reads from the API, shared by the page and its parts.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QmNote {
  id: string
  content: string
  timestamp: string
  addedBy: string
}

export interface OrderItem {
  id: string
  itemType: string
  size: string
  needSizing: boolean
  sizingDetails: string
  qmNotes: QmNote[]
  givenAt: string | null
  givenBy: string | null
  /** When the stores told the cadet it's ready; null until then. */
  readyToCollect?: string | null
}

export interface Order {
  id: string
  cadetName: string
  cadetCin: number
  timestamp: string
  completed: boolean
  items: OrderItem[]
}

export interface BadgeItem {
  id: string
  badgeName: string
  replacement?: boolean // replacement badges carry a £2 fee
  qmNotes: QmNote[]
  givenAt: string | null
  givenBy: string | null
  readyToCollect?: string | null
  gainedWhere?: string | null
  gainedWhereDetail?: string | null
  gainedDateFrom?: string | null
  gainedDateTo?: string | null
}

export interface BadgeOrder {
  id: string
  cadetName: string
  cadetCin: number
  timestamp: string
  completed: boolean
  items: BadgeItem[]
}

/** One line of a uniform order being edited. */
export type DraftItem = { itemType: string; size: string; needSizing: boolean; sizingDetails: string }

export function emptyDraft(itemType = ""): DraftItem {
  return { itemType, size: "", needSizing: false, sizingDetails: "" }
}
