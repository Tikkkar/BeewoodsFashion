// ============================================
// product-from-image - Generate product draft from image + hints
// Similar pattern to seo-content-generator
// ============================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { callOpenRouterChat } from "../facebook-auto-poster/openRouterClient.ts";

interface ProductFromImageRequest {
  imageUrl: string;
  titleHint?: string;
  descriptionHint?: string;
  brandName?: string;
  categoryHint?: string;
  priceHint?: number;
}

interface GeneratedProduct {
  name: string;
  slug: string;
  description: string;
  brand_name?: string;
  price?: number;
  original_price?: number;
  categories: string[];
  attributes: {
    colors?: string[];
    material?: string;
    style?: string;
    fit?: string;
    target_gender?: string;
    target_age?: string;
  };
  is_featured?: boolean;
  is_active?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

function parseJSON(text: string): any {
  let clean = String(text || "").trim();

  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/i, "").replace(/\s*```$/g, "").trim();
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/i, "").replace(/\s*```$/g, "").trim();
  }

  const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) clean = match[0];

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("AI trả về JSON không hợp lệ.");
  }
}

function buildPrompt(body: ProductFromImageRequest): string {
  const {
    imageUrl,
    titleHint,
    descriptionHint,
    brandName,
    categoryHint,
    priceHint,
  } = body;

  return `
Bạn là trợ lý tạo sản phẩm cho hệ thống quản trị thời trang cao cấp.

NHIỆM VỤ:
- Nhìn vào ảnh sản phẩm (URL bên dưới) và các gợi ý (nếu có).
- Đề xuất dữ liệu để TẠO MỚI SẢN PHẨM trong AdminProductForm, gồm:
  - name: Tên sản phẩm ngắn gọn, rõ, dễ bán, tiếng Việt.
  - slug: URL-friendly, không dấu, dùng dấu gạch ngang, không khoảng trắng.
  - description: 2-4 đoạn mô tả chi tiết (chất liệu, form, cảm giác mặc, ngữ cảnh sử dụng).
  - brand_name: nếu có gợi ý hoặc nhận diện hợp lý (không bịa thương hiệu lạ).
  - price: nếu có priceHint thì ưu tiên; nếu không, ước lượng hợp lý bằng VND.
  - original_price: optional, > price nếu muốn gợi ý khung giảm giá.
  - categories: mảng text cho danh mục gợi ý (VD: ["Áo vest", "Set vest", "Quần tây"]).
  - attributes:
      colors: mảng màu sắc tiếng Việt (VD: ["trắng", "đen", "be"])
      material: chất liệu chính (VD: "Linen", "Cotton", "Tweed")
      style: phong cách (VD: "thanh lịch", "trẻ trung", "basic", "oversize")
      fit: form dáng (VD: "regular", "oversize", "slim")
      target_gender: "nữ" | "nam" | "unisex"
      target_age: khoảng tuổi (VD: "20-35")
  - is_featured: true nếu sản phẩm nổi bật, có tiềm năng trưng bày.
  - is_active: true (admin có thể tắt sau).
  - seo_title: title chuẩn SEO tiếng Việt (~50-60 ký tự).
  - seo_description: mô tả SEO (~120-160 ký tự).
  - seo_keywords: chuỗi keywords, cách nhau bởi dấu phẩy.

YÊU CẦU:
- Dùng tiếng Việt tự nhiên, bán hàng nhưng không khoa trương quá đà.
- Không thêm markdown, không thêm giải thích.
- KHÔNG dùng placeholder như "url_to_image_1".
- KHÔNG bịa brand nếu không chắc; nếu không rõ, dùng brandName từ input hoặc để trống.
- Nếu không chắc giá, gợi ý khoảng giá hợp lý cho phân khúc thời trang trung-cao cấp.

INPUT:
- Ảnh sản phẩm: ${imageUrl}
- Gợi ý tên: ${titleHint || ""}
- Gợi ý mô tả: ${descriptionHint || ""}
- Gợi ý brand: ${brandName || ""}
- Gợi ý danh mục: ${categoryHint || ""}
- Gợi ý giá: ${priceHint ? priceHint + " VND" : ""}

TRẢ VỀ DUY NHẤT JSON VỚI STRUCT:

{
  "name": "Áo vest linen cổ ve phối quần ống rộng",
  "slug": "ao-vest-linen-co-ve-phoi-quan-ong-rong",
  "description": "Mô tả chi tiết...",
  "brand_name": "BeWo",
  "price": 890000,
  "original_price": 1090000,
  "categories": ["Áo vest", "Set vest", "Quần tây"],
  "attributes": {
    "colors": ["be", "trắng"],
    "material": "Linen",
    "style": "thanh lịch",
    "fit": "regular",
    "target_gender": "nữ",
    "target_age": "22-35"
  },
  "is_featured": true,
  "is_active": true,
  "seo_title": "Áo vest linen phối quần ống rộng - Thanh lịch cho nàng công sở",
  "seo_description": "Set vest linen cao cấp, phom chuẩn, tôn dáng, phù hợp đi làm và dự tiệc.",
  "seo_keywords": "áo vest linen, set vest công sở, đồ công sở nữ, bew0 fashion"
}
`;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as ProductFromImageRequest;

    if (!body.imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl là bắt buộc" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const prompt = buildPrompt(body);

    const { content } = await callOpenRouterChat({
      model: "openrouter/polaris-alpha",
      messages: [
        {
          role: "system",
          content:
            "Bạn là trợ lý tạo sản phẩm cho hệ thống quản trị. Trả về DUY NHẤT JSON hợp lệ đúng schema yêu cầu.",
        },
        { role: "user", content: prompt },
      ],
      maxTokens: 2048,
      temperature: 0.4,
    });

    const parsed = parseJSON(content || "");

    const result: GeneratedProduct = {
      name: parsed.name || "",
      slug: parsed.slug || "",
      description: parsed.description || "",
      brand_name: parsed.brand_name || body.brandName || "",
      price:
        typeof parsed.price === "number"
          ? parsed.price
          : body.priceHint || 0,
      original_price:
        typeof parsed.original_price === "number"
          ? parsed.original_price
          : undefined,
      categories: Array.isArray(parsed.categories)
        ? parsed.categories
        : [],
      attributes: parsed.attributes || {},
      is_featured:
        typeof parsed.is_featured === "boolean"
          ? parsed.is_featured
          : false,
      is_active:
        typeof parsed.is_active === "boolean"
          ? parsed.is_active
          : true,
      seo_title: parsed.seo_title || "",
      seo_description: parsed.seo_description || "",
      seo_keywords: parsed.seo_keywords || "",
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("product-from-image error:", err);
    return new Response(
      JSON.stringify({
        error:
          err?.message ||
          "Lỗi khi phân tích ảnh / tạo dữ liệu sản phẩm",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      },
    );
  }
});
