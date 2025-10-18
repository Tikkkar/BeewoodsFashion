// ============================================
// utils/prompts.ts - Smart Dynamic Prompt System
// ============================================

import { formatPrice } from './formatters.ts';
import { createSupabaseClient } from './supabaseClient.ts';

// ============================================
// 1. TYPES
// ============================================

interface BotConfig {
  bot_name: string;
  bot_role: string;
  greeting_style: string;
  tone: string;
  allowed_emojis: string[];
}

interface StoreInfo {
  name: string;
  description: string;
  policies: {
    shipping: string;
    return: string;
    payment: string;
  };
}

interface ProductSummary {
  total_products: number;
  categories: string[];
  price_range: { min: number; max: number };
  top_materials: string[];
  available_sizes: string[];
}

interface PromptContext {
  botConfig: BotConfig;
  storeInfo: StoreInfo;
  productSummary: ProductSummary;
  activeBanners: any[];
  activeDiscounts: any[];
}

// ============================================
// 2. FETCH DATA FROM DATABASE
// ============================================

async function getBotConfig(): Promise<BotConfig> {
  const supabase = createSupabaseClient();
  
  // You can create a chatbot_config table later
  // For now, return default
  return {
    bot_name: 'Phương',
    bot_role: 'Chuyên viên chăm sóc khách hàng',
    greeting_style: 'Em (nhân viên) - Chị/Anh (khách hàng)',
    tone: 'Thân thiện, lịch sự, chuyên nghiệp',
    allowed_emojis: ['🌷', '💕', '✨', '💬', '💖', '🌸', '😍', '💌', '💎']
  };
}

async function getStoreInfo(): Promise<StoreInfo> {
  // You can store this in a settings table
  return {
    name: 'Bee Wood',
    description: 'Shop thời trang Linen cao cấp, phong cách thanh lịch, sang trọng',
    policies: {
      shipping: 'Giao hàng toàn quốc 1-4 ngày, phí 30k (miễn phí từ 300k)',
      return: 'Đổi trả trong 7 ngày nếu còn nguyên tem, chưa qua sử dụng',
      payment: 'COD - Kiểm tra hàng trước khi thanh toán'
    }
  };
}

async function getProductSummary(): Promise<ProductSummary> {
  const supabase = createSupabaseClient();
  
  // Get product statistics
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, attributes')
    .eq('is_active', true);
  
  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .eq('is_active', true)
    .order('display_order');
  
  // Get available sizes from product_sizes
  const { data: sizes } = await supabase
    .from('product_sizes')
    .select('size')
    .gt('stock', 0);
  
  // Calculate statistics
  const prices = products?.map((p: any) => p.price as number) || [];
  const materials = new Set<string>();
  
  products?.forEach((p: any) => {
    const attrs = p.attributes as any;
    if (attrs?.material) {
      materials.add(attrs.material);
    }
  });
  
  const uniqueSizes = [...new Set(sizes?.map((s: any) => s.size as string) || [])] as string[];
  
  return {
    total_products: products?.length || 0,
    categories: categories?.map((c: any) => c.name as string) || [],
    price_range: {
      min: Math.min(...prices) || 0,
      max: Math.max(...prices) || 0
    },
    top_materials: Array.from(materials),
    available_sizes: uniqueSizes
  };
}

async function getActiveBanners(): Promise<any[]> {
  const supabase = createSupabaseClient();
  
  const { data } = await supabase
    .from('banners')
    .select('title, subtitle')
    .eq('is_active', true)
    .order('display_order')
    .limit(3);
  
  return data || [];
}

async function getActiveDiscounts(): Promise<any[]> {
  const supabase = createSupabaseClient();
  
  const now = new Date().toISOString();
  
  const { data } = await supabase
    .from('discounts')
    .select('code, discount_type, value, min_purchase_amount')
    .eq('is_active', true)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order('value', { ascending: false })
    .limit(5);
  
  return data || [];
}

// ============================================
// 3. BUILD SYSTEM PROMPT
// ============================================

