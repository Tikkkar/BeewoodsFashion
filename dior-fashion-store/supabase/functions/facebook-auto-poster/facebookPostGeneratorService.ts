// ==================================================
// services/facebookPostGeneratorService.ts
// AI-powered Facebook Post Generator with validation
// UPGRADED: High quality posts with engagement optimization
// ==================================================

import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { callOpenRouterChat } from "./openRouterClient.ts";

// @ts-ignore
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

if (!geminiApiKey) {
  console.warn("⚠️ Gemini API Key chưa được thiết lập");
}

const genAI = new GoogleGenerativeAI(geminiApiKey as string);

// ==================================================
// INTERFACES
// ==================================================

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  brand_name?: string;
  seo_title?: string;
  seo_description?: string;
  category?: string;
  images: string[]; // Array of image URLs
  stock?: number;
  attributes?: Record<string, any>;
}

export interface PostGenerationRequest {
  product: ProductData;
  postType?: PostType;
  tone?: PostTone;
  includeHashtags?: boolean;
  includePricing?: boolean;
  includeCallToAction?: boolean;
  customHashtags?: string[];
  targetAudience?: string;
  specialOffer?: string;
  maxLength?: number;
}

export type PostType = 
  | 'new_product'       // Sản phẩm mới
  | 'product_update'    // Cập nhật sản phẩm (SEO update)
  | 'product_showcase'  // Giới thiệu sản phẩm
  | 'sale'              // Khuyến mãi
  | 'flash_sale'        // Flash sale
  | 'restock'           // Nhập hàng lại
  | 'showcase'          // Giới thiệu showcase
  | 'testimonial'       // Review khách hàng
  | 'educational'       // Bài viết hướng dẫn
  | 'story';            // Câu chuyện thương hiệu

export type PostTone = 
  | 'professional'   // Chuyên nghiệp
  | 'friendly'       // Thân thiện
  | 'enthusiastic'   // Nhiệt tình
  | 'luxury'         // Cao cấp
  | 'casual'         // Thoải mái
  | 'urgent';        // Khẩn cấp (cho sale)

export interface GeneratedPost {
  caption: string;
  captionWithoutHashtags: string;
  hashtags: string[];
  suggestedImages: string[];
  estimatedEngagement: {
    likelihood: 'low' | 'medium' | 'high';
    tips: string[];
  };
  metadata: {
    wordCount: number;
    characterCount: number;
    hashtagCount: number;
    emojiCount: number;
    readingTime: string;
    generatedAt: string;
    aiModel: string;
  };
}

export interface FacebookPostResponse {
  success: boolean;
  posts: GeneratedPost[];
  alternatives?: GeneratedPost[]; // Alternative versions for A/B testing
  processingTime: number;
  error?: string;
}

// ==================================================
// TEMPLATES & BEST PRACTICES
// ==================================================

