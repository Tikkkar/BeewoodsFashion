# 📚 BEWO AI Platform - Complete Project Documentation

## 📋 PROJECT OVERVIEW

**Project Name:** BEWO AI Platform - Multi-Tenant E-commerce Intelligence Suite  
**Version:** 2.0.0 (Multi-Tenant Migration)  
**Status:** Phase 4 - Code Updates (70% Complete)  
**Stack:** Supabase, Deno Edge Functions, React, PostgreSQL, Gemini AI  
**Last Updated:** 2025-01-06

---

## 🎯 PROJECT VISION

Transform from a single-tenant e-commerce chatbot into a **Multi-Tenant SaaS Platform** that provides:

1. **AI Chatbot** - Intelligent customer service on Facebook, Zalo, and Website
2. **SEO Content Generator** - AI-powered product descriptions and SEO optimization
3. **Ad Targeting Analyzer** - Marketing intelligence and ad performance analysis
4. **Customer Intelligence** - Machine learning from conversations to improve conversion
5. **Product Analytics** - Business insights and recommendation engine

---

## 🏗️ SYSTEM ARCHITECTURE

### Current Architecture (Post-Migration)

```
┌─────────────────────────────────────────────────────┐
│             MULTI-TENANT SAAS PLATFORM              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │    TENANT ISOLATION LAYER (NEW)              │  │
│  │  - Row Level Security (RLS)                  │  │
│  │  - Tenant Context Service                    │  │
│  │  - Per-Tenant API Keys                       │  │
│  └──────────────────────────────────────────────┘  │
│                      ↓                              │
│  ┌──────────────────────────────────────────────┐  │
│  │    APPLICATION LAYER                         │  │
│  │  ┌──────────┬──────────┬──────────┐          │  │
│  │  │ Chatbot  │   SEO    │   Ads    │          │  │
│  │  │ Service  │ Generator│ Analyzer │          │  │
│  │  └──────────┴──────────┴──────────┘          │  │
│  └──────────────────────────────────────────────┘  │
│                      ↓                              │
│  ┌──────────────────────────────────────────────┐  │
│  │    AI/ML LAYER                               │  │
│  │  - Gemini 2.0 Flash (LLM)                    │  │
│  │  - Vector Embeddings (RAG)                   │  │
│  │  - Conversation Analytics                    │  │
│  │  - Training Data Collection                  │  │
│  └──────────────────────────────────────────────┘  │
│                      ↓                              │
│  ┌──────────────────────────────────────────────┐  │
│  │    DATA LAYER (PostgreSQL + Supabase)       │  │
│  │  - 40+ Tables (20+ with tenant_id)           │  │
│  │  - Vector Store (pgvector)                   │  │
│  │  - Usage Tracking                            │  │
│  │  - Analytics                                 │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

### Core Tables Overview

#### **TIER 1: Tenant Infrastructure** (NEW - Added in Migration)

```sql
tenants (1 row currently)
├── id: UUID (primary key)
├── business_name: "BEWO Fashion"
├── subdomain: "bewo"
├── status: "active"
├── subscription info
└── settings: JSONB

subscription_plans (4 rows: Free, Starter, Growth, Enterprise)
├── limits: JSONB (messages, products, features)
└── pricing: monthly/yearly

tenant_subscriptions (1 row - links tenant to plan)
├── tenant_id → tenants
├── plan_id → subscription_plans
└── billing cycle, status

tenant_users (N rows - team members)
├── tenant_id → tenants
├── auth_user_id → auth.users
├── role: owner/admin/member
└── permissions: JSONB

tenant_api_keys (per-service API keys)
├── tenant_id → tenants
├── service: gemini/facebook/zalo
├── api_key_encrypted
└── config: JSONB
```

#### **TIER 2: Business Data** (UPDATED with tenant_id)

```sql
products (tenant_id added)
├── tenant_id → tenants  🆕
├── id, name, slug, price
├── images → product_images
├── sizes → product_sizes
└── seo_title, seo_description, seo_keywords

categories (tenant_id added)
├── tenant_id → tenants  🆕
└── name, slug, description

chatbot_conversations (tenant_id added)
├── tenant_id → tenants  🆕
├── platform: facebook/zalo/website
├── customer identifiers (fb_id, zalo_id, session_id)
├── status: active/resolved/pending_admin
├── conversion_status: pending/converted/abandoned  🆕 (ML)
├── conversion_value: numeric  🆕 (ML)
├── quality_score: 1-5  🆕 (ML)
└── context: JSONB (cart, preferences)

