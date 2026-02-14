'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Loader2, LogOut, Search, FolderOpen, BookOpen, Users } from 'lucide-react';
import { vaultService } from '@/lib/services/vault.service';
import { VaultWithMeta } from '@/lib/database.types';
import VaultCard from '@/components/vault-card';
import { VaultCardSkeleton } from '@/components/vault-card-skeleton';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';

type SortOption = 'newest' | 'oldest' | 'name';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [vaults, setVaults] = useState<VaultWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultDescription, setNewVaultDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Load vaults
  useEffect(() => {
    if (!user) return;

    const loadVaults = async () => {
      try {
        setLoading(true);
        const response = await vaultService.getAllVaults();
        if (response.status === 'error') {
          throw new Error(response.error || 'Failed to load vaults');
        }
        setVaults(response.data || []);
        setError('');
      } catch (err) {
        setError('Failed to load vaults. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadVaults();
  }, [user]);

  // Filter and sort vaults
  const filteredVaults = useMemo(() => {
    let result = vaults;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [vaults, searchQuery, sortBy]);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultName.trim()) return;

    setCreating(true);
    try {
      const response = await vaultService.createVault(newVaultName, newVaultDescription || '');
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to create vault');
      }
      if (response.data) {
        const newVault: VaultWithMeta = {
          ...response.data,
          member_count: 1,
          source_count: 0,
          file_count: 0,
          user_role: 'owner',
        };
        setVaults([newVault, ...vaults]);
      }
      setNewVaultName('');
      setNewVaultDescription('');
      setCreateDialogOpen(false);
      setError('');
    } catch (err) {
      setError('Failed to create vault. Please try again.');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVault = async (id: string) => {
    try {
      const response = await vaultService.deleteVault(id);
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to delete vault');
      }
      setVaults(vaults.filter((v) => v.id !== id));
    } catch (err) {
      setError('Failed to delete vault. Please try again.');
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  // Stats
  const totalSources = vaults.reduce((acc, v) => acc + (v.source_count || 0), 0);
  const ownedVaults = vaults.filter((v) => v.user_role === 'owner').length;
  const sharedVaults = vaults.filter((v) => v.user_role !== 'owner').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">SyncScript</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-gray-600"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats cards */}
        {!loading && vaults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-lg bg-blue-100 p-2.5">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{vaults.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {ownedVaults} owned{sharedVaults > 0 ? `, ${sharedVaults} shared` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-lg bg-emerald-100 p-2.5">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSources}</p>
                  <p className="text-xs text-muted-foreground">Total Sources</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-lg bg-violet-100 p-2.5">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {vaults.reduce((acc, v) => acc + (v.member_count || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Toolbar: search, sort, create */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vaults..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0">
                <Plus className="h-4 w-4" />
                New Vault
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateVault}>
                <DialogHeader>
                  <DialogTitle>Create New Vault</DialogTitle>
                  <DialogDescription>
                    A vault is a container for your research sources, annotations, and files.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="vault-name">Vault Name</Label>
                    <Input
                      id="vault-name"
                      placeholder="e.g., Climate Change Research"
                      value={newVaultName}
                      onChange={(e) => setNewVaultName(e.target.value)}
                      disabled={creating}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vault-desc">Description (optional)</Label>
                    <Textarea
                      id="vault-desc"
                      placeholder="Brief description of this vault's purpose..."
                      value={newVaultDescription}
                      onChange={(e) => setNewVaultDescription(e.target.value)}
                      disabled={creating}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || !newVaultName.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Vault'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vaults grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <VaultCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredVaults.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {searchQuery ? (
                <>
                  <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-gray-600">
                    No vaults match &ldquo;{searchQuery}&rdquo;
                  </p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-gray-600 mb-4">
                    No vaults yet. Create one to start organising your research.
                  </p>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Vault
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onDelete={() => handleDeleteVault(vault.id)}
                onClick={() => router.push(`/vault/${vault.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
