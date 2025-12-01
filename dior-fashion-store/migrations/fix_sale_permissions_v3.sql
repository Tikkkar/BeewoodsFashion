-- FIX: Comprehensive Sale & Employee Permissions – V3
-- This script grants required privileges and (re)creates RLS policies.
-- It uses DROP POLICY IF EXISTS to avoid duplicate‑policy errors.

-- ==========================================================
-- 1️⃣ Grant basic usage & SELECT rights
-- ==========================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT ON
    public.users,
    public.products,
    public.categories
TO authenticated;
-- GRANT SELECT ON public.brands TO authenticated; -- uncomment if table exists

GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.customer_feedbacks TO authenticated;

GRANT EXECUTE ON FUNCTION
    public.is_admin(),
    public.is_employee(),
    public.get_my_role(),
    public.get_admin_dashboard_stats()
TO authenticated;

-- ==========================================================
-- 2️⃣ Users table – RLS policies
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS view_own_profile      ON public.users;
DROP POLICY IF EXISTS employee_view_all    ON public.users;
DROP POLICY IF EXISTS admin_manage_all     ON public.users;

CREATE POLICY view_own_profile ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY employee_view_all ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
              AND role IN ('admin','sale','warehouse')
        )
    );

CREATE POLICY admin_manage_all ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================================
-- 3️⃣ order_items table – RLS policies
-- ==========================================================
DROP POLICY IF EXISTS view_order_items_by_order_access ON public.order_items;
DROP POLICY IF EXISTS insert_order_items                ON public.order_items;

CREATE POLICY view_order_items_by_order_access ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
        )
    );

CREATE POLICY insert_order_items ON public.order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================================
-- 4️⃣ orders table – RLS policies
-- ==========================================================
DROP POLICY IF EXISTS orders_select_policy ON public.orders;
DROP POLICY IF EXISTS orders_insert_policy ON public.orders;
DROP POLICY IF EXISTS orders_update_policy ON public.orders;

CREATE POLICY orders_select_policy ON public.orders
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'warehouse' OR
        ((SELECT role FROM public.users WHERE id = auth.uid()) = 'sale' AND created_by = auth.uid()) OR
        auth.uid() = user_id
    );

CREATE POLICY orders_insert_policy ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY orders_update_policy ON public.orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ==========================================================
-- End of script
-- ==========================================================
