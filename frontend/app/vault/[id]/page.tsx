'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertCircle,
  Plus,
  Loader2,
  ArrowLeft,
  BookOpen,
  FileText,
  Activity,
  Users,
  Settings,
  Link2,
} from 'lucide-react';
import { vaultService } from '@/lib/services/vault.service';
import { sourceService } from '@/lib/services/source.service';
import { fileService } from '@/lib/services/file.service';
import {
  Vault,
  Source,
  VaultMember,
  FileWithUploader,
  ActivityLogWithActor,
} from '@/lib/database.types';
import { SourceItem } from '@/components/source-item';
import { FileListPanel } from '@/components/file-list-panel';
import { ActivityFeed } from '@/components/activity-feed';
import FileUploader from '@/components/file-uploader';
import { RoleBadge } from '@/components/role-badge';
import { formatDistanceToNow } from 'date-fns';
import { realtimeService } from '@/lib/services/realtime.service';

export default function VaultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const vaultId = params.id as string;

  // Core data
  const [vault, setVault] = useState<Vault | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [files, setFiles] = useState<FileWithUploader[]>([]);
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogWithActor[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'contributor' | 'viewer' | undefined>();

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sources');

  // Add source dialog
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');

  // File upload
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'contributor' | 'viewer'>('contributor');

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Load vault data
  const loadVaultData = useCallback(async () => {
    if (!user || !vaultId) return;

    try {
      setLoading(true);
      const [vaultRes, sourcesRes, membersRes] = await Promise.all([
        vaultService.getVaultById(vaultId),
        sourceService.getSourcesByVault(vaultId),
        vaultService.getVaultMembers(vaultId),
      ]);

      if (vaultRes.status === 'error') {
        throw new Error(vaultRes.error || 'Failed to load vault');
      }

      setVault(vaultRes.data);
      setSources(sourcesRes.data || []);

      if (membersRes.status === 'success' && membersRes.data) {
        setMembers(membersRes.data);
        const myMembership = membersRes.data.find((m) => m.user_id === user.id);
        setUserRole(myMembership?.role);
      }

      setError('');
    } catch (err) {
      setError('Failed to load vault data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, vaultId]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!vaultId) return;

    const unsubSources = realtimeService.subscribeToSources(vaultId, (data) => {
      if (data.type === 'source_added') {
        setSources((prev) => {
          if (prev.find((s) => s.id === data.payload.new.id)) return prev;
          return [data.payload.new, ...prev];
        });
      } else if (data.type === 'source_updated') {
        setSources((prev) =>
          prev.map((s) => (s.id === data.payload.new.id ? data.payload.new : s))
        );
      } else if (data.type === 'source_deleted') {
        setSources((prev) => prev.filter((s) => s.id !== data.payload.old.id));
      }
    });

    const unsubMembers = realtimeService.subscribeToMembers(vaultId, (data) => {
      if (data.type === 'member_added') {
        setMembers((prev) => [...prev, data.payload.new]);
      } else if (data.type === 'member_role_changed') {
        setMembers((prev) =>
          prev.map((m) => (m.id === data.payload.new.id ? data.payload.new : m))
        );
      } else if (data.type === 'member_removed') {
        setMembers((prev) => prev.filter((m) => m.id !== data.payload.old.id));
      }
    });

    const unsubActivity = realtimeService.subscribeToActivityLogs(vaultId, (data) => {
      if (data.type === 'activity_logged') {
        setActivityLogs((prev) => [data.payload.new, ...prev]);
      }
    });

    return () => {
      unsubSources();
      unsubMembers();
      unsubActivity();
    };
  }, [vaultId]);

  // Handlers
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceUrl.trim() && !newSourceTitle.trim()) return;

    setAddingSource(true);
    try {
      const response = await sourceService.createSource(
        vaultId,
        newSourceUrl,
        newSourceTitle || newSourceUrl,
        {}
      );
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to add source');
      }
      if (response.data) {
        setSources((prev) => [response.data!, ...prev]);
      }
      setNewSourceUrl('');
      setNewSourceTitle('');
      setAddSourceOpen(false);
      setError('');
    } catch (err) {
      setError('Failed to add source. Please try again.');
      console.error(err);
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const response = await sourceService.deleteSource(sourceId);
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to delete source');
      }
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err) {
      setError('Failed to delete source. Please try again.');
      console.error(err);
    }
  };

  const handleFileUploadComplete = async (filename: string) => {
    // Reload data after upload
    setShowFileUpload(false);
    loadVaultData();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setAddingMember(true);
    try {
      const response = await vaultService.addVaultMember(
        vaultId,
        newMemberEmail,
        newMemberRole
      );
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to add member');
      }
      if (response.data) {
        setMembers((prev) => [...prev, response.data!]);
      }
      setNewMemberEmail('');
      setAddMemberOpen(false);
      setError('');
    } catch (err) {
      setError('Failed to add member. Please try again.');
      console.error(err);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await vaultService.removeVaultMember(vaultId, userId);
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to remove member');
      }
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      setError('Failed to remove member. Please try again.');
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

  if (!vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="mt-8 text-center">
          <p className="text-gray-600">Vault not found or you don&apos;t have access.</p>
        </div>
      </div>
    );
  }

  const canEdit = userRole === 'owner' || userRole === 'contributor';
  const isOwner = userRole === 'owner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{vault.name}</h1>
                  {userRole && <RoleBadge role={userRole} />}
                  {vault.is_archived && (
                    <Badge variant="secondary" className="text-xs">Archived</Badge>
                  )}
                </div>
                {vault.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{vault.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{sources.length} sources</span>
              <span>&middot;</span>
              <span>{members.length} members</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="sources" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                Sources ({sources.length})
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-1.5">
                <FileText className="h-4 w-4" />
                Files ({files.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Tab-specific actions */}
            {activeTab === 'sources' && canEdit && (
              <Dialog open={addSourceOpen} onOpenChange={setAddSourceOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Source
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddSource}>
                    <DialogHeader>
                      <DialogTitle>Add Source</DialogTitle>
                      <DialogDescription>
                        Add a URL or reference to this vault.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="source-title">Title</Label>
                        <Input
                          id="source-title"
                          placeholder="e.g., Machine Learning Survey 2024"
                          value={newSourceTitle}
                          onChange={(e) => setNewSourceTitle(e.target.value)}
                          disabled={addingSource}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="source-url">URL</Label>
                        <Input
                          id="source-url"
                          placeholder="https://example.com/paper.pdf"
                          value={newSourceUrl}
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          disabled={addingSource}
                          type="url"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddSourceOpen(false)}
                        disabled={addingSource}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={addingSource || (!newSourceUrl.trim() && !newSourceTitle.trim())}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {addingSource ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Source'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === 'files' && canEdit && (
              <Button
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
                size="sm"
                onClick={() => setShowFileUpload(!showFileUpload)}
              >
                <Plus className="h-4 w-4" />
                Upload File
              </Button>
            )}

            {activeTab === 'members' && isOwner && (
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddMember}>
                    <DialogHeader>
                      <DialogTitle>Add Member</DialogTitle>
                      <DialogDescription>
                        Invite someone to collaborate on this vault.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="member-email">Email Address</Label>
                        <Input
                          id="member-email"
                          placeholder="collaborator@example.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          disabled={addingMember}
                          type="email"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={newMemberRole === 'contributor' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewMemberRole('contributor')}
                          >
                            Contributor
                          </Button>
                          <Button
                            type="button"
                            variant={newMemberRole === 'viewer' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewMemberRole('viewer')}
                          >
                            Viewer
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddMemberOpen(false)}
                        disabled={addingMember}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={addingMember || !newMemberEmail.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {addingMember ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Member'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Sources Tab */}
          <TabsContent value="sources">
            {sources.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-gray-600 mb-4">
                    No sources yet. Add a URL or upload a file to get started.
                  </p>
                  {canEdit && (
                    <Button
                      onClick={() => setAddSourceOpen(true)}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Source
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((source) => (
                  <SourceItem
                    key={source.id}
                    source={source}
                    userRole={userRole}
                    currentUserId={user.id}
                    onSelect={(id) => router.push(`/vault/${vaultId}/source/${id}`)}
                    onDelete={canEdit ? handleDeleteSource : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            {showFileUpload && canEdit && (
              <Card className="mb-6">
                <CardContent className="py-4">
                  <FileUploader
                    vaultId={vaultId}
                    onUploadComplete={handleFileUploadComplete}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="py-4">
                <FileListPanel
                  files={files}
                  userRole={userRole}
                  currentUserId={user.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardContent className="py-4">
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No members found.</p>
                ) : (
                  <div className="divide-y">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {member.user_id.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.user_id}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined{' '}
                              {formatDistanceToNow(new Date(member.joined_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={member.role} />
                          {isOwner && member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveMember(member.user_id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardContent className="py-4">
                <ActivityFeed items={activityLogs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
