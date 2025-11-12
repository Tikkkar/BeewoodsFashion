// ============================================
// orchestratorAgent.ts - Multi-agent orchestrator for chatbot
// Provider: OpenRouter via llmClient
// Responsibilities:
//  - Nhận message + context
//  - Xác định intent chính
//  - Gọi các agent con (rule-based/LLM-assisted)
//  - Chuẩn hóa JSON schema output cho toàn hệ thống
// ============================================

import { callLLM, LLMCallResult } from "./llmClient.ts";

export type AgentResponseType =
  | "none"
  | "showcase"
  | "mention"
  | "size_advice"
  | "faq"
  | "smalltalk"
  | "cart_action";

export type AgentIntent =
  | "greeting"
  | "product_search"
  | "size_consult"
  | "style_consult"
  | "stock_check"
  | "policy"
  | "chitchat"
  | "cart"
  | "other";

export interface OrchestratorOutput {
  response: string;
  type: AgentResponseType;
  product_ids: string[];
  function_calls: {
    name: string;
    args: Record<string, any>;
  }[];
  meta: {
    intent: AgentIntent;
    follow_up_required: boolean;
  };
}

// Lightweight rule-based intent detection using last user message
function detectIntent(message: string): AgentIntent {
  const text = message.toLowerCase().trim();

  if (!text) return "other";

  if (
    text.includes("đổi trả") ||
    text.includes("return") ||
    text.includes("đổi hàng") ||
    text.includes("bảo hành") ||
    text.includes("ship") ||
    text.includes("vận chuyển") ||
    text.includes("giao hàng") ||
    text.includes("thanh toán")
  ) {
    return "policy";
  }

  if (
    text.includes("size") ||
    text.includes("mặc size") ||
    text.includes("cao") && text.includes("nặng")
  ) {
    return "size_consult";
  }

  if (
    text.includes("dự tiệc") ||
    text.includes("đi chơi") ||
    text.includes("đi làm") ||
    text.includes("phối đồ") ||
    text.includes("phù hợp")
  ) {
    return "style_consult";
  }

  if (
    text.includes("còn không") ||
    text.includes("còn ko") ||
    text.includes("còn hàng") ||
    text.includes("hết hàng")
  ) {
    return "stock_check";
  }

  if (
    text.includes("giỏ hàng") ||
    text.includes("thêm vào giỏ") ||
    text.includes("thêm vào gio") ||
    text.includes("mua luôn") ||
    text.includes("đặt hàng") ||
    text.includes("checkout")
  ) {
    return "cart";
  }

  if (
    text.includes("xin chào") ||
    text.includes("chào em") ||
    text.includes("hello") ||
    text === "hi" ||
    text === "hello" ||
    text === "chào" ||
    text === "xin chào"
  ) {
    return "greeting";
  }

  // nhiều câu hỏi về sản phẩm cụ thể, set vest, áo, váy...
  if (
    text.includes("set ") ||
    text.includes("áo ") ||
    text.includes("quần ") ||
    text.includes("đầm") ||
    text.includes("váy") ||
    text.includes("sản phẩm") ||
    text.includes("xem ảnh") ||
    text.includes("mẫu") ||
    text.includes("còn không em")
  ) {
    return "product_search";
  }

  // fallback: nếu là câu ngắn, biểu cảm
  if (
    ["ừ", "ừm", "ok", "oke", "uhm", "hmm", "cảm ơn", "thanks"].some((k) =>
      text.includes(k)
    )
  ) {
    return "chitchat";
  }

  return "other";
}

// Base system prompt for all agents via orchestrator
function baseSystemPrompt(): string {
  return `
Bạn là hệ thống multi-agent cho BEWO - thương hiệu thời trang cao cấp.
Bạn KHÔNG trả lời kiểu "hệ thống lỗi" trừ khi được backend thông báo lỗi.
Luôn đọc kỹ lịch sử hội thoại (messages) và bối cảnh (context) để không lặp lại chào hỏi vô lý.

LUÔN TRẢ VỀ JSON HỢP LỆ VỚI CẤU TRÚC:

{
  "response": "câu trả lời gửi cho khách (tiếng Việt, tự nhiên, ngắn gọn, nhất quán với ngữ cảnh)",
  "type": "none | showcase | mention | size_advice | faq | smalltalk | cart_action",
  "product_ids": ["id1", "id2"],
  "function_calls": [
    {
      "name": "tên_hàm_nếu_cần_ví_dụ_add_to_cart_hoặc_save_address",
      "args": { "field": "value" }
    }
  ],
  "meta": {
    "intent": "greeting | product_search | size_consult | style_consult | stock_check | policy | chitchat | cart | other",
    "follow_up_required": true hoặc false
  }
}

QUY TẮC QUAN TRỌNG:
- Không bao giờ bịa sản phẩm không có trong danh sách context.products (nếu có).
- Nếu không chắc chắn, hãy hỏi lại khách, không nói hệ thống lỗi.
- Không spam lời chào. Nếu trong vài tin gần đây đã chào, chỉ tiếp tục nội dung.
- Khi khách hỏi size và đã có chiều cao + cân nặng: luôn gợi ý 1 size cụ thể + giải thích ngắn.
- Nếu khách bảo "cho chị xem ảnh" sản phẩm đã biết: đề xuất dùng function_calls để gửi ảnh từ dữ liệu có sẵn.
`;
}

