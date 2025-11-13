// src/services/openRouterClient.ts

// ✅ React Scripts đọc từ process.env
const OPENROUTER_API_KEY = 
  process.env.REACT_APP_OPENROUTER_API_KEY || "";

const OPENROUTER_BASE_URL = 
  process.env.REACT_APP_OPENROUTER_BASE_URL || 
  "https://openrouter.ai/api/v1";

const OPENROUTER_SITE_URL = 
  process.env.REACT_APP_OPENROUTER_SITE_URL || 
  (typeof window !== 'undefined' ? window.location.origin : '');

const OPENROUTER_APP_NAME = 
  process.env.REACT_APP_OPENROUTER_APP_NAME || 
  "BeewoodsFashion-DiorStore";

// ✅ Debug log
console.log('🔑 OpenRouter Config:', {
  hasKey: !!OPENROUTER_API_KEY,
  keyPreview: OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 15) + '...' : '❌ MISSING',
  allReactAppKeys: Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')),
});

export async function callOpenRouterChat(options: {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}) {
  if (!OPENROUTER_API_KEY) {
    console.error('❌ Missing REACT_APP_OPENROUTER_API_KEY!', {
      availableKeys: Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')),
    });
    
    throw new Error(
      "Missing REACT_APP_OPENROUTER_API_KEY in environment variables."
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

    if (res.status === 429) {
      let message =
        "OpenRouter đang bị giới hạn tạm thời (429). Vui lòng thử lại sau.";

      try {
        const json = JSON.parse(text || "{}");
        const providerMsg = json?.error?.metadata?.raw || json?.error?.message;
        if (providerMsg) {
          message = providerMsg;
        }
      } catch {}

      throw new Error(message);
    }

    throw new Error(`OpenRouter request failed: ${res.status} - ${text}`);
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