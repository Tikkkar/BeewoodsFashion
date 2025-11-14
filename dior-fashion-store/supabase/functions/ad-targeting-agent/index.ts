// supabase/functions/ad-targeting-agent/index.ts
// Edge Function: AI Ad Targeting Agent using Facebook posts as context
// - Runs server-side on Supabase
// - Uses service role key to read facebook_posts
// - Uses OpenRouter/Gemini for reasoning
// - Returns structured targeting options for frontend

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// ---- ENV ----
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

// Basic JSON parser for LLM outputs
function parseJSONFromModel(text: string): any {
  let clean = text.trim();

  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }

  const match = clean.match(/\{[\s\S]*\}$/);
  if (match) clean = match[0];

  return JSON.parse(clean);
}

async function callOpenRouter(prompt: string): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia Facebook Ads & Marketing tại Việt Nam. Luôn trả về DUY NHẤT JSON hợp lệ theo schema yêu cầu, không thêm text ngoài JSON.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2500,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return parseJSONFromModel(content);
}

function buildPrompt(params: {
  productName?: string;
  productCategory?: string;
  additionalContext?: string;
  imageDataSummary?: string;
  postsContext: string;
}) {
  const { productName, productCategory, additionalContext, imageDataSummary, postsContext } =
    params;

  return `
Bạn là AI Planner hỗ trợ chạy Facebook Ads cho thời trang nữ BeeWoods tại Việt Nam.

NHIỆM VỤ:
- Đề xuất tối thiểu 3 nhóm đối tượng quảng cáo (ad targeting options) CHẤT LƯỢNG CAO.
- Dựa trên:
  1) Thông tin sản phẩm hiện tại.
  2) Ngữ cảnh & insight rút ra từ các bài Facebook đã đăng (postsContext).

THÔNG TIN SẢN PHẨM:
- Tên: ${productName || "Không rõ, hãy đoán hợp lý từ context"}
- Danh mục: ${productCategory || "Thời trang nữ / thời trang BeeWoods"}
- Ghi chú thêm: ${additionalContext || "Không có"}

THÔNG TIN ẢNH (NẾU CÓ):
${imageDataSummary || "Không có"}

INSIGHT TỪ CÁC BÀI ĐÃ ĐĂNG (FACEBOOK_POSTS):
${postsContext || "Không có dữ liệu bài đăng, hãy dùng knowledge cơ bản về thời trang nữ."}

YÊU CẦU NHÓM ĐỐI TƯỢNG (MỖI OPTION):
- "option_name": Tên nhóm, ngắn gọn, dễ hiểu.
- "summary": Mô tả vì sao nhóm này phù hợp.
- "demographics":
  - "age_range": 1-3 khoảng tuổi (ví dụ ["18-24","25-34"])
  - "gender": ["Nữ"] hoặc ["Nam","Nữ"] tuỳ ngữ cảnh
  - "location": Ưu tiên Việt Nam, các TP lớn nếu phù hợp
- "lifestyle_and_interests":
  - "relevant_interests": tối đa 5, mô tả bằng tiếng Việt (không phải interest kỹ thuật)
- "facebook_targeting":
  - "detailed_interests": 3-7 target TIẾNG ANH, dạng EXACT facebook interest phổ biến
    (ví dụ: "Fashion", "Online shopping", "Women's fashion", "Luxury goods", "Korean fashion")
  - "detailed_behaviors": 0-3 (ví dụ: "Online shopping", "Engaged shoppers")
  - "detailed_demographics": 0-3 (ví dụ: "College graduate")
  - "exclusions": 0-3 (optional, ví dụ: "Job hunting", "Low income")

QUY TẮC VÀNG:
- TẤT CẢ detailed_interests / behaviors / demographics / exclusions PHẢI bằng TIẾNG ANH.
- Chỉ dùng các interest phổ biến, có khả năng tồn tại thật trên Facebook Ads.
- Không bịa interest tiếng Việt.
- Nhóm phải rõ nét, tránh trùng lặp 100%.
- Tối thiểu 3 options, tối đa 5 options.

OUTPUT BẮT BUỘC (DUY NHẤT JSON, KHÔNG TEXT NGOÀI):

{
  "product_analysis": "Phân tích ngắn gọn về khách hàng tiềm năng cho sản phẩm này (tiếng Việt, 3-6 câu).",
  "targeting_options": [
    {
      "option_name": "Nhóm 1: ...",
      "summary": "...",
      "demographics": {
        "age_range": ["18-24","25-34"],
        "gender": ["Nữ"],
        "location": ["Việt Nam","Hồ Chí Minh","Hà Nội"]
      },
      "lifestyle_and_interests": {
        "relevant_interests": ["thời trang Hàn Quốc","mua sắm online","outfit xinh","mix&match"]
      },
      "facebook_targeting": {
        "detailed_interests": ["Fashion","Women's fashion","Online shopping","Korean fashion"],
        "detailed_behaviors": ["Online shopping","Engaged shoppers"],
        "detailed_demographics": ["College graduate"],
        "exclusions": []
      }
    }
  ]
}
`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = await req.json().catch(() => ({}));

    const {
      imageData,
      productName,
      productCategory,
      additionalContext,
      tenant_id,
      limit_posts = 50,
    } = body || {};

    // 1) Lấy context từ facebook_posts đã đăng
    let query = supabase
      .from("facebook_posts")
      .select("caption, hashtags, product_name, status, engagement_metrics")
      .eq("status", "posted")
      .order("posted_at", { ascending: false })
      .limit(limit_posts);

    if (tenant_id) {
      query = query.eq("tenant_id", tenant_id);
    }

    const { data: posts, error: postsError } = await query;
    if (postsError) {
      console.error("Error loading facebook_posts:", postsError);
    }

    // Rút gọn insight từ posts
    const contextLines: string[] = [];
    (posts || []).forEach((p) => {
      if (p.caption) {
        const em = p.engagement_metrics || {};
        const score =
          (em.likes || 0) + (em.comments || 0) * 2 + (em.shares || 0) * 3;
        contextLines.push(
          `- [${score || 0} điểm tương tác] ${p.caption.substring(0, 160).replace(/\s+/g, " ")}`
        );
      }
    });

    const postsContext =
      contextLines.slice(0, 20).join("\n") ||
      "Chưa có nhiều dữ liệu bài đăng. Hãy dùng hiểu biết chung về khách hàng thời trang nữ Việt Nam.";

    // 2) Tóm tắt imageData (nếu có) để nhúng vào prompt text
    let imageDataSummary = "";
    if (typeof imageData === "string" && imageData.length > 0) {
      if (imageData.startsWith("data:image")) {
        imageDataSummary =
          "Có cung cấp ảnh sản phẩm dạng base64 (không cần giải mã, hãy giả định là hình lookbook thời trang phù hợp).";
      } else if (imageData.startsWith("http")) {
        imageDataSummary = `Ảnh sản phẩm: ${imageData}`;
      }
    }

    // 3) Build prompt
    const prompt = buildPrompt({
      productName,
      productCategory,
      additionalContext,
      imageDataSummary,
      postsContext,
    });

    // 4) Gọi OpenRouter (hoặc fallback Gemini nếu cần)
    const result = await callOpenRouter(prompt);

    const targetingOptions = Array.isArray(result.targeting_options)
      ? result.targeting_options
      : [];

    const response = {
      product_analysis:
        result.product_analysis || "Không có phân tích",
      targeting_options: targetingOptions,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: "ad-targeting-agent",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ ad-targeting-agent error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error in ad-targeting-agent",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
