// ==================================================
// services/index.ts
// Main export file for all targeting services
// ==================================================

// Enhanced Gemini Service with Facebook validation
export {
  generateEnhancedAdTargeting,
  type EnhancedAdTargetingRequest,
} from './geminiAdTargetingService';

// Facebook API Client
export {
  FacebookApiClient,
  getFacebookClient,
  resetFacebookClient,
} from './facebook/facebookApiClient';

// Validator Service
export {
  TargetingValidator,
  validateTargetingFormat,
} from './facebook/validatorService';

// Types
export type {
  FacebookTargetingItem,
  FacebookSearchResponse,
  ValidatedTargeting,
  AudienceEstimate,
  CostEstimate,
  CompetitionLevel,
  EnhancedTargetingOption,
  EnhancedFacebookAdTargetingResponse,
  BatchValidationRequest,
  BatchValidationResponse,
  FacebookSearchOptions,
  CacheEntry,
} from './facebook/types';

// Constants
export {
  FACEBOOK_CONFIG,
  ERROR_MESSAGES,
  VIETNAMESE_FASHION_INTERESTS,
  COMMON_JOB_TITLES,
  VIETNAM_LOCATIONS,
  AGE_RANGES,
} from './facebook/constants';

// Utility functions (useful for custom implementations)
export {
  calculateSimilarity,
  findBestMatch,
  findMultipleMatches,
  formatAudienceSize,
  formatCurrency,
  detectLanguage,
  normalizeString,
  sanitizeQuery,
  generateCacheKey,
} from './facebook/utils';