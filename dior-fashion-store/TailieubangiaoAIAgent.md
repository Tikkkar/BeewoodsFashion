# 🤖 BeWo AI Chatbot - AI Handover Document

> **Purpose:** Complete technical documentation for AI assistants to understand, maintain, and extend the chatbot system
> **Last Updated:** October 18, 2025
> **Version:** 1.0 (Refactored Multi-Module Architecture)
> **Target AI:** Claude/GPT/Gemini for code assistance and system expansion

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Current Implementation](#current-implementation)
4. [Multi-Tenant Preparation](#multi-tenant-preparation)
5. [Roadmap Integration](#roadmap-integration)
6. [Code Structure](#code-structure)
7. [Deployment Guide](#deployment-guide)
8. [Expansion Guide](#expansion-guide)
9. [Troubleshooting](#troubleshooting)
10. [Future Development](#future-development)

---

## 🎯 System Overview

### **What is This?**
An AI-powered chatbot system for fashion e-commerce stores, built on Supabase Edge Functions with modular, reusable architecture.

### **Current Status (October 2025):**
- ✅ **Phase:** Single-tenant (BeWo Store only)
- ✅ **Architecture:** Refactored to modular design
- ✅ **Deployment:** Production (20+ versions deployed)
- ✅ **Ready for:** Multi-tenant migration (Q1 2025)

### **Key Features:**
- AI-powered customer support (Gemini 2.0 Flash)
- Product recommendations based on conversations
- Facebook Messenger integration
- Website chat widget
- Multi-module architecture (easy to maintain)

---

## 🏗️ Architecture

### **High-Level Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
├─────────────────────────────────────────────────────────┤
│  Facebook Messenger  │  Website Chat Widget │  Future   │
└──────────┬──────────────────────┬────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────────┐  ┌──────────────────────┐
│  chatbot-webhook     │  │  Website Frontend    │
│  (Facebook receiver) │  │  (React component)   │
└──────────┬───────────┘  └──────────┬───────────┘
           │                          │
           └──────────┬───────────────┘
                      ▼
           ┌─────────────────────────┐
           │   chatbot-process       │
           │   (Main Logic)          │
           └─────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌─────────┐  ┌──────────┐  ┌──────────┐
  │ Handlers│  │ Services │  │  Utils   │
  └─────────┘  └──────────┘  └──────────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
           ┌─────────────────────────┐
           │   Supabase Database     │
           │   (PostgreSQL)          │
           └─────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌─────────┐  ┌──────────┐  ┌──────────┐
  │Products │  │  Orders  │  │Messages  │
  └─────────┘  └──────────┘  └──────────┘
```

---

### **Two-Function Architecture:**

#### **Function 1: `chatbot-webhook`**
**Role:** Facebook Messenger receiver
**File:** `supabase/functions/chatbot-webhook/index.ts`

**Responsibilities:**
- ✅ Receive webhook events from Facebook
- ✅ Verify webhook token (GET request)
- ✅ Parse incoming messages (POST request)
- ✅ Call `chatbot-process` function
- ✅ Return 200 OK to Facebook

**Key Code:**
```typescript
// Call main chatbot logic
const { data, error } = await supabase.functions.invoke('chatbot-process', {
  body: {
    platform: 'facebook',
    customer_fb_id: senderId,
    message_text: messageText,
    page_id: pageId,
    access_token: fbSettings.access_token
  }
});
```

---

#### **Function 2: `chatbot-process` (REFACTORED)**
**Role:** Main chatbot logic (AI, Database, Response)
**File:** `supabase/functions/chatbot-process/index.ts`

**Responsibilities:**
- ✅ Receive request from webhook OR website
- ✅ Get/create conversation
- ✅ Save customer message
- ✅ Build context (history, products)
- ✅ Call Gemini AI
- ✅ Parse AI response
- ✅ Save bot response
- ✅ Log usage
- ✅ Send to platform (Facebook/Website)

**Architecture:** Modular (handlers, services, utils)

---

## 📁 Code Structure

### **Current File Tree:**

```
supabase/functions/
│
├── chatbot-webhook/
│   └── index.ts                    # Facebook webhook receiver
│
└── chatbot-process/                # MAIN CHATBOT LOGIC
    │
    ├── index.ts                    # Entry point (orchestrator)
    │
    ├── handlers/                   # Request handlers
    │   ├── messageHandler.ts       # Main message processing
    │   ├── orderTrackingHandler.ts # Order status (future)
    │   └── quickReplyHandler.ts    # Quick replies (future)
    │
    ├── services/                   # Business logic
    │   ├── contextService.ts       # Build conversation context
    │   ├── geminiService.ts        # Gemini AI integration
    │   └── facebookService.ts      # Facebook Messenger API
    │
    └── utils/                      # Utilities
        ├── cors.ts                 # CORS headers
        ├── supabaseClient.ts       # Supabase client factory
        ├── formatters.ts           # Price, date formatters
        └── prompts.ts              # System prompts
```

---

### **Module Responsibilities:**

#### **1. Entry Point (`index.ts`)**
```typescript
// Orchestrator - routes requests to handlers
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const body = await req.json();
  
  // Route to appropriate handler
  const result = await handleMessage(body);
  
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
```

**Purpose:** Thin orchestrator, delegates to handlers

---

#### **2. Handlers (`handlers/`)**

**`messageHandler.ts`** - Main message processing:
```typescript
export async function handleMessage(body: any) {
  // 1. Get Supabase client
  const supabase = createSupabaseClient();
  
  // 2. Get/create conversation
  const conversationId = await supabase.rpc('get_or_create_conversation', {...});
  
  // 3. Save customer message
  await supabase.from('chatbot_messages').insert({...});
  
  // 4. Build context
  const context = await buildContext(supabase, conversationId, message_text);
  
  // 5. Call Gemini
  const aiResponse = await callGemini(context, message_text);
  
  // 6. Save bot response
  await supabase.from('chatbot_messages').insert({...});
  
  // 7. Log usage
  await supabase.from('chatbot_usage_logs').insert({...});
  
  // 8. Send to platform
  if (platform === 'facebook') {
    await sendFacebookMessage(...);
  }
  
  return { success: true, ... };
}
```

**Future Handlers:**
- `orderTrackingHandler.ts` - Track order status
- `quickReplyHandler.ts` - Predefined responses
- `visualSearchHandler.ts` - Image search
- `voiceHandler.ts` - Voice messages

---

#### **3. Services (`services/`)**

**`contextService.ts`** - Build conversation context:
```typescript
export async function buildContext(supabase, conversationId, message) {
  const context = {};
  
  // Get conversation info
  const { data: conv } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();
  
  context.customer = { name: conv.customer_name, ... };
  
  // Get chat history (last 10 messages)
  const { data: messages } = await supabase
    .from('chatbot_messages')
    .select('sender_type, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10);
  
  context.history = messages;
  
  // Get products with images
  const { data: products } = await supabase
    .from('products')
    .select(`id, name, price, stock, slug, description,
             images:product_images(image_url, is_primary, display_order)`)
    .eq('is_active', true)
    .limit(20);
  
  context.products = products;
  
  return context;
}
```

**`geminiService.ts`** - AI integration:
```typescript
export async function callGemini(context, userMessage) {
  const systemPrompt = getSystemPrompt();
  const fullPrompt = buildFullPrompt(systemPrompt, context, userMessage);
  
  // Call Gemini API
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    })
  });
  
  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;
  
  // Parse response (multiple strategies)
  const parsed = parseGeminiResponse(rawText, context.products);
  
  // Extract product cards
  const productCards = extractProductsByIds(context.products, parsed.product_ids);
  
  return { text: parsed.response, type: parsed.type, products: productCards, ... };
}
```

**`facebookService.ts`** - Facebook Messenger API:
```typescript
export async function sendFacebookMessage(recipientId, text, accessToken, products) {
  const fbApiUrl = `https://graph.facebook.com/v18.0/me/messages`;
  
  // Send product cards if available
  if (products.length > 0) {
    await fetch(fbApiUrl, {
      method: 'POST',
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              image_aspect_ratio: 'square',
              elements: products.map(p => ({
                title: p.name,
                subtitle: formatPrice(p.price),
                image_url: p.images[0].image_url,
                buttons: [{ type: 'web_url', title: 'Xem chi tiết', url: ... }]
              }))
            }
          }
        }
      })
    });
  }
  
  // Send text message
  await fetch(fbApiUrl, {
    method: 'POST',
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text }
    })
  });
}
```

---

#### **4. Utils (`utils/`)**

**`cors.ts`** - CORS headers:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
```

