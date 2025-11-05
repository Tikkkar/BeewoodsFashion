# 🔧 Services Update Guide - Phase 4

Sau khi đã update `messageHandler.ts` và tạo `tenantContextService.ts`, bạn cần update các services còn lại.

---

## 📋 Files cần update (theo thứ tự ưu tiên)

### ✅ DONE (Đã tạo)
- [x] `tenantContextService.ts` - ✅ Fixed TypeScript errors
- [x] `messageHandler.ts` - ✅ Added tenant support

### 🔄 TODO (Cần update)

---

## 1️⃣ contextService.ts (QUAN TRỌNG)

### Current signature:
```typescript
export async function buildContext(
  supabase: any,
  conversationId: string,
  message_text: string
)
```

### Updated signature:
```typescript
export async function buildContext(
  supabase: any,
  tenantId: string,          // 🆕 NEW PARAMETER
  conversationId: string,
  message_text: string
)
```

### Changes needed:

```typescript
// Add tenant_id filter to ALL queries

// Example 1: Get products
const { data: products } = await supabase
  .from("products")
  .select("*")
  .eq("tenant_id", tenantId)  // 🆕 ADD THIS
  .eq("is_active", true);

// Example 2: Get customer profile
const { data: profile } = await supabase
  .from("customer_profiles")
  .select("*")
  .eq("tenant_id", tenantId)  // 🆕 ADD THIS
  .eq("conversation_id", conversationId)
  .single();

// Example 3: Get conversation history
const { data: history } = await supabase
  .from("chatbot_messages")
  .select("*")
  .eq("tenant_id", tenantId)  // 🆕 ADD THIS
  .eq("conversation_id", conversationId)
  .order("created_at", { ascending: true });
```

---

## 2️⃣ embeddingService.ts

### Update function signatures:

```typescript
// Before
export async function createMessageEmbedding(
  conversationId: string,
  messageId: string,
  messageText: string,
  metadata: any
)

// After
export async function createMessageEmbedding(
  tenantId: string,           // 🆕 NEW PARAMETER
  conversationId: string,
  messageId: string,
  messageText: string,
  metadata: any
)
```

### Changes needed:

```typescript
await supabase.from("conversation_embeddings").insert({
  tenant_id: tenantId,        // 🆕 ADD THIS
  conversation_id: conversationId,
  message_id: messageId,
  content: messageText,
  // ... rest
});
```

### Same for `createSummaryEmbedding`:

```typescript
export async function createSummaryEmbedding(
  tenantId: string,           // 🆕 NEW PARAMETER
  conversationId: string,
  summaryText: string,
  keyPoints: string[]
)
```

---

## 3️⃣ Update RPC Function: get_or_create_conversation

Run this SQL in your database:

```sql
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_tenant_id UUID,          -- 🆕 NEW PARAMETER
  p_platform TEXT,
  p_customer_fb_id TEXT,
  p_customer_zalo_id TEXT,
  p_user_id UUID,
  p_session_id TEXT,
  p_customer_name TEXT,
  p_customer_avatar TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM chatbot_conversations
  WHERE tenant_id = p_tenant_id    -- 🆕 ADD TENANT CHECK
    AND platform = p_platform
    AND (
      (p_customer_fb_id IS NOT NULL AND customer_fb_id = p_customer_fb_id) OR
      (p_customer_zalo_id IS NOT NULL AND customer_zalo_id = p_customer_zalo_id) OR
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_session_id IS NOT NULL AND session_id = p_session_id)
    )
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Create if not found
  IF v_conversation_id IS NULL THEN
    INSERT INTO chatbot_conversations (
      tenant_id,              -- 🆕 ADD THIS
      platform,
      customer_fb_id,
      customer_zalo_id,
      user_id,
      session_id,
      customer_name,
      customer_avatar
    )
    VALUES (
      p_tenant_id,            -- 🆕 ADD THIS
      p_platform,
      p_customer_fb_id,
      p_customer_zalo_id,
      p_user_id,
      p_session_id,
      p_customer_name,
      p_customer_avatar
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;
```

---

## 4️⃣ geminiService.ts (Optional - for tenant API keys)

### Update callGemini signature:

```typescript
// Before
export async function callGemini(
  context: any,
  userMessage: string
): Promise<GeminiResponse>

// After  
export async function callGemini(
  context: any,
  userMessage: string,
  apiKey?: string            // 🆕 OPTIONAL TENANT API KEY
): Promise<GeminiResponse>
```

### Changes:

