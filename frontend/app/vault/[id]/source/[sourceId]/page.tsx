'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  ExternalLink,
  Link2,
  MessageSquare,
  Edit3,
} from 'lucide-react';
import { sourceService } from '@/lib/services/source.service';
import { annotationService } from '@/lib/services/source.annotation.service';
import { Source, Annotation, AnnotationWithAuthor } from '@/lib/database.types';
import { AnnotationItem } from '@/components/annotation-item';
import { formatDistanceToNow } from 'date-fns';
import { realtimeService } from '@/lib/services/realtime.service';

export default function SourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const vaultId = params.id as string;
  const sourceId = params.sourceId as string;

  const [source, setSource] = useState<Source | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add annotation
  const [addAnnotationOpen, setAddAnnotationOpen] = useState(false);
  const [addingAnnotation, setAddingAnnotation] = useState(false);
  const [newAnnotationContent, setNewAnnotationContent] = useState('');

  // Edit annotation
  const [editAnnotationId, setEditAnnotationId] = useState<string | null>(null);
  const [editAnnotationContent, setEditAnnotationContent] = useState('');
  const [editAnnotationOpen, setEditAnnotationOpen] = useState(false);
  const [updatingAnnotation, setUpdatingAnnotation] = useState(false);

  // Check auth
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Load data
  const loadData = useCallback(async () => {
    if (!user || !sourceId) return;

    try {
      setLoading(true);
      const [sourceRes, annotationsRes] = await Promise.all([
        sourceService.getSourceById(sourceId),
        annotationService.getAnnotationsBySource(sourceId),
      ]);

      if (sourceRes.status === 'error') {
        throw new Error(sourceRes.error || 'Failed to load source');
      }

      setSource(sourceRes.data);
      // Cast annotations — in a real app we'd join with profiles
      setAnnotations((annotationsRes.data || []) as AnnotationWithAuthor[]);
      setError('');
    } catch (err) {
      setError('Failed to load source data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, sourceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime annotations subscription
  useEffect(() => {
    if (!sourceId) return;

    const unsubAnnotations = realtimeService.subscribeToAnnotations(sourceId, (data) => {
      if (data.type === 'annotation_added') {
        setAnnotations((prev) => {
          if (prev.find((a) => a.id === data.payload.new.id)) return prev;
          return [data.payload.new as AnnotationWithAuthor, ...prev];
        });
      } else if (data.type === 'annotation_updated') {
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === data.payload.new.id ? { ...a, ...data.payload.new } : a
          )
        );
      } else if (data.type === 'annotation_deleted') {
        setAnnotations((prev) => prev.filter((a) => a.id !== data.payload.old.id));
      }
    });

    return () => {
      unsubAnnotations();
    };
  }, [sourceId]);

  // Handlers
  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotationContent.trim()) return;

    setAddingAnnotation(true);
    try {
      const response = await annotationService.createAnnotation(sourceId, newAnnotationContent);
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to add annotation');
      }
      if (response.data) {
        const newAnnotation: AnnotationWithAuthor = {
          ...response.data,
          author_email: user?.email,
        };
        setAnnotations((prev) => [newAnnotation, ...prev]);
      }
      setNewAnnotationContent('');
      setAddAnnotationOpen(false);
      setError('');
    } catch (err) {
      setError('Failed to add annotation.');
      console.error(err);
    } finally {
      setAddingAnnotation(false);
    }
  };

  const handleEditAnnotation = (id: string, content: string) => {
    setEditAnnotationId(id);
    setEditAnnotationContent(content);
    setEditAnnotationOpen(true);
  };

  const handleUpdateAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAnnotationId || !editAnnotationContent.trim()) return;

    setUpdatingAnnotation(true);
    try {
      const response = await annotationService.updateAnnotation(
        editAnnotationId,
        editAnnotationContent
      );
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to update annotation');
      }
      if (response.data) {
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === editAnnotationId
              ? { ...a, content: response.data!.content, version: response.data!.version, updated_at: response.data!.updated_at }
              : a
          )
        );
      }
      setEditAnnotationOpen(false);
      setEditAnnotationId(null);
      setEditAnnotationContent('');
      setError('');
    } catch (err) {
      setError('Failed to update annotation.');
      console.error(err);
    } finally {
      setUpdatingAnnotation(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      const response = await annotationService.deleteAnnotation(annotationId);
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to delete annotation');
      }
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    } catch (err) {
      setError('Failed to delete annotation.');
      console.error(err);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/vault/${vaultId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vault
        </Button>
        <div className="mt-8 text-center">
          <p className="text-gray-600">Source not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/vault/${vaultId}`)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {source.title || source.url || 'Untitled Source'}
                </h1>
                {source.version > 1 && (
                  <Badge variant="outline" className="shrink-0">v{source.version}</Badge>
                )}
              </div>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-0.5"
                >
                  <Link2 className="h-3 w-3" />
                  {source.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Source metadata */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {source.metadata?.author && (
                <div>
                  <p className="text-xs text-muted-foreground">Author</p>
                  <p className="font-medium">{source.metadata.author}</p>
                </div>
              )}
              {source.metadata?.journal && (
                <div>
                  <p className="text-xs text-muted-foreground">Journal</p>
                  <p className="font-medium">{source.metadata.journal}</p>
                </div>
              )}
              {source.metadata?.year && (
                <div>
                  <p className="text-xs text-muted-foreground">Year</p>
                  <p className="font-medium">{source.metadata.year}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Added</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Annotations section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Annotations ({annotations.length})
          </h2>

          <Dialog open={addAnnotationOpen} onOpenChange={setAddAnnotationOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600" size="sm">
                <Plus className="h-4 w-4" />
                Add Annotation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddAnnotation}>
                <DialogHeader>
                  <DialogTitle>Add Annotation</DialogTitle>
                  <DialogDescription>
                    Write your annotation, note, or comment about this source.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Write your annotation here..."
                    value={newAnnotationContent}
                    onChange={(e) => setNewAnnotationContent(e.target.value)}
                    disabled={addingAnnotation}
                    rows={5}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddAnnotationOpen(false)}
                    disabled={addingAnnotation}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addingAnnotation || !newAnnotationContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addingAnnotation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Annotation'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Annotation Dialog */}
        <Dialog open={editAnnotationOpen} onOpenChange={setEditAnnotationOpen}>
          <DialogContent>
            <form onSubmit={handleUpdateAnnotation}>
              <DialogHeader>
                <DialogTitle>Edit Annotation</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  value={editAnnotationContent}
                  onChange={(e) => setEditAnnotationContent(e.target.value)}
                  disabled={updatingAnnotation}
                  rows={5}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditAnnotationOpen(false)}
                  disabled={updatingAnnotation}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingAnnotation || !editAnnotationContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updatingAnnotation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Annotations list */}
        {annotations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-gray-600 mb-4">
                No annotations yet. Add one to start discussing this source.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {annotations.map((annotation) => (
              <AnnotationItem
                key={annotation.id}
                annotation={annotation}
                currentUserId={user.id}
                onEdit={handleEditAnnotation}
                onDelete={handleDeleteAnnotation}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
