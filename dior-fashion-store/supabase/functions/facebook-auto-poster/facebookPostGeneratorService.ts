// ==================================================
// services/facebookPostGeneratorService.ts
// AI-powered Facebook Post Generator with validation
// Custom brand voice: BeeWoods / "em Bee" style
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
  images: string[];
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
  | "new_product"
  | "product_update"
  | "product_showcase"
  | "sale"
  | "flash_sale"
  | "restock"
  | "showcase"
  | "testimonial"
  | "educational"
  | "story";

export type PostTone =
  | "professional"
  | "friendly"
  | "enthusiastic"
  | "luxury"
  | "casual"
  | "urgent";

export interface GeneratedPost {
  caption: string;
  captionWithoutHashtags: string;
  hashtags: string[];
  suggestedImages: string[];
  estimatedEngagement: {
    likelihood: "low" | "medium" | "high";
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
  alternatives?: GeneratedPost[];
  processingTime: number;
  error?: string;
}

// ==================================================
// TEMPLATES & BEST PRACTICES
// ==================================================

const POST_TEMPLATES: Record<
  PostType,
  {
    structure: string;
    emojis: string[];
    keywords: string[];
  }
> = {
  new_product: {
    structure: "Hook mạnh + giới thiệu hàng mới + điểm nổi bật + giá + CTA",
    emojis: ["🎉", "✨", "🆕", "💝", "🎁"],
    keywords: ["mới về", "ra mắt", "giới thiệu", "khám phá"],
  },
  product_update: {
    structure: "Thông báo cập nhật + điểm cải thiện + lợi ích + CTA",
    emojis: ["✨", "🔄", "📢", "💫", "🎯"],
    keywords: ["cập nhật", "nâng cấp", "mới nhất", "hoàn thiện"],
  },
  product_showcase: {
    structure: "Hook + mô tả cảm xúc + features chính + lifestyle + CTA",
    emojis: ["✨", "💎", "🌟", "👗"],
    keywords: ["phong cách", "xinh", "sang", "hot trend"],
  },
  sale: {
    structure: "Thông báo sale + lợi ích + thời gian/giới hạn + CTA",
    emojis: ["🔥", "💥", "⚡", "💰"],
    keywords: ["giảm giá", "sale", "ưu đãi"],
  },
  flash_sale: {
    structure: "Cực gấp + % giảm + giới hạn thời gian + FOMO + CTA",
    emojis: ["⚡", "🔥", "⏰"],
    keywords: ["flash sale", "chớp nhoáng", "nhanh tay"],
  },
  restock: {
    structure: "Về hàng lại + hot item + số lượng có hạn + CTA",
    emojis: ["📦", "✨", "⏰"],
    keywords: ["về hàng", "nhập lại"],
  },
  showcase: {
    structure: "Giới thiệu outfit + điểm nhấn sản phẩm + CTA",
    emojis: ["✨", "👗"],
    keywords: ["outfit", "phong cách"],
  },
  testimonial: {
    structure: "Review khách + cảm nhận + khẳng định chất lượng + CTA",
    emojis: ["⭐", "😍"],
    keywords: ["feedback", "review"],
  },
  educational: {
    structure: "Vấn đề + tips phối đồ / chọn size + CTA",
    emojis: ["📚", "💡"],
    keywords: ["tips", "bí quyết"],
  },
  story: {
    structure: "Câu chuyện thương hiệu/sản phẩm + cảm xúc + CTA",
    emojis: ["📖", "❤️"],
    keywords: ["story", "câu chuyện"],
  },
};

const ENGAGEMENT_BEST_PRACTICES = {
  call_to_action: [
    '💌 Ib em Bee ngay để được tư vấn size chuẩn nha!',
    '💬 Comment "TƯ VẤN" để em Bee gửi hình và soi size cho mình nè!',
    "📲 Inbox em Bee để chốt đơn liền tay trước khi hết size!",
  ],
};

// ==================================================
// HASHTAGS
// ==================================================

const GUARANTEED_HASHTAGS = {
  fashion: ["#BeeWoods", "#ThoiTrangNu", "#OutfitDep", "#DepXiu"],
};

// ==================================================
// UTILS
// ==================================================

function parseJSONFromModel(text: string): any {
  let clean = text.trim();

  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }

  const match = clean.match(/\{[\s\S]*\}$/);
  if (match) clean = match[0];

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("❌ JSON parse error snippet:", clean.slice(0, 300));
    throw new Error("AI trả về JSON không hợp lệ");
  }
}

