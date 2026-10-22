"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ErrorAlert } from "@/components/error-alert"
import { ChoiceButtons } from "@/components/activity-log/choice-buttons"
import {
  DURATIONS,
  SECTION_INFO,
  useActivityLogSave,
  type ActivityLog,
  type SectionKey,
  type SectionLog,
} from "@/lib/activity-log"
import { todayLocal } from "@/lib/format"

type Setup = {
  activity: string
  goal: string
  assessor_name: string
  assessor_role: string
  duration_months: number | null
  start_date: string
}

const PLACEHOLDERS: Record<SectionKey, { activity: string; goal: string; role: string }> = {
  skills: {
    activity: "Learning the guitar",
    goal: "Play three songs all the way through",
    role: "Music teacher",
  },
  volunteering: {
    activity: "Helping at the charity shop",
    goal: "Run the till on my own",
    role: "Shop manager",
  },
  physical: { activity: "Swimming", goal: "Swim 1km without stopping", role: "Swimming coach" },
}

function setupErrors(s: Setup): Partial<Record<keyof Setup, string>> {
  const errors: Partial<Record<keyof Setup, string>> = {}
  if (!s.activity.trim()) errors.activity = "Say what your activity is"
  if (!s.goal.trim()) errors.goal = "Say what you want to get better at or achieve"
  if (!s.duration_months) errors.duration_months = "Pick how long you're doing it for"
  if (!s.start_date) errors.start_date = "Pick the day you started"
  return errors
}

/**
 * The top of the paper sheet: activity, goal, assessor, how long and when it
 * starts. Used to set a section up and, in a dialog, to change it when the
 * cadet changes their mind. The assessor can be left for later: a cadet who
 * doesn't know yet shouldn't be stuck on the first screen.
 */
export function SetupForm({
  section,
  log,
  onSaved,
  onCancel,
}: {
  section: SectionKey
  log?: SectionLog | null
  onSaved: (log: ActivityLog) => void
  onCancel?: () => void
}) {
  const save = useActivityLogSave()
  const [form, setForm] = useState<Setup>({
    activity: log?.activity ?? "",
    goal: log?.goal ?? "",
    assessor_name: log?.assessor_name ?? "",
    assessor_role: log?.assessor_role ?? "",
    duration_months: log?.duration_months ?? null,
    start_date: log?.start_date ?? todayLocal(),
  })
  const [errors, setErrors] = useState<Partial<Record<keyof Setup, string>>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ph = PLACEHOLDERS[section]

  const set = <K extends keyof Setup>(key: K, value: Setup[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const found = setupErrors(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setError(null)
    try {
      onSaved(await save(section, "PUT", form))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof Setup) => ({
    id: `setup-${key}`,
    "aria-invalid": !!errors[key] || undefined,
    "aria-describedby": errors[key] ? `setup-${key}-error` : undefined,
  })
  const err = (key: keyof Setup) =>
    errors[key] && (
      <p id={`setup-${key}-error`} className="text-destructive text-sm">
        {errors[key]}
      </p>
    )

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setup-activity">
          What&apos;s your {SECTION_INFO[section].label.toLowerCase()} activity?
        </Label>
        <Input
          {...field("activity")}
          value={form.activity}
          onChange={(e) => set("activity", e.target.value)}
          placeholder={ph.activity}
          maxLength={300}
        />
        {err("activity")}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setup-goal">What&apos;s your goal?</Label>
        <Textarea
          {...field("goal")}
          value={form.goal}
          onChange={(e) => set("goal", e.target.value)}
          placeholder={ph.goal}
          maxLength={1000}
        />
        {err("goal")}
      </div>

      <div className="flex flex-col gap-1.5">
        <span id="setup-duration-label" className="text-sm leading-none font-medium">
          How long for?
        </span>
        <p className="text-muted-foreground text-sm">
          Ask staff if you&apos;re not sure which one you&apos;re doing.
        </p>
        <ChoiceButtons
          labelledBy="setup-duration-label"
          options={DURATIONS.map((m) => ({ value: m as number, label: `${m} months` }))}
          value={form.duration_months}
          onChange={(m) => set("duration_months", m)}
          invalid={!!errors.duration_months}
        />
        {err("duration_months")}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setup-start_date">Start date</Label>
        <Input
          {...field("start_date")}
          type="date"
          value={form.start_date}
          onChange={(e) => set("start_date", e.target.value)}
          className="w-fit"
        />
        {err("start_date")}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Your assessor</span>
          <p className="text-muted-foreground text-sm">
            The adult who sees you do it, like your coach or teacher. Not sure yet? Leave it and add it later.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-assessor_name">Their name</Label>
          <Input
            {...field("assessor_name")}
            value={form.assessor_name}
            onChange={(e) => set("assessor_name", e.target.value)}
            autoComplete="off"
            maxLength={120}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-assessor_role">What they do</Label>
          <Input
            {...field("assessor_role")}
            value={form.assessor_role}
            onChange={(e) => set("assessor_role", e.target.value)}
            placeholder={ph.role}
            maxLength={120}
          />
        </div>
      </div>

      <ErrorAlert message={error} title="That didn't save" />

      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button type="submit" disabled={saving} className="h-11">
          {saving && <Spinner />}
          {log ? "Save changes" : "Start my log"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-11">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
