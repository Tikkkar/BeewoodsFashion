// supabase/functions/order-assistant/index.ts
// Edge Function để xử lý AI Assistant cho Order Management

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: "chat" | "parse_customer" | "suggest_products" | "answer_question";
  message?: string;
  text?: string;
  description?: string;
  question?: string;
  products?: any[];
}

// OpenRouter API Call
async function callOpenRouter(messages: any[], model = "x-ai/grok-4.1-fast:free") {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { action, message, text, description, question, products } = body;

    console.log("📥 Order Assistant Request:", { action });

    let systemPrompt = `Bạn là AI Assistant của BeewoodsFashion - chuyên gia hỗ trợ nhân viên tạo đơn hàng.

QUY TẮC:
1. LUÔN trả lời bằng tiếng Việt
2. LUÔN trả về JSON format (KHÔNG wrap trong markdown)
3. Xử lý tiếng Việt không dấu, viết tắt, lỗi chính tả
4. Chuẩn hóa dữ liệu: tên (viết hoa), SĐT (10-11 số bắt đầu 0)`;

    let userPrompt = "";

    // Xử lý theo action
    switch (action) {
      case "parse_customer":
        if (!text) {
          throw new Error("Missing 'text' parameter");
        }
        systemPrompt += `

OUTPUT FORMAT (customer_info):
{
  "type": "customer_info",
  "data": {
    "customer_name": "Họ Tên (viết hoa)",
    "customer_phone": "0912345678",
    "customer_email": "email hoặc null",
    "shipping_address": "Số nhà, tên đường",
    "shipping_ward": "Phường/Xã hoặc null",
    "shipping_district": "Quận/Huyện hoặc null",
    "shipping_city": "Tỉnh/TP hoặc null",
    "notes": "Ghi chú hoặc null"
  },
  "confidence": "high|medium|low",
  "message": "Thông báo"
}`;
        userPrompt = `Phân tích tin nhắn sau và trích xuất thông tin khách hàng:

${text}

Tìm: tên, SĐT (10-11 số), email, địa chỉ (tách số nhà/đường, phường, quận, tỉnh), ghi chú.
Chuẩn hóa: "nguyen van a" → "Nguyễn Văn A", "84912345678" → "0912345678"`;
        break;

      case "suggest_products":
        if (!description || !products) {
          throw new Error("Missing 'description' or 'products'");
        }
        systemPrompt += `

OUTPUT FORMAT (product_suggestions):
{
  "type": "product_suggestions",
  "data": {
    "products": [
      {
        "product_id": "uuid",
        "product_name": "Tên từ database",
        "reason": "Lý do gợi ý",
        "confidence": "high|medium|low"
      }
    ]
  },
  "message": "Giải thích"
}`;
        userPrompt = `Khách yêu cầu: ${description}

Sản phẩm có sẵn:
${JSON.stringify(products.slice(0, 50), null, 2)}

Gợi ý 3-5 sản phẩm phù hợp nhất (ưu tiên còn hàng).`;
        break;

      case "answer_question":
        if (!question) {
          throw new Error("Missing 'question'");
        }
        systemPrompt += `

OUTPUT FORMAT (chat):
{
  "type": "chat",
  "message": "Câu trả lời"
}`;
        userPrompt = `Câu hỏi: ${question}

Sản phẩm:
${products ? JSON.stringify(products.slice(0, 20), null, 2) : "Không có"}

Trả lời ngắn gọn, chính xác.`;
        break;

      case "chat":
      default:
        if (!message) {
          throw new Error("Missing 'message'");
        }
        systemPrompt += `

OUTPUT FORMAT (chat):
{
  "type": "chat",
  "message": "Câu trả lời"
}`;
        userPrompt = message;
        break;
    }

    // Gọi OpenRouter API
    console.log("🤖 Calling OpenRouter...");
    const aiResponse = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    console.log("✅ OpenRouter response received");

    // Parse response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = aiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      // Try to find JSON object
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          type: "chat",
          message: cleanedResponse,
        };
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse JSON:", e);
      parsedResponse = {
        type: "chat",
        message: aiResponse,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResponse,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Order Assistant Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});