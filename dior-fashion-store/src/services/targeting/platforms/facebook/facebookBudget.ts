// ============================================
// targeting/platforms/facebook/facebookBudget.ts
// ============================================

import { Facebook } from '../../core/baseTargeting';

export interface BudgetOptimizationResult {
  recommendations: BudgetRecommendations;
  scenarios: BudgetScenario[];
  allocation: BudgetAllocation;
  bidding: BiddingStrategy;
  optimization: OptimizationRules;
}

export interface BudgetRecommendations {
  daily: {
    min: number;
    recommended: number;
    max: number;
    currency: 'VND' | 'USD';
  };
  monthly: {
    total: number;
    breakdown: MonthlyBreakdown;
  };
  platformSplit: PlatformSplit;
  schedule: Facebook.Schedule;
}

export interface MonthlyBreakdown {
  testing: { amount: number; percentage: number; purpose: string };
  scaling: { amount: number; percentage: number; purpose: string };
  retargeting: { amount: number; percentage: number; purpose: string };
  brandAwareness: { amount: number; percentage: number; purpose: string };
}

export interface PlatformSplit {
  facebook: { amount: number; percentage: number; reasoning: string };
  instagram: { amount: number; percentage: number; reasoning: string };
  messenger: { amount: number; percentage: number; reasoning: string };
  audienceNetwork: { amount: number; percentage: number; reasoning: string };
}

export interface BudgetScenario {
  name: 'conservative' | 'balanced' | 'aggressive';
  monthlyBudget: number;
  dailyBudget: number;
  expectedROAS: number;
  expectedRevenue: number;
  risk: 'low' | 'medium' | 'high';
  description: string;
  suitableFor: string;
}

export interface BudgetAllocation {
  funnelStages: {
    awareness: { budget: number; percentage: number };
    consideration: { budget: number; percentage: number };
    conversion: { budget: number; percentage: number };
  };
  audienceLayers: {
    core: { budget: number; percentage: number };
    expansion: { budget: number; percentage: number };
    test: { budget: number; percentage: number };
  };
  weekdayVsWeekend: {
    weekday: { dailyBudget: number; reasoning: string };
    weekend: { dailyBudget: number; reasoning: string };
  };
}

export interface BiddingStrategy {
  strategy: Facebook.BidStrategy;
  optimizationGoal: Facebook.OptimizationGoal;
  bidCap?: number;
  targetCost?: number;
  minimumROAS?: number;
  reasoning: string;
  alternatives: AlternativeBidStrategy[];
}

export interface AlternativeBidStrategy {
  strategy: Facebook.BidStrategy;
  when: string;
  pros: string[];
  cons: string[];
}

export interface OptimizationRules {
  autoRules: AutoOptimizationRule[];
  manualChecks: ManualCheck[];
  scalingRules: ScalingRule[];
}

export interface AutoOptimizationRule {
  condition: string;
  action: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ManualCheck {
  frequency: string;
  metric: string;
  threshold: string;
  action: string;
}

export interface ScalingRule {
  trigger: string;
  action: string;
  safetyCheck: string;
}

export class FacebookBudgetOptimizer {
  /**
   * Generate comprehensive budget recommendations
   */
  static generateBudgetPlan(
    productPrice: number,
    targetROAS: number,
    marketSize: 'small' | 'medium' | 'large'
  ): BudgetOptimizationResult {
    return {
      recommendations: this.buildRecommendations(productPrice, targetROAS, marketSize),
      scenarios: this.buildScenarios(productPrice, targetROAS),
      allocation: this.buildAllocation(productPrice, marketSize),
      bidding: this.buildBiddingStrategy(productPrice, targetROAS),
      optimization: this.buildOptimizationRules(targetROAS),
    };
  }

