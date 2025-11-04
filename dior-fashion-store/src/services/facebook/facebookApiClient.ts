// ==================================================
// services/facebook/facebookApiClient.ts
// Main Facebook Marketing API client with caching & rate limiting
// ==================================================

import {
  FACEBOOK_CONFIG,
  ERROR_MESSAGES,
} from './constants.ts';
import type {
  FacebookTargetingItem,
  FacebookSearchResponse,
  FacebookSearchOptions,
  FacebookAPIError,
  RateLimiterState,
} from './types.ts';
import {
  cache,
  generateCacheKey,
  sanitizeQuery,
  retryWithBackoff,
  buildFacebookApiUrl,
  isValidAccessToken,
  sleep,
} from './utils.ts';

/**
 * Simple rate limiter
 */
class RateLimiter {
  private state: RateLimiterState = {
    requests: [],
    lastReset: Date.now(),
  };
  
  private readonly maxRequests = FACEBOOK_CONFIG.RATE_LIMITS.MAX_REQUESTS_PER_HOUR;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour

  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset if window has passed
    if (now - this.state.lastReset >= this.windowMs) {
      this.state.requests = [];
      this.state.lastReset = now;
    }
    
    // Remove old requests outside the window
    this.state.requests = this.state.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    // Check if limit exceeded
    if (this.state.requests.length >= this.maxRequests) {
      const oldestRequest = this.state.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.warn(`⚠️ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await sleep(waitTime);
      
      // Recurse to check again
      return this.checkLimit();
    }
    
    // Record this request
    this.state.requests.push(now);
  }

  getStatus(): { used: number; limit: number; remaining: number } {
    const now = Date.now();
    const recentRequests = this.state.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    return {
      used: recentRequests.length,
      limit: this.maxRequests,
      remaining: this.maxRequests - recentRequests.length,
    };
  }
}

/**
 * Facebook Marketing API Client
 */
export class FacebookApiClient {
  private accessToken: string;
  private rateLimiter: RateLimiter;
  private apiVersion: string;

  constructor(accessToken: string) {
    if (!isValidAccessToken(accessToken)) {
      throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
    }
    
    this.accessToken = accessToken;
    this.rateLimiter = new RateLimiter();
    this.apiVersion = FACEBOOK_CONFIG.API_VERSION;
  }

  /**
   * Generic method to call Facebook API
   */
  private async callApi<T>(url: string): Promise<T> {
    await this.rateLimiter.checkLimit();

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData: FacebookAPIError = await response.json();
        throw new Error(
          errorData.message || ERROR_MESSAGES.GENERIC_ERROR
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      throw error;
    }
  }

  /**
   * Search for targeting options (interests, behaviors, demographics)
   */
  async search(options: FacebookSearchOptions): Promise<FacebookTargetingItem[]> {
    const {
      query,
      type,
      limit = FACEBOOK_CONFIG.SEARCH_LIMITS.DEFAULT_LIMIT,
      locale = 'vi_VN',
    } = options;

    // Validate query
    const sanitized = sanitizeQuery(query);
    if (sanitized.length < FACEBOOK_CONFIG.SEARCH_LIMITS.MIN_QUERY_LENGTH) {
      throw new Error(ERROR_MESSAGES.INVALID_QUERY);
    }

    // Check cache first
    const cacheKey = generateCacheKey(type, sanitized, locale);
    const cached = cache.get(cacheKey) as FacebookTargetingItem[] | null;
    if (cached && Array.isArray(cached)) {
      console.log(`✅ Cache hit for: ${cacheKey}`);
      return cached;
    }

    // Build API URL
    const url = buildFacebookApiUrl(this.apiVersion, '/search', {
      type,
      q: sanitized,
      limit,
      locale,
      access_token: this.accessToken,
    });

    // Call API with retry logic
    // NOTE: some TS configs complain when passing a type arg directly to retryWithBackoff.
    // So we let TS infer the generic by casting the callback return to the expected Promise type.
    const response = await retryWithBackoff(
      () => this.callApi(url) as Promise<FacebookSearchResponse>
    );

    // Ensure results typed correctly
    const results: FacebookTargetingItem[] = response?.data ?? [];
    
    // Cache results (ttl from config)
    const ttl = FACEBOOK_CONFIG.CACHE_TTL.INTERESTS;
    cache.set(cacheKey, results, ttl);
    
    console.log(`✅ Found ${results.length} results for "${sanitized}" (${type})`);
    return results;
  }

  /**
   * Search interests specifically
   */
  async searchInterests(
    query: string,
    limit?: number,
    locale?: string
  ): Promise<FacebookTargetingItem[]> {
    return this.search({
      query,
      type: 'adinterest',
      limit,
      locale,
    });
  }

  /**
   * Search behaviors specifically
   */
  async searchBehaviors(
    query: string,
    limit?: number,
    locale?: string
  ): Promise<FacebookTargetingItem[]> {
    return this.search({
      query,
      type: 'adbehavior',
      limit,
      locale,
    });
  }

  /**
   * Search demographics specifically
   */
  async searchDemographics(
    query: string,
    limit?: number,
    locale?: string
  ): Promise<FacebookTargetingItem[]> {
    return this.search({
      query,
      type: 'addemographics',
      limit,
      locale,
    });
  }

  /**
   * Search job titles
   */
  async searchJobs(
    query: string,
    limit?: number,
    locale?: string
  ): Promise<FacebookTargetingItem[]> {
    return this.search({
      query,
      type: 'adworkemployer',
      limit,
      locale,
    });
  }

  /**
   * Batch search multiple queries
   */
  async batchSearch(
    queries: string[],
    type: FacebookSearchOptions['type'],
    locale?: string
  ): Promise<Map<string, FacebookTargetingItem[]>> {
    const results = new Map<string, FacebookTargetingItem[]>();

    for (const query of queries) {
      try {
        const items = await this.search({ query, type, locale });
        results.set(query, items);
      } catch (error) {
        console.error(`❌ Error searching "${query}":`, error);
        results.set(query, []);
      }
    }

    return results;
  }

  /**
   * Get rate limiter status
   */
  getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: cache.size(),
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    cache.clear();
    console.log('✅ Cache cleared');
  }
}

/**
 * Create a singleton instance (optional)
 */
let clientInstance: FacebookApiClient | null = null;

export function getFacebookClient(accessToken?: string): FacebookApiClient {
  if (!clientInstance) {
    if (!accessToken) {
      throw new Error('Access token required for first initialization');
    }
    clientInstance = new FacebookApiClient(accessToken);
  }
  return clientInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetFacebookClient(): void {
  clientInstance = null;
}
