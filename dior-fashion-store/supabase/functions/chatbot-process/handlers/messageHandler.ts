// ============================================
// handlers/messageHandler.ts - FIXED Complete Version
// ============================================

import { createSupabaseClient } from '../utils/supabaseClient.ts';
import { calculateCost } from '../utils/formatters.ts';
import { buildContext } from '../services/contextService.ts';
import { callGemini,callGeminiWithFunctionResult } from '../services/geminiService.ts';
import { sendFacebookMessage, } from '../services/facebookService.ts';
import { extractAndSaveAddress } from '../services/addressExtractionService.ts';
import { saveCustomerProfile } from '../services/customerProfileService.ts';
import { saveAddressStandardized } from '../services/addressService.ts';
import { 
  isOrderIntent, 
  isConfirmation, 
  isAddToCartIntent,
  handleOrderCreation 
} from './orderHandler.ts';
import {
  getOrCreateCart,
  addToCart,
  getCartSummary,
} from '../services/cartService.ts';
import { 
  createMessageEmbedding,
  createSummaryEmbedding 
} from '../services/embeddingService.ts';
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

  // ========================================
  // 1. GET OR CREATE CONVERSATION
  // ========================================
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

  // ========================================
  // 2. SAVE CUSTOMER MESSAGE
  // ========================================
  const { data: customerMessage, error: msgError } = await supabase
    .from('chatbot_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'customer',
      message_type: 'text',
      content: { text: message_text }
    })
    .select()
    .single();

  if (msgError) {
    console.error('Error saving customer message:', msgError);
    throw msgError;
  }

  // 🔥 2.1. CREATE EMBEDDING FOR CUSTOMER MESSAGE
  createMessageEmbedding(
    conversationId,
    customerMessage.id,
    message_text,
    {
      sender_type: 'customer',
      platform: dbPlatform,
      customer_fb_id: customer_fb_id || null,
      user_id: user_id || null,
      session_id: session_id || null
    }
  ).catch(err => console.error('❌ Customer embedding error:', err));

  // ========================================
  // 3. BUILD CONTEXT (includes memory retrieval)
  // ========================================
  const context = await buildContext(supabase, conversationId, message_text);

  console.log('Context built:', {
    hasProfile: !!context.profile,
    historyCount: context.history?.length || 0,
    memoryCount: context.memory?.length || 0,
    summaryAvailable: !!context.summary
  });

  // ========================================
  // 4. GENERATE RESPONSE
  // ========================================
  const llmResult = await callGemini(context, message_text);
  let responseText = llmResult.text; // ✅ Changed const to let
  const tokensUsed = llmResult.tokens;
  const recommendationType = llmResult.type;
  const productCards = llmResult.products;
  const functionCalls = llmResult.functionCalls || [];

  console.log('Response generated:', {
    type: recommendationType,
    products: productCards.length,
    tokens: tokensUsed,
    functionCalls: functionCalls.length
  });