**`supabaseClient.ts`** - Supabase client:
```typescript
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseKey);
}
```

**`formatters.ts`** - Helper functions:
```typescript
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

export function calculateCost(tokens: number): number {
  return tokens * 0.4 / 1_000_000 * 0.125 + tokens * 0.6 / 1_000_000 * 0.375;
}
```

**`prompts.ts`** - System prompts:
```typescript
export function getSystemPrompt(): string {
  return `Bạn là trợ lý ảo BeWo Store - shop thời trang.
  
QUY TẮC:
- Trả lời ngắn gọn 2-3 câu
- Khi TƯ VẤN sản phẩm: type="showcase" + product_ids
- Khi chỉ NHẮC ĐẾN: type="mention" + product_ids=[]
- Câu hỏi chung: type="none" + product_ids=[]

QUAN TRỌNG: Chỉ trả về JSON!`;
}
```

---

## 🗄️ Database Schema

### **Current Tables (Single-Tenant):**

```sql
-- Conversations
chatbot_conversations (
  id UUID PRIMARY KEY,
  platform TEXT,              -- 'facebook', 'website'
  customer_fb_id TEXT,
  user_id UUID,
  session_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_avatar TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Messages
chatbot_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  sender_type TEXT,           -- 'customer', 'bot', 'admin'
  message_type TEXT,          -- 'text', 'product_card', 'image'
  content JSONB,              -- { text, products, recommendation_type }
  tokens_used INTEGER,
  created_at TIMESTAMPTZ
)

-- Usage Logs
chatbot_usage_logs (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost NUMERIC,
  model TEXT,
  created_at TIMESTAMPTZ
)

-- Facebook Settings
chatbot_facebook_settings (
  id UUID PRIMARY KEY,
  page_id TEXT UNIQUE,
  page_name TEXT,
  access_token TEXT,
  verify_token TEXT,
  is_connected BOOLEAN,
  created_at TIMESTAMPTZ
)
```