function generateHashtags(
  product: ProductData,
  customHashtags: string[] = [],
  include: boolean = true
): string[] {
  if (!include) return [];
  const set = new Set<string>();

  customHashtags.forEach((tag) => {
    const t = tag.startsWith("#") ? tag : `#${tag}`;
    set.add(t);
  });

  GUARANTEED_HASHTAGS.fashion.forEach((t) => set.add(t));

  if (product.category) {
    const lower = product.category.toLowerCase();
    if (lower.includes("áo khoác") || lower.includes("coat")) {
      set.add("#AoKhoac");
    }
    if (lower.includes("đầm") || lower.includes("váy")) {
      set.add("#DamVay");
    }
  }

  if (product.brand_name) {
    const brandTag = product.brand_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "");
    if (brandTag.length > 1) set.add(`#${brandTag}`);
  }

  return Array.from(set).slice(0, 15);
}

// ==================================================
// PROMPT: BEE VOICE
// ==================================================

function buildPostPrompt(req: PostGenerationRequest): string {
  const { product, postType = "product_showcase" } = req;

  const template =
    POST_TEMPLATES[postType] || POST_TEMPLATES["product_showcase"];

  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : 0;

  const discountText =
    discountPercent > 0
      ? `Đang sale còn ${product.price.toLocaleString(
          "vi-VN"
        )}đ (giảm khoảng ${discountPercent}%, nói đúng thông tin).`
      : "";

  return `
Bạn là copywriter in-house của thương hiệu thời trang Bee (BeeWoods Fashion), chuyên bán đồ nữ tại Việt Nam.

GIỌNG ĐIỆU:
- Viết tiếng Việt tự nhiên, như người thật.
- Em Bee xưng "em Bee" với khách, gọi khách là "các chị", "các nàng", "các cô gái của Bee".
- Phong cách giống các caption mẫu: thân mật, nhiều năng lượng, dễ thương:
  + "🔥 SALE SỐC! Hàng về đủ size rồiii!"
  + "Cô bé Hàn Quốc", "em bé mùa Đông", "đẹp xỉuuu", "bay vèo vèo", "auto xinh"
- Có FOMO nhưng không nói dối. Không spam emoji, mỗi caption 3-6 emoji.

DỮ LIỆU SẢN PHẨM:
- Tên: ${product.name}
- Mô tả: ${product.description || ""}
- Danh mục: ${product.category || "Thời trang nữ"}
- Giá bán: ${product.price.toLocaleString("vi-VN")}đ
${
  product.original_price && discountPercent > 0
    ? `- Giá gốc: ${product.original_price.toLocaleString(
        "vi-VN"
      )}đ (${discountPercent}% off).`
    : ""
}
${discountText}

YÊU CẦU CAPTION (MỖI PHIÊN BẢN) & XUỐNG DÒNG THÔNG MINH:

1. Mở đầu (HOOK):
   - 1 dòng riêng, nổi bật, có thể dùng từ khoá như "SALE SỐC", "em bé mùa Đông", "đẹp xỉuuu".
   - Có 1-2 emoji ở đầu.
   - Ví dụ:
     "🔥 SALE SỐC! Em bé mùa Đông đủ size rồiii!"

2. Thân bài:
   - Viết thành 1-2 đoạn, cách nhau bằng 1 dòng trống.
   - Trong mỗi đoạn:
     - Câu ngắn, dễ đọc.
     - Nhấn cảm giác mặc: mềm, nhẹ, ấm, tôn dáng, chuẩn Hàn, dễ phối,...
     - Gợi ngữ cảnh: đi làm, đi chơi, đi cafe, hẹn hò,...
     - Dùng style em Bee: gần gũi, tự nhiên, không liệt kê khô cứng.

3. Giá & ưu đãi:
   - Nếu có giảm giá từ dữ liệu:
     - Đặt ở riêng 1 câu hoặc cùng đoạn thân, nhưng rõ ràng, dễ nhìn.
   - Không bịa phần trăm hoặc giá.

4. CTA:
   - Đặt ở dòng cuối cùng, tách riêng với 1 dòng trống phía trên.
   - Ví dụ:
     "💌 Ib em Bee ngay để được tư vấn size chuẩn nha!"

5. Xuống dòng:
   - Không viết tất cả trên một dòng dài.
   - Không xuống dòng từng câu một choáng mắt.
   - Pattern gợi ý:
     [HOOK]
     dòng trống
     [2-3 câu thân bài cùng đoạn]
     dòng trống
     [1 câu chốt + CTA]

FORMAT TRẢ VỀ:
- Chỉ trả về JSON:
{
  "posts": [
    {
      "caption": "string"
    },
    ...
  ],
  "alternatives": [
    {
      "caption": "string"
    },
    ...
  ]
}
`;
}

// ==================================================
// MAIN FUNCTION
// ==================================================

