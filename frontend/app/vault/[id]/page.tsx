'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Loader2,
  FileText,
  Users,
  Activity,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SourceItem } from '@/components/source-item';
import { FileListPanel } from '@/components/file-list-panel';
import FileUploader from '@/components/file-uploader';
import { MemberManagement } from '@/components/member-management';
import { ActivityFeed } from '@/components/activity-feed';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeSources, useRealtimeMembers, useRealtimeActivity } from '@/hooks/use-realtime';
import { vaultService } from '@/lib/services/vault.service';
import { sourceService } from '@/lib/services/source.service';
import { fileService } from '@/lib/services/file.service';
import supabase from '@/lib/supabase-client';
import { toast } from 'sonner';
import type { Vault, Source, VaultMember, FileRecord, ActivityLog, Role } from '@/lib/database.types';

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  const { user } = useAuth();

  // Core state
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Role | undefined>();

  // Sources – initial fetch
  const [initialSources, setInitialSources] = useState<Source[]>([]);
  const [initialMembers, setInitialMembers] = useState<VaultMember[]>([]);
  const [initialActivity, setInitialActivity] = useState<ActivityLog[]>([]);

  // Realtime subscriptions
  const { sources } = useRealtimeSources(vaultId, initialSources);
  const { members } = useRealtimeMembers(vaultId, initialMembers);
  const { activities: activity } = useRealtimeActivity(vaultId, initialActivity);

  // Add source dialog
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  const fetchVaultData = useCallback(async () => {
    setLoading(true);
    try {
      const [vaultRes, sourcesRes, membersRes, filesRes] = await Promise.all([
        vaultService.getVaultById(vaultId),
        sourceService.getSourcesByVault(vaultId),
        vaultService.getVaultMembers(vaultId),
        fileService.getFilesByVault(vaultId),
      ]);

      if (vaultRes.status === 'success' && vaultRes.data) {
        setVault(vaultRes.data);
      } else {
        toast.error('Vault not found');
        router.push('/dashboard');
        return;
      }

      setInitialSources(sourcesRes.data || []);

      if (membersRes.status === 'success') {
        setInitialMembers(membersRes.data || []);
        const me = (membersRes.data || []).find((m) => m.user_id === user?.id);
        setCurrentUserRole(me?.role);
      }

      if (filesRes.status === 'success') {
        setFiles(filesRes.data || []);
      }

      // Fetch activity logs
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const activityRes = await fetch(`/api/vaults/${vaultId}/activity`, {
          headers: { Authorization: `Bearer ${session?.access_token || ''}` },
        });
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setInitialActivity(activityData.data || []);
        }
      } catch {
        // Activity feed is optional – don't block if it fails
      }
    } finally {
      setLoading(false);
    }
  }, [vaultId, user?.id, router]);

  useEffect(() => {
    if (vaultId) fetchVaultData();
  }, [vaultId, fetchVaultData]);

  const handleAddSource = async () => {
    if (!newSourceUrl.trim()) return;
    setAddingSource(true);
    try {
      const result = await sourceService.createSource(
        vaultId,
        newSourceUrl.trim(),
        newSourceTitle.trim() || undefined
      );
      if (result.status === 'success') {
        toast.success('Source added!');
        setAddSourceOpen(false);
        setNewSourceUrl('');
        setNewSourceTitle('');
      } else {
        toast.error(result.error || 'Failed to add source');
      }
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    const result = await sourceService.deleteSource(sourceId);
    if (result.status === 'success') {
      toast.success('Source deleted');
    } else {
      toast.error(result.error || 'Failed to delete source');
    }
  };

  const refreshFiles = async () => {
    const filesRes = await fileService.getFilesByVault(vaultId);
    if (filesRes.status === 'success') {
      setFiles(filesRes.data || []);
    }
  };

  const refreshMembers = async () => {
    const membersRes = await vaultService.getVaultMembers(vaultId);
    if (membersRes.status === 'success') {
      setInitialMembers(membersRes.data || []);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vault) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate font-semibold">{vault.name}</h1>
            {vault.description && (
              <p className="truncate text-xs text-muted-foreground">{vault.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main content with tabs */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="sources" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sources" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Sources ({sources.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Files ({files.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sources</h2>
              <Dialog open={addSourceOpen} onOpenChange={setAddSourceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Source
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a source</DialogTitle>
                    <DialogDescription>
                      Paste a URL to a paper, article, or document.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        placeholder="https://arxiv.org/abs/…"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (optional)</Label>
                      <Input
                        placeholder="Paper title…"
                        value={newSourceTitle}
                        onChange={(e) => setNewSourceTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddSourceOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddSource}
                      disabled={addingSource || !newSourceUrl.trim()}
                    >
                      {addingSource && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {sources.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <h3 className="font-medium">No sources yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first source to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sources.map((source) => (
                  <SourceItem
                    key={source.id}
                    source={source}
                    onClick={() => router.push(`/vault/${vaultId}/source/${source.id}`)}
                    onDelete={handleDeleteSource}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Files</h2>
            </div>

            <FileUploader vaultId={vaultId} onUploadComplete={refreshFiles} />
            <FileListPanel files={files} vaultId={vaultId} onFileDeleted={refreshFiles} />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <h2 className="text-lg font-semibold">Members</h2>
            <MemberManagement
              vaultId={vaultId}
              members={members}
              currentUserId={user?.id}
              currentUserRole={currentUserRole}
              onMembersChanged={refreshMembers}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <h2 className="text-lg font-semibold">Activity</h2>
            <ActivityFeed items={activity} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
