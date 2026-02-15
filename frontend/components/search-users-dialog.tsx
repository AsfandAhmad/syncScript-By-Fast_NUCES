'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Users, BookOpen, UserPlus, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import supabase from '@/lib/supabase-client';
import { toast } from 'sonner';

interface SearchUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface UserVault {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_archived: boolean;
  created_at: string;
  target_user_role: string;
  current_user_role: string | null;
  is_member: boolean;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

interface SearchUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchUsersDialog({ open, onOpenChange }: SearchUsersDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [loadingVaults, setLoadingVaults] = useState(false);
  const [vaults, setVaults] = useState<UserVault[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 3) {
      toast.error('Enter at least 3 characters');
      return;
    }

    setSearching(true);
    setSelectedUser(null);
    setVaults([]);
    setHasSearched(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(query.trim())}`, { headers });
      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error || 'Search failed');
        return;
      }

      setUsers(body.data || []);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleSelectUser = useCallback(async (user: SearchUser) => {
    setSelectedUser(user);
    setLoadingVaults(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/users/${user.id}/vaults`, { headers });
      const body = await res.json();

      if (res.ok) {
        setVaults(body.data || []);
      } else {
        toast.error(body.error || 'Failed to load vaults');
      }
    } finally {
      setLoadingVaults(false);
    }
  }, []);

  const handleRequestAccess = useCallback(async (vaultId: string) => {
    setRequesting(vaultId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/vaults/${vaultId}/request-access`, {
        method: 'POST',
        headers,
      });
      const body = await res.json();

      if (res.ok) {
        toast.success('Access request sent to vault owner');
        // Update local state to show "Requested"
        setVaults((prev) =>
          prev.map((v) => (v.id === vaultId ? { ...v, is_member: true, current_user_role: 'requested' } : v))
        );
      } else {
        toast.error(body.error || 'Failed to request access');
      }
    } finally {
      setRequesting(null);
    }
  }, []);

  const handleGoToVault = (vaultId: string) => {
    onOpenChange(false);
    router.push(`/vault/${vaultId}`);
  };

  const handleReset = () => {
    setSelectedUser(null);
    setVaults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Users & Vaults
          </DialogTitle>
          <DialogDescription>
            Search by email to find users and browse their vaults.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <Button onClick={handleSearch} disabled={searching} size="sm">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="max-h-[400px]">
          {/* User results (when no user selected) */}
          {!selectedUser && (
            <div className="space-y-1">
              {hasSearched && users.length === 0 && !searching && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No users found matching &quot;{query}&quot;
                </p>
              )}

              {users.map((u) => (
                <button
                  key={u.id}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                  onClick={() => handleSelectUser(u)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.full_name || u.email}
                    </p>
                    {u.full_name && (
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* Vaults for selected user */}
          {selectedUser && (
            <div className="space-y-3">
              {/* Back link */}
              <button
                className="mb-2 flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={handleReset}
              >
                ← Back to results
              </button>

              <div className="rounded-md border p-3 bg-muted/30">
                <p className="text-sm font-medium">
                  {selectedUser.full_name || selectedUser.email}
                </p>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>

              <h4 className="text-sm font-semibold">Their Vaults</h4>

              {loadingVaults ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : vaults.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No vaults found for this user.
                </p>
              ) : (
                <div className="space-y-2">
                  {vaults.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.name}</p>
                        {v.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {v.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {v.target_user_role}
                          </Badge>
                        </div>
                      </div>

                      {/* Action button */}
                      {v.is_member && v.current_user_role !== 'requested' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => handleGoToVault(v.id)}
                        >
                          Open
                        </Button>
                      ) : v.current_user_role === 'requested' ? (
                        <Button size="sm" variant="ghost" disabled className="shrink-0">
                          <Check className="mr-1 h-3.5 w-3.5" /> Requested
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="shrink-0"
                          disabled={requesting === v.id}
                          onClick={() => handleRequestAccess(v.id)}
                        >
                          {requesting === v.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="mr-1 h-3.5 w-3.5" />
                          )}
                          Request Access
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
