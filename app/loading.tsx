import { Skeleton } from "@/components/ui/skeleton"

// Instant fallback Next.js swaps in the moment navigation starts (see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md) —
// without it, a slow client-side transition leaves the previous page on
// screen with no feedback, which reads as "nothing happened" on mobile.
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-40" />
    </div>
  )
}
