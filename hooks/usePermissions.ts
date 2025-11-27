'use client';

import { useSupabaseAuth } from './useSupabaseAuth';

export type Role = 'user' | 'developer' | 'accountant' | 'admin' | 'staff';

export function usePermissions() {
  const { profile } = useSupabaseAuth();
  const role = (profile?.role || 'user') as Role;

  const permissions = {
    // Page access
    canAccessDashboard: true, // All roles can access dashboard
    canAccessSchedules: ['user', 'developer', 'admin', 'staff'].includes(role),
    canAccessWorkers: ['user', 'developer', 'admin', 'staff'].includes(role),
    canAccessFeeds: ['developer', 'admin', 'staff'].includes(role),
    canAccessRules: ['accountant', 'developer', 'admin', 'staff'].includes(role),
    canAccessAdmin: role === 'admin',

    // Actions
    canCreateFeeds: ['developer', 'admin', 'staff'].includes(role),
    canEditFeeds: ['developer', 'admin', 'staff'].includes(role),
    canDeleteFeeds: role === 'admin',
    
    canCreateSchedules: ['developer', 'admin', 'staff'].includes(role),
    canEditSchedules: ['developer', 'admin', 'staff'].includes(role),
    canDeleteSchedules: role === 'admin',
    
    canCreateRules: ['accountant', 'developer', 'admin', 'staff'].includes(role),
    canEditRules: ['accountant', 'developer', 'admin', 'staff'].includes(role),
    canDeleteRules: ['developer', 'admin'].includes(role),
    
    canViewWorkers: ['user', 'developer', 'admin', 'staff'].includes(role),
    
    canManageUsers: role === 'admin',
  };

  return {
    role,
    permissions,
    isAdmin: role === 'admin',
    isDeveloper: role === 'developer',
    isAccountant: role === 'accountant',
    isUser: role === 'user',
  };
}