chatbot_messages (tenant_id added)
├── tenant_id → tenants  🆕
├── conversation_id → chatbot_conversations
├── sender_type: customer/bot/admin
├── message_type: text/image/product_card
├── content: JSONB
└── tokens_used: integer

customer_profiles (tenant_id added)
├── tenant_id → tenants  🆕
├── conversation_id → chatbot_conversations
├── personal info (name, phone, email)
├── measurements (height, weight, size)
├── preferences (style, colors, materials)
├── shipping address (structured fields)
└── engagement metrics

orders (tenant_id added)
├── tenant_id → tenants  🆕
├── user_id (optional - guests allowed)
├── order_number
├── customer info
├── shipping info
├── payment info
└── items → order_items

chatbot_orders (tenant_id added)
├── tenant_id → tenants  🆕
├── conversation_id → chatbot_conversations
├── profile_id → customer_profiles
├── same structure as orders
├── main_order_id → orders (after sync)
└── product_details: JSONB
```

#### **TIER 3: AI/ML Features** (NEW)

```sql
chatbot_training_data (NEW - ML)
├── tenant_id → tenants
├── conversation_id → chatbot_conversations
├── customer_message: text
├── bot_response: text
├── products_recommended: JSONB
├── outcome: positive/negative
├── feedback_type: conversion/admin_rating
└── quality_score: 1-5

conversation_analytics (NEW - ML)
├── tenant_id → tenants
├── conversation_id → chatbot_conversations
├── analysis_data: JSONB
│   ├── totalMessages
│   ├── duration
│   ├── functionCallsUsed
│   └── productRecommendations
└── outcome: converted/abandoned

conversation_embeddings (tenant_id added)
├── tenant_id → tenants  🆕
├── conversation_id → chatbot_conversations
├── message_id → chatbot_messages
├── content: text
├── embedding: vector(768)  (pgvector)
├── content_type: message/summary/fact
└── metadata: JSONB

conversation_summaries (tenant_id added)
├── tenant_id → tenants  🆕
├── conversation_id → chatbot_conversations
├── summary_text: text
├── key_points: JSONB
├── customer_intent: browsing/buying/support
├── sentiment: positive/neutral/negative
└── outcome: purchased/not_purchased

customer_memory_facts (tenant_id added)
├── tenant_id → tenants  🆕
├── customer_profile_id → customer_profiles
├── fact_type: preference/constraint/life_event
├── fact_text: text
├── importance_score: 1-10
├── source_conversation_id
└── is_active: boolean

customer_interests (tenant_id added)
├── tenant_id → tenants  🆕
├── customer_profile_id → customer_profiles
├── product_id → products
├── interest_type: viewed/asked/liked/purchased
├── view_count
└── sentiment
```

#### **TIER 4: Usage & Billing** (NEW)

```sql
tenant_usage_logs (NEW)
├── tenant_id → tenants
├── usage_type: message/api_call/seo_generation
├── quantity: integer
├── cost: numeric
├── billing_period: date
└── metadata: JSONB

ai_usage_logs (NEW)
├── tenant_id → tenants
├── conversation_id → chatbot_conversations
├── model: gemini-2.0-flash-exp
├── input_tokens, output_tokens
├── cost: numeric
└── purpose: chatbot/seo/ad_targeting

chatbot_usage_logs (tenant_id added)
├── tenant_id → tenants  🆕
├── conversation_id → chatbot_conversations
├── input_tokens, output_tokens
├── cost: numeric
└── model: string
```

#### **TIER 5: SEO & Content** (NEW)

```sql
seo_content_generations (NEW)
├── tenant_id → tenants
├── product_id → products
├── seo_title, seo_description, seo_keywords
├── content_blocks: JSONB
├── ai_model: string
├── tokens_used, generation_cost
└── status: draft/applied/rejected

