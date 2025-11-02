// ============================================
// targeting/platforms/facebook/facebookCreative.ts
// ============================================

import { Facebook } from '../../core/baseTargeting';

export interface CreativeStrategyResult {
  formats: CreativeFormatRecommendation[];
  copyStrategy: CopyStrategy;
  visualStrategy: VisualStrategy;
  testingMatrix: CreativeTestingMatrix;
  contentCalendar: ContentCalendar;
}

export interface CreativeFormatRecommendation {
  format: Facebook.CreativeFormat;
  specs: Facebook.CreativeSpecs;
  useCases: string[];
  bestFor: string;
  estimatedCTR: { min: number; avg: number; max: number };
  examples: CreativeExample[];
}

export interface CreativeExample {
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  caption: string;
}

export interface CopyStrategy {
  guidelines: Facebook.CopyGuidelines;
  frameworks: CopyFramework[];
  hooks: Hook[];
  primaryTextExamples: CopyVariation[];
  headlineExamples: CopyVariation[];
  callToActions: Facebook.CallToAction[];
}

export interface CopyFramework {
  name: string;
  structure: string;
  example: string;
  bestFor: string;
}

export interface Hook {
  type: 'question' | 'statistic' | 'pain_point' | 'benefit' | 'curiosity';
  text: string;
  reasoning: string;
}

export interface CopyVariation {
  text: string;
  tone: 'professional' | 'casual' | 'urgent' | 'friendly';
  length: 'short' | 'medium' | 'long';
  targetAudience: string;
  estimatedPerformance: 'high' | 'medium' | 'low';
}

export interface VisualStrategy {
  guidelines: Facebook.VisualGuidelines;
  layouts: LayoutRecommendation[];
  colorPalette: ColorGuideline;
  photography: PhotographyGuideline;
  videoGuidelines: VideoGuideline;
}

export interface LayoutRecommendation {
  type: string;
  description: string;
  bestFor: string;
  dosList: string[];
  dontsList: string[];
}

export interface ColorGuideline {
  primary: string[];
  accent: string[];
  avoid: string[];
  psychology: Record<string, string>;
}

export interface PhotographyGuideline {
  style: string[];
  lighting: string[];
  composition: string[];
  models: string[];
  props: string[];
}

export interface VideoGuideline {
  duration: { min: number; optimal: number; max: number };
  firstFrame: string[];
  pacing: string;
  captions: boolean;
  music: string[];
  transitions: string[];
}

export interface CreativeTestingMatrix {
  variables: TestVariable[];
  combinations: TestCombination[];
  methodology: string;
  expectedDuration: string;
}

export interface TestVariable {
  name: string;
  variations: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface TestCombination {
  name: string;
  variables: Record<string, string>;
  hypothesis: string;
  successMetric: string;
}

export interface ContentCalendar {
  weeks: WeeklyContent[];
  themes: ContentTheme[];
  postingSchedule: PostingSchedule;
}

export interface WeeklyContent {
  week: number;
  theme: string;
  posts: ContentPost[];
}

export interface ContentPost {
  day: string;
  time: string;
  format: string;
  theme: string;
  objective: string;
  caption: string;
  hashtags: string[];
}

export interface ContentTheme {
  name: string;
  ratio: number;
  description: string;
  examples: string[];
}

export interface PostingSchedule {
  frequency: string;
  bestTimes: { day: string; hours: number[] }[];
  avoid: string[];
}

export class FacebookCreativeGenerator {
  /**
   * Generate comprehensive creative strategy
   */
  static generateCreativeStrategy(
    productType: string,
    targetAudience: any
  ): CreativeStrategyResult {
    return {
      formats: this.buildFormatRecommendations(productType),
      copyStrategy: this.buildCopyStrategy(productType, targetAudience),
      visualStrategy: this.buildVisualStrategy(productType),
      testingMatrix: this.buildTestingMatrix(),
      contentCalendar: this.buildContentCalendar(productType),
    };
  }

