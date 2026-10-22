"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChoiceButtons } from "@/components/activity-log/choice-buttons"
import { formatDate, todayLocal } from "@/lib/format"
import { formatMinutes } from "@/lib/activity-log"

/** One day's entry as the form holds it; `minutes` is null until picked. */
export type EntryDraft = { date: string; description: string; minutes: number | null }
export type EntryErrors = Partial<Record<keyof EntryDraft, string>>

const QUICK_MINUTES = [30, 60, 90, 120]
const MAX_MINUTES = 600

/** What's wrong with a draft, in words that say what to do. Empty when it's fine. */
export function entryErrors(draft: EntryDraft, startDate: string, today = todayLocal()): EntryErrors {
  const errors: EntryErrors = {}
  if (!draft.description.trim()) errors.description = "Say what you did"
  if (!draft.minutes || draft.minutes < 1) errors.minutes = "Pick how long you did it for"
  else if (draft.minutes > MAX_MINUTES) errors.minutes = "That's over 10 hours. Split it into separate days."
  if (!draft.date) errors.date = "Pick the day you did it"
  else if (draft.date > today) errors.date = "Pick today or an earlier day"
  else if (draft.date < startDate)
    errors.date = `Your log starts on ${formatDate(startDate)}. Pick that day or later.`
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  )
}

/**
 * The three questions for one day: what, how long, when. Shared by the "Add
 * what you did" form (one block per day when catching up) and the edit dialog,
 * so both ask them the same way.
 */
export function EntryFields({
  id,
  draft,
  errors,
  startDate,
  onChange,
}: {
  id: string
  draft: EntryDraft
  errors: EntryErrors
  startDate: string
  onChange: (draft: EntryDraft) => void
}) {
  const other = draft.minutes !== null && !QUICK_MINUTES.includes(draft.minutes)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-what`}>What did you do?</Label>
        <Textarea
          id={`${id}-what`}
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          placeholder="Sorted donations and served on the till"
          maxLength={1000}
          aria-invalid={!!errors.description || undefined}
          aria-describedby={errors.description ? `${id}-what-error` : undefined}
        />
        <FieldError id={`${id}-what-error`} message={errors.description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span id={`${id}-time-label`} className="text-sm leading-none font-medium">
          How long for?
        </span>
        <ChoiceButtons
          labelledBy={`${id}-time-label`}
          options={QUICK_MINUTES.map((m) => ({ value: m, label: formatMinutes(m) }))}
          value={draft.minutes}
          onChange={(minutes) => onChange({ ...draft, minutes })}
          invalid={!!errors.minutes}
        />
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-other`} className="text-muted-foreground font-normal">
            Or type the minutes
          </Label>
          <Input
            id={`${id}-other`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_MINUTES}
            value={other ? String(draft.minutes) : ""}
            onChange={(e) => onChange({ ...draft, minutes: e.target.value ? Number(e.target.value) : null })}
            className="w-24"
            aria-invalid={!!errors.minutes || undefined}
            aria-describedby={errors.minutes ? `${id}-time-error` : undefined}
          />
        </div>
        <FieldError id={`${id}-time-error`} message={errors.minutes} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-date`}>When?</Label>
        <Input
          id={`${id}-date`}
          type="date"
          value={draft.date}
          min={startDate}
          max={todayLocal()}
          onChange={(e) => onChange({ ...draft, date: e.target.value })}
          className="w-fit"
          aria-invalid={!!errors.date || undefined}
          aria-describedby={errors.date ? `${id}-date-error` : undefined}
        />
        <FieldError id={`${id}-date-error`} message={errors.date} />
      </div>
    </div>
  )
}
