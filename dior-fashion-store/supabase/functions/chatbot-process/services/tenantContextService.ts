// ============================================
// services/tenantContextService.ts
// Tenant Context Service for Multi-Tenant Support
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";

export interface TenantContext {
  tenantId: string;
  tenantInfo: any;
  subscription: any;
  limits: any;
  apiKeys: Record<string, TenantApiKey>;
}

interface TenantApiKey {
  apiKey: string | null;
  apiSecret: string | null;
  accessToken: string | null;
  config: any;
}

/**
 * Get tenant from subdomain or custom domain
 */
export async function getTenantByDomain(hostname: string): Promise<any> {
  const supabase = createSupabaseClient();
  
  // Extract subdomain (e.g., "bewo" from "bewo.myplatform.app")
  const parts = hostname.split('.');
  const subdomain = parts.length > 2 ? parts[0] : hostname;
  
  console.log(`🔍 Looking up tenant for hostname: ${hostname}, subdomain: ${subdomain}`);
  
  // Try subdomain first
  let { data: tenant } = await supabase
    .from('tenants')
    .select(`
      *,
      subscription:tenant_subscriptions!inner(
        *,
        plan:subscription_plans(*)
      )
    `)
    .eq('subdomain', subdomain)
    .eq('status', 'active')
    .maybeSingle();
  
  // If not found, try custom domain
  if (!tenant) {
    console.log(`🔍 Subdomain not found, trying custom domain: ${hostname}`);
    
    const { data } = await supabase
      .from('tenants')
      .select(`
        *,
        subscription:tenant_subscriptions!inner(
          *,
          plan:subscription_plans(*)
        )
      `)
      .eq('custom_domain', hostname)
      .eq('status', 'active')
      .maybeSingle();
    
    tenant = data;
  }
  
  if (tenant) {
    console.log(`✅ Tenant found: ${tenant.business_name} (${tenant.id})`);
  } else {
    console.log(`⚠️ No tenant found for hostname: ${hostname}`);
  }
  
  return tenant;
}

/**
 * Get tenant context for request
 * For now, returns default tenant (first tenant in database)
 * TODO: Implement proper subdomain routing in production
 */
export async function getTenantContext(request?: Request): Promise<TenantContext> {
  const supabase = createSupabaseClient();
  
  let tenant: any = null;
  
  // If request is provided, try to get tenant from hostname
  if (request) {
    try {
      const url = new URL(request.url);
      tenant = await getTenantByDomain(url.hostname);
    } catch (error) {
      console.error('Error getting tenant from hostname:', error);
    }
  }
  
  // Fallback: Get default tenant (first tenant in database)
  if (!tenant) {
    console.log('📌 Using default tenant (first in database)');
    
    const { data } = await supabase
      .from('tenants')
      .select(`
        *,
        subscription:tenant_subscriptions!inner(
          *,
          plan:subscription_plans(*)
        )
      `)
      .eq('status', 'active')
      .limit(1)
      .single();
    
    tenant = data;
  }
  
  if (!tenant) {
    throw new Error('No active tenant found. Please run migration first.');
  }
  
  // Get API keys
  const apiKeys = await getTenantApiKeys(tenant.id);
  
  return {
    tenantId: tenant.id,
    tenantInfo: tenant,
    subscription: Array.isArray(tenant.subscription) ? tenant.subscription[0] : tenant.subscription,
    limits: tenant.subscription?.[0]?.plan?.limits || tenant.subscription?.plan?.limits || {},
    apiKeys
  };
}

/**
 * Get tenant's API keys (decrypted)
 * TODO: Implement proper encryption/decryption in production
 */
async function getTenantApiKeys(tenantId: string): Promise<Record<string, TenantApiKey>> {
  const supabase = createSupabaseClient();
  
  const { data: keys, error } = await supabase
    .from('tenant_api_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching tenant API keys:', error);
    return {};
  }
  
  if (!keys || keys.length === 0) {
    console.warn(`⚠️ No API keys found for tenant ${tenantId}`);
    return {};
  }
  
  // Convert array to object keyed by service name
  // Fixed TypeScript error: Properly type the accumulator
  return keys.reduce((acc: Record<string, TenantApiKey>, key: any) => {
    acc[key.service] = {
      apiKey: key.api_key_encrypted, // TODO: Decrypt in production
      apiSecret: key.api_secret_encrypted,
      accessToken: key.access_token_encrypted,
      config: key.config || {}
    };
    return acc;
  }, {} as Record<string, TenantApiKey>);
}

/**
 * Check if tenant can use a feature
 */
export function canUseFeature(
  tenantContext: TenantContext,
  feature: string
): boolean {
  const features = tenantContext.limits?.features || {};
  return features[feature] === true;
}

/**
 * Check usage limit
 */
export async function checkUsageLimit(
  tenantId: string,
  limitType: 'messages' | 'products' | 'conversations'
): Promise<{ allowed: boolean; message?: string }> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: allowed, error } = await supabase.rpc('check_tenant_limit', {
      p_tenant_id: tenantId,
      p_limit_type: limitType + '_per_month'
    });
    
    if (error) {
      console.error('Error checking tenant limit:', error);
      // Allow on error to not block operation
      return { allowed: true };
    }
    
    if (!allowed) {
      return {
        allowed: false,
        message: `Đã đạt giới hạn ${limitType}. Vui lòng nâng cấp gói!`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Exception checking tenant limit:', error);
    // Allow on error
    return { allowed: true };
  }
}

/**
 * Track usage
 */
export async function trackUsage(
  tenantId: string,
  usageType: 'message' | 'api_call' | 'seo_generation',
  quantity: number = 1,
  metadata: any = {}
) {
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase.from('tenant_usage_logs').insert({
      tenant_id: tenantId,
      usage_type: usageType,
      quantity,
      metadata,
      billing_period: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      created_at: new Date().toISOString()
    });
    
    if (error) {
      console.error('Error tracking usage:', error);
    }
  } catch (error) {
    console.error('Exception tracking usage:', error);
  }
}

/**
 * Track AI usage (tokens and cost)
 */
export async function trackAIUsage(
  tenantId: string,
  conversationId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  purpose: 'chatbot' | 'seo_generation' | 'ad_targeting' | 'image_analysis' = 'chatbot'
) {
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase.from('ai_usage_logs').insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost,
      purpose,
      created_at: new Date().toISOString()
    });
    
    if (error) {
      console.error('Error tracking AI usage:', error);
    }
  } catch (error) {
    console.error('Exception tracking AI usage:', error);
  }
}