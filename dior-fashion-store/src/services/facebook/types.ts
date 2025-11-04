// ==================================================
// services/facebook/types.ts
// TypeScript interfaces for Facebook Marketing API
// ==================================================

/**
 * Facebook Interest/Behavior object structure
 */
export interface FacebookDetailedTargeting {
  demographics: ValidatedTargeting[];  // Nhân khẩu học
  interests: ValidatedTargeting[];      // Mối quan tâm
  behaviors: ValidatedTargeting[];      // Hành vi
}
export interface FacebookTargetingItem {
  id: string;
  name: string;
  audience_size_lower_bound?: number;
  audience_size_upper_bound?: number;
  path?: string[];
  description?: string;
  topic?: string;
  disambiguation_category?: string;
  type?: string;
}

/**
 * Facebook API Search Response
 */
export interface FacebookSearchResponse {
  data: FacebookTargetingItem[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

/**
 * Validated targeting option with Facebook match
 */
export interface ValidatedTargeting {
  original: string;
  fbMatch?: FacebookTargetingItem;
  alternatives?: FacebookTargetingItem[];
  confidence: number; // 0-100
  isValid: boolean;
  type: 'interest' | 'behavior' | 'demographic' | 'job' | 'unknown';
}

/**
 * Audience size estimation
 */
export interface AudienceEstimate {
  min: number;
  max: number;
  total?: number;
}

/**
 * Cost estimation (CPM/CPC)
 */
export interface CostEstimate {
  cpm: {
    min: number;
    max: number;
    average: number;
  };
  cpc: {
    min: number;
    max: number;
    average: number;
  };
  currency: string;
}

/**
 * Competition level for targeting
 */
export type CompetitionLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Enhanced targeting option with Facebook validation
 */
export interface EnhancedTargetingOption {
  optionName: string;
  summary: string;
  
  demographics: {
    ageRange: string[];
    gender: string[];
    location: string[];
  };
  
  jobDetails: {
    specificJobs: string[];
    jobRelatedBehaviors: string[];
  };
  
  lifestyleAndInterests: {
    relevantInterests: string[];
    placesTheyGo: string[];
    toolsTheyUse: string[];
  };
  
  psychographics: {
    painPoints: string[];
    goals: string[];
    motivations: string[];
  };
  
  mediaConsumption: {
    influencersOrCreators: string[];
    publicationsOrBlogs: string[];
    preferredSocialPlatforms: string[];
  };
  
  creativeAngle: {
    mainMessage: string;
    suggestedHooks: string[];
  };
  
  facebookTargeting: {
    detailedInterests: string[];
    detailedBehaviors: string[];
    detailedDemographics: string[];
    exclusions: string[];
  };
  
  // NEW: Validation results
  validation?: {
    validatedInterests: ValidatedTargeting[];
    validatedBehaviors: ValidatedTargeting[];
    validatedDemographics: ValidatedTargeting[];
    overallConfidence: number; // 0-100
    warnings: string[];
  };
  
  // NEW: Metrics
  metrics?: {
    estimatedReach: AudienceEstimate;
    estimatedCosts: CostEstimate;
    competitionLevel: CompetitionLevel;
  };
  
  // NEW: Metadata
  metadata?: {
    generatedAt: string;
    validatedAt?: string;
    aiModel: string;
    fbApiVersion: string;
  };
}

/**
 * Enhanced response with validation
 */
export interface EnhancedFacebookAdTargetingResponse {
  productAnalysis: string;
  targetingOptions: EnhancedTargetingOption[];
  metadata: {
    generatedAt: string;
    processingTime: number; // milliseconds
    aiTokensUsed?: number;
    fbApiCallsUsed: number;
  };
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Search options for Facebook API
 */
export interface FacebookSearchOptions {
  query: string;
  type: 'adinterest' | 'adbehavior' | 'addemographics' | 'adworkemployer';
  limit?: number;
  locale?: string;
}

/**
 * Batch validation request
 */
export interface BatchValidationRequest {
  interests?: string[];
  behaviors?: string[];
  demographics?: string[];
}

/**
 * Batch validation response
 */
export interface BatchValidationResponse {
  interests: ValidatedTargeting[];
  behaviors: ValidatedTargeting[];
  demographics: ValidatedTargeting[];
  summary: {
    totalValidated: number;
    totalValid: number;
    totalInvalid: number;
    averageConfidence: number;
  };
}

/**
 * API Error response
 */
export interface FacebookAPIError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  requests: number[];
  lastReset: number;
}