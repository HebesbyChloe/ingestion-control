'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, type Role, type CreateRoleInput, type UpdateRoleInput } from '@/lib/api/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionSelector } from './PermissionSelector';
import { Loader2, X } from 'lucide-react';

interface RoleFormProps {
  role?: Role | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RoleForm({ role, onClose, onSuccess }: RoleFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load role permissions if editing
  useEffect(() => {
    if (role?.id) {
      rolesApi.getPermissions(role.id).then((permissions) => {
        setSelectedPermissionIds(permissions.map(p => p.id));
      }).catch((err) => {
        console.error('Error loading permissions:', err);
      });
    }
  }, [role?.id]);

  const createMutation = useMutation({
    mutationFn: (input: CreateRoleInput) => rolesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) => rolesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update role');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    if (role?.id) {
      // Update existing role
      updateMutation.mutate({
        id: role.id,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          permission_ids: selectedPermissionIds,
        },
      });
    } else {
      // Create new role
      createMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        permission_ids: selectedPermissionIds,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isSystemRole = role?.is_system;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {role ? 'Edit Role' : 'Create New Role'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Name */}
          <div>
            <Label htmlFor="role-name">Role Name *</Label>
            <Input
              id="role-name"
              type="text"
              placeholder="e.g., Manager, Analyst"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading || isSystemRole}
              className="mt-1"
            />
            {isSystemRole && (
              <p className="text-xs text-slate-500 mt-1">
                System roles cannot be renamed
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="role-description">Description</Label>
            <textarea
              id="role-description"
              placeholder="Describe what this role is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Permissions */}
          <div>
            <Label className="mb-3 block">Permissions</Label>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-[400px] overflow-y-auto">
              <PermissionSelector
                selectedPermissionIds={selectedPermissionIds}
                onSelectionChange={setSelectedPermissionIds}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Select the permissions this role should have. Permissions are grouped by resource.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {role ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                role ? 'Update Role' : 'Create Role'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