---

## 🚀 Multi-Tenant Preparation

### **Roadmap Context:**
According to the Master Roadmap, **Q1 2025 (January)** focuses on multi-tenant migration.

### **Database Migration Plan:**

#### **Step 1: Create `tenants` table (Week 1)**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  industry TEXT,                    -- 'fashion', 'food', 'electronics'
  
  -- Branding
  settings JSONB DEFAULT '{}'::jsonb,  -- { brand_name, logo_url, primary_color }
  
  -- AI config
  ai_config JSONB DEFAULT '{}'::jsonb, -- { model, temperature, system_prompt }
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  message_limit INTEGER DEFAULT 100,
  messages_used INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_tenants_slug (slug),
  INDEX idx_tenants_domain (domain)
);
```

#### **Step 2: Add `tenant_id` to existing tables (Week 1)**
```sql
-- Products
ALTER TABLE products ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_products_tenant ON products(tenant_id);

-- Orders
ALTER TABLE orders ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_orders_tenant ON orders(tenant_id);

-- Chatbot Conversations
ALTER TABLE chatbot_conversations ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_conversations_tenant ON chatbot_conversations(tenant_id);

-- Categories
ALTER TABLE categories ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
```

#### **Step 3: Migrate existing data (Week 1)**
```sql
-- Create BeWo Store tenant
INSERT INTO tenants (name, slug, industry, settings, ai_config)
VALUES (
  'BeWo Store',
  'bewo-store',
  'fashion',
  '{"brand_name": "BeWo", "primary_color": "#000000", "logo_url": "https://..."}',
  '{"model": "gemini-2.0-flash-exp", "temperature": 0.7}'
)
RETURNING id;

-- Update existing records with BeWo tenant_id
UPDATE products SET tenant_id = 'bewo-tenant-uuid';
UPDATE orders SET tenant_id = 'bewo-tenant-uuid';
UPDATE chatbot_conversations SET tenant_id = 'bewo-tenant-uuid';
UPDATE categories SET tenant_id = 'bewo-tenant-uuid';
```

#### **Step 4: RLS Policies (Week 1)**
```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their tenant's data
CREATE POLICY "tenant_isolation_products"
  ON products FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: Service role bypasses RLS
CREATE POLICY "service_role_bypass_products"
  ON products FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

---

### **Code Migration Plan:**

#### **Update `contextService.ts` (Week 1):**
```typescript
export async function buildContext(
  supabase: any,
  conversationId: string,
  tenantId: string,  // ✅ ADD THIS
  message: string
) {
  // Get tenant info
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();
  
  context.tenant = tenant;
  context.brandName = tenant.settings?.brand_name || tenant.name;
  
  // Get products filtered by tenant
  const { data: products } = await supabase
    .from('products')
    .select('...')
    .eq('tenant_id', tenantId)  // ✅ FILTER BY TENANT
    .eq('is_active', true);
  
  context.products = products;
  return context;
}
```

#### **Update `prompts.ts` (Week 1):**
```typescript
export function getSystemPrompt(tenant: any): string {
  const brandName = tenant.settings?.brand_name || tenant.name;
  const industry = tenant.industry;
  
  // Industry-specific prompts
  const industryPrompts: any = {
    fashion: `Bạn là trợ lý ảo ${brandName} - shop thời trang...`,
    food: `Bạn là trợ lý ảo ${brandName} - quán ăn...`,
    electronics: `Bạn là trợ lý ảo ${brandName} - cửa hàng điện tử...`
  };
  
  // Custom prompt from tenant settings
  return tenant.ai_config?.system_prompt || industryPrompts[industry];
}
```

