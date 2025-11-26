# Authentication Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Setup (2 min)

Open **Supabase SQL Editor** and run these files in order:

1. **Create profiles table**: Run `database/schema.sql`
2. **Enable security**: Run `database/rls.sql`

✅ Done? Your database is ready!

---

### Step 2: Create Your Admin User (2 min)

#### In Supabase Dashboard:
1. Go to **Authentication** → **Users** → **"Add User"**
2. Fill in:
   - Email: `your-email@example.com`
   - Password: (set a secure password)
   - ✅ **Auto Confirm User**: YES
3. Click **"Create User"**
4. **Copy the User ID** (looks like: `abc12345-6789-...`)

#### Back in SQL Editor:
```sql
insert into public.profiles (id, email, full_name, role, is_active)
values (
  'PASTE_YOUR_USER_ID_HERE'::uuid,
  'your-email@example.com',
  'Your Name',
  'admin',
  true
);
```

✅ Done? You now have an admin account!

---

### Step 3: Test It Out (1 min)

```bash
npm run dev
```

1. Go to `http://localhost:5000/dashboard`
2. You'll be redirected to `/login`
3. Enter your email and password
4. You should see: **"Good morning/afternoon/evening, Your Name!"**

✅ Working? You're all set! 🎉

---

## 🔑 Quick Reference

### Login Credentials
- **URL**: `/login`
- **Email**: The email you created
- **Password**: The password you set

### Pages You Can Access
- `/dashboard` - Main dashboard
- `/feeds` - Feed management
- `/schedules` - Schedule management
- `/workers` - Job monitoring
- `/rules` - Rules management
- `/admin/users` - User management (admin only)

### Your Admin Powers
- ✅ Create new users
- ✅ Change user roles
- ✅ Activate/deactivate accounts
- ✅ Access all pages

---

## 🛠️ Common Tasks

### Create New Users
1. Go to `/admin/users`
2. Users can self-register at `/register`
3. Or create them manually in Supabase Dashboard

### Change User Roles
1. Go to `/admin/users`
2. Find the user
3. Click the role dropdown
4. Select: User / Staff / Admin

### Deactivate a User
1. Go to `/admin/users`
2. Toggle the switch next to the user
3. They won't be able to log in

---

## 🚨 Troubleshooting

### "Cannot access dashboard"
→ Make sure you logged in first at `/login`

### "Login not working"
→ Check your email and password  
→ Verify you created the admin profile in SQL

### "Can't see Admin Users link"
→ Verify your role is `'admin'` in the database:
```sql
SELECT role FROM profiles WHERE email = 'your-email@example.com';
```

### "401 Unauthorized errors"
→ Check `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📚 Full Documentation

- **Comprehensive Setup**: `AUTH_SETUP_GUIDE.md`
- **Testing Checklist**: `POST_AUTH_CHECKLIST.md`
- **Implementation Details**: `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist

- [ ] Run `database/schema.sql` in Supabase
- [ ] Run `database/rls.sql` in Supabase
- [ ] Create admin user in Supabase Dashboard
- [ ] Insert admin profile with SQL
- [ ] Test login at `http://localhost:5000/login`
- [ ] Verify dashboard shows your name
- [ ] Test logout button
- [ ] Test admin user management

---

**That's it! Your authentication is ready to use.** 🎉

Need more details? Check `AUTH_SETUP_GUIDE.md`