  private static buildFormatRecommendations(productType: string): CreativeFormatRecommendation[] {
    return [
      {
        format: {
          type: 'carousel',
          recommended: true,
          priority: 'high',
          specs: {
            aspectRatio: '1:1',
            resolution: '1080x1080',
            fileSize: '< 30MB per image',
            imageCount: 5,
          },
          bestPractices: [
            'First card should be attention-grabbing hero image',
            'Tell a story across cards (problem → solution → results)',
            'Use last card for strong CTA',
            'Mix product shots with lifestyle images',
            'Add text overlay to first 2 cards for key messages',
          ],
          examples: [
            'Card 1: Hero product shot with "New Collection"',
            'Card 2-4: Different angles, colors, or use cases',
            'Card 5: Bundle offer or CTA "Shop Now - Free Shipping"',
          ],
        },
        specs: {
          aspectRatio: '1:1 (square) or 4:5 (vertical)',
          resolution: '1080x1080 or 1080x1350',
          fileSize: '< 30MB per image',
          imageCount: 3-10,
        },
        useCases: [
          'Showcase multiple products',
          'Tell brand story',
          'Feature different product benefits',
          'Before/after transformations',
        ],
        bestFor: 'E-commerce, Fashion, Product catalogs',
        estimatedCTR: { min: 1.5, avg: 2.3, max: 4.0 },
        examples: [
          {
            description: '5-card fashion collection carousel',
            caption: '✨ New Arrivals: Mix & Match Your Way\nSwipe to see how to style our latest pieces →',
          },
        ],
      },
      {
        format: {
          type: 'video',
          recommended: true,
          priority: 'high',
          specs: {
            aspectRatio: '1:1 or 4:5',
            resolution: '1080x1080 or 1080x1350',
            fileSize: '< 4GB',
            duration: '15-60 seconds',
          },
          bestPractices: [
            'Hook viewers in first 3 seconds',
            'Show product in use immediately',
            'Add captions (85% watch without sound)',
            'Include clear CTA at end',
            'Use trending music or upbeat audio',
          ],
          examples: [
            'Quick outfit transformation (0-15s)',
            'Product unboxing with reactions (15-30s)',
            'Styling tips tutorial (30-60s)',
          ],
        },
        specs: {
          aspectRatio: '1:1, 4:5, 9:16',
          resolution: 'Minimum 1080x1080',
          fileSize: '< 4GB',
          duration: '15-60 seconds optimal',
        },
        useCases: [
          'Product demonstrations',
          'Customer testimonials',
          'Behind-the-scenes',
          'How-to tutorials',
          'Unboxing videos',
        ],
        bestFor: 'Engagement, storytelling, showcasing features',
        estimatedCTR: { min: 1.8, avg: 3.0, max: 5.5 },
        examples: [
          {
            description: '30-second styling video',
            caption: '3 Ways to Style the Perfect White Tee 👕\nFrom casual to chic in seconds!',
          },
        ],
      },
      {
        format: {
          type: 'single_image',
          recommended: false,
          priority: 'medium',
          specs: {
            aspectRatio: '1:1 or 4:5',
            resolution: '1080x1080 or 1080x1350',
            fileSize: '< 30MB',
          },
          bestPractices: [
            'Use high-quality, eye-catching imagery',
            'Include text overlay for key message',
            'Show product in lifestyle context',
            'Maintain consistent brand aesthetic',
          ],
          examples: [
            'Flat lay product shot with props',
            'Model wearing product in natural setting',
            'Close-up detail shot of texture/quality',
          ],
        },
        specs: {
          aspectRatio: '1:1 or 4:5',
          resolution: '1080x1080 or 1080x1350',
          fileSize: '< 30MB',
        },
        useCases: [
          'Simple product announcements',
          'Flash sales',
          'Single hero product',
        ],
        bestFor: 'Quick promotions, simple messages',
        estimatedCTR: { min: 0.8, avg: 1.5, max: 2.5 },
        examples: [
          {
            description: 'Product on colored background with sale badge',
            caption: 'Flash Sale! 40% OFF Today Only 🔥\nFree shipping on orders over 500K',
          },
        ],
      },
      {
        format: {
          type: 'collection',
          recommended: true,
          priority: 'high',
          specs: {
            aspectRatio: '1:1',
            resolution: '1080x1080',
            fileSize: '< 30MB per image',
          },
          bestPractices: [
            'Feature hero image prominently',
            'Show 4-5 product variations below',
            'Enable instant shopping experience',
            'Use for product launches or collections',
          ],
          examples: [
            'New collection with hero lifestyle shot',
            'Seasonal sale with multiple products',
          ],
        },
        specs: {
          aspectRatio: '1:1 (hero) + product tiles',
          resolution: '1080x1080',
          fileSize: '< 30MB',
        },
        useCases: [
          'Product launches',
          'Collection showcases',
          'Seasonal campaigns',
        ],
        bestFor: 'E-commerce with catalog, multi-product sales',
        estimatedCTR: { min: 1.5, avg: 2.5, max: 4.2 },
        examples: [
          {
            description: 'Summer collection ad',
            caption: '☀️ Summer Essentials Are Here!\nShop the full collection → Tap to explore',
          },
        ],
      },
    ];
  }