image_analyses (NEW)
├── tenant_id → tenants
├── product_id → products
├── image_url: text
├── description, suggested_alt_text
├── suggested_caption
├── keywords: text[]
└── analysis_cost: numeric
```

---

## 🔧 SERVICE LAYER

### Current Services Structure

```
services/
├── tenantContextService.ts        ✅ DONE (Phase 4)
│   ├── getTenantContext()
│   ├── checkUsageLimit()
│   ├── trackUsage()
│   └── trackAIUsage()
│
├── messageHandler.ts              ✅ DONE (Phase 4)
│   └── handleMessage()            (Updated with tenant support)
│
├── contextService.ts              ⚠️ NEEDS UPDATE (Priority 1)
│   └── buildContext()             (Need to add tenantId param)
│
├── embeddingService.ts            ⚠️ NEEDS UPDATE (Priority 1)
│   ├── createMessageEmbedding()   (Need tenantId)
│   └── createSummaryEmbedding()   (Need tenantId)
│
├── geminiService.ts               ⚠️ NEEDS UPDATE (Priority 1)
│   ├── callGemini()               (Add optional tenant API key)
│   └── callGeminiWithFunctionResult()
│
├── chatbotOrderService.ts         ⚠️ NEEDS UPDATE (Priority 2)
│   └── createChatbotOrder()       (Need tenant_id in order)
│
├── orderSyncService.ts            ⚠️ NEEDS UPDATE (Priority 2)
│   └── syncChatbotOrderToMainOrders() (Sync tenant_id)
│
├── customerProfileService.ts      ✅ OK (uses conversationId)
├── addressService.ts              ✅ OK (uses conversationId)
├── addressExtractionService.ts    ✅ OK (deprecated)
├── cartService.ts                 ✅ OK (uses context)
├── memoryService.ts               ❓ NOT PROVIDED (need to check)
├── facebookService.ts             ✅ OK (no DB queries)
└── zaloService.ts                 ✅ OK (no DB queries)
```

---

## ✅ WHAT'S BEEN COMPLETED

### Phase 1: Database Migration ✅ COMPLETE

**Files Created:**
- `migration_to_multitenant.sql` - Complete migration script

**What Was Done:**
1. ✅ Created 14 new tables for multi-tenant infrastructure
2. ✅ Added `tenant_id` column to 20+ existing tables
3. ✅ Created default tenant ("BEWO Fashion")
4. ✅ Migrated all existing data to default tenant
5. ✅ Created subscription plans (Free, Starter, Growth, Enterprise)
6. ✅ Setup Row Level Security (RLS) policies
7. ✅ Created helper views and functions
8. ✅ Created ML/Learning tables (training_data, analytics)
9. ✅ Created usage tracking tables
10. ✅ Created SEO content tables

**Database Status:**
- Total Tables: 40+
- Tables with tenant_id: 20+
- Current Tenants: 1 (BEWO)
- Current Subscription: Enterprise Plan

### Phase 2: Documentation ✅ COMPLETE

**Files Created:**
1. `README_SUMMARY.md` - Project overview
2. `IMPLEMENTATION_GUIDE.md` - Step-by-step guide
3. `QUICK_START.md` - Migration checklist
4. `ARCHITECTURE.md` - System architecture diagrams
5. `INDEX.md` - Documentation index
6. `SERVICES_UPDATE_GUIDE.md` - Code update guide

### Phase 3: API & Components ✅ COMPLETE

**Files Created:**
1. `tenant-api-service.js` - Frontend API functions
2. `tenant-dashboard-components.jsx` - React components

**Components Provided:**
- TenantSettings (with tabs)
- GeneralSettings
- BrandingSettings
- ApiKeysSettings
- TeamSettings
- UsageDashboard
- StatCard, UsageBar

### Phase 4: Core Service Updates 🔄 70% COMPLETE

**Files Completed:**
1. ✅ `tenantContextService.ts` - Tenant context management
2. ✅ `messageHandler.ts` - Updated with tenant support

**Files Pending Update:**
1. ⚠️ `contextService.ts` - Need to add tenantId parameter
2. ⚠️ `embeddingService.ts` - Need to add tenantId parameter
3. ⚠️ `geminiService.ts` - Need optional tenant API key support
4. ⚠️ `chatbotOrderService.ts` - Need tenant_id in orders
5. ⚠️ `orderSyncService.ts` - Need to sync tenant_id
6. ❓ `memoryService.ts` - Need to check and update

**SQL Functions Pending:**
1. ⚠️ `get_or_create_conversation()` - Need to add p_tenant_id parameter

---

## 🚧 WHAT NEEDS TO BE DONE

### Immediate (This Week)

#### 1. **Update RPC Function** ⭐ CRITICAL
```sql
-- Update get_or_create_conversation to include tenant_id
-- Location: Supabase SQL Editor
-- Status: NOT DONE
```

#### 2. **Update Core Services** ⭐ CRITICAL

**contextService.ts:**
```typescript
// CURRENT
buildContext(supabase, conversationId, message)