#### **Update `messageHandler.ts` (Week 1):**
```typescript
export async function handleMessage(body: any) {
  const { tenant_slug, message_text, ... } = body;
  
  const supabase = createSupabaseClient();
  
  // 1. GET TENANT
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', tenant_slug)
    .eq('subscription_status', 'active')
    .single();
  
  if (!tenant) throw new Error('Tenant not found');
  
  // 2. CHECK MESSAGE LIMIT
  if (tenant.subscription_tier === 'free' && tenant.messages_used >= tenant.message_limit) {
    throw new Error('Monthly message limit reached');
  }
  
  // 3. GET/CREATE CONVERSATION
  const { data: conversationId } = await supabase.rpc('get_or_create_conversation', {
    p_tenant_id: tenant.id,  // ✅ PASS TENANT_ID
    ...
  });
  
  // 4. BUILD CONTEXT
  const context = await buildContext(supabase, conversationId, tenant.id, message_text);
  
  // 5. CALL GEMINI with tenant-specific prompt
  const aiResponse = await callGemini(context, message_text, tenant);
  
  // 6. INCREMENT MESSAGE USAGE
  await supabase
    .from('tenants')
    .update({ messages_used: tenant.messages_used + 1 })
    .eq('id', tenant.id);
  
  return { success: true, ... };
}
```

---

## 📅 Roadmap Integration

### **Phase 1: Q1 2025 - Multi-Tenant SaaS (CURRENT FOCUS)**

**Goal:** Transform chatbot to multi-tenant SaaS platform

**Timeline:**
- ✅ **Week 1-2 (Jan 1-14):** Database migration to multi-tenant
- ✅ **Week 3-4 (Jan 15-31):** Code refactor for multi-tenant
- 📝 **Week 5-6 (Feb 1-14):** Onboarding flow & trial system
- 📝 **Week 7-8 (Feb 15-28):** Stripe integration & billing
- 📝 **Week 9-12 (Mar 1-31):** Launch & first 50 customers

**AI Assistant Tasks:**
1. Help migrate database schema
2. Update all queries to filter by `tenant_id`
3. Implement tenant validation middleware
4. Create onboarding flow UI
5. Integrate Stripe payment

---

### **Phase 2: Q2 2025 - AI Agents Layer**

**Goal:** Add autonomous AI agents (Analytics, Marketing, Auto Ads)

**New Architecture:**
```
┌─────────────────────────────────────────────┐
│         Orchestrator Agent (CEO AI)         │
├─────────────────────────────────────────────┤
│  Analytics  │  Marketing  │  Campaign  │... │
│   Agent     │   Agent     │   Agent    │    │
└─────────────────────────────────────────────┘
```

**Implementation:**
- Python backend (FastAPI) for agent orchestration
- Celery + Redis for background jobs
- Agent-to-agent communication via message queue
- LangChain/CrewAI for agent framework

**AI Assistant Tasks:**
1. Setup Python FastAPI backend
2. Create base Agent class
3. Implement Analytics Agent (analyze conversations)
4. Implement Marketing Agent (content generation)
5. Implement Campaign Agent (auto Facebook/Google Ads)

---

### **Phase 3: Q3 2025 - Multi-Agent System**

**Goal:** Full automation (Product, Operations, Finance agents)

**New Agents:**
- **Product Agent:** Auto sourcing, pricing
- **Operations Agent:** Order fulfillment automation
- **Finance Agent:** Accounting, budgeting
- **Customer Success Agent:** Churn prediction, proactive outreach

**AI Assistant Tasks:**
1. Integrate with suppliers (Alibaba, AliExpress)
2. Implement fulfillment routing (Printful, ShipBob)
3. Connect accounting APIs (QuickBooks, Xero)
4. Build churn prediction model

---

### **Phase 4: Q4 2025 - Enterprise & Scale**

**Goal:** $250K MRR, enterprise features, white-label

**Features:**
- White-label solution for agencies
- Enterprise tier ($2K-5K/month)
- Custom AI training
- On-premise deployment option

**AI Assistant Tasks:**
1. Build white-label infrastructure
2. Create agency portal
3. Implement custom model fine-tuning
4. Setup multi-region deployment

---

## 🛠️ Development Guide

### **Local Development Setup:**

```bash
# 1. Clone repository
git clone https://github.com/your-repo/bewo-chatbot
cd bewo-chatbot

# 2. Install Supabase CLI
npm install -g supabase
# Or use npx: npx supabase ...

# 3. Login to Supabase
npx supabase login

# 4. Link project
npx supabase link --project-ref YOUR_PROJECT_ID

# 5. Pull database schema
npx supabase db pull

# 6. Setup environment variables
cp .env.example .env.local
# Add: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 7. Test function locally (requires Docker)
npx supabase functions serve chatbot-process

# 8. Deploy function
npx supabase functions deploy chatbot-process
```

---

### **Adding a New Feature:**

#### **Example: Add Order Tracking**

**Step 1: Create handler**
```bash
touch supabase/functions/chatbot-process/handlers/orderTrackingHandler.ts
```