  private static buildCopyStrategy(productType: string, targetAudience: any): CopyStrategy {
    return {
      guidelines: {
        primaryText: {
          min: 50,
          max: 125,
          recommended: 80,
        },
        headline: {
          max: 40,
          recommended: 25,
        },
        description: {
          max: 30,
          recommended: 20,
        },
        toneOfVoice: 'Friendly, enthusiastic, benefit-focused',
        examples: [],
      },
      frameworks: [
        {
          name: 'PAS (Problem-Agitate-Solution)',
          structure: 'Problem → Agitate → Solution',
          example: 'Tired of clothes that lose shape after one wash? 😫 We\'ve all been there - that favorite shirt that\'s now unwearable. Our premium cotton blend keeps its fit wash after wash. Shop quality that lasts! 👕',
          bestFor: 'Addressing common customer pain points',
        },
        {
          name: 'AIDA (Attention-Interest-Desire-Action)',
          structure: 'Attention → Interest → Desire → Action',
          example: '🔥 NEW ARRIVAL ALERT! Our best-selling styles just got even better. Premium fabrics, perfect fit, timeless designs. Limited stock - grab yours before they\'re gone! Shop Now →',
          bestFor: 'Product launches, limited offers',
        },
        {
          name: 'BAB (Before-After-Bridge)',
          structure: 'Before → After → Bridge',
          example: 'Before: Settling for fast fashion that falls apart. After: Owning quality pieces that last for years. The Bridge: Our sustainable collection with lifetime warranty. Invest in your wardrobe today! 🌿',
          bestFor: 'Transformation stories, premium products',
        },
        {
          name: 'Feature-Benefit-Proof',
          structure: 'Feature → Benefit → Proof',
          example: '100% organic cotton (Feature) = All-day comfort + eco-friendly (Benefit). Certified by GOTS + 5-star reviews from 10K+ customers (Proof). Try it risk-free! ✨',
          bestFor: 'Building trust, new customers',
        },
      ],
      hooks: [
        {
          type: 'question',
          text: 'Looking for the perfect outfit for [occasion]?',
          reasoning: 'Questions engage and qualify the audience immediately',
        },
        {
          type: 'statistic',
          text: '9 out of 10 customers buy again',
          reasoning: 'Social proof builds credibility',
        },
        {
          type: 'pain_point',
          text: 'Tired of clothes that don\'t fit right?',
          reasoning: 'Addresses common frustration, builds relatability',
        },
        {
          type: 'benefit',
          text: 'Get ready in 5 minutes with our mix & match collection',
          reasoning: 'Leads with value proposition',
        },
        {
          type: 'curiosity',
          text: 'The wardrobe secret fashion insiders don\'t want you to know...',
          reasoning: 'Creates intrigue and stops scroll',
        },
      ],
      primaryTextExamples: [
        {
          text: '✨ New Collection Alert!\n\nYour wardrobe just called - it needs these pieces! From office chic to weekend casual, we\'ve got you covered.\n\n🎁 Special Launch Offer: Free shipping + 15% off\n💝 Shop before midnight for guaranteed delivery\n\n👉 Tap to explore the full collection',
          tone: 'friendly',
          length: 'medium',
          targetAudience: 'Women 25-35, fashion-conscious',
          estimatedPerformance: 'high',
        },
        {
          text: 'Quality over quantity. 🌿\n\nOne amazing piece that lasts > Ten that fall apart.\n\nOur sustainable collection: Premium fabrics, ethical production, timeless design.\n\nInvest in clothes you\'ll love for years. Shop now →',
          tone: 'professional',
          length: 'short',
          targetAudience: 'Eco-conscious, 30-45',
          estimatedPerformance: 'medium',
        },
        {
          text: '🔥 FLASH SALE - 24 HOURS ONLY!\n\nUp to 50% OFF our best-sellers\n✅ Premium quality\n✅ Fast shipping\n✅ Easy returns\n\nDon\'t miss out - Stock is limited!\n👉 Shop now before it\'s gone!',
          tone: 'urgent',
          length: 'short',
          targetAudience: 'Bargain hunters, impulse buyers',
          estimatedPerformance: 'high',
        },
      ],
      headlineExamples: [
        {
          text: 'New Arrivals - Shop Now',
          tone: 'casual',
          length: 'short',
          targetAudience: 'General',
          estimatedPerformance: 'medium',
        },
        {
          text: 'Premium Quality, Perfect Fit',
          tone: 'professional',
          length: 'short',
          targetAudience: 'Quality-focused',
          estimatedPerformance: 'high',
        },
        {
          text: '40% OFF - Today Only!',
          tone: 'urgent',
          length: 'short',
          targetAudience: 'Deal seekers',
          estimatedPerformance: 'high',
        },
      ],
      callToActions: [
        { text: 'Shop Now', type: 'shop_now', recommended: true },
        { text: 'Learn More', type: 'learn_more', recommended: false },
        { text: 'Sign Up', type: 'sign_up', recommended: false },
        { text: 'Get Offer', type: 'shop_now', recommended: true },
      ],
    };
  }

