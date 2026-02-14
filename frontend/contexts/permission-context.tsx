'use client';

import { createContext, useContext, useMemo } from 'react';
import { usePermissions, type Permissions } from '@/hooks/use-permissions';
import type { Role } from '@/lib/database.types';

interface PermissionContextValue extends Permissions {
  currentUserId?: string;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

interface PermissionProviderProps {
  role?: Role;
  currentUserId?: string;
  children: React.ReactNode;
}

/**
 * Wraps a subtree with role-based permissions so child components
 * can call `usePermissionContext()` instead of receiving props.
 */
export function PermissionProvider({ role, currentUserId, children }: PermissionProviderProps) {
  const permissions = usePermissions(role);

  const value = useMemo<PermissionContextValue>(
    () => ({ ...permissions, currentUserId }),
    [permissions, currentUserId],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Access the current user's vault permissions.
 * Must be used inside a `<PermissionProvider>`.
 */
export function usePermissionContext(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return ctx;
}