**Step 2: Implement handler**
```typescript
// handlers/orderTrackingHandler.ts
import { createSupabaseClient } from '../utils/supabaseClient.ts';
import { formatPrice, formatDate } from '../utils/formatters.ts';

export async function handleOrderTracking(body: any) {
  const { message_text, tenant_id } = body;
  
  // Extract order number
  const orderMatch = message_text.match(/ORD-\d{8}-\d{4}/i);
  if (!orderMatch) {
    return {
      success: true,
      response: 'Vui lòng cung cấp mã đơn hàng (VD: ORD-20250118-0001)',
      message_type: 'text'
    };
  }
  
  const orderNumber = orderMatch[0].toUpperCase();
  const supabase = createSupabaseClient();
  
  // Query order
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(quantity, price, product:products(name))')
    .eq('order_number', orderNumber)
    .eq('tenant_id', tenant_id)  // ✅ Filter by tenant
    .single();
  
  if (!order) {
    return {
      success: true,
      response: `Không tìm thấy đơn hàng ${orderNumber}`,
      message_type: 'text'
    };
  }
  
  const response = `
📦 Đơn hàng: ${order.order_number}
📊 Trạng thái: ${order.status}
💰 Tổng tiền: ${formatPrice(order.total_amount)}
📅 Ngày đặt: ${formatDate(order.created_at)}
  `.trim();
  
  return { success: true, response, message_type: 'order_status' };
}
```

**Step 3: Update orchestrator**
```typescript
// index.ts
import { handleOrderTracking } from './handlers/orderTrackingHandler.ts';

serve(async (req: Request) => {
  const body = await req.json();
  const { message_text } = body;
  
  let result;
  
  // Check if order tracking query
  if (/đơn hàng|order|ORD-/i.test(message_text)) {
    result = await handleOrderTracking(body);
  } else {
    result = await handleMessage(body);
  }
  
  return new Response(JSON.stringify(result), { ... });
});
```

**Step 4: Deploy**
```bash
npx supabase functions deploy chatbot-process
```

---

### **Testing Guide:**

#### **Test Locally:**
```bash
# Start local server
npx supabase functions serve chatbot-process

# Test with curl
curl -X POST http://localhost:54321/functions/v1/chatbot-process \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "website",
    "tenant_slug": "bewo-store",
    "session_id": "test_123",
    "message_text": "cho tôi xem áo"
  }'
```

#### **Test Production:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "website",
    "tenant_slug": "bewo-store",
    "session_id": "prod_test",
    "message_text": "xin chào"
  }'
```

#### **View Logs:**
```bash
# Real-time logs
npx supabase functions logs chatbot-process --tail

# Last 100 logs
npx supabase functions logs chatbot-process --limit 100
```

---

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. "Cannot find module" errors in VSCode**
**Cause:** VSCode thinks it's NodeJS, but it's Deno

**Solution:** Add `// @ts-ignore` comments
```typescript
// @ts-ignore - Deno standard library
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// @ts-ignore - Deno.env is available in Deno runtime
const API_KEY = Deno.env.get('GEMINI_API_KEY');
```

**Or:** Install Deno extension for VSCode

---

#### **2. "Gemini API failed" errors**
**Cause:** API key missing or invalid

**Solution:**
```bash
# Check if secret is set
npx supabase secrets list

# Set secret
npx supabase secrets set GEMINI_API_KEY=your_key_here

# Redeploy function
npx supabase functions deploy chatbot-process
```

---

#### **3. "Conversation error: function not found"**
**Cause:** Database function `get_or_create_conversation` missing

**Solution:** Run SQL migration
```sql
-- Create the RPC function
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_platform TEXT,
  p_tenant_id UUID,
  p_customer_fb_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT 'Guest',
  p_customer_avatar TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM chatbot_conversations
  WHERE platform = p_platform
    AND tenant_id = p_tenant_id
    AND (
      (p_customer_fb_id IS NOT NULL AND customer_fb_id = p_customer_fb_id) OR
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_session_id IS NOT NULL AND session_id = p_session_id)
    )
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If not found, create new
  IF v_conversation_id IS NULL THEN
    INSERT INTO chatbot_conversations (
      platform, tenant_id, customer_fb_id, user_id, session_id,
      customer_name, customer_avatar, status
    ) VALUES (
      p_platform, p_tenant_id, p_customer_fb_id, p_user_id, p_session_id,
      p_customer_name, p_customer_avatar, 'active'
    )
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$;
```

---

#### **4. "Missing Supabase credentials" error**
**Cause:** Environment variables not set in Deno runtime

**Solution:** 
```bash
# Check project environment
npx supabase projects list

# Ensure function has access to env vars
# They're auto-injected by Supabase from project settings
```

---

#### **5. Slow response times (> 5 seconds)**
**Cause:** Too many database queries or large context

