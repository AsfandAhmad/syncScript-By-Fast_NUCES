'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, BookOpen, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import VaultCard from '@/components/vault-card';
import { VaultCardSkeleton } from '@/components/vault-card-skeleton';
import { useAuth } from '@/hooks/use-auth';
import { vaultService } from '@/lib/services/vault.service';
import { toast } from 'sonner';
import type { Vault } from '@/lib/database.types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create vault dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchVaults = useCallback(async () => {
    setLoading(true);
    try {
      const result = await vaultService.getAllVaults();
      if (result.status === 'success') {
        setVaults(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load vaults');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const handleCreateVault = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const result = await vaultService.createVault(newName.trim(), newDesc.trim() || undefined);
      if (result.status === 'success') {
        toast.success('Vault created!');
        setDialogOpen(false);
        setNewName('');
        setNewDesc('');
        fetchVaults();
      } else {
        toast.error(result.error || 'Failed to create vault');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVault = async (vaultId: string) => {
    const result = await vaultService.deleteVault(vaultId);
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
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
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
            <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Vault
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new vault</DialogTitle>
                <DialogDescription>
                  Vaults help you organize sources, annotations, and files for a research project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="vault-name">Name</Label>
                  <Input
                    id="vault-name"
                    placeholder="e.g. ML Research Paper"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vault-desc">Description (optional)</Label>
                  <Textarea
                    id="vault-desc"
                    placeholder="Brief description of this vault…"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVault} disabled={creating || !newName.trim()}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
