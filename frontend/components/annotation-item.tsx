'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Annotation } from '@/lib/database.types';

interface AnnotationItemProps {
  annotation: Annotation;
  currentUserId?: string;
  onUpdate?: (annotationId: string, content: string) => Promise<void>;
  onDelete?: (annotationId: string) => Promise<void>;
}

export function AnnotationItem({
  annotation,
  currentUserId,
  onUpdate,
  onDelete,
}: AnnotationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(annotation.content);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUserId === annotation.created_by;
  const initials = annotation.created_by?.slice(0, 2).toUpperCase() ?? '??';

  const handleSave = async () => {
    if (!editContent.trim() || !onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(annotation.id, editContent.trim());
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(annotation.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete(annotation.id);
  };

  return (
    <div className="group flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        <User className="h-4 w-4" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {new Date(annotation.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {annotation.version > 1 && (
              <span className="ml-1 text-muted-foreground/60">(edited v{annotation.version})</span>
            )}
          </p>

          {isOwner && !isEditing && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !editContent.trim()}>
                <Check className="mr-1 h-3 w-3" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm">{annotation.content}</p>
        )}
      </div>
    </div>
  );
}
