// services/geminiSEOService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini client init
 * Ensure REACT_APP_GEMINI_API_KEY is set in env for client-side usage.
 */
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY || "");

/* ---------------- Types ---------------- */

export interface SEOContentRequest {
  productId?: string;
  productName: string;
  productDescription?: string;
  productPrice?: string;
  productCategory?: string;
  brandName?: string;
  productImages?: string[]; // Real image URLs from database - RENAMED for clarity
  images?: string[]; // Alias
  image?: string; // Alias single image
  targetKeywords?: string[];
  tone?: "professional" | "casual" | "friendly";
  preferShortTitle?: boolean;
  preferHtml?: boolean;
}

export interface ImageAnalysisItem {
  index: number;
  url?: string;
  description?: string;
  suggested_alt_text?: string;
  suggested_caption?: string;
  keywords?: string[];
}

export interface SEOContentResponse {
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
  imageAnalysis?: ImageAnalysisItem[];
}

/* ---------------- Helpers ---------------- */

/**
 * Parse JSON returned by Gemini which may be wrapped in markdown or extra text.
 */
function parseGeminiJSON(text: string): any {
  let cleanText = String(text || "").trim();

  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/g, "").trim();
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\s*/i, "").replace(/\s*```$/g, "").trim();
  }

  // match first JSON object/array
  const match = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) cleanText = match[0];

  try {
    return JSON.parse(cleanText);
  } catch (err) {
    // brute-force try progressively smaller substrings from first bracket
    const firstBrace = cleanText.indexOf("{");
    const firstBracket = cleanText.indexOf("[");
    const start = firstBrace >= 0 ? firstBrace : firstBracket >= 0 ? firstBracket : 0;

    for (let end = cleanText.length; end > start; end--) {
      const candidate = cleanText.slice(start, end);
      try {
        return JSON.parse(candidate);
      } catch {}
    }

    console.error("❌ Failed to parse JSON from AI response (snippet):", cleanText.substring(0, 400));
    throw new Error("AI trả về format không hợp lệ. Vui lòng thử lại!");
  }
}

/**
 * Convert Blob to Data URL (base64)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Image part shape for Gemini SDK (flexible)
 */
type ImagePart = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

/**
 * Prepare image part from data URL or fetch URL and convert to base64 inlineData.
 * Returns ImagePart or null on failure.
 */
async function prepareImagePart(imageStr: string): Promise<ImagePart | null> {
  if (!imageStr) return null;

  // If data URL already
  if (imageStr.startsWith("data:image")) {
    const parts = imageStr.split(",");
    const base64 = parts[1] || "";
    const mimeType = (parts[0] && parts[0].split(":")[1].split(";")[0]) || "image/jpeg";
    if (!base64) return null;
    return { inlineData: { data: base64, mimeType } };
  }

  // Otherwise try fetching
  try {
    const resp = await fetch(imageStr);
    if (!resp.ok) {
      console.warn("prepareImagePart: failed to fetch image:", resp.status, imageStr);
      return null;
    }
    const blob = await resp.blob();
    const dataUrl = await blobToBase64(blob);
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    return { inlineData: { data: base64, mimeType: blob.type || "image/jpeg" } };
  } catch (err) {
    console.warn("prepareImagePart: fetch/convert failed:", err, imageStr);
    return null;
  }
}

/**
 * Check if a string is a placeholder URL
 */
function isPlaceholderUrl(url: any): boolean {
  if (!url || typeof url !== "string") return true;
  const u = url.trim().toLowerCase();
  if (u === "" || u === "null" || u === "undefined") return true;
  // Check for common placeholders
  if (/^(url_to_image|placeholder|example|image_\d+|dummy)\.(jpg|jpeg|png|gif|webp)$/i.test(u)) return true;
  if (/^https?:\/\/(example\.com|placeholder\.com)/i.test(u)) return true;
  return false;
}

/* ---------------- Prompt builder ---------------- */

function buildSEOPromptWithImages(request: SEOContentRequest, imageCount: number): string {
  const {
    productName,
    productDescription,
    productPrice,
    productCategory,
    targetKeywords = [],
    tone = "professional",
    preferShortTitle = false,
    brandName,
  } = request;

  const toneText = tone === "professional" ? "Chuyên nghiệp, tin cậy" : tone === "casual" ? "Thân thiện, gần gũi" : "Nhiệt tình, năng động";
  const titleHint = preferShortTitle ? "ngắn gọn (30-50 ký tự)" : "30-60 ký tự";

  const imageReq = imageCount > 0
    ? `\n🖼️ QUAN TRỌNG VỀ HÌNH ẢNH (BẮT BUỘC):
- Bạn đã được cung cấp ${imageCount} hình ảnh sản phẩm thực tế.
- BẮT BUỘC phải phân tích mỗi ảnh và đưa vào "image_analysis" với: index (0, 1, 2...), description, suggested_alt_text, suggested_caption, keywords (array).
- BẮT BUỘC phải tạo ít nhất ${imageCount} content_blocks loại "image" trong content_blocks array:
  * TUYỆT ĐỐI KHÔNG sử dụng placeholder như "url_to_image_1.jpg", "example.jpg", "placeholder.jpg"
  * CHỈ ĐỂ TRƯỜNG "url" LÀ CHUỖI RỖNG ""
  * Hệ thống sẽ TỰ ĐỘNG điền URL thực vào
  * VÍ DỤ: { "type": "image", "url": "", "alt": "Set Vest Hồng Phấn - Nét dịu dàng khó cưỡng", "caption": "Set vest màu hồng phấn tôn lên vẻ nữ tính, thanh lịch" }
- Sắp xếp: văn bản → ảnh → văn bản → ảnh (xen kẽ để nội dung sinh động)
- Sử dụng thông tin từ ảnh (màu sắc, chất liệu, kiểu dáng) trong văn bản.`
    : "";

  return `Bạn là chuyên gia SEO & content marketing cho cửa hàng thời trang trực tuyến.
${brandName ? `🏷️ THƯƠNG HIỆU: "${brandName}" - BẮT BUỘC tích hợp thương hiệu này vào SEO!\n` : ""}
THÔNG TIN SẢN PHẨM:
- Tên sản phẩm: ${productName}
${brandName ? `- Thương hiệu: ${brandName}` : ""}
${productDescription ? `- Mô tả: ${productDescription}` : ""}
${productPrice ? `- Giá: ${productPrice}` : ""}
${productCategory ? `- Danh mục: ${productCategory}` : ""}
${targetKeywords && targetKeywords.length ? `- Từ khóa mục tiêu: ${targetKeywords.join(", ")}` : ""}

YÊU CẦU SEO:
1) SEO Title (${titleHint}):
   ${brandName ? `- BẮT BUỘC phải có tên thương hiệu "${brandName}" (đặt ở đầu hoặc cuối title)` : "- Tối ưu với từ khóa chính"}
   - Format tốt: "${brandName ? `${brandName} | ` : ''}[Tên sản phẩm] - [Điểm nổi bật]"
   - Hoặc: "[Tên sản phẩm] ${brandName ? `- ${brandName}` : ''} [USP]"
   