  private static buildRecommendations(
    productPrice: number,
    targetROAS: number,
    marketSize: 'small' | 'medium' | 'large'
  ): BudgetRecommendations {
    // Calculate based on product economics
    const targetCPA = productPrice * 0.7 / targetROAS; // 70% margin
    const dailyBudget = this.calculateDailyBudget(targetCPA, marketSize);
    const monthlyBudget = dailyBudget * 30;

    return {
      daily: {
        min: dailyBudget * 0.5,
        recommended: dailyBudget,
        max: dailyBudget * 2,
        currency: 'VND',
      },
      monthly: {
        total: monthlyBudget,
        breakdown: {
          testing: {
            amount: monthlyBudget * 0.15,
            percentage: 15,
            purpose: 'Test new audiences, creatives, and messaging',
          },
          scaling: {
            amount: monthlyBudget * 0.60,
            percentage: 60,
            purpose: 'Scale winning campaigns with proven ROAS',
          },
          retargeting: {
            amount: monthlyBudget * 0.20,
            percentage: 20,
            purpose: 'Convert warm audiences (website visitors, cart abandoners)',
          },
          brandAwareness: {
            amount: monthlyBudget * 0.05,
            percentage: 5,
            purpose: 'Top-of-funnel reach and brand building',
          },
        },
      },
      platformSplit: {
        facebook: {
          amount: monthlyBudget * 0.50,
          percentage: 50,
          reasoning: 'Largest audience, proven conversion funnel, best for retargeting',
        },
        instagram: {
          amount: monthlyBudget * 0.35,
          percentage: 35,
          reasoning: 'Visual product showcase, high engagement, younger demographic',
        },
        messenger: {
          amount: monthlyBudget * 0.10,
          percentage: 10,
          reasoning: 'Direct customer communication, high intent traffic',
        },
        audienceNetwork: {
          amount: monthlyBudget * 0.05,
          percentage: 5,
          reasoning: 'Extended reach at lower CPM, test performance before scaling',
        },
      },
      schedule: {
        type: 'specific_hours',
        hours: [10, 11, 12, 13, 14, 18, 19, 20, 21, 22], // 10AM-2PM, 6PM-10PM
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        timezone: 'Asia/Ho_Chi_Minh',
      },
    };
  }

  private static calculateDailyBudget(
    targetCPA: number,
    marketSize: 'small' | 'medium' | 'large'
  ): number {
    // Minimum 50x CPA for learning phase (Facebook recommendation)
    const minBudget = targetCPA * 50;

    // Adjust for market size
    const multiplier = {
      small: 1,
      medium: 1.5,
      large: 2.5,
    }[marketSize];

    return Math.round(minBudget * multiplier / 100000) * 100000; // Round to 100K VND
  }

  private static buildScenarios(
    productPrice: number,
    targetROAS: number
  ): BudgetScenario[] {
    const baseBudget = productPrice * 20; // 20x product price as baseline

    return [
      {
        name: 'conservative',
        monthlyBudget: baseBudget * 0.5 * 30,
        dailyBudget: baseBudget * 0.5,
        expectedROAS: targetROAS * 1.2,
        expectedRevenue: baseBudget * 0.5 * 30 * targetROAS * 1.2,
        risk: 'low',
        description: 'Slow and steady approach with minimal risk',
        suitableFor: 'New businesses, limited budget, risk-averse owners',
      },
      {
        name: 'balanced',
        monthlyBudget: baseBudget * 30,
        dailyBudget: baseBudget,
        expectedROAS: targetROAS,
        expectedRevenue: baseBudget * 30 * targetROAS,
        risk: 'medium',
        description: 'Balanced growth with managed risk',
        suitableFor: 'Most businesses, standard growth trajectory',
      },
      {
        name: 'aggressive',
        monthlyBudget: baseBudget * 2 * 30,
        dailyBudget: baseBudget * 2,
        expectedROAS: targetROAS * 0.85,
        expectedRevenue: baseBudget * 2 * 30 * targetROAS * 0.85,
        risk: 'high',
        description: 'Rapid market capture, accept lower initial ROAS',
        suitableFor: 'Well-funded businesses, competitive markets, seasonal pushes',
      },
    ];
  }

  private static buildAllocation(
    productPrice: number,
    marketSize: 'small' | 'medium' | 'large'
  ): BudgetAllocation {
    const baseBudget = productPrice * 20;

    return {
      funnelStages: {
        awareness: {
          budget: baseBudget * 0.20,
          percentage: 20,
        },
        consideration: {
          budget: baseBudget * 0.30,
          percentage: 30,
        },
        conversion: {
          budget: baseBudget * 0.50,
          percentage: 50,
        },
      },
      audienceLayers: {
        core: {
          budget: baseBudget * 0.60,
          percentage: 60,
        },
        expansion: {
          budget: baseBudget * 0.25,
          percentage: 25,
        },
        test: {
          budget: baseBudget * 0.15,
          percentage: 15,
        },
      },
      weekdayVsWeekend: {
        weekday: {
          dailyBudget: baseBudget * 0.85,
          reasoning: 'Standard traffic, office browsing patterns',
        },
        weekend: {
          dailyBudget: baseBudget * 1.15,
          reasoning: 'Higher engagement, more leisure browsing, better conversion rates',
        },
      },
    };
  }

