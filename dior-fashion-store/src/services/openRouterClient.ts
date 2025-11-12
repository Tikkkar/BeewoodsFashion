const OPENROUTER_API_KEY =
  import.meta.env?.VITE_OPENROUTER_API_KEY ||
  process.env.REACT_APP_OPENROUTER_API_KEY ||
  "";

const OPENROUTER_BASE_URL =
  import.meta.env?.VITE_OPENROUTER_BASE_URL ||
  process.env.REACT_APP_OPENROUTER_BASE_URL ||
  "https://openrouter.ai/api/v1";

const OPENROUTER_SITE_URL =
  import.meta.env?.VITE_OPENROUTER_SITE_URL ||
  process.env.REACT_APP_OPENROUTER_SITE_URL ||
  window.location.origin;

const OPENROUTER_APP_NAME =
  import.meta.env?.VITE_OPENROUTER_APP_NAME ||
  process.env.REACT_APP_OPENROUTER_APP_NAME ||
  "BeewoodsFashion-DiorStore";

/**
 * Gọi OpenRouter completion/chat completion.
 * WARNING: Nếu dùng trên frontend, chỉ dùng key đã giới hạn quyền. Tốt nhất proxy qua backend.
 */
export async function callOpenRouterChat(options: {
  model: string; // vd: "anthropic/claude-3.5-sonnet", "openai/gpt-4.1-mini", ...
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY chưa được cấu hình. Vui lòng thêm vào .env (VITE_OPENROUTER_API_KEY hoặc REACT_APP_OPENROUTER_API_KEY)."
    );
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": OPENROUTER_SITE_URL,
      "X-Title": OPENROUTER_APP_NAME,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("OpenRouter API error:", res.status, text);

    // Xử lý riêng lỗi 429 từ provider (thường do dùng free model, rate limit)
    if (res.status === 429) {
      let message =
        "OpenRouter đang bị giới hạn tạm thời (429). Vui lòng thử lại sau vài giây hoặc cấu hình model/Key khác.";

      try {
        const json = JSON.parse(text || "{}");
        const providerMsg = json?.error?.metadata?.raw || json?.error?.message;
        if (providerMsg) {
          message =
            providerMsg +
            " (TIPS: Chọn model khác không bị giới hạn, hoặc dùng API key riêng trong OpenRouter Integrations).";
        }
      } catch {}

      throw new Error(message);
    }

    throw new Error(`OpenRouter request failed: ${res.status} - ${text || "Unknown error"}`);
  }

  const data = await res.json();

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content ??
    "";

  return {
    raw: data,
    content: typeof content === "string" ? content : JSON.stringify(content),
  };
}
