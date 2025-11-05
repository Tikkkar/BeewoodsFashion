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
  images?: string[]; // URLs or data URLs (will use up to maxImages)
  image?: string; // alias single image
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
 * Helper: basename (filename) extractor for URLs or paths.
 * Examples:
 *  - https://.../products/1762333900013_76.png => 1762333900013_76.png
 *  - 1762333900013_76.png => 1762333900013_76.png
 */
function basenameOf(u: any): string {
  try {
    if (!u) return "";
    const s = String(u).trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) {
      try {
        const pathname = new URL(s).pathname;
        const parts = pathname.split("/");
        return parts[parts.length - 1] || "";
      } catch {
        const parts = s.split(/[\\/]/);
        return parts[parts.length - 1] || "";
      }
    }
    const parts = s.split(/[\\/]/);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
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
    preferHtml = false,
    brandName,
  } = request;

  const toneText = tone === "professional" ? "Chuyên nghiệp, tin cậy" : tone === "casual" ? "Thân thiện, gần gũi" : "Nhiệt tình, năng động";
  const titleHint = preferShortTitle ? "ngắn gọn (30-50 ký tự)" : "30-60 ký tự";

  const imageReq = imageCount > 0
    ? `\nIMPORTANT: You were provided ${imageCount} image(s). For each image, include an item in "image_analysis" array with fields: index (0..), description, suggested_alt_text, suggested_caption, keywords (array). Use the image to inform color/material/style descriptions and to supply alt/caption for image blocks. If you mention the image in content_blocks, prefer using the full image URL; if you must echo filename, make sure it matches the filename of the supplied images.`
    : "";

  return `Bạn là chuyên gia SEO & content marketing cho cửa hàng thời trang trực tuyến.
${brandName ? `Thông tin: Thương hiệu: "${brandName}".` : ""}

THÔNG TIN SẢN PHẨM:
- Tên sản phẩm: ${productName}
${productDescription ? `- Mô tả: ${productDescription}` : ""}
${productPrice ? `- Giá: ${productPrice}` : ""}
${productCategory ? `- Danh mục: ${productCategory}` : ""}
${targetKeywords && targetKeywords.length ? `- Từ khóa mục tiêu: ${targetKeywords.join(", ")}` : ""}

YÊU CẦU:
1) Sinh SEO Title (${titleHint}) - ưu tiên chứa từ khóa chính và brand nếu có.
2) Sinh SEO Description (120-160 ký tự).
3) Sinh 5-10 SEO Keywords (phân tách bằng dấu phẩy).
4) Sinh 3-5 content blocks (type: text|image) với title + content và (nếu image block) url/alt/caption.
5) Tone: ${toneText}
6) Viết bằng tiếng Việt. Tránh spam.

${imageReq}

TRẢ VỀ CHỈ JSON theo định dạng:
{
  "seo_title": "...",
  "seo_description": "...",
  "seo_keywords": "...",
  "content_blocks": [ ... ],
  "image_analysis": [ /* optional, length = number of images passed */ ]
}
`;
}

/* ---------------- Main: generateSEOContent ---------------- */

/**
 * generateSEOContent:
 * - Accepts request including images[] or image
 * - Attaches up to MAX_IMAGES images as inline parts for Gemini to reference
 * - Parses AI JSON, normalizes content_blocks, image_analysis
 * - Matches AI-returned filenames to supplied public URLs using basename mapping
 */
