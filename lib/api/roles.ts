import { createClient } from '@/lib/supabase/client';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions?: Permission[];
  user_count?: number;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permission_ids: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permission_ids?: string[];
}

export const rolesApi = {
  // Get all roles
  getAll: async (): Promise<RoleWithPermissions[]> => {
    const supabase = createClient();
    
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('is_system', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    // Get permissions for each role and user count
    const rolesWithData = await Promise.all(
      (roles || []).map(async (role) => {
        const [permissionsResult, userCountResult] = await Promise.all([
          supabase
            .from('role_permissions')
            .select('permission_id, permissions(*)')
            .eq('role_id', role.id),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role_id', role.id),
        ]);

        return {
          ...role,
          permissions: permissionsResult.data?.map((rp: any) => rp.permissions).filter(Boolean) || [],
          user_count: userCountResult.count || 0,
        };
      })
    );

    return rolesWithData as RoleWithPermissions[];
  },

  // Get single role with permissions
  getById: async (id: string): Promise<RoleWithPermissions | null> => {
    const supabase = createClient();
    
    const { data: role, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!role) return null;

    // Get permissions for this role
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions(*)')
      .eq('role_id', id);

    // Get user count
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', id);

    return {
      ...role,
      permissions: rolePermissions?.map((rp: any) => rp.permissions).filter(Boolean) || [],
      user_count: count || 0,
    } as RoleWithPermissions;
  },

  // Create new role
  create: async (input: CreateRoleInput): Promise<Role> => {
    const supabase = createClient();
    
    // Create the role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: input.name,
        description: input.description || null,
        is_system: false,
      })
      .select()
      .single();

    if (roleError) throw roleError;
    if (!role) throw new Error('Failed to create role');

    // Assign permissions
    if (input.permission_ids.length > 0) {
      const rolePermissions = input.permission_ids.map(permission_id => ({
        role_id: role.id,
        permission_id,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    return role;
  },

  // Update role
  update: async (id: string, input: UpdateRoleInput): Promise<Role> => {
    const supabase = createClient();
    
    // Update role fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    if (Object.keys(updateData).length > 0) {
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (roleError) throw roleError;
      if (!role) throw new Error('Role not found');
    }

    // Update permissions if provided
    if (input.permission_ids !== undefined) {
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (input.permission_ids.length > 0) {
        const rolePermissions = input.permission_ids.map(permission_id => ({
          role_id: id,
          permission_id,
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (insertError) throw insertError;
      }
    }

    // Fetch updated role
    const updatedRole = await rolesApi.getById(id);
    if (!updatedRole) throw new Error('Role not found');
    
    return updatedRole;
  },

  // Delete role
  delete: async (id: string): Promise<void> => {
    const supabase = createClient();
    
    // Check if role is system role
    const { data: role, error: fetchError } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (role?.is_system) {
      throw new Error('Cannot delete system role');
    }

    // Check if role is in use
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', id);

    if (count && count > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    // Delete role (cascade will delete role_permissions)
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get permissions for a role
  getPermissions: async (roleId: string): Promise<Permission[]> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions(*)')
      .eq('role_id', roleId);

    if (error) throw error;

    return (data?.map((rp: any) => rp.permissions).filter(Boolean) || []) as Permission[];
  },
};