**Solution:**
```typescript
// Add indexes
CREATE INDEX idx_messages_conversation ON chatbot_messages(conversation_id, created_at);
CREATE INDEX idx_products_active_tenant ON products(tenant_id, is_active);

// Limit context size
const { data: messages } = await supabase
  .from('chatbot_messages')
  .select('...')
  .limit(10);  // ✅ Only last 10 messages

const { data: products } = await supabase
  .from('products')
  .select('...')
  .limit(20);  // ✅ Only 20 products
```

---

#### **6. Facebook webhook not receiving messages**
**Cause:** Webhook not verified or expired token

**Solution:**
```bash
# 1. Check webhook verification
curl "https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=12345"

# Should return: 12345

# 2. Check Facebook Page settings
# - Go to Facebook App Dashboard
# - Webhooks → Edit Subscription
# - Verify URL and token match

# 3. Re-verify webhook
# - Click "Verify and Save" in Facebook

# 4. Check access token
# - Tokens expire, need to refresh
# - Update in chatbot_facebook_settings table
```

---

#### **7. Product cards not showing images**
**Cause:** Image URLs broken or not sorted properly

**Solution:**
```typescript
// Ensure images are sorted correctly
if (products) {
  products.forEach((p: any) => {
    if (p.images) {
      p.images.sort((a: any, b: any) => {
        // Primary images first
        if (a.is_primary !== b.is_primary) return b.is_primary ? 1 : -1;
        // Then by display_order
        return (a.display_order || 999) - (b.display_order || 999);
      });
    }
  });
}

// Check image URL in database
SELECT image_url, is_primary, display_order 
FROM product_images 
WHERE product_id = 'some-uuid';
```

---

## 📈 Performance Optimization

### **Current Performance:**
- Average response time: ~2-3 seconds
- P95 latency: ~5 seconds
- Gemini API: 1-2 seconds
- Database queries: 200-500ms

### **Optimization Strategies:**

#### **1. Caching (Q2 2025)**
```typescript
// Use Redis for caching products
import { Redis } from 'https://deno.land/x/upstash_redis/mod.ts';

const redis = new Redis({
  url: Deno.env.get('REDIS_URL'),
  token: Deno.env.get('REDIS_TOKEN')
});

export async function buildContext(supabase, conversationId, tenantId, message) {
  // Try cache first
  const cacheKey = `products:${tenantId}`;
  let products = await redis.get(cacheKey);
  
  if (!products) {
    // Fetch from database
    const { data } = await supabase
      .from('products')
      .select('...')
      .eq('tenant_id', tenantId);
    
    products = data;
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(products));
  }
  
  context.products = typeof products === 'string' ? JSON.parse(products) : products;
}
```

#### **2. Prompt Optimization (Q2 2025)**
```typescript
// Reduce tokens by using shorter prompts
export function buildFullPrompt(systemPrompt, context, userMessage) {
  // BEFORE: 1500 tokens
  // AFTER: 800 tokens (47% reduction)
  
  // Only include relevant products (not all 20)
  const relevantProducts = filterRelevantProducts(context.products, userMessage);
  
  // Compress history (summarize old messages)
  const compressedHistory = compressHistory(context.history);
  
  return `${systemPrompt}\n${compressedHistory}\n${relevantProducts}\nUser: ${userMessage}`;
}
```

#### **3. Parallel Queries (Q2 2025)**
```typescript
export async function buildContext(supabase, conversationId, tenantId, message) {
  // Run queries in parallel
  const [conv, messages, products] = await Promise.all([
    supabase.from('chatbot_conversations').select('*').eq('id', conversationId).single(),
    supabase.from('chatbot_messages').select('...').eq('conversation_id', conversationId).limit(10),
    supabase.from('products').select('...').eq('tenant_id', tenantId).limit(20)
  ]);
  
  // 3x faster than sequential queries!
}
```

#### **4. Model Routing (Q3 2025)**
```typescript
// Use cheaper model for simple queries
export async function callGemini(context, userMessage, tenant) {
  const complexity = analyzeComplexity(userMessage);
  
  let model;
  if (complexity === 'simple') {
    model = 'gemini-1.5-flash';  // Cheaper
  } else {
    model = 'gemini-2.0-flash-exp';  // More capable
  }
  
  // 40% cost reduction on average!
}
```

---

## 🔐 Security Best Practices

### **Critical Rules:**

#### **1. NEVER expose Service Role Key**
```typescript
// ❌ WRONG - Don't use service_role_key in frontend
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ CORRECT - Use anon key in frontend
const supabase = createClient(url, ANON_KEY);

// ✅ Service role only in Edge Functions (server-side)
```

#### **2. Always validate tenant_id**
```typescript
export async function handleMessage(body: any) {
  const { tenant_slug, user_id } = body;
  
  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', tenant_slug)
    .single();
  
  // ✅ Validate user belongs to tenant
  if (user_id) {
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user_id)
      .single();
    
    if (user.tenant_id !== tenant.id) {
      throw new Error('Unauthorized access');
    }
  }
}
```

