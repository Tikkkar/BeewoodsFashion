// supabase/functions/_shared/openRouterClient.ts
// OpenRouter client cho Supabase Edge Functions (Deno runtime)
// Shared client để sử dụng cho nhiều Edge Functions

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const OPENROUTER_BASE_URL =
  Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1";
const OPENROUTER_SITE_URL =
  Deno.env.get("OPENROUTER_SITE_URL") || "https://beewoodsfashion.vn";
const OPENROUTER_APP_NAME =
  Deno.env.get("OPENROUTER_APP_NAME") || "BeewoodsFashion";

/**
 * Gọi OpenRouter trong Supabase Edge Functions (Deno).
 * CHỈ dùng trên server, KHÔNG expose key ra client.
 */
export async function callOpenRouterChat(options: {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY chưa được cấu hình trong Supabase (Edge Function env)."
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
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    }),
  });

  const textBody = await res.text().catch(() => "");

  if (!res.ok) {
    console.error("OpenRouter API error:", res.status, textBody);

    if (res.status === 429) {
      try {
        const json = JSON.parse(textBody || "{}");
        const providerMsg =
          json?.error?.metadata?.raw || json?.error?.message;
        if (providerMsg) {
          throw new Error(
            providerMsg +
              " (TIPS: Thử model khác hoặc cấu hình API key riêng trong OpenRouter để có hạn mức cao hơn)."
          );
        }
      } catch {
        // ignore parse error, fall through
      }
      throw new Error(
        "OpenRouter 429 (rate limit hoặc provider limit). Thử lại sau hoặc đổi model/API key."
      );
    }

    throw new Error(
      `OpenRouter request failed: ${res.status} - ${
        textBody || "Unknown error"
      }`
    );
  }

  let data: any;
  try {
    data = JSON.parse(textBody || "{}");
  } catch (e) {
    console.error("OpenRouter JSON parse error:", e, textBody.slice(0, 400));
    throw new Error("Không parse được JSON từ OpenRouter response");
  }

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content ??
    "";

  return {
    raw: data,
    content: typeof content === "string"
      ? content
      : JSON.stringify(content),
  };
}
