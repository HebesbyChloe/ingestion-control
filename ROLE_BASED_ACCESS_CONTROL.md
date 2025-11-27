# Role-Based Access Control (RBAC) Implementation

## Overview

The application now supports role-based access control with 5 distinct roles, each with different permissions and page access.

## Roles and Permissions

### 1. **User** (Basic Access)
**Pages:**
- ✅ Dashboard
- ✅ Jobs (Workers)
- ✅ Schedules

**Actions:**
- View only (read-only access)
- Cannot create, edit, or delete

**Use Case:** Basic users who need to monitor system status and view jobs/schedules.

---

### 2. **Developer** (Technical Access)
**Pages:**
- ✅ Dashboard
- ✅ Schedules
- ✅ Workers (Jobs)
- ✅ Feeds

**Actions:**
- ✅ Create/Edit/View all content
- ✅ Cannot delete (except rules)
- ❌ No user management
- ❌ No admin panel access

**Use Case:** Technical staff who manage feeds, schedules, and workers but don't need admin privileges.

---

### 3. **Accountant** (Rules Management)
**Pages:**
- ✅ Dashboard
- ✅ Rules

**Actions:**
- ✅ Create/Edit/View Rules only
- ❌ Cannot access other pages
- ❌ No delete permissions

**Use Case:** Accounting staff who manage business rules and pricing logic.

---

### 4. **Admin** (Full Access)
**Pages:**
- ✅ Dashboard
- ✅ Feeds
- ✅ Schedules
- ✅ Workers
- ✅ Rules
- ✅ Admin Users

**Actions:**
- ✅ Full CRUD access to everything
- ✅ User management
- ✅ Can delete any content
- ✅ Complete system access

**Use Case:** System administrators with full control.

---

### 5. **Staff** (Legacy Support)
**Pages:**
- ✅ Dashboard
- ✅ Schedules
- ✅ Workers
- ✅ Feeds

**Actions:**
- ✅ Create/Edit/View
- ❌ No delete (except rules)
- ❌ No user management

**Use Case:** Legacy role, similar to Developer.

---

## Implementation Details

### 1. Database Schema
- Updated `profiles` table to support: `user`, `developer`, `accountant`, `admin`, `staff`
- Constraint check ensures only valid roles can be assigned

### 2. Middleware Protection (`middleware.ts`)
- Route-level access control
- Redirects users to `/dashboard` if they try to access unauthorized routes
- Checks role before allowing access

### 3. Permissions Hook (`hooks/usePermissions.ts`)
- Provides granular permission checks
- Can be used in components to show/hide UI elements
- Returns role and permission flags

### 4. Navigation Filtering (`components/Layout.tsx`)
- Automatically filters navigation menu based on user role
- Only shows pages the user has access to

### 5. Login Redirect Fix
- Fixed login redirect issue using `window.location.href`
- Ensures session is fully established before redirect

---

## Usage Examples

### In Components

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { permissions, role } = usePermissions();

  return (
    <div>
      {permissions.canCreateFeeds && (
        <Button onClick={createFeed}>Create Feed</Button>
      )}
      
      {permissions.canDeleteFeeds && (
        <Button onClick={deleteFeed}>Delete</Button>
      )}
      
      {permissions.canAccessAdmin && (
        <Link href="/admin/users">Manage Users</Link>
      )}
    </div>
  );
}
```

### In Middleware

Routes are automatically protected based on role. Users trying to access unauthorized routes are redirected to dashboard.

---

## Role Assignment

### During User Creation
Admins can assign any role when creating users via `/admin/users`.

### During Registration
New users are automatically assigned `user` role (lowest privilege).

### Role Changes
Admins can change user roles at any time via the Admin Users page.

---

## Security

1. **Middleware Protection**: Routes are protected at the edge
2. **Component-Level**: UI elements are hidden based on permissions
3. **Database RLS**: Can be extended to restrict data access by role

---

## Testing Roles

1. **Create Test Users:**
   - Go to `/admin/users`
   - Create users with different roles
   - Test login with each role

2. **Verify Access:**
   - Login as each role
   - Check navigation menu shows only allowed pages
   - Try accessing unauthorized routes (should redirect to dashboard)

3. **Test Actions:**
   - Verify create/edit/delete buttons show/hide correctly
   - Test that unauthorized actions are blocked

---

## Future Enhancements

- Add RLS policies for database-level role restrictions
- Add audit logging for role changes
- Add role-based API endpoint restrictions
- Add custom role creation

---

**Last Updated:** November 26, 2025

