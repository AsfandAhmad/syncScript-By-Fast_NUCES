'use client';

import { useState } from 'react';
import { UserPlus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoleBadge } from '@/components/role-badge';
import { vaultService } from '@/lib/services/vault.service';
import { toast } from 'sonner';
import type { VaultMember, Role } from '@/lib/database.types';

interface MemberManagementProps {
  vaultId: string;
  members: VaultMember[];
  currentUserId?: string;
  currentUserRole?: Role;
  onMembersChanged?: () => void;
}

export function MemberManagement({
  vaultId,
  members,
  currentUserId,
  currentUserRole,
  onMembersChanged,
}: MemberManagementProps) {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Role>('viewer');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = currentUserRole === 'owner';

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    setAdding(true);
    try {
      // Note: In a real app you'd look up user by email first.
      // For now we pass the email as userId (the API/backend would resolve it).
      const result = await vaultService.addVaultMember(vaultId, newMemberEmail.trim(), newMemberRole);
      if (result.status === 'success') {
        toast.success('Member added');
        setNewMemberEmail('');
        onMembersChanged?.();
      } else {
        toast.error(result.error || 'Failed to add member');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId);
    try {
      const result = await vaultService.removeVaultMember(vaultId, userId);
      if (result.status === 'success') {
        toast.success('Member removed');
        onMembersChanged?.();
      } else {
        toast.error(result.error || 'Failed to remove member');
      }
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const result = await vaultService.updateMemberRole(vaultId, userId, newRole);
    if (result.status === 'success') {
      toast.success('Role updated');
      onMembersChanged?.();
    } else {
      toast.error(result.error || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add member form – only owners */}
      {isOwner && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="User ID or email…"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as Role)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contributor">Contributor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddMember} disabled={adding || !newMemberEmail.trim()}>
            {adding ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="mr-1 h-3.5 w-3.5" />
            )}
            Add
          </Button>
        </div>
      )}

      {/* Member list */}
      <div className="divide-y rounded-lg border">
        {members.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No members</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-3 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {(member.full_name || member.email || member.user_id).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.full_name || member.email || member.user_id}
                  </p>
                  {member.email && member.email !== member.full_name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && member.user_id !== currentUserId ? (
                  <Select
                    value={member.role}
                    onValueChange={(v) => handleRoleChange(member.user_id, v as Role)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <RoleBadge role={member.role} />
                )}

                {isOwner && member.user_id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={removingId === member.user_id}
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    {removingId === member.user_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
