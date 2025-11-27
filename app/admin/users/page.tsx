'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { rolesApi, type Role } from '@/lib/api/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Shield, UserPlus, X, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'developer' | 'accountant' | 'admin' | 'staff';
  role_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  // Fetch all roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get default role (user)
  const defaultRoleId = roles.find(r => r.name === 'user')?.id || '';

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    roleId: defaultRoleId,
  });

  // Update roleId when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !newUser.roleId) {
      const userRole = roles.find(r => r.name === 'user');
      if (userRole) {
        setNewUser(prev => ({ ...prev, roleId: userRole.id }));
      }
    }
  }, [roles, newUser.roleId]);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch all profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Get role name from role_id or fallback to role field
  const getRoleName = (profile: Profile): string => {
    if (profile.role_id) {
      const role = roles.find(r => r.id === profile.role_id);
      return role?.name || profile.role;
    }
    return profile.role;
  };

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      // Get role name from role_id
      const role = roles.find(r => r.id === roleId);
      if (!role) throw new Error('Role not found');

      const { error } = await supabase
        .from('profiles')
        .update({ role_id: roleId, role: role.name })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Approve user mutation (sets is_active to true)
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete both profile and auth user using database function
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowDeleteConfirm(false);
      setDeleteUserId(null);
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Get role name from role_id
      const role = roles.find(r => r.id === userData.roleId);
      if (!role) throw new Error('Role not found');

      // Create profile with specified role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          role_id: userData.roleId,
          role: role.name,
          is_active: true,
        });

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowAddUserModal(false);
      const defaultRole = roles.find(r => r.name === 'user');
      setNewUser({ email: '', password: '', fullName: '', roleId: defaultRole?.id || '' });
      setAddUserError(null);
    },
    onError: (error: any) => {
      setAddUserError(error.message || 'Failed to create user');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);
    createUserMutation.mutate(newUser);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'developer':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'accountant':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'staff':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Separate pending and active users
  const pendingUsers = profiles.filter(p => !p.is_active);
  const activeUsers = profiles.filter(p => p.is_active);

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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Manage user accounts and permissions</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddUserModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="w-5 h-5" />
                  All Users
                </CardTitle>
                <CardDescription className="mt-1">
                  View and manage user roles and account status
                  {pendingUsers.length > 0 && (
                    <span className="ml-2 text-amber-600 font-medium">
                      • {pendingUsers.length} pending approval
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600">No users found</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {/* Pending Users Section */}
                {pendingUsers.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <div className="mb-3 sm:mb-4 flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs sm:text-sm">
                        Pending Approval ({pendingUsers.length})
                      </Badge>
                    </div>
                    <div className="overflow-x-auto border border-amber-200 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-amber-50">
                            <TableHead className="text-xs sm:text-sm">Email</TableHead>
                            <TableHead className="text-xs sm:text-sm">Full Name</TableHead>
                            <TableHead className="text-xs sm:text-sm">Role</TableHead>
                            <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Created</TableHead>
                            <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingUsers.map((profile) => (
                            <TableRow key={profile.id} className="bg-amber-50/50">
                              <TableCell className="font-medium text-xs sm:text-sm">
                                <div className="truncate max-w-[150px] sm:max-w-none">{profile.email}</div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {profile.full_name || '-'}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <Badge className={getRoleBadgeColor(profile.role)}>
                                  {profile.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm text-slate-500 hidden sm:table-cell">
                                {format(new Date(profile.created_at), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    onClick={() => approveUserMutation.mutate(profile.id)}
                                    disabled={approveUserMutation.isPending}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                                  >
                                    {approveUserMutation.isPending ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      'Approve'
                                    )}
                                  </Button>
                                  <Select
                                    value={profile.role_id || profile.role}
                                    onValueChange={(roleId) => updateRoleMutation.mutate({
                                      userId: profile.id,
                                      roleId,
                                    })}
                                  >
                                    <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm" disabled={updateRoleMutation.isPending}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                          {role.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={() => {
                                      setDeleteUserId(profile.id);
                                      setShowDeleteConfirm(true);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                                  >
                                    <Trash2 className="w-3 h-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Active Users Section */}
                {activeUsers.length > 0 && (
                  <div>
                    {pendingUsers.length > 0 && (
                      <div className="mb-3 sm:mb-4 flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs sm:text-sm">
                          Active Users ({activeUsers.length})
                        </Badge>
                      </div>
                    )}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Email</TableHead>
                            <TableHead className="text-xs sm:text-sm">Full Name</TableHead>
                            <TableHead className="text-xs sm:text-sm">Role</TableHead>
                            <TableHead className="text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Created</TableHead>
                            <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeUsers.map((profile) => (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                <div className="truncate max-w-[150px] sm:max-w-none">{profile.email}</div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {profile.full_name || '-'}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <Badge className={getRoleBadgeColor(profile.role)}>
                                  {profile.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() => toggleActiveMutation.mutate({
                                    userId: profile.id,
                                    isActive: !profile.is_active,
                                  })}
                                  disabled={toggleActiveMutation.isPending}
                                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                  style={{
                                    backgroundColor: profile.is_active ? '#4f46e5' : '#94a3b8',
                                  }}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      profile.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm text-slate-500 hidden sm:table-cell">
                                {format(new Date(profile.created_at), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Select
                                    value={profile.role_id || profile.role}
                                    onValueChange={(roleId) => updateRoleMutation.mutate({
                                      userId: profile.id,
                                      roleId,
                                    })}
                                  >
                                    <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm" disabled={updateRoleMutation.isPending}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                          {role.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {!profile.is_active && (
                                    <Button
                                      onClick={() => {
                                        setDeleteUserId(profile.id);
                                        setShowDeleteConfirm(true);
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
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
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setAddUserError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  required
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={createUserMutation.isPending}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.roleId}
                  onValueChange={(roleId) => setNewUser({ ...newUser, roleId })}
                >
                  <SelectTrigger disabled={createUserMutation.isPending}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                        {role.description && (
                          <span className="text-xs text-slate-500 ml-2">
                            - {role.description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {addUserError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {addUserError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserError(null);
                  }}
                  disabled={createUserMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteUserId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone. The user profile will be permanently removed.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteUserId(null);
                }}
                disabled={deleteUserMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteUserMutation.mutate(deleteUserId)}
                disabled={deleteUserMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
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

