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
  Settings,
  Pencil,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourceItem } from '@/components/source-item';
import { FileListPanel } from '@/components/file-list-panel';
import FileUploader from '@/components/file-uploader';
import { MemberManagement } from '@/components/member-management';
import { ActivityFeed } from '@/components/activity-feed';
import { VaultChatPanel } from '@/components/vault-chat-panel';
import { RoleBadge } from '@/components/role-badge';
import { AddSourceDialog } from '@/components/add-source-dialog';
import { EditVaultDialog } from '@/components/edit-vault-dialog';
import { VaultSettingsDialog } from '@/components/vault-settings-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { NotificationCenter } from '@/components/notification-center';
import { ConnectionStatus } from '@/components/connection-status';
import { PermissionProvider } from '@/contexts/permission-context';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeSources, useRealtimeMembers, useRealtimeActivity, useRealtimeFiles } from '@/hooks/use-realtime';
import { useVaultNotifications } from '@/hooks/use-vault-notifications';
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
  const [currentUserRole, setCurrentUserRole] = useState<Role | undefined>();

  // Sources – initial fetch
  const [initialSources, setInitialSources] = useState<Source[]>([]);
  const [initialMembers, setInitialMembers] = useState<VaultMember[]>([]);
  const [initialActivity, setInitialActivity] = useState<ActivityLog[]>([]);
  const [initialFiles, setInitialFiles] = useState<FileRecord[]>([]);

  // Realtime subscriptions
  const { sources } = useRealtimeSources(vaultId, initialSources);
  const { members } = useRealtimeMembers(vaultId, initialMembers);
  const { activities: activity } = useRealtimeActivity(vaultId, initialActivity);
  const { files } = useRealtimeFiles(vaultId, initialFiles);

  // In-app toast notifications for realtime events
  useVaultNotifications(vaultId);

  // Add source dialog
  const [addSourceOpen, setAddSourceOpen] = useState(false);

  // Edit vault dialog
  const [editVaultOpen, setEditVaultOpen] = useState(false);

  // Vault settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Delete source confirmation
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null);

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
        setInitialFiles(filesRes.data || []);
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

  const handleDeleteSource = async (sourceId: string) => {
    // Open confirm dialog instead of deleting immediately
    setDeleteSourceId(sourceId);
  };

  const confirmDeleteSource = async () => {
    if (!deleteSourceId) return;
    const result = await sourceService.deleteSource(deleteSourceId);
    if (result.status === 'success') {
      toast.success('Source deleted');
    } else {
      toast.error(result.error || 'Failed to delete source');
    }
  };

  const refreshFiles = async () => {
    const filesRes = await fileService.getFilesByVault(vaultId);
    if (filesRes.status === 'success') {
      setInitialFiles(filesRes.data || []);
    }
  };

  const refreshMembers = async () => {
    const membersRes = await vaultService.getVaultMembers(vaultId);
    if (membersRes.status === 'success') {
      setInitialMembers(membersRes.data || []);
    }
  };

  // Derive permissions from the current user's role (hook must be called unconditionally)
  const permissions = usePermissions(currentUserRole);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vault) return null;

  return (
    <PermissionProvider role={currentUserRole} currentUserId={user?.id}>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-semibold">{vault.name}</h1>
              {currentUserRole && <RoleBadge role={currentUserRole} />}
            </div>
            {vault.description && (
              <p className="truncate text-xs text-muted-foreground">{vault.description}</p>
            )}
          </div>
          {/* Vault actions – owner only */}
          {permissions.isOwner && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditVaultOpen(true)} aria-label="Edit vault">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Vault settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
          <NotificationCenter />
        </div>
      </header>

      <ConnectionStatus />

      {/* Main content with tabs */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="sources" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="sources" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sources</span> ({sources.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Files</span> ({files.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Members</span> ({members.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sources</h2>
              {permissions.canCreateSource && (
                <Button size="sm" onClick={() => setAddSourceOpen(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Source
                </Button>
              )}
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
                    onDelete={permissions.canDeleteSource ? handleDeleteSource : undefined}
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

            {permissions.canUploadFile && (
              <FileUploader vaultId={vaultId} onUploadComplete={refreshFiles} />
            )}
            <FileListPanel
              files={files}
              vaultId={vaultId}
              onFileDeleted={refreshFiles}
              canDelete={permissions.canDeleteFile}
            />
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

          {/* Chat Tab */}
          <TabsContent value="chat">
            <VaultChatPanel vaultId={vaultId} vaultName={vault.name} />
          </TabsContent>
        </Tabs>
      </main>
    </div>

    {/* Dialogs rendered outside main layout */}
    <AddSourceDialog
      open={addSourceOpen}
      onOpenChange={setAddSourceOpen}
      vaultId={vaultId}
    />

    {vault && (
      <>
        <EditVaultDialog
          open={editVaultOpen}
          onOpenChange={setEditVaultOpen}
          vault={vault}
          onVaultUpdated={fetchVaultData}
        />

        <VaultSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          vault={vault}
          sourcesCount={sources.length}
          filesCount={files.length}
          membersCount={members.length}
          onVaultUpdated={fetchVaultData}
          onVaultDeleted={() => router.push('/dashboard')}
        />
      </>
    )}

    <ConfirmDialog
      open={!!deleteSourceId}
      onOpenChange={(v) => { if (!v) setDeleteSourceId(null); }}
      title="Delete source?"
      description="This will permanently delete this source and all its annotations. This action cannot be undone."
      actionLabel="Delete Source"
      onConfirm={confirmDeleteSource}
    />
    </PermissionProvider>
  );
}
