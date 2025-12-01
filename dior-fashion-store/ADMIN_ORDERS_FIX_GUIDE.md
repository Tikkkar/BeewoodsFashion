# Admin Orders Permission Fix Guide

## Problem
- Admin users getting 403 errors when viewing orders at `/admin/orders`
- Admin users cannot create manual orders
- Error: "Failed to load resource: the server responded with a status of 403"

## Root Cause
Supabase Row Level Security (RLS) policies are too restrictive and not allowing admin users to access the `orders` and `order_items` tables.

## Solution
Apply the migration file `migrations/fix_admin_orders_permissions.sql` to your Supabase database.

---

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `ftqwpsftzbagidoudwoq`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration**
   - Open `migrations/fix_admin_orders_permissions.sql`
   - Copy the entire content
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" or press `Ctrl+Enter`
   - Wait for success message

5. **Verify the Fix**
   - Go to `/admin/orders` in your app
   - Orders should now load
   - Try creating a manual order

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset
# OR
supabase db push
```

### Option 3: Direct SQL Execution

```bash
# Using psql command line
psql "postgresql://postgres:[YOUR-PASSWORD]@db.ftqwpsftzbagidoudwoq.supabase.co:5432/postgres" -f migrations/fix_admin_orders_permissions.sql
```

---

## What This Fix Does

### 1. Removes Restrictive Policies
- Drops old policies that were blocking admin access
- Cleans up conflicting rules

### 2. Creates New Comprehensive Policies

**For Admins:**
- ✅ Full access to ALL orders (view, create, update, delete)
- ✅ Full access to ALL order_items

**For Sale Employees:**
- ✅ Full access to ALL orders
- ✅ Full access to ALL order_items

**For Warehouse Employees:**
- ✅ Can view all orders (read-only)

**For Customers:**
- ✅ Can view their own orders only
- ✅ Can create new orders (checkout)

**For Anonymous Users (Guest Checkout):**
- ✅ Can create orders without login

### 3. Grants Table Permissions
- Ensures `authenticated` and `anon` roles have proper table access

---

## Verification Steps

After applying the migration, run these checks:

### 1. Check in SQL Editor
```sql
-- Verify your admin role
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Check if orders load
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Check policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
```

### 2. Check in Application
1. Login as admin user
2. Go to `/admin/orders`
3. Orders should load without 403 errors
4. Click "Create Manual Order"
5. Fill form and submit
6. Order should be created successfully

### 3. Check Console
- No more 403 errors in browser console
- No more "Error fetching orders" messages

---

## Expected Results

**Before Fix:**
```
❌ Failed to load resource: the server responded with a status of 403
❌ Error fetching orders: Object
❌ Error creating manual order: Object
```

**After Fix:**
```
✅ Orders loaded successfully
✅ ✅ Total products loaded: 68
✅ Manual order created successfully
✅ No 403 errors in console
```

---

## Rollback Plan

If you need to rollback this migration:

```sql
-- Remove new policies
DROP POLICY IF EXISTS "Admin can manage all orders" ON orders;
DROP POLICY IF EXISTS "Sale can manage orders" ON orders;
DROP POLICY IF EXISTS "Warehouse can view orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Anonymous users can create orders" ON orders;
DROP POLICY IF EXISTS "Admin can manage all order_items" ON order_items;
DROP POLICY IF EXISTS "Customers can view own order_items" ON order_items;
DROP POLICY IF EXISTS "Anyone can create order_items" ON order_items;

-- Re-enable RLS (if disabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
```

---

## Troubleshooting

### Issue: Still getting 403 after migration
**Solution:**
1. Clear browser cache
2. Logout and login again
3. Check if user role is actually 'admin' in database:
   ```sql
   SELECT email, role FROM users WHERE id = auth.uid();
   ```
4. If role is not 'admin', update it:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

### Issue: Migration fails with "policy already exists"
**Solution:**
1. The policy names might conflict
2. Manually drop all existing policies first:
   ```sql
   -- Get all policy names
   SELECT policyname FROM pg_policies WHERE tablename = 'orders';
   
   -- Drop each one
   DROP POLICY IF EXISTS "policy_name_here" ON orders;
   ```

### Issue: Cannot create orders as customer
**Solution:**
Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items');
```

---

## Related Files
- Migration: `migrations/fix_admin_orders_permissions.sql`
- Performance optimizations: See `PERFORMANCE_OPTIMIZATION_SUMMARY.md`

## Need Help?
- Check Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- Review existing policies in Supabase Dashboard → Authentication → Policies
- Contact support if issue persists after applying fix
