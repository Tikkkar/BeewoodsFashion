import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { callOpenRouterChat } from "../facebook-auto-poster/openRouterClient.ts";

const OpenRouter_Model ="deepseek/deepseek-chat-v3.1:free"

interface SEOContentRequest {
  productId?: string;
  productName: string;
  productDescription?: string;
  productPrice?: string;
  productCategory?: string;
  brandName?: string;
  productImages?: string[];
  images?: string[];
  image?: string;
  targetKeywords?: string[];
  tone?: "professional" | "casual" | "friendly";
  preferShortTitle?: boolean;
  preferHtml?: boolean;
}

interface ImageAnalysisItem {
  index: number;
  url?: string;
  description?: string;
  suggested_alt_text?: string;
  suggested_caption?: string;
  keywords?: string[];
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
  imageAnalysis?: ImageAnalysisItem[];
}

function parseAIJson(text: string): any {
  let cleanText = String(text || "").trim();

  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/g, "").trim();
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\s*/i, "").replace(/\s*```$/g, "").trim();
  }

  const match = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) cleanText = match[0];

  try {
    return JSON.parse(cleanText);
  } catch {
    const firstBrace = cleanText.indexOf("{");
    const firstBracket = cleanText.indexOf("[");
    const start = firstBrace >= 0 ? firstBrace : firstBracket >= 0 ? firstBracket : 0;

    for (let end = cleanText.length; end > start; end--) {
      const candidate = cleanText.slice(start, end);
      try {
        return JSON.parse(candidate);
      } catch {
        // continue
      }
    }
    throw new Error("AI trả về format không hợp lệ.");
  }
}

function isPlaceholderUrl(url: any): boolean {
  if (!url || typeof url !== "string") return true;
  const u = url.trim().toLowerCase();
  if (u === "" || u === "null" || u === "undefined") return true;
  if (/^(url_to_image|placeholder|example|image_\d+|dummy)\.(jpg|jpeg|png|gif|webp)$/i.test(u)) return true;
  if (/^https?:\/\/(example\.com|placeholder\.com)/i.test(u)) return true;
  return false;
}

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

  const toneText =
    tone === "professional"
      ? "Chuyên nghiệp, tin cậy"
      : tone === "casual"
      ? "Thân thiện, gần gũi"
      : "Nhiệt tình, năng động";
  const titleHint = preferShortTitle ? "ngắn gọn (30-50 ký tự)" : "30-60 ký tự";

  const imageReq =
    imageCount > 0
      ? `\n🖼️ QUAN TRỌNG VỀ HÌNH ẢNH (BẮT BUỘC):
- Bạn đã được cung cấp ${imageCount} hình ảnh sản phẩm thực tế.
- BẮT BUỘC phải phân tích mỗi ảnh và đưa vào "image_analysis" với: index (0, 1, 2...), description, suggested_alt_text, suggested_caption, keywords (array).
- BẮT BUỘC phải tạo ít nhất ${imageCount} content_blocks loại "image" trong content_blocks array:
  * TUYỆT ĐỐI KHÔNG sử dụng placeholder như "url_to_image_1.jpg", "example.jpg", "placeholder.jpg"
  * CHỈ ĐỂ TRƯỜNG "url" LÀ CHUỖI RỖNG ""
  * Hệ thống sẽ TỰ ĐỘNG điền URL thực vào
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
1) SEO Title (${titleHint})
2) SEO Description (120-160 ký tự)
3) SEO Keywords (5-10 từ khóa)
4) Content Blocks (xen kẽ text và image)
5) Tone: ${toneText}
6) Ngôn ngữ: Tiếng Việt tự nhiên

${imageReq}

