import { Skeleton } from "@/components/ui/skeleton"

export function VaultCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-2/3" />
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="flex -space-x-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
