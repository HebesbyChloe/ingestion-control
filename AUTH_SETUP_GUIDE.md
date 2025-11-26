# Authentication Setup Guide

## Overview

This application now has **secure email/password authentication** powered by Supabase Auth. All admin pages are protected and require login.

## Features Implemented

✅ Email/password authentication  
✅ Login, Register, and Logout pages  
✅ Protected routes with middleware  
✅ Role-based access control (User, Staff, Admin)  
✅ User profile management  
✅ Admin user management page  
✅ Personalized dashboard with user greeting  
✅ Logout functionality in sidebar  

## Setup Instructions

### 1. Run Database Migrations

Execute these SQL files in your **Supabase SQL Editor** in order:

#### Step 1: Create Profiles Table
```bash
# Run: database/schema.sql
```

This creates:
- `profiles` table linked to `auth.users`
- Indexes for performance
- Auto-update triggers for `updated_at`

#### Step 2: Enable Row Level Security
```bash
# Run: database/rls.sql
```

This sets up:
- RLS policies for profiles table
- User self-service policies
- Admin management policies

### 2. Create Your First Admin User

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"**
3. Fill in:
   - Email: `admin@yourdomain.com`
   - Password: (set a secure password)
   - **Auto Confirm User**: ✅ YES
4. Click **"Create User"**
5. Copy the generated **User ID** (UUID)
6. Go to **SQL Editor** and run:

```sql
insert into public.profiles (id, email, full_name, role, is_active)
values (
  'PASTE_USER_ID_HERE'::uuid,
  'admin@yourdomain.com',
  'Admin User',
  'admin',
  true
);
```

#### Option B: Via SQL (Advanced)
See `database/seed.sql` for manual SQL user creation.

### 3. Environment Variables

Your `.env.local` should already have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These were set up earlier and are already configured.

### 4. Start the Development Server

```bash
npm run dev
```

## Testing the Authentication Flow

### Test 1: Protected Routes
1. Open browser to `http://localhost:5000`
2. Try accessing `/dashboard`
3. **Expected**: Redirect to `/login`

### Test 2: Login
1. Go to `/login`
2. Enter admin credentials
3. Click "Sign In"
4. **Expected**: Redirect to `/dashboard` with personalized greeting

### Test 3: Dashboard Personalization
1. Check dashboard header
2. **Expected**: "Good [morning/afternoon/evening], [Your Name]!"
3. **Expected**: Role badge showing "ADMIN"

### Test 4: User Profile in Sidebar
1. Check bottom of sidebar
2. **Expected**: 
   - Your initials in avatar
   - Full name
   - Email address
   - Role badge (admin/staff/user)
   - "Sign Out" button

### Test 5: Admin User Management
1. Click "Admin Users" in sidebar (only visible to admins)
2. **Expected**: See list of all users
3. Try changing a user's role
4. Try toggling user active status
5. **Expected**: Changes save successfully

### Test 6: Role-Based Access
1. Create a new user with "user" role (not admin)
2. Log in as that user
3. **Expected**: "Admin Users" link NOT visible in sidebar
4. Try accessing `/admin/users` directly
5. **Expected**: Redirect to `/dashboard`

### Test 7: Logout
1. Click "Sign Out" in sidebar
2. **Expected**: Redirect to `/login`
3. Try accessing `/dashboard` again
4. **Expected**: Redirect to `/login`

### Test 8: Register New User
1. Go to `/register`
2. Fill in: Name, Email, Password
3. Click "Create Account"
4. **Expected**: Account created, redirect to `/dashboard`
5. **Expected**: New user has "user" role by default

## File Structure

```
lib/supabase/
├── client.ts          # Browser-side Supabase client
├── server.ts          # Server-side Supabase client
└── middleware.ts      # Middleware helper for auth

app/
├── login/page.tsx     # Login page
├── register/page.tsx  # Registration page
├── logout/page.tsx    # Logout handler
└── admin/
    └── users/page.tsx # User management (admin only)

hooks/
└── useSupabaseAuth.ts # Custom auth hook

middleware.ts          # Root middleware for route protection

database/
├── schema.sql        # Database schema
├── rls.sql           # RLS policies
└── seed.sql          # First admin user instructions
```

## Protected Routes

The following routes require authentication:
- `/dashboard`
- `/feeds`
- `/schedules`
- `/workers`
- `/rules`
- `/admin/*` (admin role only)

Public routes (no auth required):
- `/login`
- `/register`
- `/logout`

## User Roles

### User (Default)
- Access to all main pages
- Cannot access `/admin/*` routes
- Can view own profile

### Staff
- Same as User
- Custom permissions can be added later

### Admin
- Full access to all pages
- Access to User Management (`/admin/users`)
- Can change user roles
- Can activate/deactivate accounts

## Security Features

1. **Middleware Protection**: All routes checked before render
2. **Row Level Security**: Database policies prevent unauthorized data access
3. **Session Management**: Automatic session refresh
4. **Cookie-based Auth**: Secure HTTP-only cookies
5. **Role Validation**: Server-side role checks for admin routes

## Customization

### Adding New Protected Routes

Edit `middleware.ts`:

```typescript
const protectedRoutes = [
  '/dashboard', 
  '/feeds', 
  '/schedules', 
  '/workers', 
  '/rules', 
  '/admin',
  '/your-new-route', // Add here
];
```

### Adding New Roles

1. Update `database/schema.sql`:
```sql
role text not null default 'user' check (role in ('user', 'staff', 'admin', 'new_role'))
```

2. Update TypeScript types in `hooks/useSupabaseAuth.ts`:
```typescript
role: 'user' | 'staff' | 'admin' | 'new_role';
```

## Troubleshooting

### "Unauthorized" Error
- Check Supabase environment variables are set
- Verify RLS policies are enabled
- Check user has a profile in `profiles` table

### Middleware Redirect Loop
- Clear browser cookies
- Check middleware matcher in `middleware.ts`
- Verify public routes are excluded

### User Can't Access Admin Page
- Verify user's role in `profiles` table
- Run: `SELECT role FROM profiles WHERE id = 'user-id';`
- Should return `'admin'`

### Profile Not Found After Signup
- Check RLS policy: "Users can insert own profile on signup"
- Verify `signUp` function creates profile
- Check Supabase logs for errors

## Next Steps

### Production Deployment

1. Set environment variables in Vercel/deployment platform:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. Disable public registration (optional):
   - Remove `/register` from public routes in `middleware.ts`
   - Only admins can create users via dashboard

3. Add password reset functionality:
   - Use `supabase.auth.resetPasswordForEmail()`
   - Create `/reset-password` page

4. Add email verification:
   - Enable in Supabase Auth settings
   - Update signup flow to show "Check your email" message

## API Reference

### useSupabaseAuth Hook

```typescript
const { 
  user,      // Current user object
  profile,   // User profile with role
  loading,   // Auth loading state
  signIn,    // (email, password) => Promise
  signUp,    // (email, password, fullName) => Promise
  signOut,   // () => Promise
  isAdmin,   // boolean helper
} = useSupabaseAuth();
```

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Verify database policies in Supabase Dashboard → Authentication → Policies

---

**Authentication is now fully configured! 🎉**

Test thoroughly before deploying to production.

