-- ============================================
-- DEFAULT PERMISSIONS SEED DATA
-- ============================================

-- Insert default permissions for all resources and actions
INSERT INTO public.permissions (name, resource, action, description) VALUES
-- Dashboard permissions
('dashboard.view', 'dashboard', 'view', 'View dashboard'),

-- Feeds permissions
('feeds.view', 'feeds', 'view', 'View feeds list'),
('feeds.create', 'feeds', 'create', 'Create new feeds'),
('feeds.update', 'feeds', 'update', 'Edit existing feeds'),
('feeds.delete', 'feeds', 'delete', 'Delete feeds'),

-- Schedules permissions
('schedules.view', 'schedules', 'view', 'View schedules list'),
('schedules.create', 'schedules', 'create', 'Create new schedules'),
('schedules.update', 'schedules', 'update', 'Edit existing schedules'),
('schedules.delete', 'schedules', 'delete', 'Delete schedules'),
('schedules.execute', 'schedules', 'execute', 'Manually execute schedules'),

-- Workers permissions
('workers.view', 'workers', 'view', 'View workers/jobs list'),
('workers.retry', 'workers', 'retry', 'Retry failed jobs'),

-- Rules permissions
('rules.view', 'rules', 'view', 'View rules list'),
('rules.create', 'rules', 'create', 'Create new rules'),
('rules.update', 'rules', 'update', 'Edit existing rules'),
('rules.delete', 'rules', 'delete', 'Delete rules'),

-- Admin permissions
('admin.users.view', 'admin', 'view', 'View user management'),
('admin.users.create', 'admin', 'create', 'Create new users'),
('admin.users.update', 'admin', 'update', 'Edit user accounts'),
('admin.users.delete', 'admin', 'delete', 'Delete user accounts'),
('admin.roles.view', 'admin', 'view', 'View roles management'),
('admin.roles.create', 'admin', 'create', 'Create new roles'),
('admin.roles.update', 'admin', 'update', 'Edit roles'),
('admin.roles.delete', 'admin', 'delete', 'Delete roles')

ON CONFLICT (name) DO NOTHING;

