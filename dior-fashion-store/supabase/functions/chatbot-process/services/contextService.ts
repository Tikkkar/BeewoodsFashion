// services/contextService.ts - UPDATED

import { loadCustomerMemory } from './memoryService.ts';

export async function buildContext(
  supabase: any,
  conversationId: string,
  message: string
) {
  const context: any = {};

  // 1. GET CONVERSATION INFO
  const { data: conv } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (conv) {
    context.customer = {
      name: conv.customer_name ?? 'Guest',
      phone: conv.customer_phone ?? ''
    };
  }

  // 2. ✅ LOAD LONG-TERM MEMORY
  const memory = await loadCustomerMemory(conversationId);
  
  if (memory) {
    context.profile = memory.profile;
    context.interests = memory.interests;
    context.memory_facts = memory.facts;
    context.previous_summary = memory.summary?.summary_text;
    context.key_points = memory.summary?.key_points;
  }

  // 3. GET RECENT MESSAGES (10 tin cuối)
  const { data: messages } = await supabase
    .from('chatbot_messages')
    .select('sender_type, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10);

  context.history = messages || [];

  // 4. GET PRODUCTS
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, price, stock, slug, description,
      images:product_images(image_url, is_primary, display_order)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
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

  return context;
}