const POST_TEMPLATES: Record<PostType, {
  structure: string;
  emojis: string[];
  keywords: string[];
}> = {
  new_product: {
    structure: '🎉 Announcement + Product highlight + Benefits + Price + CTA',
    emojis: ['🎉', '✨', '🆕', '💝', '🎁'],
    keywords: ['mới về', 'ra mắt', 'giới thiệu', 'khám phá'],
  },
  product_update: {
    structure: '✨ Update announcement + What changed + Benefits + CTA',
    emojis: ['✨', '🔄', '📢', '💫', '🎯'],
    keywords: ['cập nhật', 'nâng cấp', 'mới nhất', 'hoàn thiện'],
  },
  product_showcase: {
    structure: 'Hook + Story + Features + Social proof + CTA',
    emojis: ['✨', '💎', '🌟', '👗', '👔', '👕'],
    keywords: ['đẳng cấp', 'phong cách', 'xu hướng', 'hot trend'],
  },
  sale: {
    structure: '🔥 Urgency + Discount + Limited time + Price + CTA',
    emojis: ['🔥', '💥', '⚡', '🎯', '💰'],
    keywords: ['giảm giá', 'sale', 'ưu đãi', 'tiết kiệm'],
  },
  flash_sale: {
    structure: '⚡ URGENT + Big discount + Countdown + FOMO + CTA',
    emojis: ['⚡', '🔥', '💥', '⏰', '🎯'],
    keywords: ['flash sale', 'chớp nhoáng', 'nhanh tay', 'chỉ hôm nay'],
  },
  restock: {
    structure: '📦 Back in stock + Limited quantity + Popular item + CTA',
    emojis: ['📦', '✨', '🎯', '⏰'],
    keywords: ['về hàng', 'còn hàng', 'nhập lại', 'có sẵn'],
  },
  showcase: {
    structure: 'Hook + Story + Features + Social proof + CTA',
    emojis: ['✨', '💎', '🌟'],
    keywords: ['đẳng cấp', 'phong cách', 'xu hướng'],
  },
  testimonial: {
    structure: '⭐ Review + Story + Result + CTA',
    emojis: ['⭐', '💯', '👍', '😍'],
    keywords: ['review', 'khách hàng', 'đánh giá', 'hài lòng'],
  },
  educational: {
    structure: '📚 Problem + Solution + Tips + CTA',
    emojis: ['📚', '💡', '✅', '👉'],
    keywords: ['hướng dẫn', 'tips', 'bí quyết', 'cách'],
  },
  story: {
    structure: '📖 Story + Emotional hook + Brand values + CTA',
    emojis: ['📖', '❤️', '✨', '🌟'],
    keywords: ['câu chuyện', 'hành trình', 'giá trị', 'khác biệt'],
  },
};

const ENGAGEMENT_BEST_PRACTICES = {
  caption: {
    // Khuyến nghị caption dài hơn, có storytelling rõ ràng
    optimal_length: [400, 800],
    max_length: 2200,
    first_sentence_max: 80, // Hook vẫn gọn để hiện đủ trong preview
  },
  hashtags: {
    recommended_count: [8, 12], // Tăng lên để SEO tốt hơn
    max_count: 30,
    mix: 'Use 3-4 broad + 4-6 niche + 2-3 branded',
  },
  emojis: {
    recommended_count: [4, 10], // Tăng lên cho bắt mắt hơn
    placement: 'Start of sections, highlight key points',
  },
  call_to_action: [
    '💬 Nhắn tin ngay để được tư vấn!',
    '📩 Comment "MUA" để được hỗ trợ!',
    '📲 Inbox shop để đặt hàng nhé!',
    '🛒 Đặt hàng ngay - Số lượng có hạn!',
    '👉 Click link để xem chi tiết!',
    '🎁 Inbox ngay để nhận ưu đãi đặc biệt!',
  ],
};

// ==================================================
// GUARANTEED VALID HASHTAGS
// ==================================================

const GUARANTEED_HASHTAGS = {
  fashion: [
    '#thờitrang', '#fashion', '#style', '#ootd', '#fashionista',
    '#streetstyle', '#fashionblogger', '#outfitoftheday', '#fashionvietnam',
  ],
  mensFashion: [
    '#thờitrangnam', '#mensfashion', '#menswear', '#menstyle',
    '#fashionmen', '#manstyle', '#gentlemanstyle',
  ],
  womensFashion: [
    '#thờitrangnữ', '#womensfashion', '#womenswear', '#girlstyle',
    '#fashionwoman', '#ladystyle', '#fashiongirl',
  ],
  sale: [
    '#sale', '#giảmgiá', '#khuyếnmãi', '#ưuđãi', '#giárẻ',
    '#flashsale', '#hotsale', '#dealsale', '#khuyenmaikhung',
  ],
  shopping: [
    '#shopping', '#muasắm', '#shoponline', '#shopee',
    '#onlineshopping', '#shoppingonline', '#muahang',
  ],
  lifestyle: [
    '#lifestyle', '#cuộcsống', '#dailylook', '#instadaily',
    '#instagood', '#photooftheday', '#vietnam',
  ],
  quality: [
    '#chấtlượng', '#quality', '#authentic', '#chínhhãng',
    '#hàngthật', '#guaranteedquality', '#hanghieugiare',
  ],
  trending: [
    '#trending', '#viral', '#hot', '#trendingnow',
    '#xuhuong', '#trendingfashion', '#hotnhat',
  ],
};

// ==================================================
// UTILITY FUNCTIONS
// ==================================================

