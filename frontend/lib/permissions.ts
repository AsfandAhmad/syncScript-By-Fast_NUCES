// Centralized permissions logic for vault role-based access control

export type VaultRole = 'owner' | 'contributor' | 'viewer';

export interface VaultPermissions {
  canEditVault: boolean;
  canDeleteVault: boolean;
  canManageMembers: boolean;
  canAddSource: boolean;
  canEditSource: boolean;
  canDeleteSource: boolean;
  canAddAnnotation: boolean;
  canEditOwnAnnotation: boolean;
  canEditAnyAnnotation: boolean;
  canDeleteOwnAnnotation: boolean;
  canDeleteAnyAnnotation: boolean;
  canUploadFile: boolean;
  canDeleteOwnFile: boolean;
  canDeleteAnyFile: boolean;
  canViewActivity: boolean;
}

export function getPermissions(role?: VaultRole): VaultPermissions {
  if (!role) {
    return {
      canEditVault: false,
      canDeleteVault: false,
      canManageMembers: false,
      canAddSource: false,
      canEditSource: false,
      canDeleteSource: false,
      canAddAnnotation: false,
      canEditOwnAnnotation: false,
      canEditAnyAnnotation: false,
      canDeleteOwnAnnotation: false,
      canDeleteAnyAnnotation: false,
      canUploadFile: false,
      canDeleteOwnFile: false,
      canDeleteAnyFile: false,
      canViewActivity: false,
    };
  }

  switch (role) {
    case 'owner':
      return {
        canEditVault: true,
        canDeleteVault: true,
        canManageMembers: true,
        canAddSource: true,
        canEditSource: true,
        canDeleteSource: true,
        canAddAnnotation: true,
        canEditOwnAnnotation: true,
        canEditAnyAnnotation: true,
        canDeleteOwnAnnotation: true,
        canDeleteAnyAnnotation: true,
        canUploadFile: true,
        canDeleteOwnFile: true,
        canDeleteAnyFile: true,
        canViewActivity: true,
      };

    case 'contributor':
      return {
        canEditVault: false,
        canDeleteVault: false,
        canManageMembers: false,
        canAddSource: true,
        canEditSource: true,
        canDeleteSource: false, // can only delete own (checked separately with currentUserId)
        canAddAnnotation: true,
        canEditOwnAnnotation: true,
        canEditAnyAnnotation: false,
        canDeleteOwnAnnotation: true,
        canDeleteAnyAnnotation: false,
        canUploadFile: true,
        canDeleteOwnFile: true,
        canDeleteAnyFile: false,
        canViewActivity: true,
      };

    case 'viewer':
      return {
        canEditVault: false,
        canDeleteVault: false,
        canManageMembers: false,
        canAddSource: false,
        canEditSource: false,
        canDeleteSource: false,
        canAddAnnotation: false,
        canEditOwnAnnotation: false,
        canEditAnyAnnotation: false,
        canDeleteOwnAnnotation: false,
        canDeleteAnyAnnotation: false,
        canUploadFile: false,
        canDeleteOwnFile: false,
        canDeleteAnyFile: false,
        canViewActivity: true,
      };
  }
}

/**
 * Check if a user can perform an action on a resource they created.
 * Owners can act on anyone's resources, contributors on their own.
 */
export function canActOnResource(
  role: VaultRole | undefined,
  resourceCreatorId: string,
  currentUserId: string
): boolean {
  if (!role) return false;
  if (role === 'owner') return true;
  if (role === 'contributor') return resourceCreatorId === currentUserId;
  return false;
}
