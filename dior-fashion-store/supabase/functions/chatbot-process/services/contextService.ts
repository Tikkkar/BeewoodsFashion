// ============================================
// services/contextService.ts - FIXED TO USE getStandardizedAddress
// ============================================

import { loadCustomerMemory } from "./memoryService.ts";
import { getStandardizedAddress } from "./addressService.ts";

export async function buildContext(
  supabase: any,
  tenantId: string,
  conversationId: string,
  message: string,
) {
  const context: any = {};

  // ========================================
  // 1. GET CONVERSATION INFO
  // ========================================
  const { data: conv } = await supabase
    .from("chatbot_conversations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", conversationId)
    .maybeSingle();

  if (conv) {
    context.customer = {
      name: conv.customer_name ?? "Guest",
      phone: conv.customer_phone ?? "",
    };
  }

  // ========================================
  // 2. LOAD LONG-TERM MEMORY
  // ========================================
  const memory = await loadCustomerMemory(conversationId);

  if (memory) {
    context.profile = memory.profile;
    context.interests = memory.interests;
    context.memory_facts = memory.facts;
    context.previous_summary = memory.summary?.summary_text;
    context.key_points = memory.summary?.key_points;
  }

  // ========================================
  // 3. LOAD SAVED ADDRESS - ✅ FIXED
  // ========================================
  // ✅ THAY BẰNG:
  const savedAddress = await getStandardizedAddress(conversationId);

  if (savedAddress) {
    context.saved_address = savedAddress;
    console.log(
      "📍 Loaded address from customer_profiles (structured):",
      savedAddress.address_line,
    );
  } else {
    context.saved_address = null;
    console.log("⚠️ No saved address found");
  }

  // ========================================
  // 4. GET RECENT MESSAGES (100 tin gần nhất)
  // ========================================
  const { data: messages } = await supabase
    .from("chatbot_messages")
    .select("id, sender_type, content, created_at")
    .eq("tenant_id", tenantId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  context.history = messages || [];

  // ========================================
  // 4.1 GET CONVERSATION SUMMARY (nếu có)
  // ========================================
  try {
    const { data: summaryRow } = await supabase
      .from("conversation_summaries")
      .select("summary_text, key_points, outcome, summary_created_at")
      .eq("conversation_id", conversationId)
      .order("summary_created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (summaryRow) {
      context.summary = {
        text: summaryRow.summary_text,
        key_points: summaryRow.key_points,
        outcome: summaryRow.outcome,
      };
    }
  } catch (err) {
    console.warn("⚠️ Cannot load conversation summary:", err);
  }

  // ========================================
  // 4.2 SEMANTIC CONTEXT (từ embeddings - optional, không chặn flow)
  // ========================================
  try {
    if (message && message.length > 10) {
      const { data: semanticMessages } = await supabase
        .from("conversation_embeddings")
        .select("content, content_type, metadata")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (semanticMessages && semanticMessages.length > 0) {
        context.semantic_snippets = semanticMessages.map((m: any) => ({
          content: m.content,
          type: m.content_type,
          metadata: m.metadata,
        }));
      }
    }
  } catch (err) {
    console.warn("⚠️ Semantic context lookup failed:", err);
  }

  // ========================================
  // 5. GET PRODUCTS
  // ========================================
  const { data: products } = await supabase
    .from("products")
    .select(`
      id, name, price, stock, slug, description,
      images:product_images(image_url, is_primary, display_order)
    `)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (products) {
    products.forEach((p: any) => {
      if (p.images) {
        p.images.sort((a: any, b: any) => {
          if (a.is_primary !== b.is_primary) return b.is_primary ? 1 : -1;
          return (a.display_order || 999) - (b.display_order || 999);
        });
      }
    });
  }

  context.products = products || [];

  // ========================================
  // 6. DEBUG LOG
  // ========================================
  console.log("📊 Context Summary:", {
    hasProfile: !!context.profile,
    hasSavedAddress: !!context.saved_address,
    addressLine: context.saved_address?.address_line || "none",
    historyCount: context.history?.length || 0,
    productCount: context.products?.length || 0,
    memoryFactsCount: context.memory_facts?.length || 0,
  });

  return context;
}