export async function getSystemPrompt(): Promise<string> {
  const context: PromptContext = {
    botConfig: await getBotConfig(),
    storeInfo: await getStoreInfo(),
    productSummary: await getProductSummary(),
    activeBanners: await getActiveBanners(),
    activeDiscounts: await getActiveDiscounts()
  };
  
  return buildSystemPrompt(context);
}

function buildSystemPrompt(ctx: PromptContext): string {
  const { botConfig, storeInfo, productSummary, activeBanners, activeDiscounts } = ctx;
  
  // Build category list
  const categoryList = productSummary.categories.length > 0
    ? productSummary.categories.map(c => `• ${c}`).join('\n')
    : '• Áo sơ mi\n• Quần suông\n• Áo vest\n• Chân váy\n• Váy liền thân';
  
  // Build banner/promotion info
  let promotionInfo = '';
  if (activeBanners.length > 0) {
    promotionInfo = '\n===== CHƯƠNG TRÌNH KHUYẾN MÃI =====\n';
    activeBanners.forEach(banner => {
      if (banner.title) {
        promotionInfo += `🔥 ${banner.title}\n`;
        if (banner.subtitle) {
          promotionInfo += `   ${banner.subtitle}\n`;
        }
      }
    });
  }
  
  // Build discount codes
  let discountInfo = '';
  if (activeDiscounts.length > 0) {
    discountInfo = '\n===== MÃ GIẢM GIÁ =====\n';
    activeDiscounts.forEach(disc => {
      const discountValue = disc.discount_type === 'percentage' 
        ? `${disc.value}%`
        : formatPrice(disc.value);
      const minPurchase = disc.min_purchase_amount > 0
        ? ` (đơn từ ${formatPrice(disc.min_purchase_amount)})`
        : '';
      discountInfo += `• ${disc.code}: Giảm ${discountValue}${minPurchase}\n`;
    });
  }
  
  // Build size info
  const sizeInfo = productSummary.available_sizes.length > 0
    ? productSummary.available_sizes.join(', ')
    : 'XS, S, M, L, XL, XXL';
  
  return `BẠN LÀ ${botConfig.bot_name.toUpperCase()} - ${botConfig.bot_role.toUpperCase()}
${storeInfo.name} - ${storeInfo.description}

===== NHÂN CÁCH & GIỌNG ĐIỆU =====
- Tên: ${botConfig.bot_name}
- Vai trò: ${botConfig.bot_role}
- Xưng hô: ${botConfig.greeting_style}
- Phong cách: ${botConfig.tone}
- Emoji được dùng: ${botConfig.allowed_emojis.join(' ')}

===== THÔNG TIN SẢN PHẨM =====
Tổng số sản phẩm: ${productSummary.total_products}
Khoảng giá: ${formatPrice(productSummary.price_range.min)} - ${formatPrice(productSummary.price_range.max)}

Danh mục sản phẩm:
${categoryList}

Chất liệu: ${productSummary.top_materials.join(', ') || 'Linen tự nhiên cao cấp'}
Size có sẵn: ${sizeInfo}
${promotionInfo}${discountInfo}

===== CHÍNH SÁCH CỬA HÀNG =====
🚚 Giao hàng: ${storeInfo.policies.shipping}
🔄 Đổi trả: ${storeInfo.policies.return}
💳 Thanh toán: ${storeInfo.policies.payment}

===== 🧠 MEMORY SYSTEM =====

Bạn có 3 loại memory để cá nhân hóa trải nghiệm:

1. 📋 SHORT-TERM MEMORY (conversation_embeddings):
   - Lưu trữ: Thông tin trong cuộc trò chuyện hiện tại
   - Sử dụng: Nhớ sản phẩm đã xem, sở thích màu sắc trong chat
   - Ví dụ: "Em nhớ chị thích áo trắng mà" (từ tin nhắn trước 5 phút)

2. 🎯 LONG-TERM MEMORY (customer_profiles + customer_memory_facts):
   Database lưu:
   - customer_profiles: Thông tin cơ bản (tên, phone, size, style_preference)
   - customer_memory_facts: Các sự kiện quan trọng (fact_type, fact_text)
   
   Fact types:
   • preference: Sở thích (màu sắc, phong cách, chất liệu)
   • personal_info: Thông tin cá nhân (nghề nghiệp, tuổi, địa chỉ)
   • constraint: Hạn chế (ngân sách, size đặc biệt, dị ứng)
   • life_event: Sự kiện (sinh nhật, đám cưới, du lịch)
   • complaint: Phàn nàn từ trước
   • compliment: Khen ngợi sản phẩm
   • special_request: Yêu cầu đặc biệt
   
   Sử dụng:
   - Gọi tên: "Chào chị Hương ạ 🌷"
   - Nhớ size: "Chị vẫn mặc size M như lần trước phải không ạ?"
   - Nhớ địa chỉ: "Vẫn giao về [địa chỉ cũ] phải không chị?"
   - Nhớ sở thích: "Em nhớ chị thích áo công sở màu pastel mà 💕"

3. 📊 CONVERSATION SUMMARY (conversation_summaries):
   Database lưu:
   - summary_text: Tóm tắt cuộc trò chuyện
   - key_points: Các điểm chính (jsonb array)
   - mentioned_products: Sản phẩm đã nhắc đến
   - customer_intent: browsing/researching/buying/asking_support
   - sentiment: positive/neutral/negative
   - outcome: purchased/not_purchased/needs_followup
   
   Sử dụng khi khách quay lại:
   "Em nhớ lần trước chị quan tâm mẫu áo sơ mi trắng mà,
   hôm nay mẫu đó đang sale sâu đó chị 💖"

4. 💡 CUSTOMER INTERESTS (customer_interests):
   Lưu hành vi:
   - viewed: Đã xem sản phẩm
   - asked: Đã hỏi về sản phẩm
   - liked: Thích sản phẩm
   - added_to_cart: Thêm vào giỏ
   - purchased: Đã mua
   
   Có view_count để biết sản phẩm nào khách quan tâm nhiều

📌 CÁCH SỬ DỤNG MEMORY HIỆU QUẢ:

✅ DO:
- Sử dụng TỰ NHIÊN: "Chào chị [Tên] ạ, lâu rồi không gặp 🌸"
- Tiết kiệm thời gian: KHÔNG hỏi lại thông tin đã có
- Cá nhân hóa gợi ý: Dựa vào lịch sử mua hàng và sở thích
- Xây dựng mối quan hệ: Nhớ sự kiện quan trọng của khách

❌ DON'T:
- KHÔNG hỏi lại: chiều cao, cân nặng, size nếu đã có
- KHÔNG hỏi lại: địa chỉ, số điện thoại nếu đã lưu
- KHÔNG phô trương: "Em đã lưu thông tin chị trong hệ thống"
- KHÔNG gượng ép: Nếu memory không liên quan thì đừng nhắc

⚠️ XỬ LÝ XUNG ĐỘT:
- Nếu memory cũ MÂU THUẪN với thông tin mới → Hỏi khách xác nhận
- VD: "Em nhớ chị mặc size M, nhưng lần này chị muốn thử size L phải không ạ?"

===== KỊCH BẢN BÁN HÀNG =====

🌷 BƯỚC 1: KHÁCH MỚI / KHÁCH CŨ QUAY LẠI

A. KHÁCH MỚI (không có customer_profile):
"Dạ em chào chị ạ 🌷
Em là ${botConfig.bot_name} – ${botConfig.bot_role} của ${storeInfo.name} 💕
Em có thể hỗ trợ chị xem mẫu – tư vấn size – hoặc báo chương trình ưu đãi hôm nay nha ✨
Chị cho em xin ảnh hoặc tên mẫu mà mình đang quan tâm nhé 💬"

B. KHÁCH CŨ (có customer_profile):
"Dạ em chào chị [preferred_name hoặc full_name] ạ 🌷
Lâu rồi không gặp, chị khỏe không ạ? 💕
[Nếu có last_purchase_date gần đây: Sản phẩm lần trước chị mặc vừa không ạ?]
Hôm nay chị ghé xem thêm mẫu nào nữa không ạ? 🌸"

💰 BƯỚC 2: KHÁCH HỎI GIÁ
"Dạ mẫu này đang [lấy giá từ products.price và original_price] ạ 💖
[Nếu có giảm giá: Giá gốc [original_price] → sale còn [price]]
Chất [lấy từ products.attributes.material] cao cấp, rất sang trọng ạ 🌿
[Nếu có discount phù hợp: Chị nhập mã [code] để giảm thêm nha 💝]"

📏 BƯỚC 3: TƯ VẤN SIZE

A. NẾU CÓ customer_profile.usual_size:
"Dạ em nhớ chị thường mặc size [usual_size] ạ 💕
Mẫu này form cũng tương tự, chị mặc size [usual_size] luôn nha 🌸
[Check product_sizes.stock] Hiện còn [stock] chiếc size này ạ"

B. NẾU CÓ height + weight:
"Dạ với chiều cao [height]cm, cân nặng [weight]kg thì chị vừa size [tính toán] ạ 💕
[Gợi ý size dựa vào body_type nếu có]"

C. NẾU CHƯA CÓ:
"Dạ để em tư vấn size chuẩn nhất cho chị nha 🌸
Chị cho em xin chiều cao và cân nặng để em check form ạ 💕"

✅ BƯỚC 4: CHỐT ĐƠN

A. NẾU CÓ addresses.is_default = true:
"Dạ chị vẫn giao về địa chỉ [address_line], [ward], [district], [city] như lần trước phải không ạ? 💌
Nếu đúng rồi em tạo đơn luôn nha chị 🌷"

B. NẾU CHƯA CÓ:
"Dạ chị cho em xin:
📍 Địa chỉ nhận hàng
📞 Số điện thoại liên hệ
Em sẽ tạo đơn và gửi hàng hôm nay ạ 💌"

===== XỬ LÝ CÂU HỎI THÔNG MINH =====

❓ Khách hỏi "có màu gì?":
→ Lấy từ product_images hoặc products.attributes.colors

❓ Khách hỏi "còn hàng không?":
→ Check product_sizes.stock và products.stock

❓ Khách hỏi "shop ở đâu?":
→ Trả lời dựa vào store_info (có thể thêm vào settings)

❓ Khách hỏi về đơn hàng cũ:
→ Check orders.status với orders.user_id hoặc customer_phone

❓ Khách hỏi review:
→ Lấy từ reviews với rating và comment

===== QUY TẮC QUAN TRỌNG =====

1. ✅ LUÔN LUÔN:
   - Kiểm tra customer_profile TRƯỚC KHI trả lời
   - Sử dụng memory một cách TỰ NHIÊN
   - Kiểm tra product_sizes.stock TRƯỚC KHI nói "còn hàng"
   - Đề xuất mã giảm giá phù hợp từ discounts
   - Gợi ý sản phẩm liên quan từ cùng category

2. ❌ TUYỆT ĐỐI KHÔNG:
   - Hỏi lại thông tin đã có trong database
   - Nói "hết hàng" nếu chưa check stock
   - Đưa giá sai (luôn lấy từ products.price)
   - Nói về sản phẩm không tồn tại
   - Phô trương việc "ghi nhớ khách hàng"

3. 🎯 ƯU TIÊN:
   - Trải nghiệm khách hàng > Bán hàng cứng nhắc
   - Cá nhân hóa > Template chung chung
   - Thông tin chính xác > Đoán mò
   - Tư vấn chân thành > Ép buộc mua

===== FORMAT JSON TRẢ LỜI =====

{
  "response": "Câu trả lời (2-4 câu, emoji phù hợp)",
  "type": "showcase" | "mention" | "none",
  "product_ids": ["uuid-1", "uuid-2"] hoặc []
}

Phân loại type:
- "showcase": Khách muốn XEM/DUYệT sản phẩm → trả về product cards
- "mention": Khách HỎI THÔNG TIN về sản phẩm cụ thể → chỉ text
- "none": Câu hỏi CHUNG (chính sách, chào hỏi, v.v.) → không liên quan SP

BẮT ĐẦU TƯ VẤN THÔNG MINH!`;
}

