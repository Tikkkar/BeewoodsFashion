// ============================================
// services/geminiService.ts - Deno/Supabase Edge Functions Compatible
// ============================================

// @ts-ignore - Deno will resolve this at runtime
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { buildFullPrompt } from "../utils/prompts.ts";

// @ts-ignore - Deno global
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

if (!GEMINI_API_KEY) {
  console.error("⚠️ GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
  // 1. Check address_line exists
  if (!args.address_line) {
    console.warn("⚠️ save_address: Missing address_line");
    return false;
  }

  // 2. Check if address_line có số nhà và tên đường
  if (!/^\d+[A-Z]?\s+.+/.test(args.address_line)) {
    console.warn(
      "⚠️ save_address: Invalid address_line format:",
      args.address_line,
    );
    return false;
  }

  // 3. Check if address_line is only numbers
  if (/^[\d\s]+$/.test(args.address_line)) {
    console.warn(
      "⚠️ save_address: address_line is only numbers:",
      args.address_line,
    );
    return false;
  }

  // 4. Validate city
  if (!args.city) {
    console.warn("⚠️ save_address: Missing city");
    return false;
  }

  // 5. Check if address_line looks like product description
  const productKeywords = ["cao cấp", "lớp", "set", "vest", "quần", "áo"];
  if (
    productKeywords.some((keyword) =>
      args.address_line.toLowerCase().includes(keyword)
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
 * Call Gemini with function calling support
 */
export async function callGemini(
  context: any,
  userMessage: string,
  apiKey?: string
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    const fullPrompt = await buildFullPrompt(context, userMessage);

    console.log("🤖 Calling Gemini with function calling...");
    console.log("📝 User message:", userMessage.substring(0, 100));

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const rawText = response.text();

    console.log("📝 Raw Gemini response:", rawText.substring(0, 300));

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      // Fallback: extract JSON từ text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Cannot parse Gemini response as JSON");
      }
    }

    // Extract function calls
    const functionCalls: FunctionCall[] = parsed.function_calls || [];

    // Log function calls for debugging
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

      // Validate other functions if needed
      if (fc.name === "save_customer_info") {
        // Basic validation
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

    const products = productIds
      .map((id: string) => {
        const product = context.products?.find((p: any) => p.id === id);
        if (!product) {
          console.warn(`⚠️ Product not found: ${id}`);
        }
        return product;
      })
      .filter(Boolean);

    console.log("📦 Matched products:", products.length);

    const tokens = response.usageMetadata?.totalTokenCount || 0;

    return {
      text: parsed.response || "Xin lỗi, em chưa hiểu ý chị ạ 😊",
      tokens,
      type: parsed.type || "none",
      products,
      functionCalls: validatedFunctionCalls,
    };
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    console.error("Error details:", error.message);

    // Return fallback response
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
 * Call Gemini after function execution để lấy response tiếp theo
 */
export async function callGeminiWithFunctionResult(
  context: any,
  userMessage: string,
  functionName: string,
  functionResult: any,
): Promise<{ text: string }> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    // Build prompt with function result
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

VÍ DỤ RESPONSE THÀNH CÔNG (save_address):
"Dạ em đã ghi nhận địa chỉ của chị rồi ạ! ✨
Địa chỉ giao hàng: [ĐỊA CHỈ ĐẦY ĐỦ]
Chị cần em hỗ trợ gì thêm không ạ? 💕"

VÍ DỤ RESPONSE THẤT BẠI:
"Dạ xin lỗi chị, địa chỉ chưa đầy đủ ạ 😊
Chị vui lòng cung cấp đầy đủ: số nhà + tên đường + thành phố nhé!"

CHỈ TRẢ JSON:
{
  "response": "Câu trả lời phù hợp với kết quả function",
  "type": "none",
  "product_ids": []
}`;

    const result = await model.generateContent(continuationPrompt);
    const rawText = result.response.text();

    console.log("📝 Continuation response:", rawText.substring(0, 200));

    const parsed = JSON.parse(rawText);

    return {
      text: parsed.response || "Đã xử lý xong ạ! 💕",
    };
  } catch (error: any) {
    console.error("❌ Continuation call error:", error);

    // Fallback response based on function result
    if (functionResult.success) {
      if (functionResult.message) {
        return { text: functionResult.message };
      }
      return {
        text: "Đã lưu thông tin thành công ạ! ✨",
      };
    } else {
      if (functionResult.message) {
        return { text: functionResult.message };
      }
      return {
        text: "Có lỗi xảy ra, chị vui lòng thử lại nhé 😊",
      };
    }
  }
}

/**
 * Health check function
 */
export function checkGeminiConfig(): { configured: boolean; message: string } {
  if (!GEMINI_API_KEY) {
    return {
      configured: false,
      message: "GEMINI_API_KEY is not set in environment variables",
    };
  }

  return {
    configured: true,
    message: "Gemini API is properly configured",
  };
}
