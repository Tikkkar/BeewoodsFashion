// ============================================
// services/geminiService.ts
// - OpenRouter-based LLM Client (ACTIVE)
// - Legacy Gemini SDK config KEPT AS COMMENT for future reuse
// Deno/Supabase Edge Functions Compatible
// ============================================

import { buildFullPrompt } from "../utils/prompts.ts";

// ================================
// LEGACY GEMINI SDK (COMMENTED OUT)
// ================================
// import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
// // @ts-ignore - Deno global
// const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
// if (!GEMINI_API_KEY) {
//   console.error("⚠️ GEMINI_API_KEY not found in environment variables");
// }
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ================================
// OPENROUTER CONFIG (ACTIVE)
// ================================

// @ts-ignore Deno global in Supabase Edge Functions
const OPENROUTER_API_KEY =
  Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPENROUTER_KEY") || "";
// @ts-ignore
const OPENROUTER_BASE_URL =
  Deno.env.get("OPENROUTER_BASE_URL") ||
  "https://openrouter.ai/api/v1/chat/completions";
// @ts-ignore
const OPENROUTER_MODEL =
  Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.0-flash-exp:free";

if (!OPENROUTER_API_KEY) {
  console.error("⚠️ OPENROUTER_API_KEY not found in environment variables");
}

interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

interface GeminiResponse {
  text: string;
  tokens: number;
  type: "showcase" | "mention" | "none";
  products: any[];
  functionCalls: FunctionCall[];
}

/**
 * Validate address function call
 */
function validateAddressFunctionCall(args: any): boolean {
  if (!args.address_line) {
    console.warn("⚠️ save_address: Missing address_line");
    return false;
  }

  if (!/^\d+[A-Z]?\s+.+/.test(args.address_line)) {
    console.warn(
      "⚠️ save_address: Invalid address_line format:",
      args.address_line,
    );
    return false;
  }

  if (/^[\d\s]+$/.test(args.address_line)) {
    console.warn(
      "⚠️ save_address: address_line is only numbers:",
      args.address_line,
    );
    return false;
  }

  if (!args.city) {
    console.warn("⚠️ save_address: Missing city");
    return false;
  }

  const productKeywords = ["cao cấp", "lớp", "set", "vest", "quần", "áo"];
  if (
    productKeywords.some((keyword) =>
      String(args.address_line).toLowerCase().includes(keyword)
    )
  ) {
    console.warn(
      "⚠️ save_address: address_line looks like product description:",
      args.address_line,
    );
    return false;
  }

  console.log("✅ save_address validation passed");
  return true;
}

/**
 * Call LLM via OpenRouter with function-calling-style JSON response
 * - API compatible với callGemini hiện tại
 * - Hỗ trợ override apiKey per-tenant (ưu tiên apiKey truyền vào)
 */