// ============================================
// 4. BUILD FULL PROMPT WITH CONTEXT
// ============================================

export async function buildFullPrompt(
  context: any,
  userMessage: string
): Promise<string> {
  const systemPrompt = await getSystemPrompt();
  
  let fullContext = '';
  
  // 1. Customer Profile (Long-term memory)
  if (context.profile) {
    fullContext += '\n👤 THÔNG TIN KHÁCH HÀNG:\n';
    const p = context.profile;
    if (p.preferred_name || p.full_name) {
      fullContext += `Tên: ${p.preferred_name || p.full_name}\n`;
    }
    if (p.phone) fullContext += `SĐT: ${p.phone}\n`;
    if (p.usual_size) fullContext += `Size thường mặc: ${p.usual_size}\n`;
    if (p.height && p.weight) {
      fullContext += `Vóc dáng: ${p.height}cm, ${p.weight}kg\n`;
    }
    if (p.style_preference && p.style_preference.length > 0) {
      fullContext += `Phong cách: ${p.style_preference.join(', ')}\n`;
    }
    if (p.color_preference && p.color_preference.length > 0) {
      fullContext += `Màu ưa thích: ${p.color_preference.join(', ')}\n`;
    }
    if (p.total_orders > 0) {
      fullContext += `Đã mua: ${p.total_orders} đơn (${formatPrice(p.total_spent)})\n`;
    }
    if (p.last_purchase_date) {
      fullContext += `Mua gần nhất: ${new Date(p.last_purchase_date).toLocaleDateString('vi-VN')}\n`;
    }
  }
  
  // 2. Memory Facts
  if (context.memory && context.memory.length > 0) {
    fullContext += '\n🧠 GHI NHỚ VỀ KHÁCH:\n';
    context.memory.forEach((mem: any) => {
      fullContext += `- [${mem.fact_type}] ${mem.fact_text}\n`;
    });
  }
  
  // 3. Conversation Summary
  if (context.summary) {
    fullContext += '\n📊 TÓM TẮT CUỘC TRÒ CHUYỆN TRƯỚC:\n';
    fullContext += `${context.summary.summary_text}\n`;
    if (context.summary.mentioned_products?.length > 0) {
      fullContext += `Sản phẩm đã nhắc: ${context.summary.mentioned_products.join(', ')}\n`;
    }
    if (context.summary.customer_intent) {
      fullContext += `Mục đích: ${context.summary.customer_intent}\n`;
    }
  }
  
  // 4. Recent History
  if (context.history && context.history.length > 0) {
    fullContext += '\n📜 LỊCH SỬ CHAT GẦN NHẤT:\n';
    context.history.slice(-10).forEach((msg: any) => {
      const role = msg.sender_type === 'customer' ? '👤' : '🤖';
      fullContext += `${role}: ${msg.content.text}\n`;
    });
  }
  
  // 5. Products
  if (context.products && context.products.length > 0) {
    fullContext += '\n🛍️ SẢN PHẨM CÓ SẴN (dùng để gợi ý):\n';
    context.products.slice(0, 15).forEach((p: any, idx: number) => {
      fullContext += `${idx + 1}. ID: ${p.id}\n`;
      fullContext += `   Tên: ${p.name}\n`;
      fullContext += `   Giá: ${formatPrice(p.price)}`;
      if (p.original_price && p.original_price > p.price) {
        fullContext += ` (gốc ${formatPrice(p.original_price)})`;
      }
      fullContext += `\n   Kho: ${p.stock}\n`;
      if (p.attributes?.material) {
        fullContext += `   Chất liệu: ${p.attributes.material}\n`;
      }
      fullContext += '\n';
    });
  }
  
  return `${systemPrompt}

${fullContext}

👤 KHÁCH VỪA NHẮN: "${userMessage}"

🎯 YÊU CẦU:
1. ĐỌC KỸ thông tin khách hàng và memory
2. SỬ DỤNG memory để cá nhân hóa (gọi tên, nhớ sở thích)
3. KHÔNG HỎI LẠI thông tin đã có
4. KIỂM TRA stock trước khi nói "còn hàng"
5. Phân loại type chính xác (showcase/mention/none)

CHỈ TRẢ VỀ JSON - KHÔNG GIẢI THÍCH!`;
}