  private static buildBiddingStrategy(
    productPrice: number,
    targetROAS: number
  ): BiddingStrategy {
    const targetCPA = (productPrice * 0.7) / targetROAS;

    return {
      strategy: 'lowest_cost',
      optimizationGoal: 'conversions',
      reasoning: `Start with lowest cost to gather data during learning phase. Switch to cost cap once CPA stabilizes around ${this.formatVND(targetCPA)}.`,
      alternatives: [
        {
          strategy: 'cost_cap',
          when: 'After 50+ conversions and stable CPA',
          pros: [
            'Control over cost per result',
            'Predictable costs',
            'Scale while maintaining efficiency',
          ],
          cons: [
            'May limit delivery if cap is too low',
            'Requires optimization history',
          ],
        },
        {
          strategy: 'bid_cap',
          when: 'Advanced users with auction insights',
          pros: [
            'Maximum control over bids',
            'Useful in highly competitive auctions',
          ],
          cons: [
            'Requires deep understanding of auction dynamics',
            'Can severely limit delivery',
            'Not recommended for beginners',
          ],
        },
        {
          strategy: 'minimum_roas',
          when: `When ROAS consistently above ${targetROAS}x`,
          pros: [
            'Optimize for value, not just conversions',
            'Ideal for e-commerce',
            'Automatically prioritizes high-value customers',
          ],
          cons: [
            'Requires Facebook pixel tracking purchase value',
            'May reduce volume',
            'Needs significant conversion data',
          ],
        },
      ],
    };
  }

  private static buildOptimizationRules(targetROAS: number): OptimizationRules {
    return {
      autoRules: [
        {
          condition: `ROAS < ${targetROAS * 0.5}x for 3 consecutive days`,
          action: 'Pause ad set and notify',
          impact: 'Prevent wasted spend on underperforming campaigns',
          priority: 'high',
        },
        {
          condition: 'Frequency > 3.0',
          action: 'Reduce budget by 30% or refresh creative',
          impact: 'Prevent ad fatigue and declining performance',
          priority: 'high',
        },
        {
          condition: `ROAS > ${targetROAS * 1.5}x for 2 consecutive days`,
          action: 'Increase budget by 20%',
          impact: 'Scale winning campaigns faster',
          priority: 'medium',
        },
        {
          condition: 'CPC increased by 50% compared to baseline',
          action: 'Investigate targeting/creative/competition',
          impact: 'Maintain cost efficiency',
          priority: 'medium',
        },
        {
          condition: 'CTR < 0.8% for 5 days',
          action: 'Refresh creative or adjust targeting',
          impact: 'Improve relevance and reduce CPM',
          priority: 'low',
        },
      ],
      manualChecks: [
        {
          frequency: 'Daily',
          metric: 'ROAS and Spend',
          threshold: 'Varies by campaign',
          action: 'Adjust budgets, pause losers, scale winners',
        },
        {
          frequency: 'Weekly',
          metric: 'Audience overlap',
          threshold: '>25% overlap between ad sets',
          action: 'Consolidate audiences or adjust targeting',
        },
        {
          frequency: 'Bi-weekly',
          metric: 'Creative performance',
          threshold: 'Declining CTR or engagement',
          action: 'Launch new creative variations',
        },
        {
          frequency: 'Monthly',
          metric: 'Full funnel analysis',
          threshold: 'Overall campaign health',
          action: 'Strategic pivot if needed',
        },
      ],
      scalingRules: [
        {
          trigger: `Consistent ROAS ${targetROAS}x+ for 7 days`,
          action: 'Increase budget by 20% every 3 days',
          safetyCheck: 'Monitor CPA and ROAS daily during scaling',
        },
        {
          trigger: 'Ad set exits learning phase successfully',
          action: 'Duplicate and test in new geographic markets',
          safetyCheck: 'Maintain 70% budget in proven markets',
        },
        {
          trigger: 'Core audience saturation (frequency > 2.5)',
          action: 'Expand to lookalike 2-3% or new interest stacks',
          safetyCheck: 'Keep expansion budget under 30% total spend',
        },
      ],
    };
  }

  // Helper
  private static formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
}