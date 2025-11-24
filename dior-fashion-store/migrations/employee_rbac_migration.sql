-- =====================================================
-- MIGRATION: Employee RBAC System
-- =====================================================
-- Purpose: Add Sale and Warehouse employee roles with data access control
-- Date: 2025-11-24

-- =====================================================
-- 1. UPDATE USERS TABLE - Add Employee Roles
-- =====================================================

-- Drop existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new roles to enum
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['customer'::text, 'admin'::text, 'sale'::text, 'warehouse'::text]));

-- Add employee-specific fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS employee_code TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hired_date TIMESTAMP WITH TIME ZONE;

-- Create index for employee queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON public.users(employee_code);

COMMENT ON COLUMN public.users.employee_code IS 'Mã nhân viên (cho Sale và Warehouse)';
COMMENT ON COLUMN public.users.department IS 'Phòng ban: sales, warehouse, admin';
COMMENT ON COLUMN public.users.is_active IS 'Trạng thái hoạt động của nhân viên';

-- =====================================================
-- 2. UPDATE ORDERS TABLE - Add Created By Tracking
-- =====================================================

-- Add created_by field to track which employee created the order
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

COMMENT ON COLUMN public.orders.created_by IS 'ID của nhân viên Sale tạo đơn hàng';

-- =====================================================
-- 3. MIGRATE EXISTING DATA
-- =====================================================

-- Assign existing orders to admin (or first admin user)
UPDATE public.orders 
SET created_by = (
  SELECT id FROM public.users 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS orders_select_policy ON public.orders;
DROP POLICY IF EXISTS orders_insert_policy ON public.orders;
DROP POLICY IF EXISTS orders_update_policy ON public.orders;
DROP POLICY IF EXISTS orders_delete_policy ON public.orders;

-- =====================================================
-- 4.1. SELECT Policy: Role-based data access
-- =====================================================
CREATE POLICY orders_select_policy ON public.orders
FOR SELECT
USING (
  CASE 
    -- Admin: xem tất cả
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN true
    
    -- Warehouse: xem tất cả để đóng gói
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'warehouse'
    ) THEN true
    
    -- Sale: chỉ xem orders của mình + trong 30 ngày
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'sale'
    ) THEN (
      created_by = auth.uid() 
      AND created_at >= NOW() - INTERVAL '30 days'
    )
    
    -- Customer: xem orders của mình
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'customer'
    ) THEN user_id = auth.uid()
    
    -- Default: không cho phép
    ELSE false
  END
);

-- =====================================================
-- 4.2. INSERT Policy: Who can create orders
-- =====================================================
CREATE POLICY orders_insert_policy ON public.orders
FOR INSERT
WITH CHECK (
  CASE
    -- Admin: có thể tạo orders
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN true
    
    -- Sale: có thể tạo orders (created_by phải là chính họ)
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'sale'
    ) THEN created_by = auth.uid()
    
    -- Customer: có thể tạo orders (user_id phải là chính họ)
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'customer'
    ) THEN user_id = auth.uid()
    
    -- Warehouse: KHÔNG được tạo orders
    ELSE false
  END
);

-- =====================================================
-- 4.3. UPDATE Policy: Who can update orders
-- =====================================================
CREATE POLICY orders_update_policy ON public.orders
FOR UPDATE
USING (
  CASE
    -- Admin: có thể update tất cả
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN true
    
    -- Sale: chỉ update orders của mình (trong 30 ngày)
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'sale'
    ) THEN (
      created_by = auth.uid() 
      AND created_at >= NOW() - INTERVAL '30 days'
    )
    
    -- Warehouse: có thể update status (để đóng gói)
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'warehouse'
    ) THEN true
    
    -- Customer: có thể update orders của mình (chỉ khi pending)
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'customer'
    ) THEN (user_id = auth.uid() AND status = 'pending')
    
    ELSE false
  END
);