/**
 * Orchestrator chính:
 * - Nhận context đầy đủ + lastUserMessage
 * - Dùng rule detectIntent
 * - Gọi LLM (OpenRouter) với system prompt + schema rõ ràng
 * - Trả về OrchestratorOutput đã chuẩn hóa
 */
export async function runOrchestrator(options: {
  tenantId: string;
  context: any; // từ buildContext
  history: any[]; // chatbot_messages gần đây (optional nếu đã trong context)
  lastUserMessage: string;
  model?: string;
  apiKey?: string; // per-tenant
}): Promise<OrchestratorOutput> {
  const { tenantId, context, history = [], lastUserMessage, model, apiKey } =
    options;

  const intent = detectIntent(lastUserMessage);

  const system = baseSystemPrompt();

  // Chuẩn bị messages cho LLM:
  // - system prompt
  // - tóm tắt context (ngắn) + history gần đây
  const shortHistory = history.slice(-8);

  const historyText = shortHistory
    .map((m: any) => {
      const role = m.sender_type === "customer"
        ? "User"
        : m.sender_type === "bot"
        ? "Assistant"
        : "System";
      const text = m.content?.text || m.content || "";
      return `${role}: ${text}`;
    })
    .join("\n");

  const productsSummary = (context.products || [])
    .slice(0, 12)
    .map(
      (p: any) =>
        `- [${p.id}] ${p.name} - ${p.price}đ (slug: ${p.slug || ""})`,
    )
    .join("\n");

  const userPrompt = `
[NGỮ CẢNH HIỆN TẠI]
Tenant: ${tenantId}
Intent dự đoán (rule-based): ${intent}
Khách hàng: ${context.customer?.name || "Guest"} - ${
    context.customer?.phone || "N/A"
  }

[LỊCH SỬ HỘI THOẠI GẦN ĐÂY]
${historyText || "(chưa có lịch sử)"}

[DANH SÁCH SẢN PHẨM (tối đa 12)]
${productsSummary || "(không có hoặc lấy từ context khác)"}

[TIN NHẮN MỚI NHẤT CỦA KHÁCH]
"${lastUserMessage}"

NHIỆM VỤ:
- Dựa trên intent và ngữ cảnh, tạo JSON theo đúng schema đã cho trong system prompt.
- Không lặp lại lời chào nếu đã chào gần đây.
- Không nói "hệ thống lỗi" nếu vẫn có thể trả lời bình thường.
- Nếu cần gọi function (ví dụ: add_to_cart, show_product_images, save_address, save_customer_info) hãy thêm vào function_calls.
`;

  const llmResult: LLMCallResult = await callLLM({
    provider: "openrouter",
    model,
    apiKey,
    tenantId,
    agent: "OrchestratorAgent",
    system,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    json: true,
    maxTokens: 800,
    temperature: 0.6,
  });

  // Chuẩn hóa output
  const parsed = llmResult.json || {};

  const safe: OrchestratorOutput = {
    response:
      typeof parsed.response === "string" && parsed.response.trim()
        ? parsed.response
        : "Dạ em chưa rõ ý chị, chị nói cụ thể hơn giúp em với ạ 💕",
    type: ([
      "none",
      "showcase",
      "mention",
      "size_advice",
      "faq",
      "smalltalk",
      "cart_action",
    ] as AgentResponseType[]).includes(parsed.type)
      ? parsed.type
      : "none",
    product_ids: Array.isArray(parsed.product_ids)
      ? parsed.product_ids.filter((id: any) => typeof id === "string")
      : [],
    function_calls: Array.isArray(parsed.function_calls)
      ? parsed.function_calls
          .filter(
            (fc: any) =>
              fc &&
              typeof fc.name === "string" &&
              fc.name.length > 0 &&
              typeof fc.args === "object",
          )
          .map((fc: any) => ({
            name: fc.name,
            args: fc.args || {},
          }))
      : [],
    meta: {
      intent: ([
        "greeting",
        "product_search",
        "size_consult",
        "style_consult",
        "stock_check",
        "policy",
        "chitchat",
        "cart",
        "other",
      ] as AgentIntent[]).includes(parsed?.meta?.intent)
        ? parsed.meta.intent
        : intent,
      follow_up_required: Boolean(parsed?.meta?.follow_up_required),
    },
  };

  return safe;
}
