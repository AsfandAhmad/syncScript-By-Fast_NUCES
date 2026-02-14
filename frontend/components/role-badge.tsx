import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type VaultRole = 'owner' | 'contributor' | 'viewer';

const roleConfig: Record<VaultRole, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  },
  contributor: {
    label: "Contributor",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  viewer: {
    label: "Viewer",
    className: "bg-secondary text-muted-foreground border-border hover:bg-secondary",
  },
}

interface RoleBadgeProps {
  role: VaultRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]
  if (!config) return null;
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 text-xs font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
