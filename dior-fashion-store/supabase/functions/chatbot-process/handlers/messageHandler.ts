// ============================================
// handlers/messageHandler.ts - Complete with Memory Integration
// ============================================

import { createSupabaseClient } from '../utils/supabaseClient.ts';
import { calculateCost } from '../utils/formatters.ts';
import { buildContext } from '../services/contextService.ts';
import { callGemini } from '../services/geminiService.ts';
import { sendFacebookMessage } from '../services/facebookService.ts';
import { 
  extractAndSaveMemory, 
  extractMemoryFacts, 
  createConversationSummary 
} from '../services/memoryService.ts';

export async function handleMessage(body: any) {
  const {
    platform,
    customer_fb_id,
    user_id,
    session_id,
    message_text,
    page_id,
    access_token
  } = body;

  const dbPlatform = platform === 'web' ? 'website' : platform;

  console.log('Processing message:', {
    platform: dbPlatform,
    message: message_text.substring(0, 50)
  });

  const supabase = createSupabaseClient();

  // 1. GET OR CREATE CONVERSATION
  const { data: conversationId, error: convError } = await supabase.rpc(
    'get_or_create_conversation',
    {
      p_platform: platform,
      p_customer_fb_id: customer_fb_id || null,
      p_user_id: user_id || null,
      p_session_id: session_id || null,
      p_customer_name: 'Guest',
      p_customer_avatar: null
    }
  );

  if (convError) throw new Error(`Conversation error: ${convError.message}`);

  // 2. SAVE CUSTOMER MESSAGE
  await supabase.from('chatbot_messages').insert({
    conversation_id: conversationId,
    sender_type: 'customer',
    message_type: 'text',
    content: { text: message_text }
  });

  // 3. BUILD CONTEXT (includes memory retrieval)
  const context = await buildContext(supabase, conversationId, message_text);

  console.log('Context built:', {
    hasProfile: !!context.profile,
    historyCount: context.history?.length || 0,
    memoryCount: context.memory?.length || 0,
    summaryAvailable: !!context.summary
  });

  // 4. GENERATE RESPONSE
  const llmResult = await callGemini(context, message_text);
  const responseText = llmResult.text;
  const tokensUsed = llmResult.tokens;
  const recommendationType = llmResult.type;
  const productCards = llmResult.products;

  console.log('Response generated:', {
    type: recommendationType,
    products: productCards.length,
    tokens: tokensUsed
  });

  // 5. SAVE BOT RESPONSE
  await supabase.from('chatbot_messages').insert({
    conversation_id: conversationId,
    sender_type: 'bot',
    message_type: productCards.length > 0 ? 'product_card' : 'text',
    content: {
      text: responseText,
      products: productCards,
      recommendation_type: recommendationType
    },
    tokens_used: tokensUsed
  });

  // 6. LOG USAGE
  if (tokensUsed > 0) {
    await supabase.from('chatbot_usage_logs').insert({
      conversation_id: conversationId,
      input_tokens: Math.floor(tokensUsed * 0.4),
      output_tokens: Math.floor(tokensUsed * 0.6),
      cost: calculateCost(tokensUsed),
      model: 'gemini-2.0-flash-exp'
    });
  }

  // ========================================
  // MEMORY PROCESSING (Non-blocking)
  // ========================================

  // 7. EXTRACT AND SAVE SHORT-TERM MEMORY
  // Runs asynchronously to not block the response
  extractAndSaveMemory(conversationId, message_text, llmResult)
    .catch(err => console.error('❌ Memory extraction error:', err));

  // 8. EXTRACT LONG-TERM MEMORY FACTS
  // Only if we have a customer profile
  if (context.profile?.id) {
    extractMemoryFacts(context.profile.id, message_text, conversationId)
      .catch(err => console.error('❌ Memory facts error:', err));
  }

  // 9. CREATE CONVERSATION SUMMARY
  // Every 20 messages, create a summary of the conversation
  const messageCount = context.history?.length || 0;
  if (messageCount > 0 && messageCount % 20 === 0) {
    console.log(`📊 Creating summary at ${messageCount} messages`);
    createConversationSummary(conversationId)
      .catch(err => console.error('❌ Summary creation error:', err));
  }

  // ========================================
  // SEND TO PLATFORM
  // ========================================

  // 10. SEND TO FACEBOOK (if applicable)
  if (platform === 'facebook' && access_token && customer_fb_id) {
    await sendFacebookMessage(
      customer_fb_id,
      responseText,
      access_token,
      productCards
    );
  }

  // 11. RETURN RESPONSE
  return {
    success: true,
    response: responseText,
    products: productCards,
    recommendation_type: recommendationType,
    message_type: productCards.length > 0 ? 'product_card' : 'text',
    // Optional: Include memory stats in response
    memory_stats: {
      conversation_messages: messageCount,
      memory_retrieved: context.memory?.length || 0,
      has_summary: !!context.summary
    }
  };
}