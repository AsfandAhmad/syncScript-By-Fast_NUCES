'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PdfPreview } from '@/components/pdf-preview';
import { AnnotationEditor } from '@/components/annotation-editor';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeAnnotations } from '@/hooks/use-realtime';
import { sourceService } from '@/lib/services/source.service';
import { annotationService } from '@/lib/services/source.annotation.service';
import { toast } from 'sonner';
import type { Source, Annotation } from '@/lib/database.types';

export default function SourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  const sourceId = params.sourceId as string;
  const { user } = useAuth();

  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAnnotations, setInitialAnnotations] = useState<Annotation[]>([]);

  const { annotations } = useRealtimeAnnotations(sourceId, initialAnnotations);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sourceRes, annotRes] = await Promise.all([
        sourceService.getSourceById(sourceId),
        annotationService.getAnnotationsBySource(sourceId),
      ]);

      if (sourceRes.status === 'success' && sourceRes.data) {
        setSource(sourceRes.data);
      } else {
        toast.error('Source not found');
        router.push(`/vault/${vaultId}`);
        return;
      }

      setInitialAnnotations(annotRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [sourceId, vaultId, router]);

  useEffect(() => {
    if (sourceId) fetchData();
  }, [sourceId, fetchData]);

  const refreshAnnotations = async () => {
    const res = await annotationService.getAnnotationsBySource(sourceId);
    setInitialAnnotations(res.data || []);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!source) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/vault/${vaultId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate font-semibold">{source.title || 'Untitled Source'}</h1>
            <p className="truncate text-xs text-muted-foreground">{source.url}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(source.url, '_blank')}
          >
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Open
          </Button>
        </div>
      </header>

      {/* Two-column layout */}
      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Preview */}
          <div className="h-[600px] lg:h-[calc(100vh-8rem)]">
            <PdfPreview url={source.url} title={source.title} />
          </div>

          {/* Right: Annotations */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Annotations ({annotations.length})
            </h2>
            <AnnotationEditor
              sourceId={sourceId}
              annotations={annotations}
              currentUserId={user?.id}
              onAnnotationsChanged={refreshAnnotations}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