export async function callGemini(
  context: any,
  userMessage: string,
  apiKey?: string,
): Promise<GeminiResponse> {
  try {
    const fullPrompt = await buildFullPrompt(context, userMessage);

    console.log("🤖 Calling OpenRouter (Gemini-compatible)...");
    console.log("📝 User message:", userMessage.substring(0, 160));

    const effectiveApiKey = apiKey || OPENROUTER_API_KEY;
    if (!effectiveApiKey) {
      throw new Error("Missing OpenRouter API key");
    }

    const body = {
      model: OPENROUTER_MODEL,
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            [
              "Bạn là Phương - trợ lý chăm sóc khách hàng & tư vấn thời trang cho thương hiệu BeWo (cách xưng hô Em - Chị/Anh như trước đây).",
              "Bạn giữ đúng phong cách thân thiện, tinh tế, tự nhiên như một nhân sự thật của BeWo, chỉ được làm thông minh hơn nhờ hiểu lịch sử hội thoại & dữ liệu sản phẩm.",
              "",
              "YÊU CẦU CHUNG:",
              "- Giọng nói: thân thiện, tự tin, chuyên nghiệp, không vòng vo, không spam emoji.",
              "- Trả lời ngắn gọn, rõ ý, ưu tiên giúp khách ra quyết định và chốt đơn.",
              "- Luôn cá nhân hóa theo ngữ cảnh (sở thích, dáng người, sản phẩm đã nhắc).",
              "",
              "ĐỊNH DẠNG RESPONSE (BẮT BUỘC):",
              "Trả về DUY NHẤT một JSON object:",
              "{",
              '  "response": string,                       // Câu trả lời gửi cho khách',
              '  "type": "showcase" | "mention" | "none", // showcase: đẩy mạnh 1-3 sản phẩm, mention: nhắc nhẹ, none: chỉ tư vấn',
              '  "product_ids": string[],                 // Danh sách id sản phẩm trong context.products nếu muốn gợi ý',
              '  "function_calls": [                      // Tùy chọn: gọi các hàm nghiệp vụ',
              "    {",
              '      "name": "save_customer_info" | "save_address" | "add_to_cart" | "confirm_and_create_order",',
              '      "args": { ... }',
              "    }",
              "  ]",
              "}",
              "KHÔNG ĐƯỢC trả text ngoài JSON.",
              "",
              "LUẬT GỢI Ý SẢN PHẨM:",
              "- Nếu khách mô tả nhu cầu (đi làm, dáng gầy, thích ôm eo, màu cụ thể):",
              "  + Chọn tối đa 1-3 sản phẩm phù hợp nhất từ context.products → đưa vào product_ids.",
              "- type = \"showcase\" khi đang highlight combo/mẫu cụ thể.",
              "- type = \"mention\" khi chỉ nhắc sản phẩm như gợi ý thêm.",
              "",
              "QUY TẮC FREESHIP / CHÍNH SÁCH (MẶC ĐỊNH, CÓ THỂ ĐƯỢC TRUYỀN QUA CONTEXT):",
              "- Nếu context có policy riêng thì ưu tiên dùng policy đó.",
              "- Nếu không có, dùng rule mặc định:",
              "  + Đơn từ 799k: FREESHIP.",
              "  + Đơn từ 300k: áp dụng mã FREESHIP giảm 30k.",
              "- Luôn trả lời nhất quán, không tự mâu thuẫn.",
              "",
              "XỬ LÝ ĐỊA CHỈ (save_address):",
              "- Hội thoại có thể gửi địa chỉ THÀNH NHIỀU TIN:",
              "  + Ví dụ: \"Đường Hoàng Hoa Thám Phường Ba Đình Hà Nội nhé\",",
              "            \"Số nhà 56 ngõ 173 nhé\".",
              "- NHIỆM VỤ:",
              "  1) Đọc toàn bộ lịch sử trong context.history.",
              "  2) Ghép các message liên quan để tạo địa chỉ đầy đủ.",
              "  3) Chỉ yêu cầu khách bổ sung PHẦN THIẾU (ví dụ thiếu số điện thoại hoặc thiếu quận/phường),",
              "     không yêu cầu lặp lại toàn bộ nếu đã đủ.",
              "- Khi đã đủ thông tin địa chỉ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành):",
              "  + Tạo function_calls:",
              "    {",
              '      "name": "save_address",',
              '      "args": {',
              '        "full_name": (nếu có trong context hoặc bỏ trống),',
              '        "phone": (nếu có),',
              '        "address_line": "Số nhà + đường + ngõ/hẻm nếu có",',
              '        "ward": "phường/xã",',
              '        "district": "quận/huyện",',
              '        "city": "tỉnh/thành phố"',
              "      }",
              "    }",
              "- Chỉ gọi save_address khi địa chỉ đủ rõ để giao hàng.",
              "",
              "THÊM VỀ FUNCTION_CALLS:",
              "- save_customer_info:",
              "  + Dùng khi khách cung cấp hoặc xác nhận tên / sđt / email.",
              "- add_to_cart:",
              "  + Khi khách nói đồng ý lấy 1 sản phẩm cụ thể.",
              "  + args: { product_id, size?, quantity? }",
              "- confirm_and_create_order:",
              "  + Khi đã có giỏ hàng + địa chỉ + khách xác nhận mua.",
              "  + args: { confirmed: true }",
              "",
              "HÀNH VI THÔNG MINH HƠN:",
              "- Không lặp câu hỏi một cách vô lý.",
              "- Dùng thông tin đã có trong lịch sử thay vì hỏi lại.",
              "- Khi khách đã đồng ý mua và đủ thông tin → chuyển sang chốt đơn rõ ràng.",
              "",
              "TUÂN THỦ:",
              "- Luôn xuất ra đúng JSON như mô tả.",
              "- Nếu không đủ thông tin để gọi function, chỉ trả \"response\" tư vấn rõ ràng.",
            ].join("\n"),
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    };

    const res = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveApiKey}`,
        "HTTP-Referer": "https://bewo.ai",
        "X-Title": "BEWO AI Chatbot",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ OpenRouter HTTP error:", res.status, errText);
      throw new Error(`OpenRouter error: ${res.status}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const rawText: string = choice?.message?.content ?? "";

    console.log("📝 Raw OpenRouter response:", rawText.substring(0, 400));

    // Parse JSON response từ model
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Cannot parse LLM response as JSON");
      }
    }

    // Extract function calls
    const functionCalls: FunctionCall[] =
      parsed.function_calls || parsed.functionCalls || [];

    if (functionCalls.length > 0) {
      console.log(`🔧 Function calls detected: ${functionCalls.length}`);
      functionCalls.forEach((fc, idx) => {
        console.log(`  ${idx + 1}. ${fc.name}:`);
        console.log("     Args:", JSON.stringify(fc.args, null, 2));
      });
    }

    // Validate function calls
    const validatedFunctionCalls = functionCalls.filter((fc) => {
      if (fc.name === "save_address") {
        return validateAddressFunctionCall(fc.args);
      }

      if (fc.name === "save_customer_info") {
        if (!fc.args.full_name && !fc.args.preferred_name && !fc.args.phone) {
          console.warn("⚠️ save_customer_info: No useful data provided");
          return false;
        }
      }

      return true;
    });

    if (validatedFunctionCalls.length < functionCalls.length) {
      console.log(
        `⚠️ Filtered out ${
          functionCalls.length - validatedFunctionCalls.length
        } invalid function calls`,
      );
    }

    // Extract product recommendations
    const productIds = parsed.product_ids || [];

    console.log("📦 Product IDs from AI:", productIds);
    console.log("📦 Type from AI:", parsed.type);

    const products =
      (productIds || [])
        .map((id: string) => {
          const product = context.products?.find((p: any) => p.id === id);
          if (!product) {
            console.warn(`⚠️ Product not found: ${id}`);
          }
          return product;
        })
        .filter(Boolean) || [];

    console.log("📦 Matched products:", products.length);

    const tokens =
      data.usage?.total_tokens ||
      data.usage?.output_tokens ||
      data.usage?.completion_tokens ||
      0;

    return {
      text: parsed.response || "Xin lỗi, em chưa hiểu ý chị ạ 😊",
      tokens,
      type: parsed.type || "none",
      products,
      functionCalls: validatedFunctionCalls,
    };
  } catch (error: any) {
    console.error("❌ OpenRouter API error:", error);
    console.error("Error details:", error.message);

    return {
      text: "Xin lỗi chị, hệ thống đang gặp lỗi. Chị vui lòng thử lại sau ạ 🙏",
      tokens: 0,
      type: "none",
      products: [],
      functionCalls: [],
    };
  }
}