// NEEDED
buildContext(supabase, tenantId, conversationId, message)

// Changes Required:
- Add tenantId parameter
- Add .eq('tenant_id', tenantId) to products query
- Add .eq('tenant_id', tenantId) to history query
```

**embeddingService.ts:**
```typescript
// CURRENT
createMessageEmbedding(conversationId, messageId, content, metadata)

// NEEDED
createMessageEmbedding(tenantId, conversationId, messageId, content, metadata)

// Changes Required:
- Add tenantId parameter
- Add tenant_id: tenantId to insert
- Same for createSummaryEmbedding()
```

**geminiService.ts:**
```typescript
// CURRENT
callGemini(context, userMessage)

// NEEDED
callGemini(context, userMessage, apiKey?)

// Changes Required:
- Add optional apiKey parameter
- Use tenant's API key if provided
- Fallback to default GEMINI_API_KEY
```

#### 3. **Test Multi-Tenant Functionality**
- [ ] Create new conversation
- [ ] Verify tenant_id in all tables
- [ ] Check usage tracking
- [ ] Test RLS policies
- [ ] Verify data isolation

### Short Term (Next 2 Weeks)

#### 4. **Update Remaining Services**

**chatbotOrderService.ts:**
- Add tenantId to order creation
- Get tenantId from conversation

**orderSyncService.ts:**
- Sync tenant_id from chatbot_orders to orders
- Update both tables with tenant_id

**memoryService.ts:**
- Check if it needs tenant_id
- Update queries if necessary

#### 5. **Frontend Integration**
- [ ] Add TenantProvider to React app
- [ ] Implement tenant context hook
- [ ] Add feature gates based on subscription
- [ ] Create tenant settings page
- [ ] Add usage dashboard

#### 6. **Testing & QA**
- [ ] Unit tests for tenant services
- [ ] Integration tests for data isolation
- [ ] Performance tests with multiple tenants
- [ ] Security audit of RLS policies

### Medium Term (Next Month)

#### 7. **Multi-Tenant Onboarding**
- [ ] Signup flow for new tenants
- [ ] Subdomain creation
- [ ] API key configuration wizard
- [ ] Product import tool
- [ ] Initial setup guide

#### 8. **Billing Integration**
- [ ] VNPay integration
- [ ] Subscription management
- [ ] Invoice generation
- [ ] Usage-based billing
- [ ] Payment history

#### 9. **Admin Dashboard**
- [ ] Super admin panel
- [ ] Tenant management
- [ ] Usage monitoring
- [ ] Revenue analytics
- [ ] Support tools

### Long Term (Next 3 Months)

#### 10. **Machine Learning Pipeline**
- [ ] RAG implementation (when 50+ conversations)
- [ ] Automatic prompt optimization
- [ ] A/B testing framework
- [ ] Conversion prediction model
- [ ] Customer segmentation

#### 11. **Advanced Features**
- [ ] White-label support
- [ ] Custom domain setup
- [ ] API rate limiting
- [ ] Webhook system
- [ ] Integration marketplace

#### 12. **Platform Expansion**
- [ ] Instagram integration
- [ ] WhatsApp integration
- [ ] SMS/Voice support
- [ ] Email automation
- [ ] Mobile apps (iOS/Android)

---

## 📁 PROJECT FILE STRUCTURE

```
bewo-ai-platform/
│
├── supabase/
│   ├── functions/
│   │   └── chatbot-process/
│   │       ├── handlers/
│   │       │   ├── messageHandler.ts           ✅ UPDATED
│   │       │   └── orderHandler.ts
│   │       │
│   │       ├── services/
│   │       │   ├── tenantContextService.ts     ✅ NEW (Phase 4)
│   │       │   ├── contextService.ts           ⚠️ NEEDS UPDATE
│   │       │   ├── embeddingService.ts         ⚠️ NEEDS UPDATE
│   │       │   ├── geminiService.ts            ⚠️ NEEDS UPDATE
│   │       │   ├── chatbotOrderService.ts      ⚠️ NEEDS UPDATE
│   │       │   ├── orderSyncService.ts         ⚠️ NEEDS UPDATE
│   │       │   ├── customerProfileService.ts   ✅ OK
│   │       │   ├── addressService.ts           ✅ OK
│   │       │   ├── cartService.ts              ✅ OK
│   │       │   ├── memoryService.ts            ❓ CHECK
│   │       │   ├── facebookService.ts          ✅ OK
│   │       │   └── zaloService.ts              ✅ OK
│   │       │
│   │       └── utils/
│   │           ├── supabaseClient.ts
│   │           ├── prompts.ts
│   │           └── formatters.ts
│   │
│   └── migrations/
│       └── migration_to_multitenant.sql        ✅ CREATED
│
├── src/
│   ├── lib/
│   │   └── api/
│   │       ├── chatbot.js                      (existing)
│   │       └── tenant.js                       ✅ NEW (provided)
│   │
│   ├── contexts/
│   │   └── TenantContext.tsx                   📝 TODO
│   │
│   └── components/
│       ├── dashboard/
│       │   └── TenantDashboard.jsx             ✅ PROVIDED
│       │
│       └── common/
│           └── FeatureGate.tsx                 📝 TODO
│
└── docs/
    ├── README_SUMMARY.md                       ✅ DONE
    ├── IMPLEMENTATION_GUIDE.md                 ✅ DONE
    ├── QUICK_START.md                          ✅ DONE
    ├── ARCHITECTURE.md                         ✅ DONE
    ├── SERVICES_UPDATE_GUIDE.md                ✅ DONE
    ├── INDEX.md                                ✅ DONE
    └── PROJECT_DOCUMENTATION.md                ✅ THIS FILE
