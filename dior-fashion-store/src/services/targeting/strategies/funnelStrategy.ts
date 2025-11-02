// ============================================
// targeting/strategies/funnelStrategy.ts
// ============================================

import { Facebook } from '../core/baseTargeting';

export interface FunnelStrategyResult {
  overview: FunnelOverview;
  stages: {
    awareness: FunnelStage;
    consideration: FunnelStage;
    conversion: FunnelStage;
  };
  retargeting: RetargetingStrategy;
  campaignStructure: CampaignHierarchy;
  sequencing: CampaignSequencing;
}

export interface FunnelOverview {
  approach: string;
  totalBudget: number;
  expectedTimeline: string;
  keyMetrics: string[];
  successCriteria: string[];
}

export interface FunnelStage {
  name: string;
  objective: Facebook.CampaignObjective;
  budgetPercentage: number;
  budgetAmount: number;
  audience: AudienceDefinition;
  content: ContentStrategy;
  placements: Facebook.Placements;
  kpis: KPI[];
  campaigns: DetailedCampaign[];
  optimizationTips: string[];
}

export interface AudienceDefinition {
  type: 'cold' | 'warm' | 'hot';
  description: string;
  size: string;
  targeting: any;
  excludeAudiences?: string[];
}

export interface ContentStrategy {
  formats: string[];
  themes: string[];
  messaging: string[];
  examples: string[];
}

export interface KPI {
  metric: string;
  target: string;
  priority: 'primary' | 'secondary';
  description: string;
}

export interface DetailedCampaign {
  campaignName: string;
  objective: Facebook.CampaignObjective;
  adSets: AdSet[];
  estimatedBudget: {
    daily: number;
    monthly: number;
  };
  expectedResults: ExpectedResults;
  setupInstructions: string[];
}

export interface AdSet {
  name: string;
  targeting: {
    demographics: Partial<Facebook.Demographics>;
    detailedTargeting?: Partial<Facebook.DetailedTargeting>;
    customAudiences?: string[];
    excludeAudiences?: string[];
    lookalike?: any;
  };
  placements: Facebook.Placements;
  optimization: {
    goal: Facebook.OptimizationGoal;
    bidStrategy: Facebook.BidStrategy;
    bidAmount?: number;
  };
  schedule: Facebook.Schedule;
  ads: AdCreative[];
}

export interface AdCreative {
  name: string;
  format: string;
  primaryText: string;
  headline: string;
  description?: string;
  callToAction: string;
  imageSpecs: string;
}

export interface ExpectedResults {
  reach: { min: number; max: number };
  impressions: { min: number; max: number };
  clicks?: { min: number; max: number };
  conversions?: { min: number; max: number };
  cost: {
    cpm: { min: number; max: number };
    cpc?: { min: number; max: number };
    cpa?: { min: number; max: number };
  };
  roas?: { min: number; expected: number; max: number };
}

export interface RetargetingStrategy {
  flows: RetargetingFlow[];
  customAudiences: CustomAudience[];
  exclusionStrategy: ExclusionStrategy;
  budgetAllocation: number;
}

export interface RetargetingFlow {
  name: string;
  trigger: string;
  sequence: RetargetingStep[];
  expectedConversionRate: number;
  avgTimeToConvert: string;
}

export interface RetargetingStep {
  day: number;
  audienceCondition: string;
  adMessage: string;
  offer?: string;
  urgency: string;
  expectedCTR: number;
}

export interface CustomAudience {
  name: string;
  definition: string;
  size: string;
  retentionDays: number;
  useCase: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ExclusionStrategy {
  alwaysExclude: string[];
  conditionalExclusions: ConditionalExclusion[];
  reasoning: string;
}

export interface ConditionalExclusion {
  audience: string;
  condition: string;
  reasoning: string;
}

export interface CampaignHierarchy {
  structure: string;
  campaigns: CampaignLevel[];
  namingConvention: NamingConvention;
  organizationTips: string[];
}

export interface CampaignLevel {
  level: 'campaign' | 'ad_set' | 'ad';
  count: number;
  purpose: string;
  bestPractices: string[];
}

export interface NamingConvention {
  pattern: string;
  examples: string[];
  variables: string[];
}

export interface CampaignSequencing {
  launchOrder: LaunchPhase[];
  dependencies: string[];
  timeline: string;
  milestones: Milestone[];
}

export interface LaunchPhase {
  phase: number;
  name: string;
  duration: string;
  campaigns: string[];
  goal: string;
  successCriteria: string;
  nextSteps: string;
}

export interface Milestone {
  day: number;
  checkpoint: string;
  expectedMetrics: Record<string, string>;
  action: string;
}

export class FunnelStrategyBuilder {
  /**
   * Build complete funnel-based campaign structure
   */
  static buildFunnelStrategy(
    productPrice: number,
    monthlyBudget: number,
    targetROAS: number
  ): FunnelStrategyResult {
    return {
      overview: this.buildOverview(monthlyBudget, targetROAS),
      stages: {
        awareness: this.buildAwarenessStage(monthlyBudget * 0.20),
        consideration: this.buildConsiderationStage(monthlyBudget * 0.30),
        conversion: this.buildConversionStage(monthlyBudget * 0.50, productPrice, targetROAS),
      },
      retargeting: this.buildRetargetingStrategy(monthlyBudget * 0.30),
      campaignStructure: this.buildCampaignHierarchy(),
      sequencing: this.buildCampaignSequencing(),
    };
  }

