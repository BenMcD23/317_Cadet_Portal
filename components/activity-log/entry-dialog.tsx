"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ErrorAlert } from "@/components/error-alert"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/responsive-dialog"
import {
  EntryFields,
  entryErrors,
  type EntryDraft,
  type EntryErrors,
} from "@/components/activity-log/entry-fields"
import { dayLabel, useActivityLogSave, type Entry, type SectionKey } from "@/lib/activity-log"

/**
 * Change or remove one thing already logged. Delete asks twice inside the
 * sheet itself, so a stray tap on a phone can't lose an entry.
 */
export function EntryDialog({
  section,
  startDate,
  entry,
  onClose,
}: {
  section: SectionKey
  startDate: string
  entry: Entry | null
  onClose: () => void
}) {
  return (
    <ResponsiveDialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        {entry && (
          <EntryEditor
            key={entry.id}
            section={section}
            startDate={startDate}
            entry={entry}
            onClose={onClose}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function EntryEditor({
  section,
  startDate,
  entry,
  onClose,
}: {
  section: SectionKey
  startDate: string
  entry: Entry
  onClose: () => void
}) {
  const save = useActivityLogSave()
  const [draft, setDraft] = useState<EntryDraft>({
    date: entry.date,
    description: entry.description,
    minutes: entry.minutes,
  })
  const [errors, setErrors] = useState<EntryErrors>({})
  const [busy, setBusy] = useState<"save" | "delete" | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (kind: "save" | "delete") => {
    if (kind === "save") {
      const found = entryErrors(draft, startDate)
      setErrors(found)
      if (Object.keys(found).length) return
    }
    setBusy(kind)
    setError(null)
    try {
      const path = `${section}/entries/${entry.id}`
      if (kind === "save") {
        await save(path, "PATCH", { ...draft, description: draft.description.trim() })
      } else {
        await save(path, "DELETE")
      }
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Change {dayLabel(entry.date)}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Fix anything that&apos;s wrong, or remove it.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <div className="py-2">
        <EntryFields
          id="edit"
          draft={draft}
          errors={errors}
          startDate={startDate}
          onChange={(d) => {
            setDraft(d)
            setErrors({})
          }}
        />
      </div>
      <ErrorAlert message={error} title="That didn't save" />
      <ResponsiveDialogFooter>
        <Button
          type="button"
          variant={confirmDelete ? "destructive" : "outline"}
          onClick={() => (confirmDelete ? run("delete") : setConfirmDelete(true))}
          disabled={busy !== null}
          className="h-11 sm:mr-auto"
        >
          {busy === "delete" ? <Spinner /> : <Trash2 />}
          {confirmDelete ? "Yes, remove it" : "Remove"}
        </Button>
        <Button type="button" onClick={() => run("save")} disabled={busy !== null} className="h-11">
          {busy === "save" && <Spinner />}
          Save changes
        </Button>
      </ResponsiveDialogFooter>
    </>
  )
}
