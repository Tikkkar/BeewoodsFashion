// src/lib/api/adTargeting.js
// Frontend wrapper to call Supabase Edge Function: ad-targeting-agent

import { supabase } from "../supabase";

/**
 * Generate ad targeting suggestions using server-side AI agent.
 * The agent:
 *  - Reads facebook_posts (status = 'posted') as context
 *  - Uses OpenRouter/Gemini on Supabase Edge
 *  - Returns structured targeting_options
 *
 * @param {Object} params
 * @param {string} [params.imageData]          - Optional: image URL or base64
 * @param {string} [params.productName]
 * @param {string} [params.productCategory]
 * @param {string} [params.additionalContext]
 * @param {string} [params.tenant_id]          - Optional: for multi-tenant filtering
 * @param {number} [params.limit_posts]        - Optional: limit context posts
 */
export async function generateAdTargeting(params = {}) {
  const client = supabase;
  const supabaseUrl = client.supabaseUrl || client.url || client.restUrl;
  const supabaseKey =
    client.supabaseKey || client.anonKey || client.key || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or anon key for ad-targeting-agent call");
  }

  const functionUrl = `${supabaseUrl}/functions/v1/ad-targeting-agent`;

  const res = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Failed to generate ad targeting options");
  }

  return data;
}
