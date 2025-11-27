import { createClient } from '@/lib/supabase/client';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

export const permissionsApi = {
  // Get all permissions
  getAll: async (): Promise<Permission[]> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true })
      .order('action', { ascending: true });

    if (error) throw error;
    return (data || []) as Permission[];
  },

  // Get permissions grouped by resource
  getGrouped: async (): Promise<PermissionGroup[]> => {
    const permissions = await permissionsApi.getAll();
    
    // Group by resource
    const grouped = permissions.reduce((acc, permission) => {
      const existing = acc.find(g => g.resource === permission.resource);
      if (existing) {
        existing.permissions.push(permission);
      } else {
        acc.push({
          resource: permission.resource,
          permissions: [permission],
        });
      }
      return acc;
    }, [] as PermissionGroup[]);

    return grouped;
  },

  // Get permissions by resource
  getByResource: async (resource: string): Promise<Permission[]> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('resource', resource)
      .order('action', { ascending: true });

    if (error) throw error;
    return (data || []) as Permission[];
  },
};

