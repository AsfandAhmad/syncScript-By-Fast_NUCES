'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, FolderOpen, Users, BookOpen, FileText } from 'lucide-react';
import { RoleBadge } from '@/components/role-badge';
import { VaultWithMeta } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';

interface VaultCardProps {
  vault: VaultWithMeta;
  onClick?: () => void;
  onDelete?: () => void;
}

export default function VaultCard({ vault, onClick, onDelete }: VaultCardProps) {
  const timeAgo = vault.created_at
    ? formatDistanceToNow(new Date(vault.created_at), { addSuffix: true })
    : '';

  return (
    <Card
      className="flex h-full flex-col hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-5 w-5 shrink-0 text-blue-600" />
              <span className="truncate">{vault.name}</span>
            </CardTitle>
            {vault.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {vault.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {vault.user_role && <RoleBadge role={vault.user_role} />}
            {vault.is_archived && (
              <Badge variant="secondary" className="text-[10px]">Archived</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {vault.source_count !== undefined && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {vault.source_count} source{vault.source_count !== 1 ? 's' : ''}
            </span>
          )}
          {vault.file_count !== undefined && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {vault.file_count} file{vault.file_count !== 1 ? 's' : ''}
            </span>
          )}
          {vault.member_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {vault.member_count}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Created {timeAgo}
          </p>
          {onDelete && vault.user_role === 'owner' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