```

---

## 🔄 DATA FLOW

### Current Message Flow (Post Phase 4)

```
1. Customer sends message
   ↓
2. Edge Function: chatbot-process
   ↓
3. getTenantContext(request)
   - Extract subdomain/domain
   - Get tenant from database
   - Get API keys & subscription
   ↓
4. checkUsageLimit(tenantId, 'messages')
   - Check monthly message limit
   - Block if exceeded
   ↓
5. get_or_create_conversation(tenantId, ...)  ⚠️ NEEDS UPDATE
   - Create/get conversation with tenant_id
   ↓
6. Save customer message
   - WITH tenant_id ✅
   ↓
7. createMessageEmbedding(tenantId, ...)  ⚠️ NEEDS UPDATE
   - Create vector embedding for semantic search
   ↓
8. buildContext(supabase, tenantId, conversationId, message)  ⚠️ NEEDS UPDATE
   - Get tenant's products
   - Get conversation history
   - Get customer profile
   - Get saved address
   - Get memory facts
   ↓
9. callGemini(context, message, tenantApiKey)  ⚠️ NEEDS UPDATE
   - Use tenant's Gemini API key if available
   - Generate AI response
   - Execute function calls
   ↓
10. Save bot message
    - WITH tenant_id ✅
    ↓
11. trackUsage(tenantId, 'message')
    - Log to tenant_usage_logs ✅
    ↓
12. trackAIUsage(tenantId, conversationId, tokens, cost)
    - Log to ai_usage_logs ✅
    ↓
13. Send response to customer
    - Facebook/Zalo/Website
```

---

## 🔑 KEY CONCEPTS

### Tenant Isolation

**How it works:**
1. Every business data table has `tenant_id` column
2. Row Level Security (RLS) enforces isolation
3. All queries automatically filtered by tenant_id
4. Users can only see data from their tenant

**Example:**
```sql
-- User from Tenant A queries products
SELECT * FROM products WHERE is_active = true;

-- RLS automatically adds:
-- AND tenant_id = 'tenant-a-uuid'

