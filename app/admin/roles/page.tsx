'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, type RoleWithPermissions } from '@/lib/api/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, UserPlus, Edit, Trash2, AlertTriangle, Users } from 'lucide-react';
import { RoleForm } from '@/components/admin/RoleForm';
import { format } from 'date-fns';

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch all roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowDeleteConfirm(false);
      setDeleteRoleId(null);
    },
  });

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowRoleForm(true);
  };

  const handleEditRole = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setShowRoleForm(true);
  };

  const handleDeleteRole = (role: RoleWithPermissions) => {
    if (role.is_system) {
      alert('System roles cannot be deleted');
      return;
    }
    setDeleteRoleId(role.id);
    setShowDeleteConfirm(true);
  };

  const getRoleBadgeColor = (isSystem: boolean) => {
    return isSystem
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Role Management</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage roles with custom permissions</p>
              </div>
            </div>
            <Button
              onClick={handleCreateRole}
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Shield className="w-5 h-5" />
              All Roles
            </CardTitle>
            <CardDescription>
              Manage roles and their permissions. System roles cannot be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600">No roles found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Description</TableHead>
                      <TableHead className="text-xs sm:text-sm">Type</TableHead>
                      <TableHead className="text-xs sm:text-sm">Permissions</TableHead>
                      <TableHead className="text-xs sm:text-sm">Users</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Created</TableHead>
                      <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {role.name}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-slate-600 max-w-xs truncate">
                          {role.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(role.is_system)}>
                            {role.is_system ? 'System' : 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {role.permissions?.length || 0} permissions
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-slate-400" />
                            {role.user_count || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-slate-500 hidden sm:table-cell">
                          {format(new Date(role.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditRole(role)}
                              size="sm"
                              variant="outline"
                              className="text-xs sm:text-sm"
                            >
                              <Edit className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            {!role.is_system && (
                              <Button
                                onClick={() => handleDeleteRole(role)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                                disabled={deleteRoleMutation.isPending || (role.user_count || 0) > 0}
                              >
                                <Trash2 className="w-3 h-3 sm:mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Form Modal */}
      {showRoleForm && (
        <RoleForm
          role={editingRole || undefined}
          onClose={() => {
            setShowRoleForm(false);
            setEditingRole(null);
          }}
          onSuccess={() => {
            setShowRoleForm(false);
            setEditingRole(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteRoleId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Role</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this role? This action cannot be undone. 
              Make sure no users are assigned to this role before deleting.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteRoleId(null);
                }}
                disabled={deleteRoleMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteRoleMutation.mutate(deleteRoleId)}
                disabled={deleteRoleMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deleteRoleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Role
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

