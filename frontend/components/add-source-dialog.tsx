'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { addSourceSchema, type AddSourceFormValues } from '@/lib/form-validators';
import { sourceService } from '@/lib/services/source.service';
import { toast } from 'sonner';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onSourceAdded?: () => void;
}

export function AddSourceDialog({
  open,
  onOpenChange,
  vaultId,
  onSourceAdded,
}: AddSourceDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddSourceFormValues>({
    resolver: zodResolver(addSourceSchema),
    defaultValues: { url: '', title: '' },
  });

  const onSubmit = async (values: AddSourceFormValues) => {
    setSubmitting(true);
    try {
      const result = await sourceService.createSource(
        vaultId,
        values.url,
        values.title || undefined,
      );
      if (result.status === 'success') {
        toast.success('Source added!');
        reset();
        onOpenChange(false);
        onSourceAdded?.();
      } else {
        toast.error(result.error || 'Failed to add source');
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
          <DialogTitle>Add a source</DialogTitle>
          <DialogDescription>
            Paste a URL to a paper, article, or document.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="source-url">URL</Label>
            <Input
              id="source-url"
              placeholder="https://arxiv.org/abs/…"
              {...register('url')}
              autoFocus
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-title">Title (optional)</Label>
            <Input
              id="source-title"
              placeholder="Paper title…"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
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
              Add Source
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
