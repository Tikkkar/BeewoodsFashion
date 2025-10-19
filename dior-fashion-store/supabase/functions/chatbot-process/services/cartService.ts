// ============================================
// services/cartService.ts - Shopping Cart Management
// ============================================

import { createSupabaseClient } from '../utils/supabaseClient.ts';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

/**
 * Get or create shopping cart for conversation
 */
export async function getOrCreateCart(conversationId: string): Promise<CartItem[]> {
  const supabase = createSupabaseClient();
  
  // Get cart from conversation context
  const { data: conversation } = await supabase
    .from('chatbot_conversations')
    .select('context')
    .eq('id', conversationId)
    .single();
  
  if (!conversation) return [];
  
  const cart = conversation.context?.cart || [];
  return cart as CartItem[];
}

/**
 * Add item to cart
 */
export async function addToCart(
  conversationId: string,
  item: CartItem
): Promise<CartItem[]> {
  const supabase = createSupabaseClient();
  
  // Get current cart
  const cart = await getOrCreateCart(conversationId);
  
  // Check if item already exists
  const existingIndex = cart.findIndex(
    (i: CartItem) => i.product_id === item.product_id && i.size === item.size
  );
  
  if (existingIndex >= 0) {
    // Update quantity
    cart[existingIndex].quantity += item.quantity;
  } else {
    // Add new item
    cart.push(item);
  }
  
  // Save to database
  await supabase
    .from('chatbot_conversations')
    .update({
      context: { cart: cart },
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);
  
  console.log(`✅ Added to cart: ${item.name} x${item.quantity}`);
  
  return cart;
}

/**
 * Update cart item quantity
 */
export async function updateCartQuantity(
  conversationId: string,
  productId: string,
  size: string,
  quantity: number
): Promise<CartItem[]> {
  const supabase = createSupabaseClient();
  
  const cart = await getOrCreateCart(conversationId);
  
  const itemIndex = cart.findIndex(
    (i: CartItem) => i.product_id === productId && i.size === size
  );
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item
      cart.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart[itemIndex].quantity = quantity;
    }
    
    // Save
    await supabase
      .from('chatbot_conversations')
      .update({
        context: { cart: cart },
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }
  
  return cart;
}

/**
 * Clear cart
 */
export async function clearCart(conversationId: string): Promise<void> {
  const supabase = createSupabaseClient();
  
  await supabase
    .from('chatbot_conversations')
    .update({
      context: { cart: [] },
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);
  
  console.log('✅ Cart cleared');
}

/**
 * Get cart summary
 */
export function getCartSummary(cart: CartItem[]): {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  itemsList: string;
} {
  const totalItems = cart.length;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const itemsList = cart.map(item => 
    `• ${item.name} - Size ${item.size} x${item.quantity} = ${formatPrice(item.price * item.quantity)}`
  ).join('\n');
  
  return {
    totalItems,
    totalQuantity,
    subtotal,
    itemsList
  };
}

/**
 * Smart product extraction from conversation
 * Detects: "thêm 1 bộ", "lấy 2 cái", "cùng mẫu", "mẫu khác"
 */
export async function extractProductsFromMessage(
  conversationId: string,
  message: string,
  recentProducts: any[]
): Promise<{ items: CartItem[], intent: string }> {
  const supabase = createSupabaseClient();
  const lowerMessage = message.toLowerCase();
  
  let items: CartItem[] = [];
  let intent = 'view'; // view, add, replace
  
  // ========================================
  // DETECT QUANTITY
  // ========================================
  let quantity = 1;
  
  // Match patterns: "2 bộ", "thêm 3", "lấy 5 cái"
  const quantityPatterns = [
    /(\d+)\s*(?:bộ|cái|chiếc|sản phẩm)/i,
    /(?:thêm|lấy|cho)\s+(\d+)/i
  ];
  
  for (const pattern of quantityPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      quantity = parseInt(match[1]);
      break;
    }
  }
  
  // ========================================
  // DETECT INTENT
  // ========================================
  if (/thêm|nữa|thêm vào/i.test(lowerMessage)) {
    intent = 'add';
  } else if (/đổi|thay|khác/i.test(lowerMessage)) {
    intent = 'replace';
  }
  
  // ========================================
  // DETECT PRODUCT REFERENCE
  // ========================================
  
  // "Cùng mẫu" / "Mẫu này" → Same product
  if (/cùng mẫu|mẫu này|cái này|bộ này/i.test(lowerMessage)) {
    if (recentProducts.length > 0) {
      const lastProduct = recentProducts[0];
      const fullProduct = await getFullProductDetails(supabase, lastProduct.id);
      
      if (fullProduct) {
        items.push({
          product_id: fullProduct.id,
          name: fullProduct.name,
          price: fullProduct.price,
          size: 'M', // TODO: detect size from context
          quantity: quantity,
          image: fullProduct.image
        });
      }
    }
  }
  // "Mẫu khác" / "Cái khác" → Different product (need AI to recommend)
  else if (/mẫu khác|cái khác|bộ khác|sản phẩm khác/i.test(lowerMessage)) {
    intent = 'view'; // Let AI show different products
  }
  // Specific product mentioned → Extract from recent products
  else {
    // Take first recent product as default
    if (recentProducts.length > 0) {
      const product = recentProducts[0];
      const fullProduct = await getFullProductDetails(supabase, product.id);
      
      if (fullProduct) {
        items.push({
          product_id: fullProduct.id,
          name: fullProduct.name,
          price: fullProduct.price,
          size: 'M',
          quantity: quantity,
          image: fullProduct.image
        });
      }
    }
  }
  
  return { items, intent };
}

/**
 * Get full product details
 */
async function getFullProductDetails(supabase: any, productId: string) {
  const { data } = await supabase
    .from('products')
    .select(`
      id, name, price,
      images:product_images(image_url, is_primary)
    `)
    .eq('id', productId)
    .single();
  
  if (!data) return null;
  
  const primaryImage = data.images?.find((img: any) => img.is_primary);
  
  return {
    id: data.id,
    name: data.name,
    price: data.price,
    image: primaryImage?.image_url || data.images?.[0]?.image_url || ''
  };
}

/**
 * Format price
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}