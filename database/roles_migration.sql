-- ============================================
-- ROLES AND PERMISSIONS MIGRATION
-- ============================================
-- This script migrates from hardcoded roles to dynamic role system

-- Step 1: Create tables (if not exists - handled by roles_schema.sql)
-- Step 2: Seed permissions (if not exists - handled by permissions_seed.sql)

-- Step 3: Create default system roles
INSERT INTO public.roles (name, description, is_system) VALUES
('user', 'Basic user with limited access', true),
('developer', 'Technical staff with create/edit access', true),
('accountant', 'Accounting staff with rules management', true),
('admin', 'System administrator with full access', true),
('staff', 'Staff member with standard access', true)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Map permissions to roles
-- User role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'user'
  AND p.name IN ('dashboard.view', 'schedules.view', 'workers.view')
ON CONFLICT DO NOTHING;

-- Developer role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'developer'
  AND p.name IN (
    'dashboard.view',
    'schedules.view', 'schedules.create', 'schedules.update', 'schedules.execute',
    'workers.view', 'workers.retry',
    'feeds.view', 'feeds.create', 'feeds.update',
    'rules.view', 'rules.create', 'rules.update', 'rules.delete'
  )
ON CONFLICT DO NOTHING;

-- Accountant role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'accountant'
  AND p.name IN ('dashboard.view', 'rules.view', 'rules.create', 'rules.update')
ON CONFLICT DO NOTHING;

-- Admin role permissions (all permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Staff role permissions (same as developer)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'staff'
  AND p.name IN (
    'dashboard.view',
    'schedules.view', 'schedules.create', 'schedules.update', 'schedules.execute',
    'workers.view', 'workers.retry',
    'feeds.view', 'feeds.create', 'feeds.update',
    'rules.view', 'rules.create', 'rules.update', 'rules.delete'
  )
ON CONFLICT DO NOTHING;

-- Step 5: Add role_id column to profiles table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role_id uuid REFERENCES public.roles(id);
  END IF;
END $$;

-- Step 6: Migrate existing users to use role_id
UPDATE public.profiles p
SET role_id = r.id
FROM public.roles r
WHERE p.role = r.name
  AND p.role_id IS NULL;

-- Step 7: Create index on role_id for performance
CREATE INDEX IF NOT EXISTS profiles_role_id_idx ON public.profiles(role_id);

