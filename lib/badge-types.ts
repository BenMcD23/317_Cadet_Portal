export type BadgeLevel = "Blue" | "Bronze" | "Silver" | "Gold" | "Gold (Nijmegen)";

export interface BadgeCategory {
  id: string;
  name: string;
  /** Fixed item names — no level selection */
  items?: string[];
  /** Sub-types that each take a level */
  subTypes?: string[];
  /** Levels directly on the category (no sub-types) */
  levels?: BadgeLevel[];
  /** Name prefix used when building the final badge string, e.g. "Leadership" */
  prefix?: string;
}

export const BADGE_CATEGORIES: BadgeCategory[] = [
  {
    id: "core",
    name: "Core Badges",
    items: ["Squadron Num", "ATC", "TRF"],
  },
  {
    id: "classification",
    name: "Classification Badges",
    items: ["First Class", "Leading", "Senior", "Master"],
  },
  {
    id: "leadership",
    name: "Leadership Badges",
    prefix: "Leadership",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "music",
    name: "Music Badges",
    prefix: "Music",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "shooting",
    name: "Shooting Badges",
    prefix: "Shooting",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "radio",
    name: "Radio Badges",
    prefix: "Radio",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "cyber",
    name: "Cyber Badges",
    prefix: "Cyber",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "space",
    name: "Space Badges",
    prefix: "Space",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "road-marching",
    name: "Road Marching Badges",
    prefix: "Road Marching",
    levels: ["Blue", "Bronze", "Silver", "Gold (Nijmegen)"],
  },
  {
    id: "first-aid",
    name: "First Aid Badges",
    prefix: "First Aid",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "dofe",
    name: "DofE Badges",
    prefix: "DofE",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
  {
    id: "flying",
    name: "Flying Badge",
    prefix: "Flying",
    levels: ["Blue", "Bronze", "Silver", "Gold"],
  },
];

/** Where a badge was gained. Camp and Sector Training Weekend also collect the dates attended. */
export const GAINED_WHERE_OPTIONS = [
  { value: "camp",                     label: "On Camp",                   needsDates: true },
  { value: "sector_training_weekend",  label: "Sector Training Weekend",   needsDates: true },
  { value: "wing_training_weekend",    label: "Wing Training Weekend",     needsDates: false },
  { value: "on_sqn",                   label: "On Sqn",                    needsDates: false },
  { value: "other",                    label: "Other",                     needsDates: false },
] as const;

export type GainedWhere = (typeof GAINED_WHERE_OPTIONS)[number]["value"];

export function gainedWhereLabel(value: string | null | undefined): string | null {
  return GAINED_WHERE_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export function gainedWhereNeedsDates(value: string | null | undefined): boolean {
  return GAINED_WHERE_OPTIONS.find((o) => o.value === value)?.needsDates ?? false;
}

/** Build the final badge name string from selections */
export function buildBadgeName(
  category: BadgeCategory,
  subType: string | null,
  level: string | null
): string | null {
  if (category.items) {
    return subType ?? null;
  }
  if (category.subTypes) {
    if (!subType || !level) return null;
    return `${subType} – ${level}`;
  }
  if (category.levels) {
    if (!level) return null;
    return `${category.prefix} – ${level}`;
  }
  return null;
}
