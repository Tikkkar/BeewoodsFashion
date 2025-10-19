// ============================================
// services/chatbotOrderService.ts
// Tạo đơn hàng từ chatbot (không cần user_id)
// ============================================

import { createSupabaseClient } from '../utils/supabaseClient.ts';

interface ProductOrder {
  product_id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

interface OrderData {
  conversationId: string;
  profileId: string;
  customerName: string;
  customerPhone: string;
  customerFbId?: string;
  shippingAddress: string;
  shippingWard?: string;
  shippingDistrict?: string;
  shippingCity?: string;
  products: ProductOrder[];
  notes?: string;
}

/**
 * Create order from chatbot conversation
 */
export async function createChatbotOrder(data: OrderData) {
  const supabase = createSupabaseClient();
  
  console.log('🛒 Creating chatbot order for:', data.customerPhone);
  
  // ========================================
  // 1. CALCULATE TOTALS
  // ========================================
  const subtotal = data.products.reduce(
    (sum, p) => sum + (p.price * p.quantity), 
    0
  );
  
  const shippingFee = subtotal >= 300000 ? 0 : 30000; // Free ship > 300k
  const discountAmount = 0; // TODO: Apply discount if any
  const totalAmount = subtotal + shippingFee - discountAmount;
  
  // ========================================
  // 2. PREPARE PRODUCT DETAILS
  // ========================================
  const productDetails = data.products.map(p => ({
    product_id: p.product_id,
    name: p.name,
    price: p.price,
    size: p.size || 'One Size',
    quantity: p.quantity,
    image: p.image
  }));
  
  const productIds = data.products.map(p => p.product_id);
  
  // ========================================
  // 3. CREATE CHATBOT ORDER
  // ========================================
  const { data: order, error: orderError } = await supabase
    .from('chatbot_orders')
    .insert({
      conversation_id: data.conversationId,
      profile_id: data.profileId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_fb_id: data.customerFbId || null,
      shipping_address: data.shippingAddress,
      shipping_ward: data.shippingWard || null,
      shipping_district: data.shippingDistrict || null,
      shipping_city: data.shippingCity || null,
      product_ids: productIds,
      product_details: productDetails,
      subtotal: subtotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: 'pending',
      notes: data.notes || null
    })
    .select()
    .single();
  
  if (orderError) {
    console.error('❌ Error creating chatbot order:', orderError);
    throw orderError;
  }
  
  console.log('✅ Chatbot order created:', order.id);
  
  // ========================================
  // 4. UPDATE STOCK
  // ========================================
  for (const product of data.products) {
    await updateProductStock(
      supabase,
      product.product_id,
      product.size,
      product.quantity
    );
  }
  
  // ========================================
  // 5. SAVE AS MEMORY FACT
  // ========================================
  await supabase
    .from('customer_memory_facts')
    .insert({
      customer_profile_id: data.profileId,
      fact_type: 'special_request',
      fact_text: `Đã đặt hàng: ${data.products.map(p => p.name).join(', ')}`,
      importance_score: 8,
      source_conversation_id: data.conversationId
    });
  
  return {
    success: true,
    order: order,
    orderSummary: {
      subtotal,
      shippingFee,
      discountAmount,
      total: totalAmount,
      products: data.products.length
    }
  };
}

/**
 * Update product stock after order
 */
async function updateProductStock(
  supabase: any,
  productId: string,
  size: string,
  quantity: number
) {
  // Update main product stock
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();
  
  if (product) {
    await supabase
      .from('products')
      .update({ stock: Math.max(0, product.stock - quantity) })
      .eq('id', productId);
  }
  
  // Update size-specific stock
  if (size && size !== 'One Size') {
    const { data: sizeData } = await supabase
      .from('product_sizes')
      .select('stock')
      .eq('product_id', productId)
      .eq('size', size)
      .single();
    
    if (sizeData) {
      await supabase
        .from('product_sizes')
        .update({ stock: Math.max(0, sizeData.stock - quantity) })
        .eq('product_id', productId)
        .eq('size', size);
    }
  }
}

/**
 * Get chatbot orders by conversation
 */
export async function getChatbotOrdersByConversation(conversationId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('chatbot_orders')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching chatbot orders:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get chatbot orders by phone
 */
export async function getChatbotOrdersByPhone(phone: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('chatbot_orders')
    .select('*')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching chatbot orders:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Confirm chatbot order and convert to main order
 */
export async function confirmChatbotOrder(chatbotOrderId: string) {
  const supabase = createSupabaseClient();
  
  console.log('📋 Converting chatbot order to main order:', chatbotOrderId);
  
  // Call SQL function to convert
  const { data: mainOrderId, error } = await supabase.rpc(
    'convert_chatbot_order_to_main',
    { p_chatbot_order_id: chatbotOrderId }
  );
  
  if (error) {
    console.error('❌ Error converting order:', error);
    throw error;
  }
  
  console.log('✅ Order converted to main order:', mainOrderId);
  
  // Get the main order details
  const { data: mainOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('id', mainOrderId)
    .single();
  
  return {
    success: true,
    mainOrderId,
    orderNumber: mainOrder?.order_number
  };
}

/**
 * Cancel chatbot order
 */
export async function cancelChatbotOrder(
  chatbotOrderId: string,
  reason: string
) {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from('chatbot_orders')
    .update({
      status: 'cancelled',
      cancel_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', chatbotOrderId);
  
  if (error) {
    console.error('❌ Error cancelling order:', error);
    return { success: false, error };
  }
  
  console.log('✅ Order cancelled:', chatbotOrderId);
  return { success: true };
}