#### **3. Rate limiting (Q2 2025)**
```typescript
// Implement rate limiting per tenant
const rateLimiter = {
  async check(tenantId: string): Promise<boolean> {
    const key = `rate:${tenantId}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60);  // 1 minute window
    }
    
    return count <= 100;  // Max 100 requests/minute
  }
};

// Use in handler
if (!await rateLimiter.check(tenant.id)) {
  throw new Error('Rate limit exceeded');
}
```

#### **4. Input validation**
```typescript
// Validate all inputs
export async function handleMessage(body: any) {
  const { message_text, tenant_slug } = body;
  
  // ✅ Validate message length
  if (!message_text || message_text.length > 1000) {
    throw new Error('Invalid message length');
  }
  
  // ✅ Validate tenant slug format
  if (!/^[a-z0-9-]+$/.test(tenant_slug)) {
    throw new Error('Invalid tenant slug');
  }
}
```

#### **5. SQL injection prevention**
```typescript
// ✅ Use parameterized queries (Supabase does this automatically)
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId);  // Safe

// ❌ Never use string concatenation
const query = `SELECT * FROM products WHERE tenant_id = '${tenantId}'`;  // DANGEROUS!
```

---

## 📊 Monitoring & Analytics

### **Metrics to Track:**

#### **1. Performance Metrics**
```typescript
// Add to every request
const startTime = Date.now();

// ... process request ...

const duration = Date.now() - startTime;

// Log to analytics
await supabase.from('chatbot_analytics').insert({
  tenant_id: tenant.id,
  endpoint: 'chatbot-process',
  duration_ms: duration,
  tokens_used: aiResponse.tokens,
  status: 'success',
  created_at: new Date().toISOString()
});
```

**Track:**
- Average response time
- P95/P99 latency
- Error rate
- Tokens per request
- Cost per conversation

---

#### **2. Business Metrics**
```sql
-- Daily active conversations
SELECT 
  DATE(created_at) as date,
  tenant_id,
  COUNT(DISTINCT conversation_id) as active_conversations
FROM chatbot_messages
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), tenant_id;

-- Conversion rate (conversations → orders)
SELECT 
  c.tenant_id,
  COUNT(DISTINCT c.id) as conversations,
  COUNT(DISTINCT o.id) as orders,
  (COUNT(DISTINCT o.id)::float / COUNT(DISTINCT c.id) * 100) as conversion_rate
FROM chatbot_conversations c
LEFT JOIN orders o ON o.customer_phone = c.customer_phone
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.tenant_id;

-- Customer satisfaction (from feedback)
SELECT 
  tenant_id,
  AVG(rating) as avg_rating,
  COUNT(*) as total_feedbacks
FROM chatbot_feedback
GROUP BY tenant_id;
```

---

#### **3. Cost Tracking**
```sql
-- Total cost per tenant (last 30 days)
SELECT 
  c.tenant_id,
  t.name as tenant_name,
  SUM(u.cost) as total_cost,
  COUNT(u.id) as total_requests,
  AVG(u.cost) as avg_cost_per_request
