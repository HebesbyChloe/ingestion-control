'use client';

import { useQuery } from '@tanstack/react-query';
import { useSupabaseAuth } from './useSupabaseAuth';
import { createClient } from '@/lib/supabase/client';
import { rolesApi, type Permission } from '@/lib/api/roles';

// Fallback permissions for backward compatibility
const getFallbackPermissions = (role: string) => {
  const roleLower = role.toLowerCase();
  return {
    // Page access
    canAccessDashboard: true,
    canAccessSchedules: ['user', 'developer', 'admin', 'staff'].includes(roleLower),
    canAccessWorkers: ['user', 'developer', 'admin', 'staff'].includes(roleLower),
    canAccessFeeds: ['developer', 'admin', 'staff'].includes(roleLower),
    canAccessRules: ['accountant', 'developer', 'admin', 'staff'].includes(roleLower),
    canAccessAdmin: roleLower === 'admin',

    // Actions
    canCreateFeeds: ['developer', 'admin', 'staff'].includes(roleLower),
    canEditFeeds: ['developer', 'admin', 'staff'].includes(roleLower),
    canDeleteFeeds: roleLower === 'admin',
    
    canCreateSchedules: ['developer', 'admin', 'staff'].includes(roleLower),
    canEditSchedules: ['developer', 'admin', 'staff'].includes(roleLower),
    canDeleteSchedules: roleLower === 'admin',
    
    canCreateRules: ['accountant', 'developer', 'admin', 'staff'].includes(roleLower),
    canEditRules: ['accountant', 'developer', 'admin', 'staff'].includes(roleLower),
    canDeleteRules: ['developer', 'admin'].includes(roleLower),
    
    canViewWorkers: ['user', 'developer', 'admin', 'staff'].includes(roleLower),
    
    canManageUsers: roleLower === 'admin',
    canManageRoles: roleLower === 'admin',
  };
};

export function usePermissions() {
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  // Get role ID (prefer role_id, fallback to role name)
  const roleId = profile?.role_id;
  const roleName = profile?.role || 'user';

  // Fetch permissions from database if role_id exists
  const { data: dbPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions', roleId],
    queryFn: async () => {
      if (!roleId) return [];
      
      try {
        const permissions = await rolesApi.getPermissions(roleId);
        return permissions;
      } catch (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
    },
    enabled: !!roleId && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  // Build permissions object from database permissions
  const buildPermissions = (permissions: Permission[]) => {
    const permissionSet = new Set(permissions.map(p => p.name));
    
    return {
      // Page access
      canAccessDashboard: permissionSet.has('dashboard.view'),
      canAccessSchedules: permissionSet.has('schedules.view'),
      canAccessWorkers: permissionSet.has('workers.view'),
      canAccessFeeds: permissionSet.has('feeds.view'),
      canAccessRules: permissionSet.has('rules.view'),
      canAccessAdmin: permissionSet.has('admin.users.view') || permissionSet.has('admin.roles.view'),

      // Actions
      canCreateFeeds: permissionSet.has('feeds.create'),
      canEditFeeds: permissionSet.has('feeds.update'),
      canDeleteFeeds: permissionSet.has('feeds.delete'),
      
      canCreateSchedules: permissionSet.has('schedules.create'),
      canEditSchedules: permissionSet.has('schedules.update'),
      canDeleteSchedules: permissionSet.has('schedules.delete'),
      canExecuteSchedules: permissionSet.has('schedules.execute'),
      
      canCreateRules: permissionSet.has('rules.create'),
      canEditRules: permissionSet.has('rules.update'),
      canDeleteRules: permissionSet.has('rules.delete'),
      
      canViewWorkers: permissionSet.has('workers.view'),
      canRetryWorkers: permissionSet.has('workers.retry'),
      
      canManageUsers: permissionSet.has('admin.users.view'),
      canCreateUsers: permissionSet.has('admin.users.create'),
      canUpdateUsers: permissionSet.has('admin.users.update'),
      canDeleteUsers: permissionSet.has('admin.users.delete'),
      
      canManageRoles: permissionSet.has('admin.roles.view'),
      canCreateRoles: permissionSet.has('admin.roles.create'),
      canUpdateRoles: permissionSet.has('admin.roles.update'),
      canDeleteRoles: permissionSet.has('admin.roles.delete'),
    };
  };

  // Use database permissions if available, otherwise fallback
  const permissions = roleId && dbPermissions.length > 0
    ? buildPermissions(dbPermissions)
    : getFallbackPermissions(roleName);

  return {
    role: roleName,
    roleId,
    permissions,
    dbPermissions, // Raw permissions from database
    loading: authLoading || permissionsLoading,
    isAdmin: roleName === 'admin',
    isDeveloper: roleName === 'developer',
    isAccountant: roleName === 'accountant',
    isUser: roleName === 'user',
  };
}