function parseGeminiJSON(text: string): any {
  let cleanText = text.trim();
  
  // Remove markdown code blocks
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\n?/g, "").replace(/\n?```$/g, "");
  }

  // Extract JSON object
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("❌ JSON parse error:", cleanText.substring(0, 300));
    throw new Error("AI trả về JSON không hợp lệ");
  }
}

function generateHashtags(
  product: ProductData,
  customHashtags: string[] = [],
  includeCategory: boolean = true
): string[] {
  const hashtags = new Set<string>();
  
  // Custom hashtags first (priority)
  customHashtags.forEach(tag => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    hashtags.add(cleanTag);
  });
  
  // Category-based hashtags
  if (includeCategory && product.category) {
    const categoryLower = product.category.toLowerCase();
    
    if (categoryLower.includes('nam') || categoryLower.includes('men')) {
      GUARANTEED_HASHTAGS.mensFashion.slice(0, 4).forEach(tag => hashtags.add(tag));
    } else if (categoryLower.includes('nữ') || categoryLower.includes('women')) {
      GUARANTEED_HASHTAGS.womensFashion.slice(0, 4).forEach(tag => hashtags.add(tag));
    } else {
      GUARANTEED_HASHTAGS.fashion.slice(0, 4).forEach(tag => hashtags.add(tag));
    }
  } else {
    GUARANTEED_HASHTAGS.fashion.slice(0, 4).forEach(tag => hashtags.add(tag));
  }
  
  // Brand hashtag (if available)
  if (product.brand_name) {
    const brandTag = product.brand_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "");
    if (brandTag.length > 2) {
      hashtags.add(`#${brandTag}`);
    }
  }
  
  // Shopping & lifestyle hashtags
  GUARANTEED_HASHTAGS.shopping.slice(0, 3).forEach(tag => hashtags.add(tag));
  GUARANTEED_HASHTAGS.lifestyle.slice(0, 2).forEach(tag => hashtags.add(tag));
  
  // Quality hashtags
  GUARANTEED_HASHTAGS.quality.slice(0, 2).forEach(tag => hashtags.add(tag));
  
  // Trending hashtags
  GUARANTEED_HASHTAGS.trending.slice(0, 2).forEach(tag => hashtags.add(tag));
  
  // Limit to 20 hashtags max (Facebook best practice)
  return Array.from(hashtags).slice(0, 20);
}

function estimateEngagement(caption: string, product: ProductData): {
  likelihood: 'low' | 'medium' | 'high';
  tips: string[];
} {
  const tips: string[] = [];
  let score = 0;
  
  // Check caption length (optimal 100-200 chars)
  const captionLength = caption.length;
  if (captionLength >= 100 && captionLength <= 200) {
    score += 3;
  } else if (captionLength < 80) {
    tips.push('Caption hơi ngắn, nên dài hơn 100 ký tự để hấp dẫn hơn');
    score += 1;
  } else if (captionLength > 250) {
    tips.push('Caption hơi dài, cân nhắc rút gọn để dễ đọc hơn');
    score += 2;
  } else {
    score += 2;
  }
  
  // Check emojis (4-10 is ideal)
  const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
  if (emojiCount >= 4 && emojiCount <= 10) {
    score += 3;
  } else if (emojiCount === 0) {
    tips.push('Thêm emoji để bài viết bắt mắt và tăng tương tác');
  } else if (emojiCount > 15) {
    tips.push('Quá nhiều emoji, có thể làm giảm tính chuyên nghiệp');
    score += 1;
  } else {
    score += 2;
  }
  
  // Check CTA
  const hasCTA = /inbox|nhắn tin|comment|đặt hàng|mua ngay|xem ngay|liên hệ|order|shop/i.test(caption);
  if (hasCTA) {
    score += 3;
  } else {
    tips.push('Thêm Call-to-Action rõ ràng để khách hàng biết làm gì tiếp theo');
  }
  
  // Check pricing mention
  if (product.price && caption.includes(product.price.toLocaleString('vi-VN'))) {
    score += 2;
  } else if (product.price) {
    tips.push('Nên đề cập giá sản phẩm trong caption để tăng tính minh bạch');
    score += 1;
  }
  
  // Check discount mention
  if (product.original_price && product.original_price > product.price) {
    const discountPercent = Math.round((1 - product.price / product.original_price) * 100);
    if (caption.includes(`${discountPercent}%`) || caption.includes('giảm') || caption.includes('sale')) {
      score += 3;
    } else {
      tips.push('Nhấn mạnh % giảm giá để tạo sức hút');
      score += 1;
    }
  }
  
  // Check brand mention
  if (product.brand_name && caption.toLowerCase().includes(product.brand_name.toLowerCase())) {
    score += 2;
  }
  
  // Check urgency/FOMO
  const hasUrgency = /hôm nay|ngay|nhanh|số lượng có hạn|sắp hết|chỉ còn|limited/i.test(caption);
  if (hasUrgency) {
    score += 2;
  }
  
  // Determine likelihood based on total score
  const likelihood = score >= 15 ? 'high' : score >= 10 ? 'medium' : 'low';
  
  if (tips.length === 0) {
    tips.push('✅ Bài viết đã được tối ưu tốt!');
  }
  
  return { likelihood, tips };
}

