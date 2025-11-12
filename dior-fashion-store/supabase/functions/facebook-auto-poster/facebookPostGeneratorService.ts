// ==================================================
// services/facebookPostGeneratorService.ts
// AI-powered Facebook Post Generator with validation
// UPGRADED: High quality posts with engagement optimization
// ==================================================

import { GoogleGenerativeAI } from "npm:@google/generative-ai";

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

// supabase/functions/_shared/facebookPostGeneratorService.ts

// Find this section (around line 90-140) and REPLACE with:

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
    optimal_length: [80, 150], // Characters
    max_length: 2200,
    first_sentence_max: 60, // Show in preview
  },
  hashtags: {
    recommended_count: [5, 10],
    max_count: 30,
    mix: 'Use 2-3 broad + 3-5 niche + 2-3 branded',
  },
  emojis: {
    recommended_count: [3, 8],
    placement: 'Start of sections, not every line',
  },
  call_to_action: [
    'Nhắn tin ngay để được tư vấn!',
    'Comment "MUA" để được hỗ trợ!',
    'Inbox shop để đặt hàng nhé!',
    'Đặt hàng ngay - Số lượng có hạn!',
    'Click link để xem chi tiết!',
  ],
};

// ==================================================
// GUARANTEED VALID HASHTAGS
// ==================================================

const GUARANTEED_HASHTAGS = {
  fashion: [
    '#thờitrang', '#fashion', '#style', '#ootd', '#fashionista',
    '#streetstyle', '#fashionblogger', '#outfitoftheday',
  ],
  mensFashion: [
    '#thờitrangnam', '#mensfashion', '#menswear', '#menstyle',
    '#fashionmen', '#manstyle',
  ],
  womensFashion: [
    '#thờitrangnữ', '#womensfashion', '#womenswear', '#girlstyle',
    '#fashionwoman', '#ladystyle',
  ],
  sale: [
    '#sale', '#giảmgiá', '#khuyếnmãi', '#ưuđãi', '#giárẻ',
    '#flashsale', '#hotsale', '#dealsale',
  ],
  shopping: [
    '#shopping', '#muasắm', '#shoponline', '#shopee',
    '#onlineshopping', '#shoppingonline',
  ],
  lifestyle: [
    '#lifestyle', '#cuộcsống', '#dailylook', '#instadaily',
    '#instagood', '#photooftheday',
  ],
  quality: [
    '#chấtlượng', '#quality', '#authentic', '#chínhhãng',
    '#hàngthật', '#guaranteedquality',
  ],
};

// ==================================================
// UTILITY FUNCTIONS
// ==================================================

function parseGeminiJSON(text: string): any {
  let cleanText = text.trim();
  
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\n?/g, "").replace(/\n?```$/g, "");
  }

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
  
  // Custom hashtags first
  customHashtags.forEach(tag => {
    hashtags.add(tag.startsWith('#') ? tag : `#${tag}`);
  });
  
  // Category-based hashtags
  if (includeCategory && product.category) {
    const categoryLower = product.category.toLowerCase();
    
    if (categoryLower.includes('nam') || categoryLower.includes('men')) {
      GUARANTEED_HASHTAGS.mensFashion.slice(0, 3).forEach(tag => hashtags.add(tag));
    } else if (categoryLower.includes('nữ') || categoryLower.includes('women')) {
      GUARANTEED_HASHTAGS.womensFashion.slice(0, 3).forEach(tag => hashtags.add(tag));
    } else {
      GUARANTEED_HASHTAGS.fashion.slice(0, 3).forEach(tag => hashtags.add(tag));
    }
  } else {
    GUARANTEED_HASHTAGS.fashion.slice(0, 3).forEach(tag => hashtags.add(tag));
  }
  
  // Brand hashtag
  if (product.brand_name) {
    const brandTag = product.brand_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "");
    hashtags.add(`#${brandTag}`);
  }
  
  // Shopping hashtags
  GUARANTEED_HASHTAGS.shopping.slice(0, 2).forEach(tag => hashtags.add(tag));
  
  // Quality hashtags
  GUARANTEED_HASHTAGS.quality.slice(0, 2).forEach(tag => hashtags.add(tag));
  
  return Array.from(hashtags).slice(0, 15); // Max 15 hashtags
}

