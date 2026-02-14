'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Loader2, LogOut } from 'lucide-react';
import { vaultService } from '@/lib/services/vault.service';
import { Vault } from '@/lib/database.types';
import VaultCard from '@/components/vault-card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

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
        const data = await vaultService.getAllVaults();
        setVaults(data);
        setError('');
      } catch (err) {
        setError('Failed to load vaults. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadVaults();
  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultName.trim()) return;

    setCreating(true);
    try {
      const vault = await vaultService.createVault({
        name: newVaultName,
        description: '',
        isPublic: false,
      });
      setVaults([...vaults, vault]);
      setNewVaultName('');
      setShowCreateForm(false);
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
      await vaultService.deleteVault(id);
      setVaults(vaults.filter(v => v.id !== id));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user.email}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create vault section */}
        <div className="mb-8">
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <Plus className="h-4 w-4" />
              Create New Vault
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create New Vault</CardTitle>
                <CardDescription>
                  A vault is a container for your research sources and annotations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateVault} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Vault Name</label>
                    <Input
                      placeholder="e.g., Climate Change Research"
                      value={newVaultName}
                      onChange={(e) => setNewVaultName(e.target.value)}
                      disabled={creating}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Vaults list */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Vaults</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : vaults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">
                  {showCreateForm
                    ? 'Create a vault to get started'
                    : 'No vaults yet. Create one to begin organizing your research.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaults.map((vault) => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  onDelete={() => handleDeleteVault(vault.id)}
                  onClick={() => router.push(`/vault/${vault.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
