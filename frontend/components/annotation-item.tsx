import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/role-badge"
import type { Annotation } from "@/lib/types"

interface AnnotationItemProps {
  annotation: Annotation
}

export function AnnotationItem({ annotation }: AnnotationItemProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
          {annotation.avatarFallback}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {annotation.author}
          </span>
          <RoleBadge role={annotation.authorRole} className="text-[10px] px-1.5 py-0" />
          <span className="text-xs text-muted-foreground">
            {annotation.timestamp}
          </span>
        </div>
        {annotation.highlight && (
          <div className="mt-2 rounded border-l-2 border-primary/40 bg-primary/5 px-3 py-1.5">
            <p className="text-xs italic leading-relaxed text-muted-foreground">
              {annotation.highlight}
            </p>
          </div>
        )}
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {annotation.content}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Page {annotation.page}
        </p>
      </div>
    </div>
  )
}
