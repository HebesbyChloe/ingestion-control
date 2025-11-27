'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi, type Permission } from '@/lib/api/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PermissionSelectorProps {
  selectedPermissionIds: string[];
  onSelectionChange: (permissionIds: string[]) => void;
}

const resourceLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  feeds: 'Feeds',
  schedules: 'Schedules',
  workers: 'Workers',
  rules: 'Rules',
  admin: 'Admin',
};

const actionLabels: Record<string, string> = {
  view: 'View',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete',
  execute: 'Execute',
  retry: 'Retry',
};

export function PermissionSelector({ selectedPermissionIds, onSelectionChange }: PermissionSelectorProps) {
  const { data: permissionGroups = [], isLoading } = useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: () => permissionsApi.getGrouped(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(selectedPermissionIds));
  const prevPropsRef = useRef<string>(JSON.stringify(selectedPermissionIds));

  useEffect(() => {
    const currentProps = JSON.stringify(selectedPermissionIds);
    if (prevPropsRef.current !== currentProps) {
      prevPropsRef.current = currentProps;
      setSelectedIds(new Set(selectedPermissionIds));
    }
  }, [selectedPermissionIds]);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedIds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const handleResourceToggle = (resource: string, permissions: Permission[]) => {
    const resourcePermissionIds = permissions.map(p => p.id);
    const allSelected = resourcePermissionIds.every(id => selectedIds.has(id));
    
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      // Deselect all
      resourcePermissionIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all
      resourcePermissionIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {permissionGroups.map((group) => {
        const resourcePermissionIds = group.permissions.map(p => p.id);
        const allSelected = resourcePermissionIds.length > 0 && resourcePermissionIds.every(id => selectedIds.has(id));
        const someSelected = resourcePermissionIds.some(id => selectedIds.has(id));

        return (
          <Card key={group.resource} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {resourceLabels[group.resource] || group.resource}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`resource-${group.resource}`}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={() => handleResourceToggle(group.resource, group.permissions)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                  />
                  <Label
                    htmlFor={`resource-${group.resource}`}
                    className="text-xs text-slate-600 cursor-pointer"
                  >
                    Select All
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {group.permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={selectedIds.has(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <Label
                      htmlFor={`permission-${permission.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                      title={permission.description || undefined}
                    >
                      {actionLabels[permission.action] || permission.action}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