-- Result: Only Tenant A's products returned
```

### Subscription Plans

**Current Plans:**

| Plan | Price/Month | Messages | Products | Features |
|------|-------------|----------|----------|----------|
| Free | 0đ | 100 | 20 | Basic chatbot |
| Starter | 299,000đ | 2,000 | 500 | + SEO Generator |
| Growth | 799,000đ | 10,000 | 2,000 | + Ad Targeting |
| Enterprise | 1,999,000đ | Unlimited | Unlimited | All features |

**Default Tenant Status:**
- Current Plan: Enterprise
- Status: Active
- Trial Ends: 365 days from migration

### Machine Learning Pipeline

**Training Data Collection:**
1. Every conversation is analyzed
2. Successful conversations (converted) → Training data
3. Training pairs: Customer message → Bot response → Outcome
4. Stored per tenant in `chatbot_training_data`

**When to Enable RAG:**
- Tenant has >= 50 successful conversations
- Training data quality score >= 4
- Conversion rate >= 5%

**How RAG Works:**
1. Customer query → Create embedding
2. Search similar successful conversations (tenant-isolated)
3. Use top 3 examples in prompt
4. AI learns from past successes

---

## 🐛 KNOWN ISSUES

### Critical Issues

1. **RPC Function Not Updated** ⚠️
   - `get_or_create_conversation()` doesn't accept `tenant_id`
   - **Impact:** Cannot create conversations with tenant_id
   - **Fix:** Run SQL update in SERVICES_UPDATE_GUIDE.md
   - **Status:** NOT FIXED

2. **contextService.ts Missing tenantId** ⚠️
   - `buildContext()` doesn't filter by tenant
   - **Impact:** May return products from other tenants
   - **Fix:** Add tenantId parameter and filter
   - **Status:** NOT FIXED

3. **embeddingService.ts Missing tenantId** ⚠️
   - Embeddings saved without tenant_id
   - **Impact:** Cannot isolate embeddings per tenant
   - **Fix:** Add tenantId parameter
   - **Status:** NOT FIXED

### Non-Critical Issues

4. **geminiService.ts No Tenant API Key Support**
   - All tenants use same Gemini API key
   - **Impact:** Cannot use per-tenant API keys
   - **Fix:** Add optional apiKey parameter
   - **Status:** NOT FIXED

5. **Orders Missing tenant_id**
   - `chatbotOrderService.ts` doesn't add tenant_id
   - **Impact:** Orders not properly isolated
   - **Fix:** Add tenant_id to order creation
   - **Status:** NOT FIXED

---

## 🧪 TESTING STATUS

### Database Tests

- ✅ Migration ran successfully
- ✅ Default tenant created
- ✅ All data assigned to tenant
- ✅ No NULL tenant_ids in chatbot tables
- ⚠️ RPC function needs update
- ❌ End-to-end conversation test (blocked by RPC)

### Service Tests

- ✅ tenantContextService works
- ✅ messageHandler accepts tenant context
- ⚠️ contextService needs testing after update
- ⚠️ embeddingService needs testing after update
- ❌ Complete message flow (blocked)

### Frontend Tests

- ❌ Not started (waiting for backend completion)

---

## 📊 METRICS & MONITORING

### Current Metrics Available

**Tenant Dashboard Stats:**
```sql
SELECT * FROM tenant_dashboard_stats;

-- Returns:
-- total_conversations
-- converted_conversations
-- conversion_rate
-- total_messages
-- bot_messages
-- total_customers
-- monthly_ai_cost
-- monthly_tokens
-- active_products
```

**Learning Metrics:**
```sql
SELECT * FROM tenant_learning_metrics;

-- Returns:
-- total_conversations
-- converted_count
-- conversion_rate
-- avg_order_value
-- training_data_points
-- ready_for_rag (boolean)
```

**Usage Tracking:**
```sql
-- Current month usage
SELECT usage_type, SUM(quantity), SUM(cost)
FROM tenant_usage_logs
WHERE tenant_id = ?
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY usage_type;
```

---

## 🔐 SECURITY

### Implemented

1. ✅ Row Level Security (RLS) on all tenant tables
2. ✅ Tenant isolation via tenant_id
3. ✅ User authentication via Supabase Auth
4. ✅ API keys stored (TODO: encryption)
5. ✅ CORS configuration

### TODO

1. ⚠️ Implement API key encryption/decryption
2. ⚠️ Add rate limiting per tenant
3. ⚠️ Implement audit logging
4. ⚠️ Add 2FA for admin users
5. ⚠️ Security audit of all endpoints

---

## 🚀 DEPLOYMENT

### Current Environment

**Supabase Project:**
- Database: PostgreSQL 15
- Edge Functions: Deno runtime
- Storage: Supabase Storage
- Auth: Supabase Auth

**Status:**
- Development: ✅ Working
- Staging: ❌ Not setup
- Production: ⚠️ Partial (migration done)

### Deployment Checklist

- [ ] Complete Phase 4 code updates
- [ ] Test all services end-to-end
- [ ] Setup staging environment
- [ ] Run full test suite
- [ ] Security audit
- [ ] Performance testing
- [ ] Backup production database
- [ ] Run migration on production
- [ ] Deploy updated functions
- [ ] Monitor for errors
- [ ] Update documentation

---

## 📞 SUPPORT & CONTACTS

### Key Files for Support

1. **Migration Issues:** Check `IMPLEMENTATION_GUIDE.md`
2. **Service Updates:** Check `SERVICES_UPDATE_GUIDE.md`
3. **Quick Help:** Check `QUICK_START.md`
4. **Architecture Questions:** Check `ARCHITECTURE.md`

### Common Commands

```bash
# Deploy function
supabase functions deploy chatbot-process