  private static buildVisualStrategy(productType: string): VisualStrategy {
    return {
      guidelines: {
        style: [
          'Clean and minimalist',
          'Lifestyle-focused',
          'Bright and vibrant',
          'Authentic and relatable',
        ],
        colors: [
          'Use brand colors consistently',
          'White/neutral backgrounds for product focus',
          'Warm tones for lifestyle shots',
          'High contrast for text overlays',
        ],
        composition: [
          'Rule of thirds for dynamic shots',
          'Center alignment for product-only shots',
          'Leave breathing room around subject',
          'Use leading lines to guide eye',
        ],
        dosList: [
          'High-resolution images (1080x1080 minimum)',
          'Show product in use/context',
          'Include people for relatability',
          'Maintain consistent brand aesthetic',
          'Test with and without text overlays',
        ],
        dontsList: [
          'Low-resolution or pixelated images',
          'Too much text (covers >20% of image)',
          'Stock photos that look generic',
          'Inconsistent filters/editing styles',
          'Cluttered backgrounds',
        ],
      },
      layouts: [
        {
          type: 'Flat Lay',
          description: 'Product arranged from above with complementary items',
          bestFor: 'Product showcases, collections, accessories',
          dosList: [
            'Use neutral background',
            'Arrange items thoughtfully',
            'Include lifestyle props',
            'Natural lighting',
          ],
          dontsList: [
            'Too many items (cluttered)',
            'Poor lighting/shadows',
            'Messy arrangement',
          ],
        },
        {
          type: 'Lifestyle Shot',
          description: 'Model wearing/using product in real scenario',
          bestFor: 'Showing product in action, creating desire',
          dosList: [
            'Natural poses and expressions',
            'Realistic settings',
            'Show product clearly',
            'Diverse models',
          ],
          dontsList: [
            'Overly posed/unnatural',
            'Can\'t see product details',
            'Distracting backgrounds',
          ],
        },
        {
          type: 'Close-Up Detail',
          description: 'Macro shot of product texture, quality, features',
          bestFor: 'Highlighting craftsmanship, quality, materials',
          dosList: [
            'Sharp focus on details',
            'Good lighting to show texture',
            'Clean product',
          ],
          dontsList: [
            'Blurry or out of focus',
            'Harsh shadows',
            'Dirty or damaged product',
          ],
        },
      ],
      colorPalette: {
        primary: ['#FFFFFF', '#F5F5F5', '#E8E8E8'], // Neutrals
        accent: ['#FF6B6B', '#4ECDC4', '#FFD93D'], // Attention colors
        avoid: ['Pure black (#000000)', 'Neon colors', 'Too many colors at once'],
        psychology: {
          'Red/Orange': 'Urgency, excitement, passion',
          'Blue': 'Trust, calm, professionalism',
          'Green': 'Natural, eco-friendly, growth',
          'Yellow': 'Optimism, warmth, attention',
          'Pink': 'Feminine, playful, youthful',
          'Black/White': 'Luxury, minimalism, sophistication',
        },
      },
      photography: {
        style: ['Natural', 'Editorial', 'Lifestyle', 'Studio'],
        lighting: ['Natural light preferred', 'Soft diffused lighting', 'Avoid harsh shadows', 'Golden hour for outdoors'],
        composition: ['Rule of thirds', 'Negative space', 'Leading lines', 'Symmetry'],
        models: ['Diverse representation', 'Natural expressions', 'Relatable poses', 'Age-appropriate'],
        props: ['Minimal and purposeful', 'Complement not compete', 'Brand-relevant', 'Seasonal when appropriate'],
      },
      videoGuidelines: {
        duration: { min: 6, optimal: 15, max: 60 },
        firstFrame: [
          'Eye-catching hook',
          'Product clearly visible',
          'Text overlay with key message',
          'Movement/action to stop scroll',
        ],
        pacing: 'Fast cuts (2-3 seconds per scene) for short videos, slower for tutorials',
        captions: true,
        music: ['Upbeat and energetic', 'Trending sounds', 'Royalty-free', 'Match brand vibe'],
        transitions: ['Quick cuts', 'Jump cuts', 'Zoom transitions', 'Avoid cheesy effects'],
      },
    };
  }

