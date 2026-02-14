'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { vaultService } from '@/lib/services/vault.service';
import { VaultMember } from '@/lib/database.types';
import { VaultRole, VaultPermissions, getPermissions } from '@/lib/permissions';

interface UseVaultRoleReturn {
  role: VaultRole | undefined;
  permissions: VaultPermissions;
  members: VaultMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVaultRole(vaultId: string): UseVaultRoleReturn {
  const { user } = useAuth();
  const [role, setRole] = useState<VaultRole | undefined>();
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!user || !vaultId) return;

    try {
      setLoading(true);
      const response = await vaultService.getVaultMembers(vaultId);
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to load members');
      }
      const membersList = response.data || [];
      setMembers(membersList);

      const myMembership = membersList.find((m) => m.user_id === user.id);
      setRole(myMembership?.role);
      setError(null);
    } catch (err) {
      setError('Failed to load vault role');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, vaultId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const permissions = getPermissions(role);

  return {
    role,
    permissions,
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
}
