// ============================================
// targeting/core/baseTargeting.ts
// ============================================

// Base interfaces cho tất cả platforms
export interface BaseTargetingRequest {
  imageData: string;
  productName?: string;
  productPrice?: number;
  productCategory?: string;
  additionalContext?: string;
  targetMarket?: 'vietnam' | 'international';
}

export interface BaseTargetingResponse {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'google';
  targeting: any; // Will be overridden by specific platform
  creativeStrategy: any;
  budgetRecommendations: any;
  campaignStrategy: any;
  executiveSummary: ExecutiveSummary;
}

export interface ExecutiveSummary {
  productType: string;
  primaryAudience: string;
  estimatedReach: string;
  budgetRange: string;
  expectedROAS: string;
  keyRecommendations: string[];
  topPlatforms: string[];
}

// Facebook-specific types
export namespace Facebook {
  export interface Demographics {
    ageRanges: AgeRange[];
    gender: Gender[];
    locations: LocationTargeting;
    languages: string[];
    relationshipStatus?: RelationshipStatus[];
    educationLevel?: EducationLevel[];
    workFields?: WorkField[];
    parentalStatus?: ParentalStatus[];
    householdIncome?: HouseholdIncome;
  }

  export type AgeRange = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  export type Gender = 'all' | 'male' | 'female';
  
  export interface LocationTargeting {
    type: 'countries' | 'cities' | 'regions';
    locations: Location[];
    radius?: { value: number; unit: 'km' | 'mi' };
  }
  
  export interface Location {
    name: string;
    key: string; // FB location key
    type: 'country' | 'city' | 'region';
  }

  export type RelationshipStatus = 'single' | 'in_relationship' | 'married' | 'engaged';
  export type EducationLevel = 'high_school' | 'college' | 'bachelor' | 'master' | 'doctorate';
  export type WorkField = 'business' | 'education' | 'healthcare' | 'retail' | 'technology';
  export type ParentalStatus = 'all_parents' | 'parents_toddlers' | 'parents_preschoolers' | 'parents_teens';
  export type HouseholdIncome = 'top_10%' | 'top_25%' | 'top_50%' | 'bottom_50%';

  export interface DetailedTargeting {
    interests: InterestCategory[];
    behaviors: BehaviorCategory[];
    lifeEvents?: LifeEvent[];
  }

  export interface InterestCategory {
    category: string;
    subcategories: string[];
    specificInterests: string[];
    facebookInterestIds?: string[]; // Real FB interest IDs
  }

  export interface BehaviorCategory {
    category: string;
    behaviors: string[];
    facebookBehaviorIds?: string[];
  }

  export type LifeEvent = 'recently_moved' | 'new_job' | 'anniversary' | 'birthday' | 'new_relationship';

  export interface Placements {
    feeds: boolean;
    stories: boolean;
    reels: boolean;
    instream: boolean;
    search: boolean;
    messenger: boolean;
    articles: boolean;
    audienceNetwork: boolean;
  }

  export interface BudgetRecommendations {
    daily: BudgetRange;
    lifetime?: BudgetRange;
    bidStrategy: BidStrategy;
    optimizationGoal: OptimizationGoal;
    schedule: Schedule;
  }

  export interface BudgetRange {
    min: number;
    recommended: number;
    max: number;
    currency: 'VND' | 'USD';
  }

  export type BidStrategy = 'lowest_cost' | 'cost_cap' | 'bid_cap' | 'minimum_roas';
  export type OptimizationGoal = 'reach' | 'impressions' | 'link_clicks' | 'conversions' | 'value';
  
  export interface Schedule {
    type: 'all_day' | 'specific_hours';
    hours?: number[]; // 0-23
    days?: string[]; // ['monday', 'tuesday', ...]
    timezone: string;
  }

  export interface CreativeStrategy {
    formats: CreativeFormat[];
    copyGuidelines: CopyGuidelines;
    visualGuidelines: VisualGuidelines;
    callToActions: CallToAction[];
  }

  export interface CreativeFormat {
    type: 'single_image' | 'carousel' | 'video' | 'collection' | 'slideshow';
    recommended: boolean;
    priority: 'high' | 'medium' | 'low';
    specs: CreativeSpecs;
    bestPractices: string[];
    examples: string[];
  }

  export interface CreativeSpecs {
    aspectRatio: string;
    resolution: string;
    fileSize: string;
    duration?: string;
    imageCount?: number;
  }

  export interface CopyGuidelines {
    primaryText: { min: number; max: number; recommended: number };
    headline: { max: number; recommended: number };
    description: { max: number; recommended: number };
    toneOfVoice: string;
    examples: CopyExample[];
  }

  export interface CopyExample {
    type: 'primary_text' | 'headline' | 'description';
    example: string;
    reasoning: string;
  }

  export interface VisualGuidelines {
    style: string[];
    colors: string[];
    composition: string[];
    dosList: string[];
    dontsList: string[];
  }

  export interface CallToAction {
    text: string;
    type: 'shop_now' | 'learn_more' | 'sign_up' | 'download' | 'contact_us' | 'watch_more';
    recommended: boolean;
  }

  export interface CampaignStructure {
    objective: CampaignObjective;
    funnel: FunnelStrategy;
    campaigns: Campaign[];
  }

  export type CampaignObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'app_promotion' | 'sales';

  export interface FunnelStrategy {
    top: FunnelStage;
    middle: FunnelStage;
    bottom: FunnelStage;
  }

  export interface FunnelStage {
    stage: 'awareness' | 'consideration' | 'conversion';
    objective: CampaignObjective;
    audienceType: string;
    contentTypes: string[];
    kpis: string[];
    budgetPercentage: number;
    campaigns: Campaign[];
  }

  export interface Campaign {
    name: string;
    objective: CampaignObjective;
    targeting: Partial<Demographics & DetailedTargeting>;
    creative: string;
    placements: Placements;
    budget: {
      daily: number;
      currency: 'VND' | 'USD';
    };
    schedule: Schedule;
  }

  export interface PerformanceBenchmarks {
    ctr: { min: number; avg: number; max: number };
    cpc: { min: number; avg: number; max: number };
    cpm: { min: number; avg: number; max: number };
    roas: { min: number; target: number; max: number };
    conversionRate: { min: number; avg: number; max: number };
  }

  export interface AudienceInsights {
    estimatedReach: { min: number; max: number };
    competitionLevel: 'low' | 'medium' | 'high';
    peakActivityTimes: {
      daysOfWeek: string[];
      hoursOfDay: number[];
    };
    contentPreferences: {
      formats: string[];
      themes: string[];
      length: string;
    };
  }
}