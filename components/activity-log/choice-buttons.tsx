"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * A row of big pick-one buttons ("30 min", "1 hour", "3 months"…) instead of
 * a dropdown: one tap on a phone, every option visible, and nothing to learn.
 * The chosen one is filled and announced as pressed.
 */
export function ChoiceButtons<T extends string | number>({
  labelledBy,
  options,
  value,
  onChange,
  invalid,
  className,
}: {
  labelledBy: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
  invalid?: boolean
  className?: string
}) {
  return (
    <div role="group" aria-labelledby={labelledBy} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <Button
            key={String(o.value)}
            type="button"
            variant={on ? "default" : "outline"}
            aria-pressed={on}
            aria-invalid={invalid || undefined}
            onClick={() => onChange(o.value)}
            className="h-11 min-w-20 flex-1 sm:flex-none"
          >
            {o.label}
          </Button>
        )
      })}
    </div>
  )
}