// ==================================================
// PROMPT BUILDER
// ==================================================

function buildPostPrompt(request: PostGenerationRequest): string {
  const { 
    product, 
    postType = 'product_showcase', 
    tone = 'friendly', 
    targetAudience, 
    specialOffer 
  } = request;
  
  const template = POST_TEMPLATES[postType] || POST_TEMPLATES['product_showcase'];
  
  // Calculate discount if available
  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;
  
  const discountAmount = product.original_price && product.original_price > product.price
    ? product.original_price - product.price
    : 0;

  return `Bạn là Social Media Expert chuyên viết content cho Facebook với 10+ năm kinh nghiệm về thị trường Việt Nam.

**🎯 THÔNG TIN SẢN PHẨM:**
📦 Tên: ${product.name}
${product.seo_title ? `📝 SEO Title: ${product.seo_title}` : ''}
${product.seo_description ? `📄 SEO Description: ${product.seo_description}` : ''}
${product.description ? `💬 Mô tả: ${product.description}` : ''}
💰 Giá: **${product.price.toLocaleString('vi-VN')}đ**
${product.original_price ? `~~${product.original_price.toLocaleString('vi-VN')}đ~~ 🔥 **GIẢM ${discountPercent}% - TIẾT KIỆM ${discountAmount.toLocaleString('vi-VN')}đ**` : ''}
${product.brand_name ? `🏷️ Thương hiệu: **${product.brand_name}**` : ''}
📁 Danh mục: ${product.category || 'Thời trang'}
📸 Số ảnh: ${product.images.length}
${product.stock !== undefined ? `📊 Tồn kho: ${product.stock}` : ''}

**📱 YÊU CẦU BÀI ĐĂNG:**
🎭 Loại bài: **${postType}** (${template.keywords.join(', ')})
🎯 Tone: **${tone}**
${targetAudience ? `👥 Đối tượng: ${targetAudience}` : ''}
${specialOffer ? `🎁 Ưu đãi: ${specialOffer}` : ''}

**📐 CẤU TRÚC BÀI ĐĂNG:**
${template.structure}
Emoji gợi ý: ${template.emojis.join(' ')}

**⚡ QUY TẮC VÀNG (BẮT BUỘC):**

1. **HOOK - Câu mở đầu (60-80 ký tự):**
   - Phải hấp dẫn, tạo tò mò, khiến người đọc muốn xem tiếp
   - Bắt đầu với emoji phù hợp
   - Đặt câu hỏi HOẶC tạo FOMO HOẶC đưa ra lời hứa hấp dẫn
   - VD: "✨ Chị em ơi! Set vest này đang gây sốt đây 😍"

2. **BODY - Nội dung chính (100-150 ký tự):**
   - 3-5 câu ngắn, súc tích
   - Tập trung BENEFIT (lợi ích khách hàng), KHÔNG chỉ feature
   - Kể câu chuyện/tạo cảm xúc, KHÔNG liệt kê khô khan
   - Sử dụng emoji để ngắt đoạn, dễ đọc
   ${discountPercent > 0 ? `- BẮT BUỘC nhắc đến GIẢM ${discountPercent}% và TIẾT KIỆM ${discountAmount.toLocaleString('vi-VN')}đ` : ''}
   ${product.brand_name ? `- Nhắc đến thương hiệu "${product.brand_name}" 1-2 lần` : ''}

3. **PRICING - Giá cả:**
   - Format chuẩn: ${product.price.toLocaleString('vi-VN')}đ (có dấu chấm ngăn cách)
   ${discountPercent > 0 ? `- Nhấn mạnh: "Giá sale chỉ ${product.price.toLocaleString('vi-VN')}đ (giảm ${discountPercent}%)"` : ''}
   - Đặt giá ở cuối body, trước CTA

4. **CTA - Lời kêu gọi hành động:**
   - Chọn 1 trong các CTA sau (hoặc tạo tương tự):
   ${ENGAGEMENT_BEST_PRACTICES.call_to_action.map(cta => `   ${cta}`).join('\n')}
   - Đặt CTA ở cuối caption
   - Phải có emoji liên quan

5. **EMOJI (4-10 emoji):**
   - Dùng emoji ${template.emojis.join(' ')} và emoji phù hợp khác
   - Đặt ở đầu hook, đầu sections, highlight điểm quan trọng
   - KHÔNG mỗi dòng 1 emoji

6. **TONE & LANGUAGE:**
   ${tone === 'professional' ? '- Chuyên nghiệp nhưng thân thiện, đáng tin cậy' : ''}
   ${tone === 'friendly' ? '- Thân thiện như trò chuyện với bạn bè, dùng "chị em", "các bạn"' : ''}
   ${tone === 'enthusiastic' ? '- Nhiệt tình, năng động, dùng nhiều dấu chấm than!' : ''}
   ${tone === 'luxury' ? '- Sang trọng, tinh tế, dùng từ ngữ đẳng cấp' : ''}
   ${tone === 'casual' ? '- Thoải mái, tự nhiên, có thể dùng teen code nhẹ' : ''}
   ${tone === 'urgent' ? '- Khẩn cấp, tạo FOMO: "Nhanh tay", "Chỉ hôm nay", "Sắp hết"' : ''}
   - Dùng tiếng Việt tự nhiên, KHÔNG dịch máy
   - Tránh từ sáo: "chất lượng tốt", "giá rẻ", "đáng đồng tiền"
   - Dùng từ cảm xúc: "yêu thích", "mê mẩn", "cực xinh", "sang chảnh"

7. **SEO INTEGRATION:**
   ${product.seo_title ? `- Tích hợp từ khóa: "${product.seo_title}"` : ''}
   ${product.seo_description ? `- Tham khảo value: "${product.seo_description}"` : ''}
   - Caption và SEO phải nhất quán, bổ trợ nhau

8. **POST TYPE SPECIFIC:**
${postType === 'product_update' ? `
   - Nhấn mạnh "CẬP NHẬT MỚI", "HOÀN THIỆN HƠN", "BỔ SUNG"
   - Giải thích điểm gì đã thay đổi/cải thiện
   - Tạo cảm giác sản phẩm đang được chăm chút kỹ lưỡng
` : ''}
${postType === 'new_product' ? `
   - Nhấn mạnh "MỚI VỀ ✨", "VỪA RA MẮT 🎉", "HOT HOT 🔥"
   - Tạo độc quyền: "Chỉ có tại shop", "Limited edition"
   - Khuyến khích đặt hàng sớm: "Về số lượng có hạn"
` : ''}
${postType === 'sale' || postType === 'flash_sale' ? `
   - URGENCY tối đa: "CHỈ HÔM NAY ⚡", "24H CUỐI 🔥", "NHANH TAY ⏰"
   - Nhấn mạnh discount: "GIẢM ${discountPercent}% 💥"
   - FOMO: "Hết size là hết", "Không còn lần sau"
   - Countdown mental: "Chỉ còn X giờ"
` : ''}
${postType === 'product_showcase' ? `
   - Kể câu chuyện: "Phong cách của người tự tin"
   - Lifestyle benefit: "Tự tin đi làm, gây ấn tượng"
   - Social proof nếu có: "Đã có XXX khách hàng yêu thích"
` : ''}

9. **CHI TIẾT QUAN TRỌNG:**
   - Caption PHẢI tự nhiên như người viết, KHÔNG giống AI
   - Độ dài tổng: 400-800 ký tự, chia 2-4 đoạn ngắn, có xuống dòng rõ ràng để dễ đọc
   - PHẢI có ít nhất 4 emoji phù hợp ngữ cảnh
   - PHẢI có CTA rõ ràng
   - PHẢI format giá đúng chuẩn VN
   - Engagement score: 75-95 (thực tế, không phóng đại)

10. **A/B TESTING VARIANTS:**
   - Tạo 2 phiên bản khác nhau về:
     * Hook: Tò mò vs Lợi ích vs Social proof
     * Tone: Formal vs Casual
     * CTA: Khác nhau
   - Mỗi variant phải có engagement_score

**📋 TRẢ VỀ JSON (KHÔNG CÓ TEXT KHÁC):**

{
  "posts": [
    {
      "caption": "Caption hoàn chỉnh 400-800 ký tự, có chia đoạn, storytelling cuốn hút",
      "hook": "Câu mở đầu 60-80 ký tự",
      "body": "Nội dung chính 100-150 ký tự",
      "call_to_action": "CTA với emoji",
      "engagement_score": 85,
      "best_time_to_post": ["9:00-11:00", "19:00-21:00"]
    }
  ],
  "alternatives": [
    {
      "caption": "Phiên bản thay thế",
      "hook": "Hook khác",
      "body": "Body khác",
      "call_to_action": "CTA khác",
      "engagement_score": 82,
      "best_time_to_post": ["12:00-13:00", "20:00-22:00"]
    }
  ],
  "suggested_images": [
    "Ảnh 1: Sản phẩm chính trên nền đẹp",
    "Ảnh 2: Chi tiết chất liệu/đường may",
    "Ảnh 3: Người mặc/lifestyle"
  ]
}

**🚀 LƯU Ý CUỐI:**
- KHÔNG copy paste từ description
- KHÔNG dùng "sản phẩm này", "chúng tôi"
- DÙng ngôn ngữ cảm xúc, tạo kết nối
- Highlight unique selling points
- Caption phải VIRAL-READY, not boring!
`;
}

