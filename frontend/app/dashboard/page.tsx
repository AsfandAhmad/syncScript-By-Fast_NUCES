'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, LogOut, Settings, Search, Globe, FolderOpen, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VaultCard from '@/components/vault-card';
import { VaultCardSkeleton } from '@/components/vault-card-skeleton';
import { CreateVaultDialog } from '@/components/create-vault-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { NotificationCenter } from '@/components/notification-center';
import { SearchUsersDialog } from '@/components/search-users-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { vaultService } from '@/lib/services/vault.service';
import { toast } from 'sonner';
import type { Vault, Role } from '@/lib/database.types';

interface PublicVault extends Vault {
  owner_email?: string;
  owner_name?: string;
  is_member?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();

  // My vaults (owned + member)
  const [myVaults, setMyVaults] = useState<Vault[]>([]);
  const [vaultRoles, setVaultRoles] = useState<Record<string, Role>>({});
  const [loadingMy, setLoadingMy] = useState(true);

  // Public vaults
  const [publicVaults, setPublicVaults] = useState<PublicVault[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchUsersOpen, setSearchUsersOpen] = useState(false);
  const [deleteVaultId, setDeleteVaultId] = useState<string | null>(null);
  const deleteVaultName = myVaults.find((v) => v.id === deleteVaultId)?.name;

  // ── Fetch user's own vaults ──
  const fetchMyVaults = useCallback(async () => {
    setLoadingMy(true);
    try {
      const result = await vaultService.getAllVaults();
      if (result.status === 'success') {
        const fetched = result.data || [];
        setMyVaults(fetched);

        if (user?.id && fetched.length > 0) {
          const roles: Record<string, Role> = {};
          await Promise.all(
            fetched.map(async (v) => {
              try {
                const membersRes = await vaultService.getVaultMembers(v.id);
                if (membersRes.status === 'success' && membersRes.data) {
                  const me = membersRes.data.find((m) => m.user_id === user.id);
                  if (me) roles[v.id] = me.role;
                }
              } catch {
                // non-critical
              }
            })
          );
          setVaultRoles(roles);
        }
      } else {
        toast.error(result.error || 'Failed to load vaults');
      }
    } finally {
      setLoadingMy(false);
    }
  }, [user?.id]);

  // ── Fetch public vaults ──
  const fetchPublicVaults = useCallback(async () => {
    setLoadingPublic(true);
    try {
      const result = await vaultService.getPublicVaults();
      if (result.status === 'success') {
        setPublicVaults((result.data as PublicVault[]) || []);
      }
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  useEffect(() => {
    fetchMyVaults();
    fetchPublicVaults();
  }, [fetchMyVaults, fetchPublicVaults]);

  // ── Handlers ──
  const handleDeleteVault = (vaultId: string) => setDeleteVaultId(vaultId);

  const confirmDeleteVault = async () => {
    if (!deleteVaultId) return;
    const result = await vaultService.deleteVault(deleteVaultId);
    if (result.status === 'success') {
      toast.success('Vault deleted');
      fetchMyVaults();
      fetchPublicVaults();
    } else {
      toast.error(result.error || 'Failed to delete vault');
    }
  };

  const handleJoinVault = async (vaultId: string) => {
    const result = await vaultService.joinPublicVault(vaultId);
    if (result.status === 'success') {
      toast.success('Joined vault!');
      fetchMyVaults();
      fetchPublicVaults();
    } else {
      toast.error(result.error || 'Failed to join vault');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // ── Filtering logic ──
  const filterBySearch = (v: Vault) =>
    v.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    v.description?.toLowerCase().includes(debouncedSearch.toLowerCase());

  const myVaultIds = new Set(myVaults.map((v) => v.id));

  // "All" tab: user's vaults + public vaults the user isn't already a member of
  const allVaults: (Vault | PublicVault)[] = [
    ...myVaults,
    ...publicVaults.filter((pv) => !myVaultIds.has(pv.id)),
  ];

  const getFilteredVaults = () => {
    switch (activeTab) {
      case 'my':
        return myVaults.filter(filterBySearch);
      case 'public':
        return publicVaults.filter(filterBySearch);
      default: // 'all'
        return allVaults.filter(filterBySearch);
    }
  };

  const filteredVaults = getFilteredVaults();
  const loading = activeTab === 'my' ? loadingMy : activeTab === 'public' ? loadingPublic : loadingMy || loadingPublic;

  // ── Empty state messages ──
  const emptyMessage = {
    all: { title: 'No vaults yet', desc: 'Create your first vault or browse public vaults to get started.' },
    my: { title: 'No personal vaults', desc: 'Create a vault to start organizing your research.' },
    public: { title: 'No public vaults', desc: 'No vaults have been made public yet.' },
  }[activeTab] || { title: 'No vaults', desc: '' };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            SyncScript
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Browse public vaults or manage your own research projects.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSearchUsersOpen(true)}>
              <Search className="mr-2 h-4 w-4" />
              Find Users
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Vault
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5">
                <LayoutGrid className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="my" className="gap-1.5">
                <FolderOpen className="h-4 w-4" />
                My Vaults
              </TabsTrigger>
              <TabsTrigger value="public" className="gap-1.5">
                <Globe className="h-4 w-4" />
                Public
              </TabsTrigger>
            </TabsList>

            <Input
              placeholder="Search vaults…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* All three tabs render the same grid structure */}
          {['all', 'my', 'public'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <VaultCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredVaults.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                  <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">{emptyMessage.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emptyMessage.desc}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredVaults.map((vault) => {
                    const isMine = myVaultIds.has(vault.id);
                    const pubVault = publicVaults.find((pv) => pv.id === vault.id);

                    return (
                      <VaultCard
                        key={vault.id}
                        vault={vault}
                        onClick={() => {
                          if (isMine) {
                            router.push(`/vault/${vault.id}`);
                          } else {
                            // For public vaults user hasn't joined, still allow viewing
                            router.push(`/vault/${vault.id}`);
                          }
                        }}
                        onDelete={isMine ? () => handleDeleteVault(vault.id) : undefined}
                        userRole={vaultRoles[vault.id]}
                        ownerName={
                          pubVault?.owner_name || pubVault?.owner_email || undefined
                        }
                        isMember={isMine}
                        onJoin={
                          !isMine && vault.is_public
                            ? () => handleJoinVault(vault.id)
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateVaultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onVaultCreated={() => {
          fetchMyVaults();
          fetchPublicVaults();
        }}
      />

      <ConfirmDialog
        open={!!deleteVaultId}
        onOpenChange={(v) => { if (!v) setDeleteVaultId(null); }}
        title="Delete vault?"
        description={`This will permanently delete "${deleteVaultName || 'this vault'}" and all its contents. This action cannot be undone.`}
        actionLabel="Delete Vault"
        onConfirm={confirmDeleteVault}
      />

      <SearchUsersDialog
        open={searchUsersOpen}
        onOpenChange={setSearchUsersOpen}
      />
    </div>
  );
}
