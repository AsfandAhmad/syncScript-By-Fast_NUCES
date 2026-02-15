'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/role-badge';
import { Trash2, FolderOpen, Clock, FileText, Globe, UserPlus, Loader2 } from 'lucide-react';
import { Vault, Role } from '@/lib/database.types';
import { useState } from 'react';

interface VaultCardProps {
  vault: Vault;
  onClick?: () => void;
  onDelete?: () => void;
  sourceCount?: number;
  fileCount?: number;
  /** Current user's role in this vault – used to show a role badge and gate delete */
  userRole?: Role;
  /** Owner display name (for public vault listings) */
  ownerName?: string;
  /** Whether current user is already a member of this vault */
  isMember?: boolean;
  /** Called when user clicks Join on a public vault */
  onJoin?: () => Promise<void>;
}

export default function VaultCard({ vault, onClick, onDelete, sourceCount, fileCount, userRole, ownerName, isMember = true, onJoin }: VaultCardProps) {
  const showDelete = onDelete && userRole === 'owner';
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onJoin) return;
    setJoining(true);
    try {
      await onJoin();
    } finally {
      setJoining(false);
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group border-border/60 hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{vault.name}</span>
            </CardTitle>
            {vault.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {vault.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isMember && onJoin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleJoin}
                disabled={joining}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {joining ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <UserPlus className="mr-1 h-3 w-3" />}
                Join
              </Button>
            )}
            {showDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(vault.created_at).toLocaleDateString()}
          </div>
          {vault.is_public && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Globe className="h-2.5 w-2.5" /> Public
            </Badge>
          )}
          {userRole && <RoleBadge role={userRole} />}
          {ownerName && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              by {ownerName}
            </span>
          )}
          {vault.is_archived && (
            <Badge variant="secondary" className="text-[10px]">
              Archived
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