# Check logs
supabase functions logs chatbot-process

# Test function
curl -X POST https://project.supabase.co/functions/v1/chatbot-process \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"platform":"website","session_id":"test","message_text":"Hi"}'

# Check tenant stats
psql $DATABASE_URL
> SELECT * FROM tenant_dashboard_stats;
```

---

## 🎯 SUCCESS CRITERIA

### Phase 4 Complete When:
- [ ] All RPC functions updated with tenant_id
- [ ] All core services updated (context, embedding, gemini)
- [ ] End-to-end message flow works with tenant isolation
- [ ] Usage tracking works correctly
- [ ] No TypeScript errors
- [ ] All tests passing

### Project Complete When:
- [ ] Multiple tenants can signup
- [ ] Data isolation verified
- [ ] Billing integration working
- [ ] Admin dashboard functional
- [ ] Frontend integrated
- [ ] Documentation complete
- [ ] Production deployed
- [ ] Monitoring setup

---

## 📈 BUSINESS METRICS

### Target Metrics (Month 3)

- **Tenants:** 10+ active tenants
- **Conversion Rate:** 15%+ average across tenants
- **Response Time:** <2s for 95% of messages
- **Uptime:** 99.9%
- **Customer Satisfaction:** 4.5+ stars
- **MRR:** 5,000,000 VNĐ+

---

## 🔄 VERSION HISTORY

**v2.0.0 (Current)** - 2025-01-06
- Multi-tenant infrastructure added
- Machine learning pipeline created
- Usage tracking implemented
- Status: 70% complete

**v1.0.0** - 2024-12-01
- Single-tenant chatbot
- Facebook & Zalo integration
- Basic product recommendations
- Status: Fully functional

---

## 📝 NOTES FOR AI/DEVELOPERS

### Important Context

1. **This is a LIVE MIGRATION:** Data already exists, must preserve it
2. **Current Status:** Phase 4 (70%) - Core services need updates
3. **Blocking Issues:** 3 critical files need tenant_id support
4. **Database State:** Migration complete, 1 tenant exists, all data migrated

### When Helping with This Project

**Always Check:**
1. Is this file tenant-aware? (Does it have tenant_id?)
2. Is this service filtering by tenant_id?
3. Is this creating data with tenant_id?
4. Is this respecting RLS policies?

**Common Patterns:**
```typescript
// ✅ CORRECT - Tenant-aware
const tenantContext = await getTenantContext(request);
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantContext.tenantId);

// ❌ WRONG - Not tenant-aware
const { data } = await supabase
  .from('products')
  .select('*');
// This will be blocked by RLS, but explicit filter is better
```

**Testing Tenant Isolation:**
```sql
-- Create test tenant
INSERT INTO tenants (business_name, subdomain, owner_email)
VALUES ('Test Shop', 'testshop', 'test@test.com');

-- Add test product for test tenant
INSERT INTO products (tenant_id, name, price)
SELECT id, 'Test Product', 100000
FROM tenants WHERE subdomain = 'testshop';

-- Query as BEWO tenant - should NOT see test product
SELECT * FROM products 
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'bewo');
```

### Next Steps for AI Helper

1. Read `SERVICES_UPDATE_GUIDE.md` for specific file changes
2. Check current file against requirements
3. Update with tenant support
4. Test thoroughly
5. Document changes

---

**END OF DOCUMENTATION**

This documentation should be updated as the project evolves.  
Last updated: 2025-01-06 by AI Assistant