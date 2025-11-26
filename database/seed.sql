-- ============================================
-- SEED DATA - FIRST ADMIN USER
-- ============================================

-- INSTRUCTIONS:
-- 1. First, create a user in Supabase Auth Dashboard:
--    - Go to Authentication > Users > Add User
--    - Email: admin@yourdomain.com
--    - Password: (set a secure password)
--    - Auto Confirm User: YES

-- 2. After creating the auth user, copy the user ID from the dashboard

-- 3. Run this SQL to create the admin profile:
--    (Replace 'YOUR_USER_ID_HERE' with the actual UUID from step 2)

insert into public.profiles (id, email, full_name, role, is_active)
values (
  'YOUR_USER_ID_HERE'::uuid,  -- Replace with actual user ID
  'admin@yourdomain.com',
  'Admin User',
  'admin',
  true
);

-- ============================================
-- ALTERNATIVE: Create user via SQL (if needed)
-- ============================================
-- Note: This requires special permissions and is not recommended
-- It's better to use the Supabase Dashboard method above

-- Example SQL if you have access to auth schema:
-- insert into auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   confirmation_token
-- ) values (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'admin@yourdomain.com',
--   crypt('your-secure-password', gen_salt('bf')),
--   now(),
--   now(),
--   now(),
--   ''
-- );

