'use client';

import { useState, useEffect } from 'react';
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
import { editSourceSchema, type EditSourceFormValues } from '@/lib/form-validators';
import { sourceService } from '@/lib/services/source.service';
import { toast } from 'sonner';
import type { Source } from '@/lib/database.types';

interface EditSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: Source;
  onSourceUpdated?: () => void;
}

export function EditSourceDialog({
  open,
  onOpenChange,
  source,
  onSourceUpdated,
}: EditSourceDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditSourceFormValues>({
    resolver: zodResolver(editSourceSchema),
    defaultValues: { url: source.url, title: source.title || '' },
  });

  // Reset form when source changes
  useEffect(() => {
    reset({ url: source.url, title: source.title || '' });
  }, [source, reset]);

  const onSubmit = async (values: EditSourceFormValues) => {
    setSubmitting(true);
    try {
      const result = await sourceService.updateSource(source.id, {
        url: values.url,
        title: values.title || undefined,
      });
      if (result.status === 'success') {
        toast.success('Source updated!');
        onOpenChange(false);
        onSourceUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update source');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit source</DialogTitle>
          <DialogDescription>
            Update the URL or title of this source. Version {source.version}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-source-url">URL</Label>
            <Input
              id="edit-source-url"
              placeholder="https://arxiv.org/abs/…"
              {...register('url')}
              autoFocus
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-source-title">Title (optional)</Label>
            <Input
              id="edit-source-title"
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
              onClick={() => onOpenChange(false)}
            >
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
