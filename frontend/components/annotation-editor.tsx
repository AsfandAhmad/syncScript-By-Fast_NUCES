'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { annotationService } from '@/lib/services/source.annotation.service';
import { AnnotationItem } from '@/components/annotation-item';
import { toast } from 'sonner';
import type { Annotation } from '@/lib/database.types';

interface AnnotationEditorProps {
  sourceId: string;
  annotations: Annotation[];
  currentUserId?: string;
  onAnnotationsChanged?: () => void;
  /** When false the create annotation form is hidden (viewer role). Defaults to true. */
  canAdd?: boolean;
  /** When false edit/delete buttons are hidden. Defaults to true. */
  canEdit?: boolean;
}

export function AnnotationEditor({
  sourceId,
  annotations,
  currentUserId,
  onAnnotationsChanged,
  canAdd = true,
  canEdit = true,
}: AnnotationEditorProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const result = await annotationService.createAnnotation(sourceId, content.trim());
      if (result.status === 'success') {
        setContent('');
        onAnnotationsChanged?.();
      } else {
        toast.error(result.error || 'Failed to create annotation');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (annotationId: string, newContent: string) => {
    const result = await annotationService.updateAnnotation(annotationId, newContent);
    if (result.status === 'success') {
      onAnnotationsChanged?.();
    } else {
      toast.error(result.error || 'Failed to update annotation');
    }
  };

  const handleDelete = async (annotationId: string) => {
    const result = await annotationService.deleteAnnotation(annotationId);
    if (result.status === 'success') {
      onAnnotationsChanged?.();
    } else {
      toast.error(result.error || 'Failed to delete annotation');
    }
  };

  return (
    <div className="space-y-4">
      {/* New annotation input – hidden for viewers */}
      {canAdd && (
      <div className="space-y-2">
        <Textarea
          placeholder="Write an annotation…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleCreate} disabled={saving || !content.trim()}>
            {saving ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1 h-3.5 w-3.5" />
            )}
            Add Annotation
          </Button>
        </div>
      </div>
      )}

      {/* Annotation list */}
      <div className="space-y-2">
        {annotations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No annotations yet. Be the first to add one!
          </p>
        ) : (
          annotations.map((ann) => (
            <AnnotationItem
              key={ann.id}
              annotation={ann}
              currentUserId={currentUserId}
              onUpdate={canEdit ? handleUpdate : undefined}
              onDelete={canEdit ? handleDelete : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