export async function generateFacebookPost(
  request: PostGenerationRequest
): Promise<FacebookPostResponse> {
  const startTime = Date.now();

  try {
    console.log(
      `🤖 Generating ${request.postType || "product_showcase"} post for: ${
        request.product.name
      }`
    );

    const prompt = buildPostPrompt(request);

    let parsed: any;

    // Primary: OpenRouter
    try {
      const { content } = await callOpenRouterChat({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Bạn là chuyên gia Social Media thị trường Việt Nam. Luôn trả về DUY NHẤT JSON đúng schema, không text ngoài JSON.",
          },
          { role: "user", content: prompt },
        ],
        maxTokens: 2000,
        temperature: 0.8,
      });

      parsed = parseJSONFromModel(content || "");
      console.log(
        `✅ OpenRouter generated ${parsed.posts?.length || 0} posts (Bee style)`
      );
    } catch (err) {
      console.error("⚠️ OpenRouter failed, trying Gemini fallback:", err);

      if (!geminiApiKey) {
        throw new Error(
          "OpenRouter lỗi và không có GEMINI_API_KEY để fallback."
        );
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
        },
      });

      const result = await model.generateContent([prompt]);
      const text = result.response.text();
      parsed = parseJSONFromModel(text);

      console.log(
        `✅ Gemini fallback generated ${parsed.posts?.length || 0} posts (Bee style)`
      );
    }

    const posts: GeneratedPost[] = [];
    const alts: GeneratedPost[] = [];

    const apply = (caption: string): GeneratedPost => {
      const hashtags = generateHashtags(
        request.product,
        request.customHashtags,
        request.includeHashtags !== false
      );

      const withHashtags =
        request.includeHashtags === false
          ? caption
          : `${caption}\n\n${hashtags.join(" ")}`;

      const words = caption.split(/\s+/).filter(Boolean);
      const emojiCount =
        caption.match(
          /[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{1F900}-\u{1F9FF}]/gu
        )?.length || 0;

      return {
        caption: withHashtags,
        captionWithoutHashtags: caption,
        hashtags,
        suggestedImages: request.product.images,
        estimatedEngagement: {
          likelihood: "high",
          tips: [],
        },
        metadata: {
          wordCount: words.length,
          characterCount: caption.length,
          hashtagCount: hashtags.length,
          emojiCount,
          readingTime: `${Math.max(1, Math.ceil(words.length / 200))} phút`,
          generatedAt: new Date().toISOString(),
          aiModel: "openrouter-gpt4o-mini-or-gemini",
        },
      };
    };

    for (const p of parsed.posts || []) {
      if (typeof p.caption === "string" && p.caption.trim().length > 0) {
        posts.push(apply(p.caption.trim()));
      }
    }

    for (const p of parsed.alternatives || []) {
      if (typeof p.caption === "string" && p.caption.trim().length > 0) {
        alts.push(apply(p.caption.trim()));
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      posts,
      alternatives: alts.length ? alts : undefined,
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
// HELPERS
// ==================================================

export function generatePostPreview(post: GeneratedPost): string {
  const preview = post.captionWithoutHashtags.substring(0, 80);
  return preview + (post.captionWithoutHashtags.length > 80 ? "..." : "");
}

export function getBestPostingTimes(): string[] {
  return [
    "9:00-11:00 (Sáng - Giờ làm việc)",
    "12:00-13:00 (Trưa - Giờ nghỉ)",
    "18:00-21:00 (Tối - Sau giờ làm)",
    "21:00-23:00 (Đêm - Thư giãn)",
  ];
}

// ==================================================
// TEST
// ==================================================

export const testGeneratePost = async (productId: string) => {
  const mockProduct: ProductData = {
    id: productId,
    name: "Áo khoác dạ lông cừu Em Bé Mùa Đông màu ghi",
    slug: "ao-khoac-da-long-cuu-em-be-mua-dong-mau-ghi",
    description:
      "Áo khoác dạ lông cừu cao cấp, mỏng nhẹ, giữ ấm tốt, form Hàn, màu ghi dễ phối.",
    price: 850000,
    original_price: 1200000,
    brand_name: "BeeWoods",
    seo_title: "Áo khoác dạ lông cừu Em Bé Mùa Đông",
    seo_description:
      "Em bé mùa Đông siêu xinh, siêu ấm, chuẩn khí chất Hàn Quốc cho các nàng.",
    category: "Thời trang nữ",
    images: ["https://example.com/image1.jpg"],
    stock: 20,
  };

  return await generateFacebookPost({
    product: mockProduct,
    postType: "product_showcase",
    tone: "friendly",
    includeHashtags: true,
    customHashtags: ["BeeWoods", "EmBeMuaDong"],
  });
};