// ==================================================
// MAIN FUNCTION - Generate Facebook Post
// ==================================================

export async function generateFacebookPost(
  request: PostGenerationRequest
): Promise<FacebookPostResponse> {
  const startTime = Date.now();
  
  try {
    console.log(`🤖 Generating ${request.postType || 'product_showcase'} post for: ${request.product.name}`);

    const prompt = buildPostPrompt(request);

    // Use OpenRouter as primary
    let parsed: any;
    try {
      const { content: aiContent } = await callOpenRouterChat({
        model: "openai/gpt-4o-mini", // Reliable and fast
        messages: [
          {
            role: "system",
            content: "Bạn là chuyên gia Social Media cho thị trường Việt Nam. Luôn trả về DUY NHẤT JSON đúng schema, không text ngoài JSON. Viết caption tự nhiên, hấp dẫn như người thật.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        maxTokens: 3000,
        temperature: 0.8, // Tăng creativity
      });

      parsed = parseGeminiJSON(aiContent || "");
      console.log(`✅ OpenRouter generated ${parsed.posts?.length || 0} posts`);
    } catch (err) {
      console.error("⚠️ OpenRouter failed, trying Gemini fallback:", err);

      if (!geminiApiKey) {
        throw new Error("OpenRouter error và không có GEMINI_API_KEY để fallback");
      }

      // Gemini fallback
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 3000,
        },
      });

      const result = await model.generateContent([prompt]);
      const text = result.response.text();
      parsed = parseGeminiJSON(text);

      console.log(`✅ Gemini fallback generated ${parsed.posts?.length || 0} posts`);
    }

    // Process main posts
    const generatedPosts: GeneratedPost[] = [];
    
    for (const post of parsed.posts || []) {
      const hashtags = generateHashtags(
        request.product,
        request.customHashtags,
        request.includeHashtags !== false
      );
      
      const captionWithHashtags = request.includeHashtags !== false
        ? `${post.caption}\n\n${hashtags.join(' ')}`
        : post.caption;
      
      const engagement = estimateEngagement(post.caption, request.product);
      
      const emojiCount = (post.caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
      
      generatedPosts.push({
        caption: captionWithHashtags,
        captionWithoutHashtags: post.caption,
        hashtags,
        suggestedImages: parsed.suggested_images || request.product.images,
        estimatedEngagement: engagement,
        metadata: {
          wordCount: post.caption.split(/\s+/).length,
          characterCount: post.caption.length,
          hashtagCount: hashtags.length,
          emojiCount,
          readingTime: `${Math.ceil(post.caption.split(/\s+/).length / 200)} phút`,
          generatedAt: new Date().toISOString(),
          aiModel: "openrouter-gpt4o-mini-or-gemini",
        },
      });
    }

    // Process alternatives
    const alternatives: GeneratedPost[] = [];
    
    for (const alt of parsed.alternatives || []) {
      const hashtags = generateHashtags(
        request.product,
        request.customHashtags,
        request.includeHashtags !== false
      );
      
      const captionWithHashtags = request.includeHashtags !== false
        ? `${alt.caption}\n\n${hashtags.join(' ')}`
        : alt.caption;
      
      const engagement = estimateEngagement(alt.caption, request.product);
      
      const emojiCount = (alt.caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
      
      alternatives.push({
        caption: captionWithHashtags,
        captionWithoutHashtags: alt.caption,
        hashtags,
        suggestedImages: parsed.suggested_images || request.product.images,
        estimatedEngagement: engagement,
        metadata: {
          wordCount: alt.caption.split(/\s+/).length,
          characterCount: alt.caption.length,
          hashtagCount: hashtags.length,
          emojiCount,
          readingTime: `${Math.ceil(alt.caption.split(/\s+/).length / 200)} phút`,
          generatedAt: new Date().toISOString(),
          aiModel: "openrouter-gpt4o-mini-or-gemini",
        },
      });
    }

    const processingTime = Date.now() - startTime;

    console.log(`✅ Generated ${generatedPosts.length} posts + ${alternatives.length} alternatives in ${processingTime}ms`);
    
    return {
      success: true,
      posts: generatedPosts,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      processingTime,
    };

  } catch (error) {
    console.error("❌ Fatal error in generateFacebookPost:", error);
    return {
      success: false,
      posts: [],
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================================================
// HELPER FUNCTIONS
// ==================================================

export function generatePostPreview(post: GeneratedPost): string {
  const preview = post.captionWithoutHashtags.substring(0, 80);
  return preview + (post.captionWithoutHashtags.length > 80 ? '...' : '');
}

export function getBestPostingTimes(): string[] {
  return [
    '9:00-11:00 (Sáng - Giờ làm việc)',
    '12:00-13:00 (Trưa - Giờ nghỉ)',
    '18:00-21:00 (Tối - Sau giờ làm)',
    '21:00-23:00 (Đêm - Thư giãn)',
  ];
}

// ==================================================
// TEST FUNCTION
// ==================================================

export const testGeneratePost = async (productId: string) => {
  const mockProduct: ProductData = {
    id: productId,
    name: 'Set Áo Vest Ghì-lê Đáng Peplum Tay Cộc & Quần Ống Rộng Xếp Ly Màu Xám Trơn',
    slug: 'set-ao-vest-ghi-le-dang-peplum-tay-coc-quan-ong-rong-xep-ly-mau-xam-tro',
    description: 'Set vest cao cấp, thiết kế peplum tôn dáng, quần xếp ly sang trọng',
    price: 850000,
    original_price: 1200000,
    brand_name: 'BEWO Fashion',
    seo_title: 'Set Vest Nữ Công Sở Cao Cấp - BEWO Fashion',
    seo_description: 'Set vest nữ thiết kế peplum hiện đại, quần ống rộng xếp ly thanh lịch, phù hợp đi làm và dự tiệc',
    category: 'Thời trang nữ',
    images: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
    ],
    stock: 25,
  };

  return await generateFacebookPost({
    product: mockProduct,
    postType: 'product_update',
    tone: 'friendly',
    includeHashtags: true,
    customHashtags: ['BEWOFashion', 'veststyle'],
  });
};
