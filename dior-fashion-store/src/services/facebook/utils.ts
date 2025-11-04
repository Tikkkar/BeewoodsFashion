// ==================================================
// services/facebook/utils.ts
// Utility functions for Facebook API integration
// ==================================================

import type { CacheEntry, FacebookTargetingItem } from './types';

/**
 * Simple in-memory cache implementation
 */
class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();

  set(key: string, data: T, ttl: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Remove expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

export const cache = new SimpleCache();

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  // Exact substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    return 85;
  }

  // Levenshtein-based similarity
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.round(similarity);
}

/**
 * Normalize string for comparison (lowercase, remove accents, special chars)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .trim();
}

/**
 * Find best match from a list of Facebook targeting items
 */
export function findBestMatch(
  query: string,
  items: FacebookTargetingItem[],
  threshold: number = 60
): { match: FacebookTargetingItem | null; confidence: number } {
  if (!items || items.length === 0) {
    return { match: null, confidence: 0 };
  }

  let bestMatch: FacebookTargetingItem | null = null;
  let bestScore = 0;

  for (const item of items) {
    const score = calculateSimilarity(query, item.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestScore >= threshold) {
    return { match: bestMatch, confidence: bestScore };
  }

  return { match: null, confidence: 0 };
}

/**
 * Find multiple matches (alternatives)
 */
export function findMultipleMatches(
  query: string,
  items: FacebookTargetingItem[],
  limit: number = 5,
  threshold: number = 50
): Array<{ match: FacebookTargetingItem; confidence: number }> {
  if (!items || items.length === 0) {
    return [];
  }

  const matches: Array<{ match: FacebookTargetingItem; confidence: number }> = [];

  for (const item of items) {
    const confidence = calculateSimilarity(query, item.name);
    if (confidence >= threshold) {
      matches.push({ match: item, confidence });
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches.slice(0, limit);
}

/**
 * Sanitize query string for Facebook API
 */
export function sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, 100); // Max length
}

/**
 * Generate cache key
 */
export function generateCacheKey(
  type: string,
  query: string,
  locale?: string
): string {
  const normalizedQuery = normalizeString(query);
  return `${type}:${normalizedQuery}:${locale || 'vi_VN'}`;
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`⚠️ Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array based on key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const k = item[key];
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}

/**
 * Calculate average from array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

/**
 * Format audience size for display
 */
export function formatAudienceSize(size: number): string {
  if (size >= 1000000) {
    return `${(size / 1000000).toFixed(1)}M`;
  }
  if (size >= 1000) {
    return `${(size / 1000).toFixed(1)}K`;
  }
  return size.toString();
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Detect language of text
 */
export function detectLanguage(text: string): 'vi' | 'en' | 'unknown' {
  // Simple detection based on Vietnamese characters
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  
  if (vietnameseChars.test(text)) {
    return 'vi';
  }
  
  // Check if mostly English
  const englishWords = text.match(/\b[a-z]+\b/gi);
  if (englishWords && englishWords.length > 0) {
    return 'en';
  }
  
  return 'unknown';
}

/**
 * Validate Facebook access token format
 */
export function isValidAccessToken(token: string): boolean {
  // Basic validation: ensure token is a string and has a reasonable length
  return typeof token === 'string' && token.length > 50 && token.length < 500;
}


/**
 * Build Facebook API URL
 */
export function buildFacebookApiUrl(
  version: string,
  endpoint: string,
  params: Record<string, any>
): string {
  const baseUrl = `https://graph.facebook.com/${version}${endpoint}`;
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  
  return `${baseUrl}?${searchParams.toString()}`;
}