2) SEO Description (120-160 ký tự):
   ${brandName ? `- Đề cập thương hiệu ${brandName} một cách tự nhiên` : "- Mô tả hấp dẫn"}
   - Có CTA rõ ràng (Mua ngay, Khám phá, Đặt hàng...)
   - Nêu lợi ích/giá trị cốt lõi
   
3) SEO Keywords (5-10 từ khóa):
   ${brandName ? `- BẮT BUỘC bao gồm: "${brandName}", "${productName}", "${brandName} ${productCategory || 'thời trang'}"` : "- Tập trung vào từ khóa chính"}
   - Kết hợp: tên sản phẩm + thương hiệu + category + đặc điểm
   - VD: "${brandName || 'tên brand'} áo blazer, áo blazer ${brandName || 'brand'}, ${brandName || 'brand'} thời trang công sở"
   
4) Content Blocks (xen kẽ text và image):
   - Text blocks: 
     * ${brandName ? `Nhắc đến thương hiệu ${brandName} ít nhất 2-3 lần trong nội dung` : 'Nội dung giàu thông tin'}
     * Sử dụng HTML: <strong>, <em>, <br>, <ul>, <li>
     * ${brandName ? `Highlight giá trị/uy tín của ${brandName}` : 'Tập trung vào lợi ích'}
   - Image blocks: 
     * Alt text BẮT BUỘC có format: "${brandName ? `${brandName} - ` : ''}[Mô tả sản phẩm ngắn gọn]"
     * VD: "${brandName || 'Brand'} - Set Vest Hồng Phấn Cao Cấp"
   ${imageCount > 0 ? `- QUAN TRỌNG: Phải có ít nhất ${imageCount} image blocks!` : ""}
   