  private static buildTestingMatrix(): CreativeTestingMatrix {
    return {
      variables: [
        {
          name: 'Image Type',
          variations: ['Lifestyle', 'Product-only', 'Flat lay', 'Close-up'],
          impact: 'high',
        },
        {
          name: 'Copy Length',
          variations: ['Short (< 50 chars)', 'Medium (50-100 chars)', 'Long (> 100 chars)'],
          impact: 'medium',
        },
        {
          name: 'Call to Action',
          variations: ['Shop Now', 'Learn More', 'Get Offer', 'See Collection'],
          impact: 'medium',
        },
        {
          name: 'Headline Hook',
          variations: ['Question', 'Benefit', 'Urgency', 'Social Proof'],
          impact: 'high',
        },
        {
          name: 'Color Scheme',
          variations: ['Bright', 'Neutral', 'Bold', 'Pastel'],
          impact: 'low',
        },
      ],
      combinations: [
        {
          name: 'Test A - Lifestyle Focus',
          variables: {
            'Image Type': 'Lifestyle',
            'Copy Length': 'Short',
            'Call to Action': 'Shop Now',
            'Headline Hook': 'Benefit',
          },
          hypothesis: 'Lifestyle images with benefit-driven copy will resonate with aspirational buyers',
          successMetric: 'CTR > 2.5%',
        },
        {
          name: 'Test B - Product Details',
          variables: {
            'Image Type': 'Close-up',
            'Copy Length': 'Medium',
            'Call to Action': 'Learn More',
            'Headline Hook': 'Social Proof',
          },
          hypothesis: 'Detail shots with social proof will convert quality-conscious buyers',
          successMetric: 'Conversion Rate > 3%',
        },
        {
          name: 'Test C - Urgency Play',
          variables: {
            'Image Type': 'Product-only',
            'Copy Length': 'Short',
            'Call to Action': 'Get Offer',
            'Headline Hook': 'Urgency',
          },
          hypothesis: 'Time-limited offers with clear product shots will drive impulse purchases',
          successMetric: 'Add to Cart Rate > 5%',
        },
      ],
      methodology: 'Run tests with minimum $200 budget per variation. Analyze after 500+ impressions or 3 days. Winner advances to scale.',
      expectedDuration: '1-2 weeks for initial testing phase',
    };
  }

