// ============================================
// llmClient.ts - Shared LLM client for multi-agent
// Provider default: OpenRouter (config per-tenant)
// ============================================

type LLMProvider = "openrouter";

export interface LLMCallOptions {
  provider?: LLMProvider;
  model?: string;
  apiKey?: string; // per-tenant override
  system?: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
  json?: boolean; // expect JSON-only response
  tenantId?: string;
  agent?: string; // for logging
}

export interface LLMCallResult {
  rawText: string;
  json?: any;
}

/**
 * Get effective config from:
 * - per-call options
 * - env defaults
 * NOTE: Currently only OpenRouter is active as default.
 */
// @ts-ignore Deno global for Supabase Edge Functions
const DEFAULT_OPENROUTER_API_KEY =
  Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPENROUTER_KEY") || "";
// @ts-ignore
const DEFAULT_OPENROUTER_BASE_URL =
  Deno.env.get("OPENROUTER_BASE_URL") ||
  "https://openrouter.ai/api/v1/chat/completions";
// @ts-ignore
const DEFAULT_OPENROUTER_MODEL =
  Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.0-flash-001";

if (!DEFAULT_OPENROUTER_API_KEY) {
  console.warn(
    "⚠️ llmClient: OPENROUTER_API_KEY / OPENROUTER_KEY not found in env",
  );
}

export async function callLLM(options: LLMCallOptions): Promise<LLMCallResult> {
  const {
    provider = "openrouter",
    model = DEFAULT_OPENROUTER_MODEL,
    apiKey,
    system,
    messages,
    maxTokens = 2048,
    temperature = 0.7,
    json = true,
    tenantId,
    agent,
  } = options;

  if (provider !== "openrouter") {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const effectiveApiKey = apiKey || DEFAULT_OPENROUTER_API_KEY;
  if (!effectiveApiKey) {
    throw new Error("Missing OpenRouter API key");
  }

  const finalMessages = [
    ...(system
      ? [{ role: "system" as const, content: system }]
      : []),
    ...messages,
  ];

  const body: any = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: finalMessages,
  };

  if (json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(DEFAULT_OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${effectiveApiKey}`,
      "HTTP-Referer": "https://bewo.ai",
      "X-Title": "BEWO AI Multi-Agent Chatbot",
      ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
      ...(agent ? { "X-Agent": agent } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(
      `❌ llmClient: OpenRouter HTTP error ${res.status} (${agent ||
        "unknown-agent"}):`,
      errText,
    );
    throw new Error(`OpenRouter error: ${res.status}`);
  }

  const data = await res.json();
  const rawText: string = data.choices?.[0]?.message?.content ?? "";

  if (!json) {
    return { rawText };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("❌ llmClient: Failed to parse extracted JSON:", e);
      }
    }
  }

  return {
    rawText,
    json: parsed,
  };
}