/**
 * Call LLM (OpenRouter) after function execution để lấy response tiếp theo
 */
export async function callGeminiWithFunctionResult(
  context: any,
  userMessage: string,
  functionName: string,
  functionResult: any,
): Promise<{ text: string }> {
  try {
    const fullPrompt = await buildFullPrompt(context, userMessage);

    const continuationPrompt = `${fullPrompt}

🔧 FUNCTION EXECUTED: ${functionName}
📊 RESULT: ${JSON.stringify(functionResult, null, 2)}

⚠️ KẾT QUẢ THỰC THI FUNCTION:
${functionResult.success ? "✅ Thành công!" : "❌ Thất bại!"}
${functionResult.message || ""}

NHIỆM VỤ:
1. Nếu thành công → Thông báo cho khách một cách tự nhiên, thân thiện
2. Nếu thất bại → Xin lỗi và hướng dẫn khách cung cấp đúng thông tin

CHỈ TRẢ JSON:
{
  "response": "Câu trả lời phù hợp với kết quả function",
  "type": "none",
  "product_ids": [],
  "function_calls": []
}`;

    const res = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://bewo.ai",
        "X-Title": "BEWO AI Chatbot",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tiếp tục hội thoại sau khi đã thực thi function. " +
              "Luôn trả về JSON với field 'response' và không thêm giải thích ngoài JSON.",
          },
          { role: "user", content: continuationPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        "❌ OpenRouter continuation HTTP error:",
        res.status,
        errText,
      );
      throw new Error(`OpenRouter continuation error: ${res.status}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content ?? "";

    console.log("📝 Continuation response:", rawText.substring(0, 300));

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ JSON parse error (continuation):", e);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Cannot parse continuation response as JSON");
      }
    }

    return {
      text: parsed.response || "Đã xử lý xong ạ! 💕",
    };
  } catch (error: any) {
    console.error("❌ Continuation call error:", error);

    if (functionResult.success) {
      if (functionResult.message) {
        return { text: functionResult.message };
      }
      return { text: "Đã lưu thông tin thành công ạ! ✨" };
    }

    if (functionResult.message) {
      return { text: functionResult.message };
    }

    return { text: "Có lỗi xảy ra, chị vui lòng thử lại nhé 😊" };
  }
}

/**
 * Health check function
 */
export function checkGeminiConfig(): { configured: boolean; message: string } {
  if (!OPENROUTER_API_KEY) {
    return {
      configured: false,
      message: "OPENROUTER_API_KEY is not set in environment variables",
    };
  }

  return {
    configured: true,
    message:
      `OpenRouter is properly configured (model=${OPENROUTER_MODEL}, base=${OPENROUTER_BASE_URL})`,
  };
}