  private static buildOverview(monthlyBudget: number, targetROAS: number): FunnelOverview {
    return {
      approach: 'Full-funnel strategy optimized for e-commerce conversions',
      totalBudget: monthlyBudget,
      expectedTimeline: '30-90 days to full optimization',
      keyMetrics: [
        'ROAS (Target: ' + targetROAS + 'x)',
        'Customer Acquisition Cost (CAC)',
        'Conversion Rate',
        'Average Order Value (AOV)',
      ],
      successCriteria: [
        `Achieve ${targetROAS}x ROAS consistently for 14+ days`,
        'CAC under 30% of customer lifetime value',
        'Conversion rate above 2.5%',
        'Positive feedback score (>2.0)',
      ],
    };
  }

  private static buildAwarenessStage(budget: number): FunnelStage {
    return {
      name: 'Awareness (Top of Funnel)',
      objective: 'awareness',
      budgetPercentage: 20,
      budgetAmount: budget,
      audience: {
        type: 'cold',
        description: 'Broad audience with relevant interests, no prior engagement',
        size: '500K - 1M',
        targeting: {
          interests: ['Fashion', 'Online Shopping', 'Lifestyle'],
          demographics: {
            ageRanges: ['18-45'],
            gender: ['all'],
          },
        },
      },
      content: {
        formats: ['Video (15-30s)', 'Carousel', 'Single Image'],
        themes: [
          'Brand introduction',
          'Product showcase',
          'Value proposition',
          'Behind-the-scenes',
        ],
        messaging: [
          'Introduce your brand story',
          'Showcase product benefits (not features)',
          'Build emotional connection',
          'Educational content',
        ],
        examples: [
          'Video: "Meet [Brand]: Quality Fashion for Modern Life"',
          'Carousel: "5 Reasons Why Our Customers Love Us"',
          'Image: "Sustainable Style That Lasts"',
        ],
      },
      placements: {
        feeds: true,
        stories: true,
        reels: true,
        instream: true,
        search: false,
        messenger: false,
        articles: true,
        audienceNetwork: true,
      },
      kpis: [
        {
          metric: 'Reach',
          target: '300K+ unique users',
          priority: 'primary',
          description: 'Number of unique people who saw your ads',
        },
        {
          metric: 'Video Views',
          target: '100K+ 3-second views',
          priority: 'primary',
          description: 'People who watched at least 3 seconds',
        },
        {
          metric: 'CPM',
          target: '< 100,000 VND',
          priority: 'secondary',
          description: 'Cost per 1,000 impressions',
        },
        {
          metric: 'ThruPlay Rate',
          target: '> 25%',
          priority: 'secondary',
          description: 'Percentage who watched full video',
        },
      ],
      campaigns: [
        {
          campaignName: 'TOF - Brand Awareness - Fashion Lovers',
          objective: 'awareness',
          estimatedBudget: {
            daily: budget / 30 * 0.5,
            monthly: budget * 0.5,
          },
          adSets: [
            {
              name: 'AS - Women 18-35 - Fashion Interests',
              targeting: {
                demographics: {
                  ageRanges: ['18-24', '25-34'],
                  gender: ['female'],
                  locations: {
                    type: 'cities',
                    locations: [
                      { name: 'Ho Chi Minh City', key: '1583992208336934', type: 'city' },
                      { name: 'Hanoi', key: '1567543296597055', type: 'city' },
                    ],
                  },
                  languages: ['vi'],
                },
                detailedTargeting: {
                  interests: [
                    {
                      category: 'Shopping and Fashion',
                      subcategories: ['Online Shopping', 'Fashion'],
                      specificInterests: ['Zara', 'H&M', 'Fashion boutiques'],
                    },
                  ],
                  behaviors: [],
                },
              },
              placements: {
                feeds: true,
                stories: true,
                reels: true,
                instream: false,
                search: false,
                messenger: false,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'reach',
                bidStrategy: 'lowest_cost',
              },
              schedule: {
                type: 'all_day',
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - Brand Story Video',
                  format: 'video',
                  primaryText: '✨ Discover [Brand]: Where Quality Meets Style\n\nWe believe everyone deserves clothes that make them feel confident. Premium materials, timeless designs, prices that make sense.\n\n👉 Tap to explore our story',
                  headline: 'Quality Fashion for Real Life',
                  description: 'Sustainable. Affordable. Stylish.',
                  callToAction: 'Learn More',
                  imageSpecs: '1:1 or 4:5 video, 15-30 seconds',
                },
              ],
            },
          ],
          expectedResults: {
            reach: { min: 150000, max: 250000 },
            impressions: { min: 500000, max: 800000 },
            cost: {
              cpm: { min: 60000, max: 100000 },
            },
          },
          setupInstructions: [
            '1. Create campaign with "Brand Awareness" objective',
            '2. Set daily budget to recommended amount',
            '3. Create ad set with specified targeting',
            '4. Choose automatic placements (recommended)',
            '5. Upload video creative with captions',
            '6. Set optimization goal to "Reach"',
            '7. Monitor CPM and reach daily',
          ],
        },
        {
          campaignName: 'TOF - Video Views - Product Showcase',
          objective: 'awareness',
          estimatedBudget: {
            daily: budget / 30 * 0.5,
            monthly: budget * 0.5,
          },
          adSets: [
            {
              name: 'AS - Broad Fashion Audience',
              targeting: {
                demographics: {
                  ageRanges: ['18-24', '25-34', '35-44'],
                  gender: ['all'],
                  locations: {
                    type: 'cities',
                    locations: [
                      { name: 'Ho Chi Minh City', key: '1583992208336934', type: 'city' },
                      { name: 'Hanoi', key: '1567543296597055', type: 'city' },
                      { name: 'Da Nang', key: '1591597197775056', type: 'city' },
                    ],
                  },
                  languages: ['vi'],
                },
                detailedTargeting: {
                  interests: [
                    {
                      category: 'Shopping and Fashion',
                      subcategories: [],
                      specificInterests: ['Fashion', 'Clothing', 'Shopping'],
                    },
                  ],
                  behaviors: [],
                },
              },
              placements: {
                feeds: true,
                stories: true,
                reels: true,
                instream: true,
                search: false,
                messenger: false,
                articles: false,
                audienceNetwork: true,
              },
              optimization: {
                goal: 'impressions',
                bidStrategy: 'lowest_cost',
              },
              schedule: {
                type: 'all_day',
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - Product Collection Video',
                  format: 'video',
                  primaryText: '🔥 NEW COLLECTION JUST DROPPED!\n\nFrom casual weekends to office chic - we\'ve got your whole week covered.\n\n💫 Premium fabrics\n✨ Perfect fits\n🎁 Free shipping over 500K\n\nWatch now 👇',
                  headline: 'Your New Wardrobe Essentials',
                  description: 'Shop the full collection',
                  callToAction: 'Watch More',
                  imageSpecs: '1:1 or 9:16 video, 15-30 seconds, fast-paced',
                },
              ],
            },
          ],
          expectedResults: {
            reach: { min: 200000, max: 350000 },
            impressions: { min: 800000, max: 1200000 },
            clicks: { min: 5000, max: 10000 },
            cost: {
              cpm: { min: 50000, max: 80000 },
            },
          },
          setupInstructions: [
            '1. Create campaign with "Brand Awareness" objective',
            '2. Select "Video views" as sub-objective',
            '3. Set up broad interest targeting',
            '4. Enable all placements for maximum reach',
            '5. Upload attention-grabbing video (hook in first 3 seconds)',
            '6. Add captions (most watch without sound)',
            '7. Track ThruPlay rate and adjust creative if needed',
          ],
        },
      ],
      optimizationTips: [
        'Focus on creative quality - awareness is about making a good first impression',
        'Test different video hooks to see what stops the scroll',
        'Don\'t optimize for conversions yet - this is about reach and brand recall',
        'A/B test broad interests vs lookalike audiences',
        'Monitor frequency - keep it under 2.0 to avoid ad fatigue',
        'Use this stage to build custom audiences for retargeting',
      ],
    };
  }

  private static buildConsiderationStage(budget: number): FunnelStage {
    return {
      name: 'Consideration (Middle of Funnel)',
      objective: 'traffic',
      budgetPercentage: 30,
      budgetAmount: budget,
      audience: {
        type: 'warm',
        description: 'People who engaged with awareness content but haven\'t visited website',
        size: '100K - 300K',
        targeting: {
          customAudiences: [
            'Video viewers (25%)',
            'Page engagers (90 days)',
            'Instagram engagers (90 days)',
          ],
        },
        excludeAudiences: ['Website visitors (30 days)', 'Recent purchasers (30 days)'],
      },
      content: {
        formats: ['Carousel', 'Collection', 'Video (30-60s)'],
        themes: [
          'Product benefits and features',
          'Social proof (reviews, testimonials)',
          'How-to and styling guides',
          'Comparison with alternatives',
        ],
        messaging: [
          'Address common objections',
          'Highlight unique selling points',
          'Show social proof and reviews',
          'Educational content that builds trust',
        ],
        examples: [
          'Carousel: "5 Reasons Our Customers Choose Us"',
          'Video: "Real Reviews from Real Customers"',
          'Collection: "Complete the Look: Mix & Match Guide"',
        ],
      },
      placements: {
        feeds: true,
        stories: true,
        reels: true,
        instream: false,
        search: true,
        messenger: true,
        articles: false,
        audienceNetwork: false,
      },
      kpis: [
        {
          metric: 'Link Clicks',
          target: '5,000+ clicks',
          priority: 'primary',
          description: 'People clicking to website',
        },
        {
          metric: 'CTR',
          target: '> 2.0%',
          priority: 'primary',
          description: 'Click-through rate',
        },
        {
          metric: 'CPC',
          target: '< 8,000 VND',
          priority: 'secondary',
          description: 'Cost per click',
        },
        {
          metric: 'Landing Page Views',
          target: '3,000+',
          priority: 'secondary',
          description: 'People who loaded your landing page',
        },
      ],
      campaigns: [
        {
          campaignName: 'MOF - Traffic - Engaged Audience',
          objective: 'traffic',
          estimatedBudget: {
            daily: budget / 30 * 0.6,
            monthly: budget * 0.6,
          },
          adSets: [
            {
              name: 'AS - Video Viewers 25% - Last 14 Days',
              targeting: {
                customAudiences: ['Video viewers (25%+ in last 14 days)'],
                demographics: {
                  ageRanges: ['18-24', '25-34', '35-44'],
                  gender: ['all'],
                },
              },
              placements: {
                feeds: true,
                stories: true,
                reels: true,
                instream: false,
                search: true,
                messenger: false,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'link_clicks',
                bidStrategy: 'lowest_cost',
              },
              schedule: {
                type: 'specific_hours',
                hours: [10, 11, 12, 18, 19, 20, 21],
                days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - Product Benefits Carousel',
                  format: 'carousel',
                  primaryText: '👋 Noticed you checked us out!\n\nHere\'s why 10,000+ customers trust us:\n\n✅ Premium quality materials\n✅ Perfect fit guarantee\n✅ 30-day free returns\n✅ Fast shipping (24-48h)\n✅ Eco-friendly packaging\n\nSwipe to see customer reviews 👉',
                  headline: 'Why Choose Us?',
                  description: 'See what makes us different',
                  callToAction: 'Shop Now',
                  imageSpecs: '5-card carousel, 1:1, product + lifestyle mix',
                },
              ],
            },
            {
              name: 'AS - Page Engagers - Last 30 Days',
             targeting: {
                demographics: {
                    ageRanges: ['18-45'] as any, // or spread valid age ranges
                    gender: ['all'],
                },
                customAudiences: ['Video viewers (25%+ in last 14 days)'],
                },
              placements: {
                feeds: true,
                stories: true,
                reels: false,
                instream: false,
                search: true,
                messenger: true,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'link_clicks',
                bidStrategy: 'cost_cap',
                bidAmount: 8000,
              },
              schedule: {
                type: 'all_day',
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - Social Proof Video',
                  format: 'video',
                  primaryText: '⭐ 4.9/5 Stars from 10,000+ Reviews\n\n"Best quality for the price!" - Minh A.\n"My go-to store for work clothes" - Thu N.\n"Fast shipping, easy returns!" - Hùng T.\n\nJoin thousands of happy customers 👇',
                  headline: 'See Why They Love Us',
                  description: 'Real reviews, real customers',
                  callToAction: 'Learn More',
                  imageSpecs: '1:1 video montage, 30-45s, customer testimonials',
                },
              ],
            },
          ],
          expectedResults: {
            reach: { min: 50000, max: 100000 },
            impressions: { min: 200000, max: 400000 },
            clicks: { min: 3000, max: 6000 },
            cost: {
              cpm: { min: 80000, max: 120000 },
              cpc: { min: 6000, max: 10000 },
            },
          },
          setupInstructions: [
            '1. Create campaign with "Traffic" objective',
            '2. Choose "Website" as traffic destination',
            '3. Create custom audiences from awareness campaigns',
            '4. Set up retargeting with proper exclusions',
            '5. Optimize for "Link Clicks"',
            '6. Install Facebook Pixel if not done already',
            '7. Track landing page behavior in Events Manager',
          ],
        },
        {
          campaignName: 'MOF - Engagement - Social Proof',
          objective: 'engagement',
          estimatedBudget: {
            daily: budget / 30 * 0.4,
            monthly: budget * 0.4,
          },
          adSets: [
            {
              name: 'AS - Lookalike 1% Engaged Users',
              targeting: {
                demographics:{
                ageRanges: ['18-45'] as any, // or spread valid age ranges
                gender: ['all'],
            },
                lookalike: {
                  source: 'Page engagers',
                  percentage: 1,
                  countries: ['VN'],
                },
              },
              placements: {
                feeds: true,
                stories: true,
                reels: true,
                instream: false,
                search: false,
                messenger: false,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'impressions',
                bidStrategy: 'lowest_cost',
              },
              schedule: {
                type: 'all_day',
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - UGC Content Compilation',
                  format: 'video',
                  primaryText: '📸 Real customers, real style!\n\nSee how our community rocks our pieces. Tag us for a chance to be featured!\n\n#[YourBrand] #CustomerLove',
                  headline: 'Join Our Style Community',
                  description: 'Share your look with us',
                  callToAction: 'Shop Now',
                  imageSpecs: '1:1 or 4:5 video, 15-30s, UGC compilation',
                },
              ],
            },
          ],
          expectedResults: {
            reach: { min: 40000, max: 80000 },
            impressions: { min: 150000, max: 300000 },
            clicks: { min: 2000, max: 4000 },
            cost: {
              cpm: { min: 70000, max: 100000 },
              cpc: { min: 7000, max: 12000 },
            },
          },
          setupInstructions: [
            '1. Create "Engagement" objective campaign',
            '2. Create 1% lookalike of best engagers',
            '3. Optimize for post engagement',
            '4. Use authentic UGC content',
            '5. Encourage comments and shares',
            '6. Respond to comments quickly to boost engagement',
          ],
        },
      ],
      optimizationTips: [
        'This stage is about building trust - use social proof heavily',
        'Test different landing pages to see what converts visitors to customers',
        'Monitor bounce rate - high bounce means landing page doesn\'t match ad',
        'Use retargeting pixels to build audiences for bottom funnel',
        'A/B test carousel vs video formats',
        'Exclude recent website visitors to avoid overlap with conversion campaigns',
      ],
    };
  }

  private static buildConversionStage(budget: number, productPrice: number, targetROAS: number): FunnelStage {
    return {
      name: 'Conversion (Bottom of Funnel)',
      objective: 'sales',
      budgetPercentage: 50,
      budgetAmount: budget,
      audience: {
        type: 'hot',
        description: 'High-intent audiences: website visitors, cart abandoners, engaged users',
        size: '50K - 150K',
        targeting: {
          customAudiences: [
            'Website visitors (30 days)',
            'Add to cart (14 days)',
            'Initiate checkout (7 days)',
            'Product viewers (14 days)',
          ],
        },
        excludeAudiences: ['Purchasers (30 days)'],
      },
      content: {
        formats: ['Dynamic Product Ads', 'Collection', 'Carousel', 'Video'],
        themes: [
          'Direct product promotion',
          'Limited-time offers',
          'Free shipping / discounts',
          'Urgency and scarcity',
          'Cart abandonment reminders',
        ],
        messaging: [
          'Strong call-to-action',
          'Clear value proposition',
          'Address final objections',
          'Incentivize immediate action',
        ],
        examples: [
          'DPA: "You left something in your cart! Complete your order now"',
          'Collection: "Complete Your Look - 20% OFF Today"',
          'Carousel: "Last Chance - Limited Stock Available"',
        ],
      },
      placements: {
        feeds: true,
        stories: true,
        reels: true,
        instream: false,
        search: true,
        messenger: true,
        articles: false,
        audienceNetwork: false,
      },
      kpis: [
        {
          metric: 'ROAS',
          target: `${targetROAS}x+`,
          priority: 'primary',
          description: 'Return on ad spend',
        },
        {
          metric: 'Purchases',
          target: 'Varies by budget',
          priority: 'primary',
          description: 'Number of completed purchases',
        },
        {
          metric: 'Conversion Rate',
          target: '> 2.5%',
          priority: 'secondary',
          description: 'Percentage of clicks that convert',
        },
        {
          metric: 'CPA',
          target: `< ${productPrice * 0.7 / targetROAS} VND`,
          priority: 'secondary',
          description: 'Cost per acquisition',
        },
      ],
      campaigns: [
        {
          campaignName: 'BOF - Conversions - Website Retargeting',
          objective: 'sales',
          estimatedBudget: {
            daily: budget / 30 * 0.35,
            monthly: budget * 0.35,
          },
          adSets: [
            {
              name: 'AS - Add to Cart - Last 7 Days',
              targeting: {
                demographics: {
                ageRanges: ['18-45'] as any, // or spread valid age ranges
                gender: ['all'],
            },
                customAudiences: ['Add to Cart - Last 7 Days'],
                excludeAudiences: ['Purchasers - Last 30 Days'],
              },
              placements: {
                feeds: true,
                stories: true,
                reels: false,
                instream: false,
                search: true,
                messenger: true,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'conversions',
                bidStrategy: 'lowest_cost',
              },
              schedule: {
                type: 'all_day',
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - Cart Abandonment DPA',
                  format: 'dynamic',
                  primaryText: '🛒 You left something behind!\n\nYour items are waiting for you. Complete your order now and enjoy:\n\n✅ Free shipping on orders over 500K\n✅ 30-day easy returns\n✅ Secure checkout\n\nLimited stock - don\'t miss out! 👇',
                  headline: 'Complete Your Purchase',
                  description: 'Your cart expires in 24h',
                  callToAction: 'Shop Now',
                  imageSpecs: 'Dynamic Product Ads - auto-populated from catalog',
                },
              ],
            },
            {
              name: 'AS - Website Visitors - Last 14 Days',
              targeting: {
                demographics: {
                    ageRanges: ['18-45'] as any, // or spread valid age ranges
                    gender: ['all'],
                },
                customAudiences: ['Website Visitors - Last 14 Days'],
                excludeAudiences: ['Purchasers - Last 30 Days', 'Add to Cart - Last 7 Days'],
              },
              placements: {
                feeds: true,
                stories: true,
                reels: true,
                instream: false,
                search: true,
                messenger: false,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'conversions',
                bidStrategy: 'cost_cap',
                bidAmount: productPrice * 0.7 / targetROAS,
              },
              schedule: {
                type: 'specific_hours',
                hours: [11, 12, 13, 18, 19, 20, 21, 22],
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - Best Sellers Collection',
                  format: 'collection',
                  primaryText: '🔥 Still Deciding?\n\nCheck out our best-sellers - loved by 10,000+ customers!\n\n⭐ 4.9/5 rating\n🚚 Free shipping today\n💳 Easy payment options\n\nShop now and see why everyone\'s talking about us! 👇',
                  headline: 'Our Most-Loved Pieces',
                  description: 'Join thousands of happy customers',
                  callToAction: 'Shop Now',
                  imageSpecs: 'Collection ad with hero image + product grid',
                },
              ],
            },
          ],
          expectedResults: {
            reach: { min: 30000, max: 60000 },
            impressions: { min: 150000, max: 300000 },
            clicks: { min: 2000, max: 4000 },
            conversions: { min: 50, max: 120 },
            cost: {
              cpm: { min: 100000, max: 150000 },
              cpc: { min: 8000, max: 15000 },
              cpa: { min: productPrice * 0.5 / targetROAS, max: productPrice * 0.8 / targetROAS },
            },
            roas: { min: targetROAS * 0.8, expected: targetROAS, max: targetROAS * 1.5 },
          },
          setupInstructions: [
            '1. Create "Sales" objective campaign (Conversions)',
            '2. Set up Facebook Pixel with Purchase event',
            '3. Create custom audiences based on pixel events',
            '4. Set up Dynamic Product Ads with product catalog',
            '5. Optimize for "Conversions" (Purchase event)',
            '6. Use cost cap bid strategy after getting 50+ conversions',
            '7. Monitor ROAS daily and adjust budgets accordingly',
            '8. Set up abandoned cart email sequence in parallel',
          ],
        },
        {
          campaignName: 'BOF - Conversions - Lookalike Purchasers',
          objective: 'sales',
          estimatedBudget: {
            daily: budget / 30 * 0.40,
            monthly: budget * 0.40,
          },
          adSets: [
            {
              name: 'AS - LAL 1% Purchasers',
              targeting: {
                demographics: {
                    ageRanges: ['18-45'] as any, // or spread valid age ranges
                    gender: ['all'],
                },
                lookalike: {
                  source: 'Purchasers - Last 180 Days',
                  percentage: 1,
                  countries: ['VN'],
                },
                excludeAudiences: ['Website Visitors - Last 30 Days', 'Purchasers - Last 30 Days'],
              },
              placements: {
                feeds: true,
                stories: true,
                reels: true,
                instream: false,
                search: true,
                messenger: false,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'conversions',
                bidStrategy: 'lowest_cost',
              },
              schedule: {
                type: 'all_day',
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - New Customer Offer',
                  format: 'carousel',
                  primaryText: '🎁 FIRST ORDER SPECIAL!\n\nWelcome to [Brand]! Get 20% OFF your first purchase.\n\n💫 Premium quality\n🚚 Free shipping over 500K\n💳 Buy now, pay later options\n✨ Join 10,000+ happy customers\n\nUse code: FIRST20 at checkout 👇',
                  headline: 'Welcome Gift: 20% OFF',
                  description: 'New customer exclusive offer',
                  callToAction: 'Shop Now',
                  imageSpecs: '5-card carousel, best-selling products, 1:1',
                },
              ],
            },
          ],
          expectedResults: {
            reach: { min: 80000, max: 150000 },
            impressions: { min: 400000, max: 700000 },
            clicks: { min: 5000, max: 9000 },
            conversions: { min: 100, max: 200 },
            cost: {
              cpm: { min: 80000, max: 120000 },
              cpc: { min: 10000, max: 18000 },
              cpa: { min: productPrice * 0.6 / targetROAS, max: productPrice * 0.9 / targetROAS },
            },
            roas: { min: targetROAS * 0.7, expected: targetROAS * 0.9, max: targetROAS * 1.2 },
          },
          setupInstructions: [
            '1. Create lookalike audience from best customers (top 10% by value)',
            '2. Start with 1% lookalike - highest quality',
            '3. Use new customer discount to lower friction',
            '4. Exclude existing customers and recent visitors',
            '5. Let ad set run for at least 7 days before judging',
            '6. Once stable, test expanding to 2% lookalike',
          ],
        },
        {
          campaignName: 'BOF - Conversions - Engaged Shoppers',
          objective: 'sales',
          estimatedBudget: {
            daily: budget / 30 * 0.25,
            monthly: budget * 0.25,
          },
          adSets: [
            {
              name: 'AS - High Intent Actions',
              targeting: {
                customAudiences: [
                  'Product Page Viewers - Last 14 Days',
                  'Collection Page Viewers - Last 14 Days',
                ],
                demographics: {
                  ageRanges: ['18-24', '25-34', '35-44'],
                  gender: ['all'],
                },
                detailedTargeting: {
                  behaviors: [
                    {
                      category: 'Purchase Behavior',
                      behaviors: ['Engaged Shoppers'],
                    },
                  ],
                  interests: [],
                },
                excludeAudiences: ['Purchasers - Last 30 Days'],
              },
              placements: {
                feeds: true,
                stories: true,
                reels: false,
                instream: false,
                search: true,
                messenger: true,
                articles: false,
                audienceNetwork: false,
              },
              optimization: {
                goal: 'conversions',
                bidStrategy: 'minimum_roas' as any,
              },
              schedule: {
                type: 'specific_hours',
                hours: [10, 11, 12, 13, 18, 19, 20, 21, 22],
                timezone: 'Asia/Ho_Chi_Minh',
              },
              ads: [
                {
                  name: 'AD - Flash Sale Urgency',
                  format: 'video',
                  primaryText: '⚡ FLASH SALE ENDING SOON!\n\n40% OFF everything - Last few hours!\n\n⏰ Sale ends at midnight\n🔥 Limited stock remaining\n🚚 Order now for weekend delivery\n\nDon\'t miss out! Shop now 👇',
                  headline: '40% OFF - Ends Tonight!',
                  description: 'Limited time only',
                  callToAction: 'Shop Now',
                  imageSpecs: '1:1 or 4:5 video, 10-15s, countdown timer, urgent',
                },
              ],
            },
          ],
          expectedResults: {
            reach: { min: 20000, max: 40000 },
            impressions: { min: 100000, max: 200000 },
            clicks: { min: 1500, max: 3000 },
            conversions: { min: 40, max: 90 },
            cost: {
              cpm: { min: 120000, max: 180000 },
              cpc: { min: 12000, max: 20000 },
              cpa: { min: productPrice * 0.5 / targetROAS, max: productPrice * 0.7 / targetROAS },
            },
            roas: { min: targetROAS, expected: targetROAS * 1.2, max: targetROAS * 1.8 },
          },
          setupInstructions: [
            '1. Target people who viewed products but didn\'t add to cart',
            '2. Use urgency and scarcity in messaging',
            '3. Optimize for minimum ROAS to ensure profitability',
            '4. Schedule ads during peak shopping hours',
            '5. Test different discount levels (20%, 30%, 40%)',
            '6. Monitor frequency - refresh creative if >2.0',
          ],
        },
      ],
      optimizationTips: [
        'This is where you make money - monitor ROAS closely',
        'Don\'t be afraid to pause underperforming ad sets quickly',
        'Scale winners aggressively but carefully (20% budget increase every 3 days)',
        'Test different discount levels - sometimes 20% works better than 40%',
        'Make checkout process as smooth as possible',
        'Use urgency but don\'t fake it - must be genuine',
        'Implement abandoned cart email/SMS sequence',
        'Consider offering buy now, pay later options',
      ],
    };
  }

  private static buildRetargetingStrategy(budget: number): RetargetingStrategy {
    return {
      flows: [
        {
          name: 'Cart Abandonment Flow',
          trigger: 'User adds to cart but doesn\'t purchase',
          sequence: [
            {
              day: 0,
              audienceCondition: 'Add to Cart - Last 24 hours',
              adMessage: '🛒 You left something behind! Your items are still available. Complete your order now →',
              offer: 'Free shipping on orders over 500K',
              urgency: 'Cart expires in 24 hours',
              expectedCTR: 4.5,
            },
            {
              day: 1,
              audienceCondition: 'Still hasn\'t purchased',
              adMessage: '⏰ Last reminder! Your cart is waiting. Get 10% OFF if you complete your order today',
              offer: '10% discount code: COMEBACK10',
              urgency: 'Offer expires tonight at midnight',
              expectedCTR: 5.2,
            },
            {
              day: 3,
              audienceCondition: 'Still hasn\'t purchased',
              adMessage: '💝 We miss you! Here\'s 15% OFF to welcome you back. Your items are still available!',
              offer: '15% discount code: WELCOME15',
              urgency: 'Limited time - 48 hours only',
              expectedCTR: 3.8,
            },
          ],
          expectedConversionRate: 12,
          avgTimeToConvert: '2-5 days',
        },
        {
          name: 'Browse Abandonment Flow',
          trigger: 'User views products but doesn\'t add to cart',
          sequence: [
            {
              day: 1,
              audienceCondition: 'Product viewers - Last 48 hours',
              adMessage: '👀 Still thinking about it? Check out what other customers are saying! ⭐4.9/5 stars',
              offer: 'Free shipping today only',
              urgency: 'Limited stock on popular items',
              expectedCTR: 3.2,
            },
            {
              day: 3,
              audienceCondition: 'Still hasn\'t added to cart',
              adMessage: '💡 Complete your look! Here are items that go perfectly with what you viewed',
              offer: 'Buy 2 Get 1 Free on selected items',
              urgency: 'Sale ends in 48 hours',
              expectedCTR: 2.8,
            },
            {
              day: 7,
              audienceCondition: 'Still hasn\'t converted',
              adMessage: '🎁 One last chance! 20% OFF everything + free shipping for you',
              offer: '20% sitewide discount',
              urgency: 'Expires in 24 hours',
              expectedCTR: 4.1,
            },
          ],
          expectedConversionRate: 8,
          avgTimeToConvert: '3-7 days',
        },
        {
          name: 'Post-Purchase Upsell Flow',
          trigger: 'User completes a purchase',
          sequence: [
            {
              day: 1,
              audienceCondition: 'Purchasers - Last 24 hours',
              adMessage: '🎉 Thank you for your order! Complete your look with these matching items - 25% OFF',
              offer: '25% off second purchase',
              urgency: '24-hour exclusive offer',
              expectedCTR: 5.5,
            },
            {
              day: 7,
              audienceCondition: 'Received their order',
              adMessage: '❤️ Loving your purchase? Share a photo and get 30% OFF your next order!',
              offer: '30% off next purchase for review',
              urgency: 'Share within 7 days',
              expectedCTR: 3.2,
            },
            {
              day: 30,
              audienceCondition: 'Ready for repurchase',
              adMessage: '✨ Time to refresh your wardrobe! New arrivals are here + VIP discount just for you',
              offer: '20% VIP discount',
              urgency: 'This month only',
              expectedCTR: 4.8,
            },
          ],
          expectedConversionRate: 15,
          avgTimeToConvert: '1-30 days',
        },
      ],
      customAudiences: [
        {
          name: 'Website Visitors - Last 180 Days',
          definition: 'All website visitors in the last 180 days',
          size: 'Large (100K+)',
          retentionDays: 180,
          useCase: 'Broad retargeting, brand awareness',
          priority: 'medium',
        },
        {
          name: 'Product Page Viewers - Last 30 Days',
          definition: 'Viewed at least one product page',
          size: 'Medium (50K+)',
          retentionDays: 30,
          useCase: 'High-intent retargeting',
          priority: 'high',
        },
        {
          name: 'Add to Cart - Last 14 Days',
          definition: 'Added item to cart but didn\'t purchase',
          size: 'Small (10K+)',
          retentionDays: 14,
          useCase: 'Cart abandonment campaigns - highest priority',
          priority: 'high',
        },
        {
          name: 'Initiate Checkout - Last 7 Days',
          definition: 'Started checkout process but didn\'t complete',
          size: 'Small (5K+)',
          retentionDays: 7,
          useCase: 'Urgent cart recovery - very high intent',
          priority: 'high',
        },
        {
          name: 'Purchasers - Last 180 Days',
          definition: 'Completed at least one purchase',
          size: 'Small (5-10K)',
          retentionDays: 180,
          useCase: 'Exclusion from prospecting, upsell/cross-sell campaigns',
          priority: 'high',
        },
        {
          name: 'Top 25% Customers by Value',
          definition: 'Customers in top quartile of lifetime value',
          size: 'Very Small (1-2K)',
          retentionDays: 365,
          useCase: 'VIP campaigns, lookalike source, exclusives',
          priority: 'high',
        },
        {
          name: 'Engaged Shoppers - Last 90 Days',
          definition: 'Viewed 3+ products or spent 2+ minutes on site',
          size: 'Medium (30K+)',
          retentionDays: 90,
          useCase: 'High-intent cold audience expansion',
          priority: 'medium',
        },
      ],
      exclusionStrategy: {
        alwaysExclude: [
          'Recent purchasers (30 days) - from prospecting',
          'Purchasers (180 days) - from first-time buyer offers',
          'Employees and team members',
          'Existing customers - from new customer acquisition',
        ],
        conditionalExclusions: [
          {
            audience: 'Cart abandoners',
            condition: 'When running conversion campaigns to cold traffic',
            reasoning: 'Avoid competing with high-intent retargeting campaigns',
          },
          {
            audience: 'Product viewers',
            condition: 'When running to add-to-cart audiences',
            reasoning: 'Focus budget on highest intent users first',
          },
        ],
        reasoning: 'Proper exclusions prevent audience overlap, reduce frequency, and improve efficiency',
      },
      budgetAllocation: budget,
    };
  }

  private static buildCampaignHierarchy(): CampaignHierarchy {
    return {
      structure: 'Campaign → Ad Set → Ad (Standard Facebook structure)',
      campaigns: [
        {
          level: 'campaign',
          count: 5-8,
          purpose: 'Group by objective and funnel stage',
          bestPractices: [
            'One objective per campaign',
            'Separate campaigns for different funnel stages',
            'Use Campaign Budget Optimization (CBO) for scaling',
            'Start with Ad Set Budget Optimization (ABO) for testing',
          ],
        },
        {
          level: 'ad_set',
          count: 10-20,
          purpose: 'Group by audience and placement',
          bestPractices: [
            'One audience type per ad set',
            'Keep audiences distinct (no overlap)',
            'Minimum budget: $5-10 per day per ad set',
            'Let ad sets exit learning phase before judging (50 events)',
          ],
        },
        {
          level: 'ad',
          count: 30-50,
          purpose: 'Test creative variations',
          bestPractices: [
            '3-5 ads per ad set',
            'Test one variable at a time',
            'Refresh creatives every 2-3 weeks',
            'Archive underperformers, scale winners',
          ],
        },
      ],
      namingConvention: {
        pattern: '[Stage]_[Objective]_[Audience]_[Creative]_[Date]',
        examples: [
          'TOF_Awareness_Fashion_Video1_2025Q1',
          'MOF_Traffic_VideoViewers_Carousel1_Jan2025',
          'BOF_Conv_AddToCart_DPA_2025',
        ],
        variables: [
          'Stage: TOF (Top), MOF (Middle), BOF (Bottom)',
          'Objective: Awareness, Traffic, Engagement, Conv (Conversion)',
          'Audience: Who you\'re targeting',
          'Creative: Format or variation number',
          'Date: When created (optional but helpful)',
        ],
      },
      organizationTips: [
        'Use consistent naming across all campaigns',
        'Add labels in Ads Manager for easy filtering',
        'Group related campaigns in same ad account',
        'Document strategy in separate spreadsheet',
        'Review and clean up weekly - pause underperformers',
        'Keep archive of winning ads for future reference',
      ],
    };
  }

  private static buildCampaignSequencing(): CampaignSequencing {
    return {
      launchOrder: [
        {
          phase: 1,
          name: 'Foundation Phase',
          duration: 'Week 1-2',
          campaigns: [
            'TOF - Brand Awareness',
            'TOF - Video Views',
          ],
          goal: 'Build brand awareness and create retargeting audiences',
          successCriteria: 'Reach 200K+ people, CPM < 100K VND',
          nextSteps: 'Launch consideration campaigns once awareness pools reach 50K+ people',
        },
        {
          phase: 2,
          name: 'Engagement Phase',
          duration: 'Week 2-3',
          campaigns: [
            'MOF - Traffic (Video Viewers)',
            'MOF - Engagement (Page Engagers)',
          ],
          goal: 'Drive traffic and build warm audiences',
          successCriteria: '2,000+ link clicks, CTR > 1.5%',
          nextSteps: 'Launch conversion campaigns once website visitor pool reaches 5K+ people',
        },
        {
          phase: 3,
          name: 'Conversion Phase',
          duration: 'Week 3-4',
          campaigns: [
            'BOF - Conversions (Website Visitors)',
            'BOF - Conversions (Add to Cart)',
          ],
          goal: 'Generate first sales and validate targeting',
          successCriteria: '50+ purchases, ROAS > 2.0x',
          nextSteps: 'Scale winning ad sets, create lookalike audiences from purchasers',
        },
        {
          phase: 4,
          name: 'Scaling Phase',
          duration: 'Week 4-8',
          campaigns: [
            'BOF - Conversions (Lookalike 1%)',
            'BOF - Conversions (Engaged Shoppers)',
            'All retargeting campaigns',
          ],
          goal: 'Scale profitable campaigns and optimize ROAS',
          successCriteria: `ROAS consistently above target, increasing revenue`,
          nextSteps: 'Expand to lookalike 2-3%, test new creative angles, optimize pricing',
        },
        {
          phase: 5,
          name: 'Optimization Phase',
          duration: 'Week 8+',
          campaigns: [
            'All campaigns - optimized',
          ],
          goal: 'Maintain performance while scaling',
          successCriteria: 'Stable ROAS, growing revenue, efficient CAC',
          nextSteps: 'Explore new platforms (Instagram, TikTok), test new products, expansion',
        },
      ],
      dependencies: [
        'Must complete Pixel setup before launching conversion campaigns',
        'Need 1,000+ website visitors before creating warm audiences',
        'Need 100+ purchases before creating valuable lookalike audiences',
        'Must have product catalog setup for Dynamic Product Ads',
      ],
      timeline: '8-12 weeks to full optimization',
      milestones: [
        {
          day: 7,
          checkpoint: 'First week review',
          expectedMetrics: {
            'Reach': '100K+',
            'Impressions': '500K+',
            'CPM': '< 100K VND',
            'Website Visitors': '2K+',
          },
          action: 'Launch consideration campaigns if metrics met, adjust creative if not',
        },
        {
          day: 14,
          checkpoint: 'Two week review',
          expectedMetrics: {
            'Link Clicks': '1,000+',
            'CTR': '> 1.5%',
            'Landing Page Views': '500+',
          },
          action: 'Launch conversion campaigns, optimize underperforming ad sets',
        },
        {
          day: 21,
          checkpoint: 'First purchases',
          expectedMetrics: {
            'Purchases': '20-50',
            'ROAS': '> 1.5x',
            'AOV': 'Track average',
          },
          action: 'Scale winners by 20%, pause ROAS < 1.0x',
        },
        {
          day: 30,
          checkpoint: 'Month 1 complete',
          expectedMetrics: {
            'Total Revenue': 'Track',
            'Average ROAS': '> 2.0x',
            'CAC': '< 30% of LTV',
          },
          action: 'Full performance review, create lookalike audiences, plan month 2',
        },
        {
          day: 60,
          checkpoint: 'Month 2 complete',
          expectedMetrics: {
            'ROAS': 'Target achieved',
            'Monthly Revenue': '2x Month 1',
          },
          action: 'Expand to new platforms, test new creative angles, optimize funnel',
        },
      ],
    };
  }
}