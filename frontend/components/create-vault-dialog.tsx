'use client';

import { useState } from 'react';
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
import { createVaultSchema, type CreateVaultFormValues } from '@/lib/form-validators';
import { vaultService } from '@/lib/services/vault.service';
import { toast } from 'sonner';

interface CreateVaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVaultCreated?: () => void;
}

export function CreateVaultDialog({
  open,
  onOpenChange,
  onVaultCreated,
}: CreateVaultDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateVaultFormValues>({
    resolver: zodResolver(createVaultSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (values: CreateVaultFormValues) => {
    setSubmitting(true);
    try {
      const result = await vaultService.createVault(
        values.name,
        values.description || undefined,
      );
      if (result.status === 'success') {
        toast.success('Vault created!');
        reset();
        onOpenChange(false);
        onVaultCreated?.();
      } else {
        toast.error(result.error || 'Failed to create vault');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new vault</DialogTitle>
          <DialogDescription>
            Vaults help you organize sources, annotations, and files for a research project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="vault-name">Name</Label>
            <Input
              id="vault-name"
              placeholder="e.g. ML Research Paper"
              {...register('name')}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vault-desc">Description (optional)</Label>
            <Textarea
              id="vault-desc"
              placeholder="Brief description of this vault…"
              {...register('description')}
              className="resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
