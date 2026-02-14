'use client';

import { useMemo } from 'react';
import type { Role } from '@/lib/database.types';

export interface Permissions {
  canCreateSource: boolean;
  canEditSource: boolean;
  canDeleteSource: boolean;
  canAddAnnotation: boolean;
  canEditAnnotation: boolean;
  canDeleteAnnotation: boolean;
  canUploadFile: boolean;
  canDeleteFile: boolean;
  canManageMembers: boolean;
  canArchiveVault: boolean;
  canDeleteVault: boolean;
  isOwner: boolean;
  isContributor: boolean;
  isViewer: boolean;
  role: Role | undefined;
}

/**
 * Hook that derives boolean permissions from a user's vault role.
 *
 * Permission matrix:
 * | Action             | Owner | Contributor | Viewer |
 * |--------------------|-------|-------------|--------|
 * | Create source      | ✅    | ✅          | ❌     |
 * | Edit source        | ✅    | ✅          | ❌     |
 * | Delete source      | ✅    | ❌          | ❌     |
 * | Add annotation     | ✅    | ✅          | ❌     |
 * | Edit annotation    | ✅    | ✅ (own)    | ❌     |
 * | Delete annotation  | ✅    | ✅ (own)    | ❌     |
 * | Upload file        | ✅    | ✅          | ❌     |
 * | Delete file        | ✅    | ❌          | ❌     |
 * | Manage members     | ✅    | ❌          | ❌     |
 * | Archive vault      | ✅    | ❌          | ❌     |
 * | Delete vault       | ✅    | ❌          | ❌     |
 */
export function usePermissions(role?: Role): Permissions {
  return useMemo(() => {
    const isOwner = role === 'owner';
    const isContributor = role === 'contributor';
    const isViewer = role === 'viewer';
    const canWrite = isOwner || isContributor;

    return {
      canCreateSource: canWrite,
      canEditSource: canWrite,
      canDeleteSource: isOwner,
      canAddAnnotation: canWrite,
      canEditAnnotation: canWrite,
      canDeleteAnnotation: canWrite,
      canUploadFile: canWrite,
      canDeleteFile: isOwner,
      canManageMembers: isOwner,
      canArchiveVault: isOwner,
      canDeleteVault: isOwner,
      isOwner,
      isContributor,
      isViewer,
      role,
    };
  }, [role]);
}