export async function generateSEOContent(request: SEOContentRequest): Promise<SEOContentResponse> {
  try {
    const model: any = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    });

    const MAX_IMAGES = 3;
    const chosen: string[] = [];
    if (request.image) chosen.push(request.image);
    if (Array.isArray(request.images) && request.images.length) {
      for (const u of request.images) {
        if (chosen.length >= MAX_IMAGES) break;
        if (!chosen.includes(u) && u) chosen.push(u);
      }
    }

    // prepare image parts (keeping association to original url)
    const imagePartsPromises = chosen.map((u) => prepareImagePart(u));
    const imageParts = await Promise.all(imagePartsPromises); // may contain nulls
    const validParts = imageParts.map((p, i) => ({ part: p, url: chosen[i] })).filter((x) => x.part !== null);

    const prompt = buildSEOPromptWithImages(request, validParts.length);

    let result: any;
    if (validParts.length > 0) {
      const partsArray = [prompt, ...validParts.map((p) => p.part)];
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
    const rawImageAnalysis = Array.isArray(parsed.image_analysis) ? parsed.image_analysis : parsed.imageAnalysis || [];
    const imageAnalysis: ImageAnalysisItem[] = Array.isArray(rawImageAnalysis)
      ? rawImageAnalysis.map((it: any, idx: number) => ({
          index: typeof it.index === "number" ? it.index : idx,
          url: it.url || undefined,
          description: it.description || it.desc || "",
          suggested_alt_text: it.suggested_alt_text || it.alt || "",
          suggested_caption: it.suggested_caption || it.caption || "",
          keywords: Array.isArray(it.keywords) ? it.keywords : (it.keywords ? String(it.keywords).split(",").map((s: string) => s.trim()) : []),
        }))
      : [];

    // Supplied urls (public) from validParts, in order
    const suppliedUrls = validParts.map((p) => p.url).filter(Boolean) as string[];

    // Build lookups: by url, by index, by basename
    const analysisByUrl = new Map<string, ImageAnalysisItem>();
    const analysisByIndex = new Map<number, ImageAnalysisItem>();
    const analysisByBasename = new Map<string, ImageAnalysisItem>();
    imageAnalysis.forEach((ia) => {
      if (ia.url) analysisByUrl.set(String(ia.url), ia);
      analysisByIndex.set(ia.index, ia);
      const bn = basenameOf(ia.url || ia.suggested_caption || ia.description || "");
      if (bn) analysisByBasename.set(bn, ia);
    });

    const suppliedUrlByBasename = new Map<string, string>();
    suppliedUrls.forEach((u) => {
      const bn = basenameOf(u);
      if (bn) suppliedUrlByBasename.set(bn, u);
    });

    // Merge imageAnalysis into contentBlocks
    let imageSlot = 0;
    contentBlocks = contentBlocks.map((b: any) => {
      if (b?.type === "image") {
        const candidateRaw = String(b.url || b.image || b.src || "").trim();
        let chosenAnalysis: ImageAnalysisItem | undefined;

        // 1) exact url match
        if (candidateRaw && analysisByUrl.has(candidateRaw)) {
          chosenAnalysis = analysisByUrl.get(candidateRaw);
        }

        // 2) basename match
        if (!chosenAnalysis && candidateRaw) {
          const candBn = basenameOf(candidateRaw);
          if (candBn && analysisByBasename.has(candBn)) {
            chosenAnalysis = analysisByBasename.get(candBn);
          }
        }

        // 3) index match
        if (!chosenAnalysis && analysisByIndex.has(imageSlot)) {
          chosenAnalysis = analysisByIndex.get(imageSlot);
        }

        // 4) resolve URL
        let resolvedUrl: string | undefined;
        if (candidateRaw) {
          if (/^https?:\/\//i.test(candidateRaw)) {
            resolvedUrl = candidateRaw;
          } else {
            const candBn = basenameOf(candidateRaw);
            if (candBn && suppliedUrlByBasename.has(candBn)) {
              resolvedUrl = suppliedUrlByBasename.get(candBn);
              console.debug(`[gemini] resolved basename "${candBn}" -> ${resolvedUrl}`);
            }
          }
        }
        if (!resolvedUrl) {
          if (chosenAnalysis && chosenAnalysis.url) resolvedUrl = chosenAnalysis.url;
          else if (suppliedUrls[imageSlot]) resolvedUrl = suppliedUrls[imageSlot];
        }

        const newAlt = (b.alt && String(b.alt).trim()) || (chosenAnalysis && chosenAnalysis.suggested_alt_text) || "";
        const newCaption = (b.caption && String(b.caption).trim()) || (chosenAnalysis && chosenAnalysis.suggested_caption) || "";

        imageSlot += 1;
        return {
          ...b,
          url: resolvedUrl || b.url,
          alt: newAlt || b.alt || "",
          caption: newCaption || b.caption || "",
        };
      }
      return b;
    });

    // If no image blocks but we have imageAnalysis, insert image blocks
    const hasImageBlock = contentBlocks.some((b: any) => b?.type === "image");
    if (!hasImageBlock && imageAnalysis.length > 0) {
      const inserted = imageAnalysis.map((ia) => {
        const bn = basenameOf(ia.url || "");
        const urlFromSupply = suppliedUrlByBasename.get(bn) || suppliedUrls[ia.index] || ia.url;
        return {
          type: "image",
          title: ia.index === 0 ? "Hình ảnh sản phẩm" : undefined,
          url: urlFromSupply || undefined,
          alt: ia.suggested_alt_text || "",
          caption: ia.suggested_caption || "",
        };
      });

      const firstTextIdx = contentBlocks.findIndex((b: any) => b?.type === "text");
      const insertAt = firstTextIdx >= 0 ? firstTextIdx + 1 : 0;
      contentBlocks = [...contentBlocks.slice(0, insertAt), ...inserted, ...contentBlocks.slice(insertAt)];
    }

    // Final sanitize: remove image blocks without usable url
    const isPlaceholder = (u: any) => !u || typeof u !== "string" || u.trim() === "" || /^(exam|placeholder|null|undefined)$/i.test(u.trim());
    contentBlocks = contentBlocks.filter((b: any) => {
      if (b?.type === "image") {
        const u = String(b.url || "").trim();
        if (!u || isPlaceholder(u)) return false;
      }
      return true;
    });

    return {
      seoTitle: String(seoTitle || "").trim(),
      seoDescription: String(seoDescription || "").trim(),
      seoKeywords: String(seoKeywords || "").trim(),
      contentBlocks: Array.isArray(contentBlocks) ? contentBlocks : [],
      imageAnalysis: imageAnalysis.length ? imageAnalysis : undefined,
    };
  } catch (error) {
    console.error("❌ Error generating SEO content (with images):", error);
    throw new Error("Không thể tạo nội dung SEO. Vui lòng thử lại!");
  }
}