```typescript
export async function callGemini(
  context: any,
  userMessage: string,
  apiKey?: string
): Promise<GeminiResponse> {
  try {
    // 🆕 Use tenant's API key if provided, otherwise use default
    const GEMINI_KEY = apiKey || Deno.env.get("GEMINI_API_KEY") || "";
    
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      // ... rest
    });
    
    // ... rest of function
  }
}
```

---

## 5️⃣ orderHandler.ts (Optional but recommended)

### Update order creation to include tenant_id:

```typescript
// When creating order
const { data: order } = await supabase
  .from("orders")
  .insert({
    tenant_id: tenantId,      // 🆕 ADD THIS
    customer_name: name,
    customer_phone: phone,
    // ... rest
  });
```

### Get tenant_id from conversation:

```typescript
export async function handleOrderCreation({ conversationId, ... }) {
  // Get tenant_id from conversation
  const { data: conversation } = await supabase
    .from("chatbot_conversations")
    .select("tenant_id")
    .eq("id", conversationId)
    .single();
  
  const tenantId = conversation?.tenant_id;
  
  // Use tenantId when creating order
  // ...
}
```

---

## 🧪 Testing Checklist

After updating all services:

### Test 1: New Conversation
```bash
# Send message via chatbot-process
curl -X POST https://your-project.supabase.co/functions/v1/chatbot-process \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "website",
    "session_id": "test-123",
    "message_text": "Xin chào"
  }'

# Expected: Success with tenant info in response
```

### Test 2: Check Database
```sql
-- Verify conversation has tenant_id
SELECT id, tenant_id, platform 
FROM chatbot_conversations 
ORDER BY created_at DESC 
LIMIT 5;

-- Should see tenant_id populated

-- Verify messages have tenant_id
SELECT id, tenant_id, sender_type, content 
FROM chatbot_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- Should see tenant_id populated
```

### Test 3: Check Usage Tracking
```sql
-- Check usage logs
SELECT * FROM tenant_usage_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check AI usage
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Both should have entries
```

---

## 🚨 Common Errors & Fixes

### Error 1: "column tenant_id does not exist"
**Cause:** Migration not run yet
**Fix:** Run `migration_to_multitenant.sql`

### Error 2: "function get_or_create_conversation(uuid, text, ...) does not exist"
**Cause:** RPC function not updated
**Fix:** Run the CREATE OR REPLACE FUNCTION above

### Error 3: "null value in column tenant_id violates not-null constraint"
**Cause:** Trying to insert without tenant_id
**Fix:** Make sure getTenantContext() is called and tenant_id is passed

### Error 4: "No active tenant found"
**Cause:** No tenant in database
**Fix:** Run migration which creates default tenant

---

## 📊 Verification Queries

```sql
-- 1. Check tenant exists
SELECT * FROM tenants;
-- Should return at least 1 row

-- 2. Check all conversations have tenant_id
SELECT 
  COUNT(*) as total,
  COUNT(tenant_id) as with_tenant,
  COUNT(*) - COUNT(tenant_id) as missing_tenant
FROM chatbot_conversations;
-- missing_tenant should be 0

-- 3. Check messages have tenant_id
SELECT 
  COUNT(*) as total,
  COUNT(tenant_id) as with_tenant  
FROM chatbot_messages;
-- All should have tenant_id

-- 4. Check tenant stats
SELECT * FROM tenant_dashboard_stats;
-- Should show your tenant's stats
```

---

## ✅ Completion Checklist

- [ ] Updated `contextService.ts` with tenantId parameter
- [ ] Updated `embeddingService.ts` functions
- [ ] Updated RPC function `get_or_create_conversation`
- [ ] (Optional) Updated `geminiService.ts` for tenant API keys
- [ ] (Optional) Updated `orderHandler.ts` with tenant_id
- [ ] Tested new conversation creation
- [ ] Verified database has tenant_id in all tables
- [ ] Checked usage tracking is working
- [ ] All TypeScript errors resolved
- [ ] Application runs without errors

---

## 🎯 Next Steps After Phase 4

1. **Phase 5: Frontend Updates** (if applicable)
   - Add TenantContext provider
   - Update API calls
   - Add feature gates

2. **Phase 6: Production Deployment**
   - Test on staging thoroughly
   - Plan deployment window
   - Monitor logs after deployment

3. **Phase 7: New Tenant Creation**
   - Create signup flow
   - Test with second tenant
   - Verify data isolation

---

Good luck! 🚀 Bạn đang ở bước cuối của Phase 4!