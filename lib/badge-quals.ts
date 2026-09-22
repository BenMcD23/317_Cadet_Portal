/**
 * The API's verdict on whether a cadet's SMS record actually evidences a badge
 * they're ordering (`GET /cadets/me/badge-qual-check`, keyed by the same badge
 * names `buildBadgeName` produces).
 *
 * The wording lives on the API so the portal and the SMS site can't describe
 * the same finding differently — this file only decides how it looks.
 */

export type BadgeQualStatus = {
  /** held = on SMS and current · expired = lapsed · missing = nothing on record ·
   *  unknown = not tied to a qualification we can check (core badges) */
  status: "held" | "expired" | "missing" | "unknown"
  /** A ready-to-show sentence, e.g. "SMS shows Blue Leadership, awarded 30 Mar 2022." */
  reason: string
  qualName: string | null
  dateAchieved: string | null
  dateExpires: string | null
  levelHeld: string | null
  highestHeld: string | null
}

export type BadgeQualChecks = Record<string, BadgeQualStatus>

/**
 * Whether the cadet should be asked to confirm before ordering this badge.
 *
 * Only a definite "SMS doesn't back this up" counts. A check that hasn't
 * loaded, or a badge that isn't tied to a qualification, is "couldn't check"
 * rather than "no", and must never stand between a cadet and their order.
 */
export function needsQualConfirmation(check: BadgeQualStatus | undefined): boolean {
  return check?.status === "missing" || check?.status === "expired"
}

/** Short label for the status chip. */
export function qualStatusLabel(status: BadgeQualStatus["status"]): string {
  if (status === "held") return "On SMS"
  if (status === "expired") return "Expired"
  return "Not on SMS"
}
