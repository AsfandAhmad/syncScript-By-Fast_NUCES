import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

const roleConfig: Record<Role, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10",
  },
  editor: {
    label: "Editor",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  reviewer: {
    label: "Reviewer",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  viewer: {
    label: "Viewer",
    className: "bg-secondary text-muted-foreground border-border hover:bg-secondary",
  },
}

interface RoleBadgeProps {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 text-xs font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
