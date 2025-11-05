-- ============================================
-- ROLLBACK SCRIPT: Multi-tenant → Single-tenant
-- Use ONLY if migration fails or needs to be reversed
-- ============================================

-- ⚠️ WARNING: This will remove tenant structure
-- Make sure you have a backup before running!

BEGIN;

-- ============================================
-- STEP 1: DISABLE RLS
-- ============================================

ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_training_data DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies
DROP POLICY IF EXISTS tenant_isolation_products ON products;
DROP POLICY IF EXISTS tenant_isolation_categories ON categories;
DROP POLICY IF EXISTS tenant_isolation_conversations ON chatbot_conversations;
DROP POLICY IF EXISTS tenant_isolation_messages ON chatbot_messages;
DROP POLICY IF EXISTS tenant_isolation_customer_profiles ON customer_profiles;
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
DROP POLICY IF EXISTS tenant_isolation_training_data ON chatbot_training_data;

-- ============================================
-- STEP 2: DROP VIEWS
-- ============================================

DROP VIEW IF EXISTS tenant_dashboard_stats;
DROP VIEW IF EXISTS tenant_learning_metrics;

-- ============================================
-- STEP 3: DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS check_tenant_limit(UUID, TEXT);

-- ============================================
-- STEP 4: REMOVE tenant_id COLUMNS
-- ============================================

-- Remove tenant_id from core tables
ALTER TABLE products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE categories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE chatbot_messages DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customer_profiles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE orders DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE chatbot_orders DROP COLUMN IF EXISTS tenant_id;

-- Remove from other tables
ALTER TABLE banners DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE discounts DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE chatbot_scenarios DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE chatbot_facebook_settings DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE conversation_embeddings DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE conversation_summaries DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customer_interests DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customer_memory_facts DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE chatbot_usage_logs DROP COLUMN IF EXISTS tenant_id;

-- Remove ML fields from conversations
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS conversion_status;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS conversion_value;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS converted_at;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS abandoned_at;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS quality_score;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS order_id;

-- ============================================
-- STEP 5: DROP NEW TABLES
-- ============================================

DROP TABLE IF EXISTS image_analyses CASCADE;
DROP TABLE IF EXISTS seo_content_generations CASCADE;
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS tenant_usage_logs CASCADE;
DROP TABLE IF EXISTS conversation_analytics CASCADE;
DROP TABLE IF EXISTS chatbot_training_data CASCADE;
DROP TABLE IF EXISTS tenant_api_keys CASCADE;
DROP TABLE IF EXISTS tenant_users CASCADE;
DROP TABLE IF EXISTS tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================
-- STEP 6: RESTORE ORIGINAL CONSTRAINTS
-- ============================================

-- Restore original unique constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_slug_unique;
ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE(slug);

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_tenant_name_unique;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_tenant_slug_unique;
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE(name);
ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE(slug);

ALTER TABLE customer_profiles DROP CONSTRAINT IF EXISTS customer_profiles_tenant_phone_unique;
ALTER TABLE customer_profiles ADD CONSTRAINT customer_profiles_phone_key UNIQUE(phone);

-- ============================================
-- STEP 7: DROP INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_products_tenant;
DROP INDEX IF EXISTS idx_products_tenant_slug;
DROP INDEX IF EXISTS idx_categories_tenant;
DROP INDEX IF EXISTS idx_conversations_tenant;
DROP INDEX IF EXISTS idx_conversations_tenant_platform;
DROP INDEX IF EXISTS idx_conversations_conversion;
DROP INDEX IF EXISTS idx_messages_tenant;
DROP INDEX IF EXISTS idx_messages_tenant_created;
DROP INDEX IF EXISTS idx_customer_profiles_tenant;
DROP INDEX IF EXISTS idx_customer_profiles_tenant_phone;
DROP INDEX IF EXISTS idx_orders_tenant;
DROP INDEX IF EXISTS idx_chatbot_orders_tenant;
DROP INDEX IF EXISTS idx_banners_tenant;
DROP INDEX IF EXISTS idx_discounts_tenant;
DROP INDEX IF EXISTS idx_scenarios_tenant;
DROP INDEX IF EXISTS idx_embeddings_tenant;
DROP INDEX IF EXISTS idx_summaries_tenant;
DROP INDEX IF EXISTS idx_interests_tenant;
DROP INDEX IF EXISTS idx_memory_facts_tenant;
DROP INDEX IF EXISTS idx_usage_logs_tenant;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
  ============================================
  ✅ ROLLBACK COMPLETED
  ============================================
  
  Database restored to single-tenant structure
  All tenant-related tables and columns removed
  
  You can now restore from backup if needed
  ============================================
  ';
END $$;