5) Tone: ${toneText}${brandName ? ` - Thể hiện đẳng cấp và uy tín của thương hiệu ${brandName}` : ''}

6) Ngôn ngữ: Tiếng Việt tự nhiên, chuyên nghiệp${brandName ? `, thể hiện bản sắc thương hiệu ${brandName}` : ''}

${imageReq}

TRẢ VỀ JSON (không có markdown backticks):
{
  "seo_title": "${brandName ? `${brandName} | ` : ''}[Tên SP] - [USP]",
  "seo_description": "Mô tả hấp dẫn${brandName ? ` từ ${brandName}` : ''} với CTA...",
  "seo_keywords": "${brandName ? `${brandName}, ${productName}, ${brandName} thời trang, ...` : 'keyword1, keyword2, ...'}",
  "content_blocks": [
    { 
      "type": "text", 
      "title": "Giới thiệu", 
      "content": "<p>${brandName ? `Từ thương hiệu ${brandName}, chúng tôi` : 'Chúng tôi'} giới thiệu...</p>" 
    },
    { 
      "type": "image", 
      "url": "", 
      "alt": "${brandName ? `${brandName} - ` : ''}[Mô tả sản phẩm]", 
      "caption": "Sản phẩm${brandName ? ` từ ${brandName}` : ''} - [điểm nổi bật]" 
    },
    { 
      "type": "text", 
      "title": "Đặc điểm nổi bật", 
      "content": "<ul><li>Chất liệu cao cấp${brandName ? ` của ${brandName}` : ''}</li><li>Thiết kế tinh tế...</li></ul>" 
    },
    { 
      "type": "image", 
      "url": "", 
      "alt": "${brandName ? `${brandName} - ` : ''}Chi tiết sản phẩm", 
      "caption": "Đẳng cấp${brandName ? ` ${brandName}` : ''} trong từng chi tiết" 
    }
  ],
  "image_analysis": [
    { 
      "index": 0, 
      "description": "Mô tả chi tiết ảnh", 
      "suggested_alt_text": "${brandName ? `${brandName} - ` : ''}Mô tả SEO-friendly",
      "suggested_caption": "Caption hấp dẫn${brandName ? ` highlight ${brandName}` : ''}", 
      "keywords": ["${brandName || 'brand'}", "${productName || 'product'}", "keyword3"] 
    }
  ]
}`;
}

/* ---------------- Main: generateSEOContent ---------------- */

/**
 * generateSEOContent:
 * - Accepts request including productImages[] (real URLs from database)
 * - Attaches up to MAX_IMAGES images as inline parts for Gemini to analyze
 * - Parses AI JSON, automatically maps supplied URLs to image blocks by index
 * - Filters out any blocks with placeholder URLs
 */
export async function generateSEOContent(request: SEOContentRequest): Promise<SEOContentResponse> {
  try {
    const model: any = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    });

    // Collect real product images
    const MAX_IMAGES = 3;
    const realImageUrls: string[] = [];
    
    // Debug: Log what we received
    console.log('[geminiSEO] 📥 Request received:', {
      hasProductImages: !!request.productImages,
      productImagesLength: Array.isArray(request.productImages) ? request.productImages.length : 0,
      hasImages: !!request.images,
      imagesLength: Array.isArray(request.images) ? request.images.length : 0,
      hasImage: !!request.image,
      productName: request.productName,
    });
    
    // Priority order: productImages > images > image
    if (Array.isArray(request.productImages) && request.productImages.length > 0) {
      console.log('[geminiSEO] ✅ Using productImages array');
      realImageUrls.push(...request.productImages.slice(0, MAX_IMAGES));
    } else if (Array.isArray(request.images) && request.images.length > 0) {
      console.log('[geminiSEO] ✅ Using images array (fallback)');
      realImageUrls.push(...request.images.slice(0, MAX_IMAGES));
    } else if (request.image) {
      console.log('[geminiSEO] ✅ Using single image (fallback)');
      realImageUrls.push(request.image);
    } else {
      console.warn('[geminiSEO] ⚠️ NO IMAGES PROVIDED in request!');
    }

    // Filter out any invalid/empty URLs and limit to MAX_IMAGES
    const validImageUrls = realImageUrls
      .filter(url => {
        const isValid = url && typeof url === 'string' && url.trim() !== '';
        if (!isValid) {
          console.warn('[geminiSEO] ⚠️ Filtering out invalid URL:', url);
        }
        return isValid;
      })
      .slice(0, MAX_IMAGES);

    console.log(`[geminiSEO] 📊 Processing ${validImageUrls.length} product images:`, validImageUrls);
    
    if (validImageUrls.length === 0) {
      console.error('[geminiSEO] ❌ NO VALID IMAGE URLS! Cannot proceed with image generation.');
    }

    // Prepare image parts for AI vision analysis
    const imagePartsPromises = validImageUrls.map((url) => prepareImagePart(url));
    const imageParts = await Promise.all(imagePartsPromises);
    const validParts = imageParts.filter(part => part !== null) as ImagePart[];

    console.log(`[geminiSEO] Successfully prepared ${validParts.length} image parts for AI`);

    // Build prompt and call Gemini
    const prompt = buildSEOPromptWithImages(request, validParts.length);

    let result: any;
    if (validParts.length > 0) {
      const partsArray = [prompt, ...validParts];
      result = await model.generateContent(partsArray as any);
    } else {
      result = await model.generateContent(prompt as any);
    }

    const text: string = result?.response?.text?.() ?? String(result?.text ?? "");
    const parsed = parseGeminiJSON(text);

    // Normalize SEO fields
    const seoTitle = parsed.seo_title || parsed.title || "";
    const seoDescription = parsed.seo_description || parsed.meta_description || parsed.description || "";
    const seoKeywords =
      parsed.seo_keywords ||
      (parsed.seo_keywords_list ? parsed.seo_keywords_list.join(", ") : "") ||
      (Array.isArray(parsed.keywords) ? parsed.keywords.join(", ") : parsed.keywords || "");

    let contentBlocks = parsed.content_blocks || parsed.blocks || parsed.contentBlocks || [];
    if (!Array.isArray(contentBlocks)) contentBlocks = [];

    // Normalize image analysis
    const rawImageAnalysis = Array.isArray(parsed.image_analysis) 
      ? parsed.image_analysis 
      : parsed.imageAnalysis || [];
    
    const imageAnalysis: ImageAnalysisItem[] = rawImageAnalysis.map((it: any, idx: number) => ({
      index: typeof it.index === "number" ? it.index : idx,
      url: it.url || undefined,
      description: it.description || it.desc || "",
      suggested_alt_text: it.suggested_alt_text || it.alt || "",
      suggested_caption: it.suggested_caption || it.caption || "",
      keywords: Array.isArray(it.keywords) 
        ? it.keywords 
        : (it.keywords ? String(it.keywords).split(",").map((s: string) => s.trim()) : []),
    }));

    console.log(`[geminiSEO] AI returned ${contentBlocks.length} content blocks, ${imageAnalysis.length} image analyses`);

    // Check if AI returned any image blocks
    const hasImageBlocks = contentBlocks.some((b: any) => b?.type === "image");
    
    // Auto-insert image blocks if AI didn't create them but we have real images
    if (!hasImageBlocks && validImageUrls.length > 0) {
      console.log(`[geminiSEO] ⚠️ AI didn't return image blocks, auto-inserting ${validImageUrls.length} images`);
      
      // Auto-insert image blocks from real URLs (with or without imageAnalysis)
      const autoImageBlocks = validImageUrls.map((url, idx) => {
        const analysis = imageAnalysis.find(ia => ia.index === idx) || imageAnalysis[idx];
        return {
          type: "image",
          url: url,
          alt: analysis?.suggested_alt_text || `${request.productName} - Ảnh ${idx + 1}`,
          caption: analysis?.suggested_caption || `Hình ảnh ${request.productName}`,
        };
      });
      
      // Insert after first text block if exists, otherwise at the beginning
      const firstTextIdx = contentBlocks.findIndex((b: any) => b?.type === "text");
      if (firstTextIdx >= 0) {
        console.log(`[geminiSEO] Inserting ${autoImageBlocks.length} images after first text block`);
        contentBlocks.splice(firstTextIdx + 1, 0, ...autoImageBlocks);
      } else {
        console.log(`[geminiSEO] No text blocks found, inserting ${autoImageBlocks.length} images at beginning`);
        contentBlocks = [...autoImageBlocks, ...contentBlocks];
      }
    } else if (hasImageBlocks) {
      console.log(`[geminiSEO] ✅ AI returned ${contentBlocks.filter((b: any) => b?.type === 'image').length} image blocks`);
    } else if (validImageUrls.length === 0) {
      console.warn(`[geminiSEO] ⚠️ No product images available to insert`);
    }

    // Map real URLs to image blocks by index
    let imageBlockIndex = 0;
    contentBlocks = contentBlocks.map((block: any) => {
      if (block?.type === "image") {
        const blockUrl = String(block.url || "").trim();
        
        // Check if we should use real URL (placeholder or empty)
        const shouldUseRealUrl = isPlaceholderUrl(blockUrl);
        const realUrl = validImageUrls[imageBlockIndex] || "";
        
        // ALWAYS use real URL if available, prefer real URL over AI's placeholder
        const finalUrl = shouldUseRealUrl ? realUrl : (blockUrl || realUrl);
        
        if (shouldUseRealUrl && realUrl) {
          console.log(`[geminiSEO] Replacing placeholder "${blockUrl}" with real URL at index ${imageBlockIndex}: ${realUrl}`);
        } else if (!shouldUseRealUrl && blockUrl) {
          console.log(`[geminiSEO] Keeping AI-provided URL at index ${imageBlockIndex}: ${blockUrl}`);
        }

        // Get analysis for this image index
        const analysis = imageAnalysis.find(ia => ia.index === imageBlockIndex);

        const finalBlock = {
          ...block,
          type: "image",
          url: finalUrl, // Use the determined final URL
          alt: block.alt || analysis?.suggested_alt_text || `${request.productName} - Hình ảnh`,
          caption: block.caption || analysis?.suggested_caption || "",
        };

        imageBlockIndex++;
        return finalBlock;
      }
      return block;
    });

    // Filter out image blocks with STILL invalid URLs after replacement
    const beforeFilterCount = contentBlocks.filter((b: any) => b?.type === 'image').length;
    contentBlocks = contentBlocks.filter((block: any) => {
      if (block?.type === "image") {
        const url = String(block.url || "").trim();
        // Now check if the FINAL url is valid (after replacement)
        const isValid = url && url !== "" && /^https?:\/\//i.test(url);
        if (!isValid) {
          console.warn(`[geminiSEO] ⚠️ Filtering out image block with invalid URL after replacement: "${url}"`);
        }
        return isValid;
      }
      return true; // Keep all text blocks
    });
    const afterFilterCount = contentBlocks.filter((b: any) => b?.type === 'image').length;
    
    if (beforeFilterCount > afterFilterCount) {
      console.warn(`[geminiSEO] ⚠️ Filtered out ${beforeFilterCount - afterFilterCount} image blocks with invalid URLs`);
    }

    console.log(`[geminiSEO] Final output: ${contentBlocks.length} blocks (${contentBlocks.filter((b: any) => b.type === 'image').length} images)`);

    return {
      seoTitle,
      seoDescription,
      seoKeywords,
      contentBlocks,
      imageAnalysis,
    };
  } catch (err: any) {
    console.error("[geminiSEO] Error:", err);
    throw new Error(err?.message || "Lỗi khi tạo nội dung SEO. Vui lòng thử lại!");
  }
}