TRẢ VỀ JSON (không có markdown backticks):
{
  "seo_title": "...",
  "seo_description": "...",
  "seo_keywords": "...",
  "content_blocks": [],
  "image_analysis": []
}`;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as SEOContentRequest;

    if (!body.productName) {
      return new Response(JSON.stringify({ error: "productName là bắt buộc" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const MAX_IMAGES = 3;
    const realImageUrls: string[] = [];

    if (Array.isArray(body.productImages) && body.productImages.length > 0) {
      realImageUrls.push(...body.productImages.slice(0, MAX_IMAGES));
    } else if (Array.isArray(body.images) && body.images.length > 0) {
      realImageUrls.push(...body.images.slice(0, MAX_IMAGES));
    } else if (body.image) {
      realImageUrls.push(body.image);
    }

    const validImageUrls = realImageUrls
      .filter((url) => url && typeof url === "string" && url.trim() !== "")
      .slice(0, MAX_IMAGES);

    const prompt = buildSEOPromptWithImages(body, validImageUrls.length);

    const { content: aiContent } = await callOpenRouterChat({
      model: OpenRouter_Model,
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia SEO & content marketing cho cửa hàng thời trang cao cấp. Trả về DUY NHẤT JSON hợp lệ theo format yêu cầu, không kèm giải thích.",
        },
        { role: "user", content: prompt },
      ],
      maxTokens: 10000,
      temperature: 0.7,
    });

    const parsed = parseAIJson(aiContent ?? "");

    const seoTitle = parsed.seo_title || parsed.title || "";
    const seoDescription =
      parsed.seo_description || parsed.meta_description || parsed.description || "";
    const seoKeywords =
      parsed.seo_keywords ||
      (parsed.seo_keywords_list ? parsed.seo_keywords_list.join(", ") : "") ||
      (Array.isArray(parsed.keywords) ? parsed.keywords.join(", ") : parsed.keywords || "");

    let contentBlocks =
      parsed.content_blocks || parsed.blocks || parsed.contentBlocks || [];
    if (!Array.isArray(contentBlocks)) contentBlocks = [];

    const rawImageAnalysis = Array.isArray(parsed.image_analysis)
      ? parsed.image_analysis
      : parsed.imageAnalysis || [];

    const imageAnalysis: ImageAnalysisItem[] = rawImageAnalysis.map(
      (it: any, idx: number) => ({
        index: typeof it.index === "number" ? it.index : idx,
        url: it.url || undefined,
        description: it.description || it.desc || "",
        suggested_alt_text: it.suggested_alt_text || it.alt || "",
        suggested_caption: it.suggested_caption || it.caption || "",
        keywords: Array.isArray(it.keywords)
          ? it.keywords
          : it.keywords
          ? String(it.keywords)
              .split(",")
              .map((s: string) => s.trim())
          : [],
      })
    );

    let imageBlockIndex = 0;
    contentBlocks = contentBlocks.map((block: any) => {
      if (block?.type === "image") {
        const blockUrl = String(block.url || "").trim();
        const shouldUseRealUrl = isPlaceholderUrl(blockUrl);
        const realUrl = validImageUrls[imageBlockIndex] || "";
        const finalUrl = shouldUseRealUrl ? realUrl : blockUrl || realUrl;

        const analysis =
          imageAnalysis.find((ia) => ia.index === imageBlockIndex) ||
          imageAnalysis[imageBlockIndex];

        const finalBlock = {
          ...block,
          type: "image",
          url: finalUrl,
          alt:
            block.alt ||
            analysis?.suggested_alt_text ||
            `${body.productName} - Hình ảnh`,
          caption: block.caption || analysis?.suggested_caption || "",
        };

        imageBlockIndex++;
        return finalBlock;
      }
      return block;
    });

    contentBlocks = contentBlocks.filter((block: any) => {
      if (block?.type === "image") {
        const url = String(block.url || "").trim();
        if (!url || !/^https?:\/\//i.test(url)) {
          return false;
        }
      }
      return true;
    });

    const response: SEOContentResponse = {
      seoTitle,
      seoDescription,
      seoKeywords,
      contentBlocks,
      imageAnalysis,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("seo-content-generator error:", err);
    return new Response(
      JSON.stringify({
        error: err?.message || "Lỗi khi tạo nội dung SEO",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
