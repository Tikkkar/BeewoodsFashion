// ============================================
// services/cartService.ts - HOÀN CHỈNH & NÂNG CẤP
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";

// Định nghĩa kiểu dữ liệu cho một sản phẩm trong giỏ hàng
interface CartItem {
  product_id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

// Định nghĩa kiểu dữ liệu trả về chung cho các service
interface ServiceResult {
  success: boolean;
  message: string;
  cart?: CartItem[];
}

/**
 * Lấy giỏ hàng từ context của cuộc trò chuyện.
 * Tự động tạo giỏ hàng rỗng nếu chưa tồn tại.
 */
export async function getOrCreateCart(
  conversationId: string,
): Promise<CartItem[]> {
  const supabase = createSupabaseClient();

  const { data: conversation, error } = await supabase
    .from("chatbot_conversations")
    .select("context")
    .eq("id", conversationId)
    .single();

  if (error || !conversation) {
    console.error("Error fetching conversation for cart:", error);
    return [];
  }

  // 🔥 NÂNG CẤP: Xử lý trường hợp context không phải là một object hợp lệ
  if (
    typeof conversation.context !== "object" || conversation.context === null
  ) {
    return [];
  }

  const cart = conversation.context?.cart || [];
  // Đảm bảo luôn trả về một mảng
  return Array.isArray(cart) ? (cart as CartItem[]) : [];
}

/**
 * 🔥 NÂNG CẤP: Hàm helper để lưu giỏ hàng một cách an toàn
 * Sử dụng RPC function 'merge_context' để hợp nhất dữ liệu,
 * tránh ghi đè mất các thông tin khác trong context.
 */
async function saveCart(
  conversationId: string,
  cart: CartItem[],
): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.rpc("merge_context", {
    p_conversation_id: conversationId,
    p_new_context: { cart: cart },
  });
  if (error) {
    console.error("Error saving cart via RPC:", error);
  }
}

/**
 * Thêm một sản phẩm vào giỏ hàng.
 * Nếu sản phẩm đã tồn tại, sẽ cộng dồn số lượng.
 */
export async function addToCart(
  conversationId: string,
  item: CartItem,
): Promise<CartItem[]> {
  const cart = await getOrCreateCart(conversationId);

  const existingIndex = cart.findIndex(
    (i: CartItem) => i.product_id === item.product_id && i.size === item.size,
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  await saveCart(conversationId, cart);

  console.log(`✅ Added to cart: ${item.name} x${item.quantity}`);
  return cart;
}

/**
 * ⭐ MỚI: Xóa sản phẩm khỏi giỏ hàng.
 * Dành cho tool `remove_from_cart`.
 */
export async function removeFromCart(
  conversationId: string,
  productId: string,
): Promise<ServiceResult> {
  const cart = await getOrCreateCart(conversationId);
  const initialLength = cart.length;

  const newCart = cart.filter((item) => item.product_id !== productId);

  if (newCart.length < initialLength) {
    await saveCart(conversationId, newCart);
    console.log(`🗑️ Removed product ${productId} from cart.`);
    return {
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng.",
      cart: newCart,
    };
  } else {
    console.warn(`⚠️ Product ${productId} not found in cart to remove.`);
    return {
      success: false,
      message: "Không tìm thấy sản phẩm này trong giỏ hàng.",
    };
  }
}

/**
 * ⭐ MỚI: Cập nhật thông tin một sản phẩm trong giỏ (số lượng, size).
 * Dành cho tool `update_cart_item`.
 */
export async function updateCartItem(
  conversationId: string,
  args: { product_id: string; quantity: number; size?: string },
): Promise<ServiceResult> {
  // Nếu số lượng <= 0, thực hiện xóa sản phẩm
  if (args.quantity <= 0) {
    return removeFromCart(conversationId, args.product_id);
  }

  const cart = await getOrCreateCart(conversationId);
  let itemIndex = -1;

  // Ưu tiên tìm chính xác product_id và size nếu được cung cấp
  if (args.size) {
    itemIndex = cart.findIndex((i) =>
      i.product_id === args.product_id && i.size === args.size
    );
  } // Nếu không có size, nhưng trong giỏ chỉ có 1 loại sản phẩm đó -> tự động chọn
  else {
    const matchingItems = cart.filter((i) => i.product_id === args.product_id);
    if (matchingItems.length === 1) {
      itemIndex = cart.findIndex((i) => i.product_id === args.product_id);
    } else if (matchingItems.length > 1) {
      return {
        success: false,
        message:
          "Sản phẩm này có nhiều size trong giỏ, chị vui lòng chỉ rõ size muốn cập nhật ạ.",
      };
    }
  }

  if (itemIndex >= 0) {
    cart[itemIndex].quantity = args.quantity;
    if (args.size) {
      cart[itemIndex].size = args.size;
    }
    await saveCart(conversationId, cart);
    console.log(
      `🔄 Updated cart item ${args.product_id} to quantity ${args.quantity}.`,
    );
    return {
      success: true,
      message: `Đã cập nhật giỏ hàng thành công.`,
      cart: cart,
    };
  } else {
    console.warn(`⚠️ Item ${args.product_id} not found to update.`);
    return {
      success: false,
      message: "Không tìm thấy sản phẩm này trong giỏ để cập nhật.",
    };
  }
}

/**
 * Xóa toàn bộ sản phẩm khỏi giỏ hàng.
 */
export async function clearCart(conversationId: string): Promise<void> {
  const cart = await getOrCreateCart(conversationId);
  if (cart.length > 0) {
    await saveCart(conversationId, []);
  }
  console.log("✅ Cart cleared");
}

/**
 * ⭐ MỚI: Lấy tóm tắt giỏ hàng dưới dạng một chuỗi văn bản thân thiện.
 * Dành cho tool `view_cart`.
 */
export async function getCartSummary(conversationId: string): Promise<string> {
  const cart = await getOrCreateCart(conversationId);

  if (cart.length === 0) {
    return "Dạ giỏ hàng của chị hiện đang trống ạ.";
  }

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0,
  );

  const itemsList = cart.map((item) =>
    `• ${item.name} (Size ${item.size}) x${item.quantity} - ${
      formatPrice(item.price * item.quantity)
    }`
  ).join("\n");

  return `Dạ, em kiểm tra giỏ hàng của chị đang có ${totalQuantity} sản phẩm:\n${itemsList}\n\n💰 Tạm tính: ${
    formatPrice(subtotal)
  }`;
}

/**
 * Định dạng số thành tiền tệ VNĐ.
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}