/* ---------------- Other functions (unchanged) ---------------- */

export function checkGeminiConfig(): { configured: boolean; message: string } {
  const key = process.env.REACT_APP_GEMINI_API_KEY;
  if (!key) {
    return {
      configured: false,
      message: "Vui lòng thiết lập REACT_APP_GEMINI_API_KEY trong file .env",
    };
  }
  return { configured: true, message: "Gemini API đã được cấu hình" };
}

export interface ContentBlockRequest {
  blockType: "introduction" | "features" | "styling" | "care" | "custom";
  productName: string;
  productDescription?: string;
  brandName?: string;
  customPrompt?: string;
}

export async function generateContentBlock(
  blockType: string,
  context: { productName: string; productDescription?: string; brandName?: string }
): Promise<{ title: string; content: string }> {
  try {
    const model: any = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    });

    let prompt = "";
    switch (blockType) {
      case "introduction":
        prompt = `Viết phần giới thiệu ngắn gọn (2-3 câu) cho sản phẩm "${context.productName}"${
          context.brandName ? ` của thương hiệu ${context.brandName}` : ""
        }. ${context.productDescription || ""}
        
Trả về JSON: { "title": "...", "content": "..." }`;
        break;

      case "features":
        prompt = `Liệt kê 3-5 đặc điểm nổi bật của sản phẩm "${context.productName}"${
          context.brandName ? ` (${context.brandName})` : ""
        }. ${context.productDescription || ""}
        
Trả về JSON: { "title": "Đặc điểm nổi bật", "content": "<ul><li>...</li></ul>" }`;
        break;

      case "styling":
        prompt = `Gợi ý 2-3 cách phối đồ với sản phẩm "${context.productName}". Viết ngắn gọn, dễ hiểu.
        
Trả về JSON: { "title": "Gợi ý phối đồ", "content": "..." }`;
        break;

      case "care":
        prompt = `Hướng dẫn bảo quản sản phẩm thời trang "${context.productName}". Liệt kê 3-4 lưu ý quan trọng.
        
Trả về JSON: { "title": "Hướng dẫn bảo quản", "content": "<ul><li>...</li></ul>" }`;
        break;

      default:
        throw new Error("Block type không hợp lệ");
    }

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? String(result?.text ?? "");
    const parsed = parseGeminiJSON(text);

    return {
      title: parsed.title || "",
      content: parsed.content || "",
    };
  } catch (err: any) {
    console.error("Error generating content block:", err);
    throw new Error(err?.message || "Lỗi khi tạo khối nội dung");
  }
}

export async function analyzeProductImage(
  imageUrl: string,
  productName: string
): Promise<{
  description: string;
  suggestedAltText: string;
  suggestedCaption: string;
  keywords: string[];
}> {
  try {
    const model: any = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
    });

    const imagePart = await prepareImagePart(imageUrl);
    if (!imagePart) {
      throw new Error("Không thể tải ảnh");
    }

    const prompt = `Phân tích ảnh sản phẩm thời trang "${productName}".

Trả về JSON:
{
  "description": "Mô tả chi tiết ảnh (màu sắc, chất liệu, kiểu dáng)",
  "suggested_alt_text": "Alt text ngắn gọn cho SEO",
  "suggested_caption": "Caption hấp dẫn để hiển thị",
  "keywords": ["keyword1", "keyword2", ...]
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result?.response?.text?.() ?? String(result?.text ?? "");
    const parsed = parseGeminiJSON(text);

    return {
      description: parsed.description || "",
      suggestedAltText: parsed.suggested_alt_text || parsed.alt || "",
      suggestedCaption: parsed.suggested_caption || parsed.caption || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch (err: any) {
    console.error("Error analyzing image:", err);
    throw new Error(err?.message || "Lỗi khi phân tích ảnh");
  }
}