function estimateEngagement(caption: string, product: ProductData): {
  likelihood: 'low' | 'medium' | 'high';
  tips: string[];
} {
  const tips: string[] = [];
  let score = 0;
  
  // Check caption length
  const captionLength = caption.length;
  if (captionLength >= 80 && captionLength <= 150) {
    score += 2;
  } else if (captionLength < 60) {
    tips.push('Caption hơi ngắn, nên dài hơn 80 ký tự');
  } else if (captionLength > 200) {
    tips.push('Caption hơi dài, cân nhắc rút gọn');
  }
  
  // Check emojis
  const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
  if (emojiCount >= 3 && emojiCount <= 8) {
    score += 2;
  } else if (emojiCount === 0) {
    tips.push('Thêm emoji để tăng tương tác');
  }
  
  // Check CTA
  const hasCTA = /inbox|nhắn tin|comment|đặt hàng|mua ngay|xem ngay/i.test(caption);
  if (hasCTA) {
    score += 2;
  } else {
    tips.push('Thêm Call-to-Action rõ ràng');
  }
  
  // Check pricing
  if (product.price) {
    score += 1;
  }
  
  // Check discount
  if (product.original_price && product.original_price > product.price) {
    score += 2;
  }
  
  const likelihood = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';
  
  if (tips.length === 0) {
    tips.push('Bài viết đã được tối ưu tốt!');
  }
  
  return { likelihood, tips };
}

// ==================================================
// PROMPT BUILDER
// ==================================================