/* ---------------- analyzeProductImage ---------------- */

export async function analyzeProductImage(imageData: string, productContext?: string) {
  try {
    const model: any = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    });

    const imagePart = await prepareImagePart(imageData);
    if (!imagePart) throw new Error("Không thể chuẩn bị ảnh (fetch/conversion lỗi).");

    const prompt = `Phân tích hình ảnh sản phẩm${productContext ? ` (${productContext})` : ""}.
YÊU CẦU:
1) Mô tả chi tiết (màu sắc, kiểu, chất liệu)
2) Alt text ngắn (5-15 từ)
3) Caption 1-2 câu
4) 3-5 từ khóa SEO

TRẢ VỀ CHỈ JSON:
{
  "description": "Mô tả chi tiết",
  "suggested_alt_text": "Alt text ngắn",
  "suggested_caption": "Caption hấp dẫn",
  "keywords": ["từ khóa 1", "từ khóa 2"]
}`;

    const result = await model.generateContent([prompt, imagePart] as any);
    const text = result?.response?.text?.() ?? String(result?.text ?? "");
    const parsed = parseGeminiJSON(text);

    return {
      description: parsed.description || parsed.desc || "",
      suggestedAltText: parsed.suggested_alt_text || parsed.alt || "",
      suggestedCaption: parsed.suggested_caption || parsed.caption || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : (parsed.keywords ? String(parsed.keywords).split(",").map((s: string) => s.trim()) : []),
    };
  } catch (err) {
    console.error("❌ analyzeProductImage error:", err);
    throw new Error("Không thể phân tích ảnh. Vui lòng thử lại!");
  }
}

/* ---------------- generateContentBlock (convenience) ---------------- */

/**
 * Exported helper to generate a single content block via Gemini.
 * Keeps compatibility with earlier frontend calls.
 */
export async function generateContentBlock(
  blockType: "introduction" | "features" | "styling" | "care" | "custom",
  productInfo: SEOContentRequest,
  customPrompt?: string
): Promise<{ title: string; content: string }> {
  try {
    const model: any = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.75, maxOutputTokens: 1024 },
    });

    let prompt = "";
    switch (blockType) {
      case "introduction":
        prompt = `Viết phần giới thiệu 1-2 đoạn cho sản phẩm "${productInfo.productName}".`;
        break;
      case "features":
        prompt = `Liệt kê 3-5 đặc điểm nổi bật cho "${productInfo.productName}", mỗi điểm 1-2 câu.`;
        break;
      case "styling":
        prompt = `Gợi ý 2-3 cách phối đồ cho "${productInfo.productName}".`;
        break;
      case "care":
        prompt = `Hướng dẫn bảo quản ngắn gọn cho "${productInfo.productName}".`;
        break;
      case "custom":
        prompt = customPrompt || `Viết nội dung cho "${productInfo.productName}".`;
        break;
    }

    prompt += `

SẢN PHẨM: ${productInfo.productName}
${productInfo.productDescription ? `MÔ TẢ: ${productInfo.productDescription}` : ""}
${productInfo.brandName ? `BRAND: ${productInfo.brandName}` : ""}

TRẢ VỀ JSON:
{
  "title": "Tiêu đề khối",
  "content": "Nội dung chi tiết (có thể dùng <strong>, <em>, <br>)"
}`;

    const result = await model.generateContent(prompt as any);
    const text = result?.response?.text?.() ?? String(result?.text ?? "");
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

/* ---------------- Health check ---------------- */

export function checkGeminiConfig(): { configured: boolean; message: string } {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    return { configured: false, message: "REACT_APP_GEMINI_API_KEY chưa được cấu hình trong .env" };
  }
  return { configured: true, message: "Gemini API đã sẵn sàng" };
}
