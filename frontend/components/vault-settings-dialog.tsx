'use client';

import { useState } from 'react';
import { Archive, ArchiveRestore, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { vaultService } from '@/lib/services/vault.service';
import { toast } from 'sonner';
import type { Vault } from '@/lib/database.types';

interface VaultSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vault: Vault;
  sourcesCount: number;
  filesCount: number;
  membersCount: number;
  onVaultUpdated?: () => void;
  onVaultDeleted?: () => void;
}

export function VaultSettingsDialog({
  open,
  onOpenChange,
  vault,
  sourcesCount,
  filesCount,
  membersCount,
  onVaultUpdated,
  onVaultDeleted,
}: VaultSettingsDialogProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const handleToggleArchive = async () => {
    setArchiving(true);
    try {
      const result = await vaultService.updateVault(vault.id, {
        is_archived: !vault.is_archived,
      });
      if (result.status === 'success') {
        toast.success(vault.is_archived ? 'Vault unarchived' : 'Vault archived');
        onVaultUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update vault');
      }
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    const result = await vaultService.deleteVault(vault.id);
    if (result.status === 'success') {
      toast.success('Vault deleted');
      onVaultDeleted?.();
    } else {
      toast.error(result.error || 'Failed to delete vault');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vault Settings</DialogTitle>
            <DialogDescription>Manage vault options and view statistics.</DialogDescription>
          </DialogHeader>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{sourcesCount}</p>
              <p className="text-xs text-muted-foreground">Sources</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{filesCount}</p>
              <p className="text-xs text-muted-foreground">Files</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{membersCount}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>

          {/* Archive */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {vault.is_archived ? 'Unarchive vault' : 'Archive vault'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {vault.is_archived
                    ? 'Restore this vault to active status.'
                    : 'Archived vaults are read-only and hidden by default.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleArchive}
                disabled={archiving}
              >
                {archiving ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : vault.is_archived ? (
                  <ArchiveRestore className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <Archive className="mr-1 h-3.5 w-3.5" />
                )}
                {vault.is_archived ? 'Unarchive' : 'Archive'}
              </Button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-lg border border-destructive/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-destructive">Delete vault</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this vault and all its data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete vault permanently?"
        description={`This will permanently delete "${vault.name}" and all its sources (${sourcesCount}), files (${filesCount}), and members (${membersCount}). This action cannot be undone.`}
        actionLabel="Delete Vault"
        onConfirm={handleDelete}
      />
    </>
  );
}
