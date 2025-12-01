-- Create a secure function to get all admin dashboard stats
-- This bypasses RLS for performance and reliability, but strictly checks for Admin role.

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges
AS $$
DECLARE
  v_total_revenue NUMERIC;
  v_total_orders INT;
  v_pending_orders INT;
  v_completed_orders INT;
  v_total_products INT;
  v_active_products INT;
  v_products_seo INT;
  v_total_feedbacks INT;
  v_avg_rating NUMERIC;
  v_result JSONB;
BEGIN
  -- 1. Security Check: Only Admins can call this
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can view dashboard stats';
  END IF;

  -- 2. Calculate Stats
  
  -- Orders Stats
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status = 'pending' THEN 1 END),
    COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO 
    v_total_revenue,
    v_total_orders,
    v_pending_orders,
    v_completed_orders
  FROM public.orders;

  -- Products Stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN is_active = true THEN 1 END),
    COUNT(CASE WHEN seo_title IS NOT NULL AND seo_description IS NOT NULL THEN 1 END)
  INTO 
    v_total_products,
    v_active_products,
    v_products_seo
  FROM public.products;

  -- Feedbacks Stats
  SELECT 
    COUNT(*),
    COALESCE(AVG(rating_average), 0)
  INTO 
    v_total_feedbacks,
    v_avg_rating
  FROM public.customer_feedbacks;

  -- 3. Construct JSON Result
  v_result := jsonb_build_object(
    'totalRevenue', v_total_revenue,
    'totalOrders', v_total_orders,
    'pendingOrders', v_pending_orders,
    'completedOrders', v_completed_orders,
    'totalProducts', v_total_products,
    'activeProducts', v_active_products,
    'productsWithSEO', v_products_seo,
    'totalFeedbacks', v_total_feedbacks,
    'averageRating', ROUND(v_avg_rating, 1)
  );

  RETURN v_result;
END;
$$;
