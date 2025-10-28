// ============================================
// services/geminiSEOService.ts - Client-side Gemini SEO Service
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.REACT_APP_GEMINI_API_KEY || ""
);
console.log(
  "🔑 Gemini API Key:",
  process.env.REACT_APP_GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌"
);

interface SEOContentRequest {
  productName: string;
  productDescription?: string;
  productPrice?: string;
  productCategory?: string;
  images?: string[]; // Base64 hoặc URLs
  targetKeywords?: string[];
  tone?: "professional" | "casual" | "friendly";
}

interface SEOContentResponse {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  contentBlocks: Array<{
    type: "text" | "image";
    title?: string;
    content?: string;
    url?: string;
    alt?: string;
    caption?: string;
  }>;
}

interface ImageAnalysisResponse {
  description: string;
  suggestedAltText: string;
  suggestedCaption: string;
  keywords: string[];
}

/**
 * Helper: Parse JSON response từ Gemini (loại bỏ markdown wrapper)
 */
function parseGeminiJSON(text: string): any {
  let cleanText = text.trim();

  // Loại bỏ markdown code blocks
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\n?/g, "").replace(/\n?```$/g, "");
  }

  // Tìm JSON object đầu tiên trong text (fallback)
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("❌ Failed to parse JSON:", cleanText.substring(0, 200));
    throw new Error("AI trả về format không hợp lệ. Vui lòng thử lại!");
  }
}

/**
 * Tạo nội dung SEO tự động từ thông tin sản phẩm
 */
export async function generateSEOContent(
  request: SEOContentRequest
): Promise<SEOContentResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
      },
    });

    const prompt = buildSEOPrompt(request);

    console.log("🤖 Generating SEO content with Gemini...");

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("📝 Raw AI response:", text.substring(0, 200));

    // Parse JSON response - loại bỏ markdown wrapper
    const parsed = parseGeminiJSON(text);

    return {
      seoTitle: parsed.seo_title || "",
      seoDescription: parsed.seo_description || "",
      seoKeywords: parsed.seo_keywords || "",
      contentBlocks: parsed.content_blocks || [],
    };
  } catch (error) {
    console.error("❌ Error generating SEO content:", error);
    throw new Error("Không thể tạo nội dung SEO. Vui lòng thử lại!");
  }
}
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
/**
 * Phân tích ảnh sản phẩm và tạo mô tả, alt text, caption
 */
export async function analyzeProductImage(
  imageData: string, // Base64 hoặc URL
  productContext?: string
): Promise<ImageAnalysisResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Prepare image part
    let imagePart: any;

    if (imageData.startsWith("data:image")) {
      // Base64 image
      const base64Data = imageData.split(",")[1];
      const mimeType = imageData.split(";")[0].split(":")[1];

      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };
    } else {
      // URL image - convert to base64 first
      console.log("🔄 Converting URL image to base64...");
      const response = await fetch(imageData);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const base64Data = base64.split(",")[1];

      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: blob.type,
        },
      };
      console.log("✅ Image converted successfully");
    }

    const prompt = `Phân tích hình ảnh này của sản phẩm thời trang${
      productContext ? ` (${productContext})` : ""
    }.

🎯 NHIỆM VỤ:
1. Mô tả chi tiết những gì bạn thấy trong ảnh (màu sắc, kiểu dáng, chất liệu, style)
2. Tạo alt text tối ưu cho SEO (ngắn gọn, mô tả chính xác)
3. Tạo caption hấp dẫn để hiển thị dưới ảnh
4. Đề xuất 3-5 từ khóa SEO liên quan

📋 YÊU CẦU:
- Mô tả bằng tiếng Việt, chuyên nghiệp
- Alt text: 5-15 từ, tự nhiên
- Caption: 1-2 câu, thu hút
- Từ khóa: liên quan đến thời trang, phong cách

⚠️ QUAN TRỌNG: Chỉ trả về JSON, không thêm text giải thích.

TRẢ VỀ JSON (chỉ JSON, không có text khác):
{
  "description": "Mô tả chi tiết ảnh",
  "suggested_alt_text": "Alt text ngắn gọn",
  "suggested_caption": "Caption hấp dẫn",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"]
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    console.log("🖼️ Image analysis result:", text.substring(0, 200));

    // Parse JSON - loại bỏ markdown wrapper
    const parsed = parseGeminiJSON(text);

    return {
      description: parsed.description || "",
      suggestedAltText: parsed.suggested_alt_text || "",
      suggestedCaption: parsed.suggested_caption || "",
      keywords: parsed.keywords || [],
    };
  } catch (error) {
    console.error("❌ Error analyzing image:", error);
    // Log chi tiết để debug
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error("Không thể phân tích ảnh. Vui lòng thử lại!");
  }
}

/**
 * Build prompt cho việc tạo nội dung SEO
 */
