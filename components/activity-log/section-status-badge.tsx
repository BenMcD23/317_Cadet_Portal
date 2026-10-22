import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SectionStatus } from "@/lib/activity-log"

// "To do" is the only state asking the cadet for something, so it's the one
// that stands out; the word always says it too.
const TONE: Record<SectionStatus["tone"], string> = {
  todo: "border-warning/40 bg-warning/10 text-warning",
  done: "border-success/40 bg-success/10 text-success",
  idle: "text-muted-foreground",
}

/** Where a DofE section is up to this week, as a badge. */
export function SectionStatusBadge({ status }: { status: SectionStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs", TONE[status.tone])}>
      {status.label}
    </Badge>
  )
}