  private static buildContentCalendar(productType: string): ContentCalendar {
    return {
      weeks: [
        {
          week: 1,
          theme: 'Product Launch & Awareness',
          posts: [
            {
              day: 'Monday',
              time: '10:00',
              format: 'Carousel',
              theme: 'New Collection Reveal',
              objective: 'Brand Awareness',
              caption: '✨ New Arrivals Alert! Swipe to see what\'s trending this season →',
              hashtags: ['#NewIn', '#FashionFinds', '#StyleInspo'],
            },
            {
              day: 'Wednesday',
              time: '19:00',
              format: 'Video',
              theme: 'Behind the Scenes',
              objective: 'Engagement',
              caption: '👀 A peek behind the curtain! See how we create quality you can trust',
              hashtags: ['#BehindTheScenes', '#QualityFirst', '#MadeWithLove'],
            },
            {
              day: 'Friday',
              time: '18:00',
              format: 'Single Image',
              theme: 'Weekend Flash Sale',
              objective: 'Conversions',
              caption: '🔥 Weekend Special: 30% OFF! Limited time only - shop before midnight!',
              hashtags: ['#WeekendSale', '#FlashDeal', '#ShopNow'],
            },
            {
              day: 'Sunday',
              time: '15:00',
              format: 'Carousel',
              theme: 'Styling Tips',
              objective: 'Education',
              caption: '💡 3 Ways to Style Our Bestseller - From day to night!',
              hashtags: ['#StylingTips', '#FashionHacks', '#OOTD'],
            },
          ],
        },
        {
          week: 2,
          theme: 'Social Proof & Engagement',
          posts: [
            {
              day: 'Tuesday',
              time: '11:00',
              format: 'UGC Video',
              theme: 'Customer Testimonial',
              objective: 'Trust Building',
              caption: '⭐ Hear from our amazing customers! Real people, real reviews',
              hashtags: ['#CustomerLove', '#5StarReview', '#HappyCustomers'],
            },
            {
              day: 'Thursday',
              time: '20:00',
              format: 'Poll/Question',
              theme: 'Community Engagement',
              objective: 'Engagement',
              caption: '🤔 Which color should we restock first? Vote now! 👇',
              hashtags: ['#YourChoice', '#Community', '#VoteNow'],
            },
            {
              day: 'Saturday',
              time: '17:00',
              format: 'Collection Ad',
              theme: 'Best Sellers',
              objective: 'Conversions',
              caption: '🏆 Our Most-Loved Pieces - See why everyone\'s talking about them!',
              hashtags: ['#BestSellers', '#CustomerFavorites', '#MustHave'],
            },
          ],
        },
        // More weeks...
      ],
      themes: [
        {
          name: 'Product Showcase',
          ratio: 40,
          description: 'Direct product promotion',
          examples: ['New arrivals', 'Best sellers', 'Product features'],
        },
        {
          name: 'Social Proof',
          ratio: 25,
          description: 'Customer reviews & UGC',
          examples: ['Testimonials', 'Unboxing', 'Customer photos'],
        },
        {
          name: 'Educational',
          ratio: 20,
          description: 'Value-add content',
          examples: ['Styling tips', 'Care guides', 'How-to videos'],
        },
        {
          name: 'Community & Engagement',
          ratio: 15,
          description: 'Build relationships',
          examples: ['Polls', 'Q&A', 'Behind-the-scenes', 'User contests'],
        },
      ],
      postingSchedule: {
        frequency: '4-7 posts per week',
        bestTimes: [
          { day: 'Monday-Friday', hours: [10, 11, 12, 19, 20, 21] },
          { day: 'Saturday-Sunday', hours: [14, 15, 16, 17, 18, 19, 20] },
        ],
        avoid: [
          'Late night (after 11 PM)',
          'Early morning (before 8 AM)',
          'Monday mornings (low engagement)',
        ],
      },
    };
  }
}