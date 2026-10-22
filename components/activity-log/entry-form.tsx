"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ErrorAlert } from "@/components/error-alert"
import {
  EntryFields,
  entryErrors,
  type EntryDraft,
  type EntryErrors,
} from "@/components/activity-log/entry-fields"
import { useActivityLogSave, weekLabel, type ActivityLog, type SectionKey } from "@/lib/activity-log"
import { todayLocal } from "@/lib/format"

type Row = EntryDraft & { key: number; week?: string }

/** Starting rows for the form: today, or one per missed week when catching up. */
export function draftRows(description: string, weeks: string[] = [], startDate = ""): Row[] {
  if (!weeks.length) return [{ key: 0, date: todayLocal(), description, minutes: 60 }]
  // A week's Monday, unless the log started part-way through that week.
  return weeks.map((week, i) => ({
    key: i,
    week,
    date: week < startDate ? startDate : week,
    description,
    minutes: 60,
  }))
}

/**
 * "Add what you did": one or more days saved in one go, so a cadet who's
 * fallen behind fills in every missed week at once. Nothing is saved unless
 * every day is right, matching the API.
 */
export function EntryForm({
  section,
  startDate,
  initialRows,
  onSaved,
}: {
  section: SectionKey
  startDate: string
  initialRows: Row[]
  onSaved: (log: ActivityLog, count: number) => void
}) {
  const save = useActivityLogSave()
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [errors, setErrors] = useState<Record<number, EntryErrors>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: number, draft: EntryDraft) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...draft } : r)))
    // Clear a row's messages once it's being fixed, rather than nagging mid-typing.
    setErrors((es) => ({ ...es, [key]: {} }))
  }

  const addDay = () => {
    const last = rows[rows.length - 1]
    setRows((rs) => [
      ...rs,
      {
        key: Math.max(...rs.map((r) => r.key)) + 1,
        date: "",
        description: last?.description ?? "",
        minutes: 60,
      },
    ])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const found = Object.fromEntries(rows.map((r) => [r.key, entryErrors(r, startDate)]))
    setErrors(found)
    if (Object.values(found).some((f) => Object.keys(f).length)) {
      setError(null)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const log = await save(`${section}/entries`, "POST", {
        entries: rows.map((r) => ({ date: r.date, description: r.description.trim(), minutes: r.minutes })),
      })
      onSaved(log, rows.length)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const several = rows.length > 1
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <div
          key={row.key}
          role={several ? "group" : undefined}
          aria-labelledby={several ? `entry-${row.key}-heading` : undefined}
          className={several ? "bg-card flex flex-col gap-3 rounded-lg border p-4" : "flex flex-col gap-3"}
        >
          {several && (
            <div className="flex items-center justify-between gap-2">
              <h3 id={`entry-${row.key}-heading`} className="text-sm font-semibold">
                {row.week ? weekLabel(row.week) : `Day ${i + 1}`}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${row.week ? weekLabel(row.week) : `day ${i + 1}`}`}
                onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
              >
                <X />
              </Button>
            </div>
          )}
          <EntryFields
            id={`entry-${row.key}`}
            draft={row}
            errors={errors[row.key] ?? {}}
            startDate={startDate}
            onChange={(d) => update(row.key, d)}
          />
        </div>
      ))}

      <ErrorAlert message={error} title="That didn't save" />

      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button type="submit" disabled={saving} className="h-11">
          {saving && <Spinner />}
          {several ? `Save ${rows.length} days to my log` : "Save to my log"}
        </Button>
        <Button type="button" variant="outline" onClick={addDay} className="h-11">
          <Plus />
          Add another day
        </Button>
      </div>
    </form>
  )
}
