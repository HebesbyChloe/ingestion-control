-- ============================================
-- ROLES AND PERMISSIONS SYSTEM
-- ============================================

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean DEFAULT false, -- System roles (admin, user, etc.) cannot be deleted
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, -- e.g., "feeds.create", "schedules.delete"
  resource text NOT NULL, -- e.g., "feeds", "schedules", "rules", "workers", "admin"
  action text NOT NULL, -- e.g., "create", "read", "update", "delete", "view"
  description text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create Role-Permissions Junction Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Add updated_at trigger for roles
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS roles_name_idx ON public.roles(name);
CREATE INDEX IF NOT EXISTS permissions_resource_idx ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS permissions_name_idx ON public.permissions(name);
CREATE INDEX IF NOT EXISTS role_permissions_role_id_idx ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON public.role_permissions(permission_id);

