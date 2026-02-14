'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, BookOpen, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VaultCard from '@/components/vault-card';
import { VaultCardSkeleton } from '@/components/vault-card-skeleton';
import { CreateVaultDialog } from '@/components/create-vault-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { NotificationCenter } from '@/components/notification-center';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { vaultService } from '@/lib/services/vault.service';
import { toast } from 'sonner';
import type { Vault, Role } from '@/lib/database.types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [vaultRoles, setVaultRoles] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Create vault dialog
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete vault confirmation
  const [deleteVaultId, setDeleteVaultId] = useState<string | null>(null);
  const deleteVaultName = vaults.find((v) => v.id === deleteVaultId)?.name;

  const fetchVaults = useCallback(async () => {
    setLoading(true);
    try {
      const result = await vaultService.getAllVaults();
      if (result.status === 'success') {
        const fetchedVaults = result.data || [];
        setVaults(fetchedVaults);

        // Fetch current user's role for each vault
        if (user?.id && fetchedVaults.length > 0) {
          const roles: Record<string, Role> = {};
          await Promise.all(
            fetchedVaults.map(async (v) => {
              try {
                const membersRes = await vaultService.getVaultMembers(v.id);
                if (membersRes.status === 'success' && membersRes.data) {
                  const me = membersRes.data.find((m) => m.user_id === user.id);
                  if (me) roles[v.id] = me.role;
                }
              } catch {
                // non-critical – card simply won't show a role badge
              }
            })
          );
          setVaultRoles(roles);
        }
      } else {
        toast.error(result.error || 'Failed to load vaults');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const handleCreateVault = async () => {
    // Handled by CreateVaultDialog component - this is a no-op
  };

  const handleDeleteVault = async (vaultId: string) => {
    setDeleteVaultId(vaultId);
  };

  const confirmDeleteVault = async () => {
    if (!deleteVaultId) return;
    const result = await vaultService.deleteVault(deleteVaultId);
    if (result.status === 'success') {
      toast.success('Vault deleted');
      fetchVaults();
    } else {
      toast.error(result.error || 'Failed to delete vault');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const filteredVaults = vaults.filter(
    (v) =>
      v.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      v.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold">Your Vaults</h1>
            <p className="text-sm text-muted-foreground">
              Organize your research into collaborative vaults.
            </p>
          </div>

          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Vault
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search vaults…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <VaultCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredVaults.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No vaults yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first vault to start organizing your research.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onClick={() => router.push(`/vault/${vault.id}`)}
                onDelete={() => handleDeleteVault(vault.id)}
                userRole={vaultRoles[vault.id]}
              />
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <CreateVaultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onVaultCreated={fetchVaults}
      />

      <ConfirmDialog
        open={!!deleteVaultId}
        onOpenChange={(v) => { if (!v) setDeleteVaultId(null); }}
        title="Delete vault?"
        description={`This will permanently delete "${deleteVaultName || 'this vault'}" and all its contents. This action cannot be undone.`}
        actionLabel="Delete Vault"
        onConfirm={confirmDeleteVault}
      />
    </div>
  );
}