-- =====================================================
-- 4.4. DELETE Policy: Who can delete orders
-- =====================================================
CREATE POLICY orders_delete_policy ON public.orders
FOR DELETE
USING (
  -- Chỉ Admin mới được xóa orders
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function: Get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = user_uuid;
$$ LANGUAGE SQL STABLE;

-- Function: Check if user is employee (sale or warehouse)
CREATE OR REPLACE FUNCTION is_employee(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT role IN ('sale', 'warehouse', 'admin') 
  FROM public.users 
  WHERE id = user_uuid;
$$ LANGUAGE SQL STABLE;

-- Function: Get orders count for sale (30 days)
CREATE OR REPLACE FUNCTION get_sale_orders_count(sale_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.orders
  WHERE created_by = sale_user_id
    AND created_at >= NOW() - INTERVAL '30 days';
$$ LANGUAGE SQL STABLE;

-- Function: Get total revenue for sale (30 days)
CREATE OR REPLACE FUNCTION get_sale_revenue(sale_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM public.orders
  WHERE created_by = sale_user_id
    AND created_at >= NOW() - INTERVAL '30 days'
    AND status NOT IN ('cancelled');
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 6. CREATE EMPLOYEE STATS VIEW
-- =====================================================

CREATE OR REPLACE VIEW v_employee_stats AS
SELECT 
  u.id as employee_id,
  u.email,
  u.full_name,
  u.role,
  u.employee_code,
  u.department,
  u.is_active,
  
  -- Stats for last 30 days
  COUNT(DISTINCT o.id) FILTER (
    WHERE o.created_at >= NOW() - INTERVAL '30 days'
  ) as orders_30d,
  
  COALESCE(SUM(o.total_amount) FILTER (
    WHERE o.created_at >= NOW() - INTERVAL '30 days'
    AND o.status NOT IN ('cancelled')
  ), 0) as revenue_30d,
  
  -- Stats for today
  COUNT(DISTINCT o.id) FILTER (
    WHERE DATE(o.created_at) = CURRENT_DATE
  ) as orders_today,
  
  COALESCE(SUM(o.total_amount) FILTER (
    WHERE DATE(o.created_at) = CURRENT_DATE
    AND o.status NOT IN ('cancelled')
  ), 0) as revenue_today,
  
  -- All time stats
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount) FILTER (
    WHERE o.status NOT IN ('cancelled')
  ), 0) as total_revenue,
  
  MAX(o.created_at) as last_order_at
  
FROM public.users u
LEFT JOIN public.orders o ON o.created_by = u.id
WHERE u.role IN ('sale', 'warehouse', 'admin')
GROUP BY u.id, u.email, u.full_name, u.role, u.employee_code, u.department, u.is_active;

COMMENT ON VIEW v_employee_stats IS 'Thống kê hiệu suất nhân viên Sale và Warehouse';

-- =====================================================
-- 7. AUDIT LOG TABLE (Optional but recommended)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.employee_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_employee_id ON public.employee_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.employee_audit_logs(created_at);

COMMENT ON TABLE public.employee_audit_logs IS 'Log hành động của nhân viên để audit';

-- =====================================================
-- 8. SAMPLE DATA (for testing)
-- =====================================================

-- Uncomment to create sample employees
/*
-- Create Sale employee
INSERT INTO public.users (id, email, full_name, role, employee_code, department, hired_date)
VALUES (
  gen_random_uuid(),
  'sale1@example.com',
  'Nguyễn Văn Sale',
  'sale',
  'SALE001',
  'sales',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create Warehouse employee
INSERT INTO public.users (id, email, full_name, role, employee_code, department, hired_date)
VALUES (
  gen_random_uuid(),
  'warehouse1@example.com',
  'Trần Thị Kho',
  'warehouse',
  'WH001',
  'warehouse',
  NOW()
) ON CONFLICT (email) DO NOTHING;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - Added roles: sale, warehouse';
  RAISE NOTICE '  - Added created_by to orders';
  RAISE NOTICE '  - Created RLS policies';
  RAISE NOTICE '  - Created helper functions';
  RAISE NOTICE '  - Created employee stats view';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security:';
  RAISE NOTICE '  - Sale: can only see own orders (30 days)';
  RAISE NOTICE '  - Warehouse: can see all orders';
  RAISE NOTICE '  - Admin: full access';
END $$;