function buildPostPrompt(request: PostGenerationRequest): string {
  const { product, postType = 'product_showcase', tone = 'friendly', targetAudience, specialOffer } = request;
  
  const template = POST_TEMPLATES[postType] || POST_TEMPLATES['product_showcase'];
  
  const jsonStructure = `
{
  "posts": [
    {
      "caption": "Caption bài đăng hoàn chỉnh (80-150 ký tự cho preview tốt)",
      "hook": "Câu mở đầu hấp dẫn (1-2 câu)",
      "body": "Nội dung chính (3-5 câu)",
      "call_to_action": "Lời kêu gọi hành động",
      "engagement_score": 85,
      "best_time_to_post": ["9:00-11:00", "19:00-21:00"]
    }
  ],
  "alternatives": [
    {
      "caption": "Phiên bản thay thế cho A/B testing",
      "hook": "Hook khác biệt",
      "body": "Body khác biệt",
      "call_to_action": "CTA khác biệt",
      "engagement_score": 80,
      "best_time_to_post": ["9:00-11:00", "19:00-21:00"]
    }
  ],
  "suggested_images": [
    "Mô tả ảnh 1 (ví dụ: ảnh chính sản phẩm trên nền trắng)",
    "Mô tả ảnh 2 (ví dụ: ảnh chi tiết chất liệu)",
    "Mô tả ảnh 3 (ví dụ: ảnh lifestyle/người mặc)"
  ]
}
`;

  return `Bạn là Social Media Expert chuyên viết content cho Facebook với kinh nghiệm về thị trường Việt Nam và tâm lý khách hàng.

**THÔNG TIN SẢN PHẨM:**
🏷️ Tên: ${product.name}
${product.seo_title ? `📝 SEO Title: ${product.seo_title}` : ''}
${product.seo_description ? `📄 SEO Description: ${product.seo_description}` : ''}
${product.description ? `💬 Mô tả: ${product.description}` : ''}
💰 Giá: ${product.price.toLocaleString('vi-VN')}đ
${product.original_price ? `🔥 Giá gốc: ${product.original_price.toLocaleString('vi-VN')}đ` : ''}
${product.brand_name ? `🏷️ Thương hiệu: ${product.brand_name}` : ''}
📦 Danh mục: ${product.category || 'N/A'}
📸 Số ảnh: ${product.images.length}
${product.stock !== undefined ? `📊 Tồn kho: ${product.stock}` : ''}

**YÊU CẦU BÀI ĐĂNG:**
📱 Loại bài: ${postType}
🎭 Tone: ${tone}
${targetAudience ? `🎯 Đối tượng: ${targetAudience}` : ''}
${specialOffer ? `🎁 Ưu đãi đặc biệt: ${specialOffer}` : ''}

**CẤU TRÚC BÀI ĐĂNG:**
${template.structure}

**QUY TẮC VÀNG - BẮT BUỘC TUÂN THỦ:**

1. **CẤU TRÚC CAPTION:**
   - Câu đầu tiên (hook): Ngắn gọn, hấp dẫn, tạo tò mò (max 60 ký tự)
   - Nội dung chính: 3-5 câu, tập trung vào lợi ích khách hàng
   - Call-to-Action: Rõ ràng, dễ thực hiện
   - Tổng độ dài: 80-150 ký tự cho phần preview tốt nhất

2. **SỬ DỤNG EMOJI (${template.emojis.join(' ')}):**
   - Dùng 3-8 emoji phù hợp với ngữ cảnh
   - Đặt ở đầu sections, KHÔNG mỗi dòng
   - Tránh lạm dụng emoji giống nhau

3. **NGÔN NGỮ & TONE:**
   ${tone === 'professional' ? '- Chuyên nghiệp, lịch sự, đáng tin cậy' : ''}
   ${tone === 'friendly' ? '- Thân thiện, gần gũi, dễ tiếp cận' : ''}
   ${tone === 'enthusiastic' ? '- Nhiệt tình, năng động, tràn đầy năng lượng' : ''}
   ${tone === 'luxury' ? '- Sang trọng, tinh tế, đẳng cấp' : ''}
   ${tone === 'casual' ? '- Thoải mái, tự nhiên, như trò chuyện bạn bè' : ''}
   ${tone === 'urgent' ? '- Khẩn cấp, tạo FOMO, kêu gọi hành động ngay' : ''}
   - Dùng tiếng Việt tự nhiên, KHÔNG dịch thuật máy móc
   - Tránh từ ngữ sáo rỗng: "chất lượng tốt", "giá rẻ"
   - Tập trung vào BENEFIT, không chỉ FEATURE

4. **PRICING & OFFERS:**
   ${product.original_price && product.original_price > product.price ? `
   - HIGHLIGHT discount: Giảm ${Math.round((1 - product.price / product.original_price) * 100)}%
   - Nhấn mạnh "tiết kiệm được ${(product.original_price - product.price).toLocaleString('vi-VN')}đ"
   ` : ''}
   ${product.brand_name ? `- Nhắc đến thương hiệu "${product.brand_name}" để tăng độ tin cậy` : ''}
   - Format giá: ${product.price.toLocaleString('vi-VN')}đ (có dấu chấm phân cách)

5. **CALL-TO-ACTION (CHỌN 1):**
   ${ENGAGEMENT_BEST_PRACTICES.call_to_action.map(cta => `- "${cta}"`).join('\n   ')}
   - Đặt CTA ở cuối caption
   - Có thể thêm link đến sản phẩm

6. **SEO INTEGRATION:**
   ${product.seo_title ? `- Tích hợp từ khóa từ SEO Title: "${product.seo_title}"` : ''}
   ${product.seo_description ? `- Tham khảo SEO Description để hiểu value proposition: "${product.seo_description}"` : ''}
   - Đảm bảo caption và SEO content nhất quán

7. **A/B TESTING VARIANTS:**
   - Tạo 2-3 phiên bản khác nhau về:
     + Hook khác biệt (tò mò vs lợi ích vs social proof)
     + Tone khác biệt (formal vs casual)
     + CTA khác biệt
   - Mỗi variant phải có engagement_score dự đoán (0-100)

8. **IMAGE SUGGESTIONS:**
   - Dựa vào số lượng ảnh có sẵn (${product.images.length} ảnh)
   - Đề xuất thứ tự hiển thị tối ưu
   - Gợi ý loại ảnh nào nên đặt ở vị trí nào

9. **BEST PRACTICES:**
   - KHÔNG copy paste từ product description
   - KHÔNG dùng các từ như: "sản phẩm này", "chúng tôi"
   - DÙng ngôn ngữ cảm xúc, kể câu chuyện
   - Tạo kết nối với khách hàng
   - Highlight unique selling points

10. **POST TYPE SPECIFIC:**
${postType === 'new_product' ? `
    - Nhấn mạnh "MỚI VỀ", "VỪA RA MẮT"
    - Tạo cảm giác độc quyền, khan hiếm
    - Khuyến khích đặt hàng sớm
` : ''}
${postType === 'sale' || postType === 'flash_sale' ? `
    - Tạo URGENCY: "Chỉ hôm nay", "Số lượng có hạn"
    - Hiển thị rõ discount percentage
    - Countdown timer mental image
` : ''}
${postType === 'product_showcase' ? `
    - Kể câu chuyện sản phẩm
    - Tập trung vào lifestyle benefit
    - Social proof nếu có
` : ''}

**CRITICAL REMINDERS:**
- Caption PHẢI tự nhiên như người viết, KHÔNG như AI
- PHẢI có ít nhất 3 emoji phù hợp
- PHẢI có CTA rõ ràng
- PHẢI format giá đúng chuẩn Việt Nam
- Engagement score PHẢI thực tế (70-95), KHÔNG phóng đại

Trả về JSON DẠNG SAU, KHÔNG có văn bản khác:

${jsonStructure}
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
    console.log('🤖 Generating Facebook post with Gemini AI...');
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7, // Creative but controlled
        maxOutputTokens: 8000,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildPostPrompt(request);
    
    console.log('📝 Prompt preview (first 500 chars):', prompt.substring(0, 500));
    
    const result = await model.generateContent([prompt]);
    const text = result.response.text();
    const parsed: any = parseGeminiJSON(text);

    console.log(`✅ Gemini generated ${parsed.posts?.length || 0} posts`);

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
          aiModel: "gemini-2.0-flash-exp",
        },
      });
    }

    // Process alternatives for A/B testing
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
          aiModel: "gemini-2.0-flash-exp",
        },
      });
    }

    const processingTime = Date.now() - startTime;

    console.log(`✅ Complete! Generated ${generatedPosts.length} posts with ${alternatives.length} alternatives in ${processingTime}ms`);
    
    return {
      success: true,
      posts: generatedPosts,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      processingTime,
    };

  } catch (error) {
    console.error("❌ Fatal error:", error);
    return {
      success: false,
      posts: [],
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================================================
// HELPER: Generate Post Preview
// ==================================================

export function generatePostPreview(post: GeneratedPost): string {
  const preview = post.captionWithoutHashtags.substring(0, 60);
  return preview + (post.captionWithoutHashtags.length > 60 ? '...' : '');
}

// ==================================================
// HELPER: Get Best Posting Time
// ==================================================

export function getBestPostingTimes(): string[] {
  return [
    '9:00-11:00 (Sáng - Giờ làm việc)',
    '12:00-13:00 (Trưa - Giờ nghỉ)',
    '18:00-21:00 (Tối - Sau giờ làm)',
    '21:00-23:00 (Đêm - Thư giãn)',
  ];
}

// ==================================================
// Export for testing
// ==================================================

export const testGeneratePost = async (productId: string) => {
  // Mock product data for testing
  const mockProduct: ProductData = {
    id: productId,
    name: 'Áo Sơ Mi Nam Công Sở',
    slug: 'ao-so-mi-nam-cong-so',
    description: 'Áo sơ mi nam cao cấp, chất liệu cotton thoáng mát',
    price: 350000,
    original_price: 450000,
    brand_name: 'BEWO Fashion',
    seo_title: 'Áo Sơ Mi Nam Công Sở Cao Cấp - BEWO Fashion',
    seo_description: 'Áo sơ mi nam công sở chất liệu cotton cao cấp, thiết kế lịch sự, phù hợp đi làm và dự tiệc',
    category: 'Thời trang nam',
    images: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    stock: 50,
  };

  return await generateFacebookPost({
    product: mockProduct,
    postType: 'product_showcase',
    tone: 'professional',
    includeHashtags: true,
    customHashtags: ['BEWOFashion', 'thờitrangcôngở'],
  });
};