FROM chatbot_usage_logs u
JOIN chatbot_conversations c ON c.id = u.conversation_id
JOIN tenants t ON t.id = c.tenant_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.tenant_id, t.name
ORDER BY total_cost DESC;
```

---

## 🎓 Learning Resources

### **For AI Assistants Working on This Project:**

#### **Supabase Edge Functions:**
- Docs: https://supabase.com/docs/guides/functions
- Examples: https://github.com/supabase/supabase/tree/master/examples/edge-functions
- Deno: https://deno.land/manual

#### **Gemini API:**
- Docs: https://ai.google.dev/docs
- Pricing: https://ai.google.dev/pricing
- Best practices: https://ai.google.dev/docs/best_practices

#### **Multi-Tenancy:**
- Guide: https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/tenant-isolation.html
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

#### **Agent Systems (Q2 2025):**
- LangChain: https://python.langchain.com/docs/get_started/introduction
- CrewAI: https://docs.crewai.com/
- AutoGen: https://microsoft.github.io/autogen/

---

## 🎯 Success Criteria

### **For Each Development Phase:**

#### **Q1 2025 - Multi-Tenant Migration:**
- ✅ Database migrated without data loss
- ✅ All queries filter by tenant_id
- ✅ RLS policies prevent cross-tenant access
- ✅ Zero security vulnerabilities
- ✅ Performance maintained (< 3s response time)

#### **Q2 2025 - AI Agents:**
- ✅ Analytics Agent provides actionable insights
- ✅ Marketing Agent generates quality content (4+/5 rating)
- ✅ Campaign Agent improves ROAS by 20%
- ✅ All agents monitored and logged
- ✅ Human-in-the-loop for critical decisions

#### **Q3 2025 - Multi-Agent System:**
- ✅ 6+ agents deployed and working
- ✅ Agents communicate reliably
- ✅ 90% task automation achieved
- ✅ Customer satisfaction > 4.5/5
- ✅ Churn rate < 3%

---

## 🚀 Quick Start Checklist

### **For AI Assistant Onboarding:**

**Day 1: Understanding**
- [ ] Read this entire document
- [ ] Study code structure (`chatbot-process/`)
- [ ] Review database schema
- [ ] Understand current limitations

**Day 2: Setup**
- [ ] Clone repository
- [ ] Setup local development
- [ ] Run function locally
- [ ] Test with sample requests

**Day 3: First Contribution**
- [ ] Pick a task from roadmap
- [ ] Make code changes
- [ ] Test thoroughly
- [ ] Deploy to staging

**Day 4: Advanced**
- [ ] Understand multi-tenant plan
- [ ] Review agent architecture
- [ ] Study roadmap phases
- [ ] Plan next features

---

## 💬 Communication with Human Developer

### **When to Ask for Clarification:**
- Business logic decisions (pricing, features)
- Access to external services (API keys)
- Database schema changes (migrations)
- Architectural decisions (new services)

### **What to Decide Independently:**
- Code implementation details
- Variable naming
- Comment style
- Minor refactoring
- Bug fixes

### **How to Report Progress:**
- Daily summary of changes
- Blockers and questions
- Next steps plan
- Performance metrics

---

## 🎁 Bonus: Common Tasks

### **Task 1: Add New Industry Support**
```typescript
// utils/prompts.ts
export function getSystemPrompt(tenant: any): string {
  const industryPrompts = {
    fashion: '...',
    food: '...',
    electronics: '...',
    // ✅ ADD NEW INDUSTRY
    beauty: `Bạn là trợ lý ảo ${tenant.name} - shop mỹ phẩm.
Bạn am hiểu về skincare, makeup, haircare.
Nhiệm vụ: Tư vấn sản phẩm phù hợp với làn da, tóc của khách hàng.`,
  };
  
  return industryPrompts[tenant.industry] || industryPrompts.fashion;
}
```

---

### **Task 2: Add New Message Type**
```typescript
// handlers/messageHandler.ts

// Check for image message
if (body.message_image) {
  // Process with vision AI
  const visionResult = await processImageWithVision(body.message_image);
  
  // Find similar products
  const { data: similarProducts } = await supabase
    .from('products')
    .select('...')
    .textSearch('description', visionResult.keywords.join(' | '))
    .eq('tenant_id', tenant.id);
  
  return {
    success: true,
    response: 'Tìm thấy những sản phẩm tương tự!',
    products: similarProducts,
    message_type: 'visual_search'
  };
}
```

---

### **Task 3: Add Webhook for Third-Party Integration**
```typescript
// Create new webhook handler
// supabase/functions/chatbot-shopify-webhook/index.ts

serve(async (req) => {
  const body = await req.json();
  const { topic, data } = body;
  
  // Handle Shopify events
  if (topic === 'orders/create') {
    // New order created
    await notifyCustomer(data.customer, data.order);
  }
  
  if (topic === 'products/update') {
    // Product updated, sync to chatbot
    await syncProductToDatabase(data);
  }
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

## 📞 Support Contacts

### **Technical Issues:**
- Supabase Support: https://supabase.com/dashboard/support
- Gemini API: https://ai.google.dev/support

### **Business Questions:**
- Contact: [Your Email]
- Slack: [Your Workspace]

### **Emergency Procedures:**
If system is down:
1. Check Supabase status: https://status.supabase.com
2. Check function logs: `npx supabase functions logs chatbot-process`
3. Rollback if needed: Deploy previous version
4. Notify customers via status page

---

## 🎉 Conclusion

This chatbot system is designed for:
- ✅ **Easy maintenance** (modular architecture)
- ✅ **Easy expansion** (multi-tenant ready)
- ✅ **Easy scaling** (1 codebase for unlimited shops)
- ✅ **Easy understanding** (clear documentation)

### **Remember:**
- Code is organized in modules (handlers, services, utils)
- Each module has ONE responsibility
- Multi-tenant is just adding `tenant_id` filter
- Follow the roadmap for feature prioritization
- Ask questions when unsure!

### **Next Steps:**
1. Familiarize with codebase
2. Test locally
3. Pick first task from roadmap
4. Start building! 🚀

---

**Last Updated:** October 18, 2025
**Version:** 1.0
**Maintained by:** BeWo AI Team
**AI-Friendly:** ✅ Yes - This document is optimized for AI assistants

**Questions?** This document should answer 95% of questions. For the remaining 5%, ask the human developer! 😊

---

*"Good code is its own best documentation." - Steve McConnell*

**Now go build amazing features! 🎯**