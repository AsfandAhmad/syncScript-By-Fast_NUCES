'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { editVaultSchema, type EditVaultFormValues } from '@/lib/form-validators';
import { vaultService } from '@/lib/services/vault.service';
import { toast } from 'sonner';
import type { Vault } from '@/lib/database.types';

interface EditVaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vault: Vault;
  onVaultUpdated?: () => void;
}

export function EditVaultDialog({
  open,
  onOpenChange,
  vault,
  onVaultUpdated,
}: EditVaultDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditVaultFormValues>({
    resolver: zodResolver(editVaultSchema),
    defaultValues: { name: vault.name, description: vault.description || '' },
  });

  useEffect(() => {
    reset({ name: vault.name, description: vault.description || '' });
  }, [vault, reset]);

  const onSubmit = async (values: EditVaultFormValues) => {
    setSubmitting(true);
    try {
      const result = await vaultService.updateVault(vault.id, {
        name: values.name,
        description: values.description || undefined,
      });
      if (result.status === 'success') {
        toast.success('Vault updated!');
        onOpenChange(false);
        onVaultUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update vault');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit vault</DialogTitle>
          <DialogDescription>Update the name or description of this vault.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-vault-name">Name</Label>
            <Input
              id="edit-vault-name"
              placeholder="e.g. ML Research Paper"
              {...register('name')}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-vault-desc">Description (optional)</Label>
            <Textarea
              id="edit-vault-desc"
              placeholder="Brief description…"
              {...register('description')}
              className="resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !isDirty}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