// ========================================
  // 4.1. EXECUTE FUNCTION CALLS ⭐ NEW
  // ========================================
  if (functionCalls.length > 0) {
    console.log(`🔧 Executing ${functionCalls.length} function call(s)`);
    
    for (const fnCall of functionCalls) {
      try {
        let functionResult: any = { success: false };
        
        switch (fnCall.name) {
          // ========================================
          // FUNCTION 1: Save Customer Info
          // ========================================
          case 'save_customer_info':
            functionResult = await saveCustomerProfile(conversationId, fnCall.args);
            console.log('✅ Customer profile saved:', functionResult.message);
            
            // Get AI continuation response
            if (functionResult.success) {
              const continuation = await callGeminiWithFunctionResult(
                context,
                message_text,
                fnCall.name,
                functionResult
              );
              if (continuation.text) {
                responseText = continuation.text;
              }
            }
            break;
          
          // ========================================
          // FUNCTION 2: Save Address
          // ========================================
        case 'save_address':
  console.log('🤖 AI args BEFORE processing:', JSON.stringify(fnCall.args, null, 2));
  
  // ⭐ VALIDATE args trước khi gọi function
  if (!fnCall.args.address_line || !fnCall.args.city) {
    console.error('❌ Missing required fields:', fnCall.args);
    functionResult = {
      success: false,
      message: 'Thiếu thông tin địa chỉ'
    };
    break;
  }
  
  // Check if address_line looks like phone number
  if (/^[\d\s]+$/.test(fnCall.args.address_line)) {
    console.error('❌ address_line is phone number!', fnCall.args.address_line);
    
    // Try to fix by using extractAndSaveAddress instead
    const fixResult = await extractAndSaveAddress(conversationId, message_text);
    
    functionResult = {
      success: fixResult,
      message: fixResult ? 'Đã lưu địa chỉ' : 'Không thể lưu địa chỉ'
    };
    break;
  }
  
  // ⭐ USE STANDARDIZED SERVICE
  const result = await saveAddressStandardized(conversationId, {
    full_name: fnCall.args.full_name,
    phone: fnCall.args.phone,
    address_line: fnCall.args.address_line,
    ward: fnCall.args.ward,
    district: fnCall.args.district,
    city: fnCall.args.city
  });
  
  console.log('💾 Save result:', result);
  
  functionResult = result;
  
  console.log('✅ Address saved (standardized):', result.message);
  
  if (result.success) {
    const continuation = await callGeminiWithFunctionResult(
      context,
      message_text,
      fnCall.name,
      functionResult
    );
    if (continuation.text) {
      responseText = continuation.text;
    }
  }
  break;
          
          // ========================================
          // FUNCTION 3: Add to Cart
          // ========================================
          case 'add_to_cart':
            const { product_id, size, quantity = 1 } = fnCall.args;
            
            // Get product details
            const { data: product } = await supabase
              .from('products')
              .select(`
                id, name, price,
                images:product_images(image_url, is_primary)
              `)
              .eq('id', product_id)
              .single();
            
            if (product) {
              const primaryImage = product.images?.find((img: any) => img.is_primary);
              
              const updatedCart = await addToCart(conversationId, {
                product_id: product.id,
                name: product.name,
                price: product.price,
                size: size,
                quantity: quantity,
                image: primaryImage?.image_url || product.images?.[0]?.image_url || ''
              });
              
              functionResult = {
                success: true,
                message: `Đã thêm ${product.name} vào giỏ hàng`,
                cart_count: updatedCart.length
              };
              
              console.log('✅ Added to cart:', product.name, 'x', quantity);
              
              // Get AI continuation
              const continuation = await callGeminiWithFunctionResult(
                context,
                message_text,
                fnCall.name,
                functionResult
              );
              if (continuation.text) {
                responseText = continuation.text;
              }
            } else {
              functionResult = {
                success: false,
                message: 'Không tìm thấy sản phẩm'
              };
            }
            break;
          
          // ========================================
          // FUNCTION 4: Create Order
          // ========================================
          case 'confirm_and_create_order':
            if (fnCall.args.confirmed) {
              const orderResult = await handleOrderCreation({
                conversationId,
                message_text,
                aiResponse: llmResult
              });
              
              functionResult = orderResult;
              
              if (orderResult.success) {
                responseText = orderResult.message;
                console.log('✅ Order created:', orderResult.orderId);
              } else {
                console.log('❌ Order creation failed:', orderResult.message);
              }
            }
            break;
          
          default:
            console.log('⚠️ Unknown function:', fnCall.name);
        }
        
      } catch (error: any) {
        console.error(`❌ Function execution error (${fnCall.name}):`, error);
      }
    }
  }
  // ========================================
  // 4.5. CHECK ORDER CONFIRMATION
  // ========================================
  // Check if customer just confirmed address
  if (isConfirmation(message_text)) {
    const recentBotMessages = context.history
      ?.filter((m: any) => m.sender_type === 'bot')
      .slice(-2) || [];
    
    const justAskedForConfirmation = recentBotMessages.some((msg: any) => {
      const text = msg.content?.text || '';
      return text.includes('giao về') && text.includes('phải không');
    });
    
    if (justAskedForConfirmation) {
      console.log('✅ Customer confirmed address - Creating order');
      
      // Create order
      const orderResult = await handleOrderCreation({
        conversationId,
        message_text,
        aiResponse: llmResult
      });
      
      if (orderResult.success) {
        // Override response with order confirmation
        responseText = orderResult.message;
      } else {
        // If order creation failed, use the error message
        responseText = orderResult.message;
      }
    }
  }
  
  // ========================================
  // 4.6. CHECK IF ORDER INTENT (First time asking)
  // ========================================
  else if (isOrderIntent(message_text)) {
    console.log('🛒 Order intent detected');
    
    const orderResult = await handleOrderCreation({
      conversationId,
      message_text,
      aiResponse: llmResult
    });
    
    if (orderResult.success) {
      // Override AI response with order confirmation
      responseText = orderResult.message;
      
      // Save order confirmation message
      await supabase.from('chatbot_messages').insert({
        conversation_id: conversationId,
        sender_type: 'bot',
        message_type: 'text',
        content: { text: responseText }
      });
    } else if (orderResult.needAddress || orderResult.needProducts) {
      // AI will handle asking for address/products
      responseText = orderResult.message;
    }
  }

  // ========================================
  // 5. SAVE BOT RESPONSE
  // ========================================
  const { data: botMessage, error: botMsgError } = await supabase
    .from('chatbot_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'bot',
      message_type: productCards.length > 0 ? 'product_card' : 'text',
      content: {
        text: responseText,
        products: productCards,
        recommendation_type: recommendationType
      },
      tokens_used: tokensUsed
    })
    .select()
    .single();

  if (botMsgError) {
    console.error('Error saving bot message:', botMsgError);
    throw botMsgError;
  }

  // 🔥 5.1. CREATE EMBEDDING FOR BOT RESPONSE
  createMessageEmbedding(
    conversationId,
    botMessage.id,
    responseText,
    {
      sender_type: 'bot',
      platform: dbPlatform,
      has_products: productCards.length > 0,
      product_count: productCards.length,
      recommendation_type: recommendationType,
      product_ids: productCards.map((p: any) => p.id)
    }
  ).catch(err => console.error('❌ Bot embedding error:', err));

  // ========================================
  // 6. LOG USAGE
  // ========================================
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
  // 6.5. EXTRACT AND SAVE ADDRESS (if provided)
  // ========================================
  const hasAddressKeywords = /(?:địa chỉ|giao|ship|nhận hàng|đường|phường|quận|huyện|\d+\s+[A-Z])/i.test(message_text);
  
  if (hasAddressKeywords) {
    console.log('🏠 Detected potential address, extracting...');
    extractAndSaveAddress(conversationId, message_text)
      .catch(err => console.error('❌ Address extraction error:', err));
  }

  // ========================================
  // MEMORY PROCESSING (Non-blocking)
  // ========================================

  // 7. EXTRACT AND SAVE SHORT-TERM MEMORY
  extractAndSaveMemory(conversationId, message_text, llmResult)
    .catch(err => console.error('❌ Memory extraction error:', err));

  // 8. EXTRACT LONG-TERM MEMORY FACTS
  if (context.profile?.id) {
    extractMemoryFacts(context.profile.id, message_text, conversationId)
      .catch(err => console.error('❌ Memory facts error:', err));
  }

  // ========================================
  // 9. CREATE CONVERSATION SUMMARY
  // ========================================
  const messageCount = context.history?.length || 0;
  if (messageCount > 0 && messageCount % 20 === 0) {
    console.log(`📊 Creating summary at ${messageCount} messages`);
    
    createConversationSummary(conversationId)
      .then(async () => {
        const { data: summary } = await supabase
          .from('conversation_summaries')
          .select('summary_text, key_points')
          .eq('conversation_id', conversationId)
          .order('summary_created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (summary) {
          await createSummaryEmbedding(
            conversationId,
            summary.summary_text,
            summary.key_points || []
          );
          console.log('✅ Summary embedding created');
        }
      })
      .catch(err => console.error('❌ Summary creation error:', err));
  }

  // ========================================
  // 10. SEND TO FACEBOOK (if applicable)
  // ========================================
  if (platform === 'facebook' && access_token && customer_fb_id) {
    await sendFacebookMessage(
      customer_fb_id,
      responseText,
      access_token,
      productCards
    );
  }

  // ========================================
  // 11. RETURN RESPONSE
  // ========================================
  return {
    success: true,
    response: responseText,
    products: productCards,
    recommendation_type: recommendationType,
    message_type: productCards.length > 0 ? 'product_card' : 'text',
    memory_stats: {
      conversation_messages: messageCount,
      memory_retrieved: context.memory?.length || 0,
      has_summary: !!context.summary,
      embeddings_created: true
    }
  };
}