function buildSEOPrompt(request: SEOContentRequest): string {
  const {
    productName,
    productDescription,
    productPrice,
    productCategory,
    targetKeywords = [],
    tone = "professional",
  } = request;

  return `Bạn là chuyên gia SEO và Content Marketing cho shop thời trang online.

📦 THÔNG TIN SẢN PHẨM:
- Tên: ${productName}
${productDescription ? `- Mô tả: ${productDescription}` : ""}
${productPrice ? `- Giá: ${productPrice}` : ""}
${productCategory ? `- Danh mục: ${productCategory}` : ""}
${
  targetKeywords.length > 0
    ? `- Từ khóa mục tiêu: ${targetKeywords.join(", ")}`
    : ""
}

🎯 NHIỆM VỤ:
Tạo nội dung SEO hoàn chỉnh cho trang sản phẩm này, bao gồm:

1. **SEO Title** (30-60 ký tự):
   - Bao gồm từ khóa chính
   - Hấp dẫn, khuyến khích click
   - Tự nhiên, không spam

2. **SEO Description** (120-160 ký tự):
   - Tóm tắt lợi ích sản phẩm
   - Call-to-action rõ ràng
   - Chứa từ khóa một cách tự nhiên

3. **SEO Keywords** (5-10 từ khóa):
   - Phân tách bằng dấu phẩy
   - Liên quan đến sản phẩm và ngành thời trang
   - Kết hợp cả từ khóa chung và cụ thể

4. **Content Blocks** (3-5 khối nội dung):
   - Khối 1: Giới thiệu sản phẩm (text)
   - Khối 2: Đặc điểm nổi bật (text)
   - Khối 3: Hướng dẫn phối đồ/sử dụng (text)
   - Khối 4: Gợi ý thêm về chất liệu/bảo quản (text)
   - Mỗi khối có title và content chi tiết

💡 TONE: ${
    tone === "professional"
      ? "Chuyên nghiệp, tin cậy"
      : tone === "casual"
      ? "Thân thiện, gần gũi"
      : "Nhiệt tình, năng động"
  }

📋 QUY ĐỊNH:
- Viết bằng tiếng Việt
- Tránh từ khóa spam
- Nội dung giá trị, tự nhiên
- Có thể dùng HTML tags: <strong>, <em>, <br>

TRẢ VỀ JSON:
{
  "seo_title": "Title tối ưu SEO",
  "seo_description": "Description hấp dẫn",
  "seo_keywords": "từ khóa 1, từ khóa 2, từ khóa 3",
  "content_blocks": [
    {
      "type": "text",
      "title": "Tiêu đề khối",
      "content": "Nội dung chi tiết có thể dùng HTML"
    }
  ]
}`;
}

/**
 * Generate content cho 1 khối nội dung cụ thể
 */
export async function generateContentBlock(
  blockType: "introduction" | "features" | "styling" | "care" | "custom",
  productInfo: SEOContentRequest,
  customPrompt?: string
): Promise<{ title: string; content: string }> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    let prompt = "";

    switch (blockType) {
      case "introduction":
        prompt = `Viết phần giới thiệu cho sản phẩm "${productInfo.productName}".
        Nội dung: 2-3 đoạn, giới thiệu tổng quan, tạo ấn tượng ban đầu.`;
        break;
      case "features":
        prompt = `Viết phần đặc điểm nổi bật cho sản phẩm "${productInfo.productName}".
        Nội dung: Liệt kê 3-5 điểm nổi bật, mỗi điểm 1-2 câu.`;
        break;
      case "styling":
        prompt = `Viết phần gợi ý phối đồ cho sản phẩm "${productInfo.productName}".
        Nội dung: 2-3 cách phối đồ đẹp, phù hợp nhiều hoàn cảnh.`;
        break;
      case "care":
        prompt = `Viết phần hướng dẫn bảo quản cho sản phẩm "${productInfo.productName}".
        Nội dung: Tips bảo quản, giặt ủi đúng cách.`;
        break;
      case "custom":
        prompt = customPrompt || "Viết nội dung cho sản phẩm";
        break;
    }

    prompt += `\n\nSản phẩm: ${productInfo.productName}
${
  productInfo.productDescription
    ? `Mô tả: ${productInfo.productDescription}`
    : ""
}

TRẢ VỀ JSON:
{
  "title": "Tiêu đề phù hợp",
  "content": "Nội dung chi tiết, có thể dùng <strong>, <em>, <br>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON - loại bỏ markdown wrapper
    const parsed = parseGeminiJSON(text);

    return {
      title: parsed.title || "",
      content: parsed.content || "",
    };
  } catch (error) {
    console.error("❌ Error generating content block:", error);
    throw new Error("Không thể tạo nội dung. Vui lòng thử lại!");
  }
}

/**
 * Health check
 */
export function checkGeminiConfig(): { configured: boolean; message: string } {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      message: "REACT_APP_GEMINI_API_KEY chưa được cấu hình trong .env",
    };
  }

  return {
    configured: true,
    message: "Gemini API đã sẵn sàng",
  };
}
