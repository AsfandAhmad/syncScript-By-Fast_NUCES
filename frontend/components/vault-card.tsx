'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, FolderOpen, Clock, FileText } from 'lucide-react';
import { Vault } from '@/lib/database.types';

interface VaultCardProps {
  vault: Vault;
  onClick?: () => void;
  onDelete?: () => void;
  sourceCount?: number;
  fileCount?: number;
}

export default function VaultCard({ vault, onClick, onDelete, sourceCount, fileCount }: VaultCardProps) {
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
          {onDelete && (
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
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(vault.created_at).toLocaleDateString()}
          </div>
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
