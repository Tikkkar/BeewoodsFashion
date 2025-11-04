// ==================================================
// services/facebook/validatorService.ts
// Validate and match targeting options with Facebook API
// ==================================================

import type { FacebookApiClient } from './facebookApiClient.ts';
import type {
  ValidatedTargeting,
  BatchValidationRequest,
  BatchValidationResponse,
  FacebookTargetingItem,
} from './types.ts';
import {
  findBestMatch,
  findMultipleMatches,
  calculateSimilarity,
  average,
  chunkArray,
} from './utils.ts';

/**
 * Targeting Validator Service
 */
export class TargetingValidator {
  private fbClient: FacebookApiClient;
  private confidenceThreshold: number;

  constructor(fbClient: FacebookApiClient, confidenceThreshold: number = 70) {
    this.fbClient = fbClient;
    this.confidenceThreshold = confidenceThreshold;
  }

  /**
   * Validate a single targeting item
   */
  async validateItem(
    item: string,
    type: 'interest' | 'behavior' | 'demographic' | 'job'
  ): Promise<ValidatedTargeting> {
    try {
      // Search Facebook for matches
      let fbResults: FacebookTargetingItem[] = [];
      
      switch (type) {
        case 'interest':
          fbResults = await this.fbClient.searchInterests(item, 10);
          break;
        case 'behavior':
          fbResults = await this.fbClient.searchBehaviors(item, 10);
          break;
        case 'demographic':
          fbResults = await this.fbClient.searchDemographics(item, 10);
          break;
        case 'job':
          fbResults = await this.fbClient.searchJobs(item, 10);
          break;
      }

      // Find best match
      const { match, confidence } = findBestMatch(
        item,
        fbResults,
        this.confidenceThreshold
      );

      // Find alternatives
      const multipleMatches = findMultipleMatches(item, fbResults, 5, 50);
      const alternatives = multipleMatches
        .filter(m => m.match.id !== match?.id)
        .map(m => m.match);

      return {
        original: item,
        fbMatch: match || undefined,
        alternatives,
        confidence,
        isValid: confidence >= this.confidenceThreshold,
        type,
      };
    } catch (error) {
      console.error(`❌ Error validating "${item}":`, error);
      return {
        original: item,
        confidence: 0,
        isValid: false,
        type,
      };
    }
  }

  /**
   * Validate multiple items of the same type
   */
  async validateItems(
    items: string[],
    type: 'interest' | 'behavior' | 'demographic' | 'job'
  ): Promise<ValidatedTargeting[]> {
    const results: ValidatedTargeting[] = [];

    // Process in chunks to avoid overwhelming the API
    const chunks = chunkArray(items, 5);

    for (const chunk of chunks) {
      const promises = chunk.map(item => this.validateItem(item, type));
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Batch validate all targeting types
   */
  async batchValidate(
    request: BatchValidationRequest
  ): Promise<BatchValidationResponse> {
    const startTime = Date.now();

    // Validate each type in parallel
    const [interests, behaviors, demographics] = await Promise.all([
      request.interests
        ? this.validateItems(request.interests, 'interest')
        : Promise.resolve([]),
      request.behaviors
        ? this.validateItems(request.behaviors, 'behavior')
        : Promise.resolve([]),
      request.demographics
        ? this.validateItems(request.demographics, 'demographic')
        : Promise.resolve([]),
    ]);

    // Calculate summary
    const allValidated = [...interests, ...behaviors, ...demographics];
    const validCount = allValidated.filter(v => v.isValid).length;
    const confidences = allValidated.map(v => v.confidence);

    const duration = Date.now() - startTime;
    console.log(`✅ Batch validation completed in ${duration}ms`);

    return {
      interests,
      behaviors,
      demographics,
      summary: {
        totalValidated: allValidated.length,
        totalValid: validCount,
        totalInvalid: allValidated.length - validCount,
        averageConfidence: Math.round(average(confidences)),
      },
    };
  }

  /**
   * Get validation warnings
   */
  getValidationWarnings(validated: ValidatedTargeting[]): string[] {
    const warnings: string[] = [];

    const invalid = validated.filter(v => !v.isValid);
    if (invalid.length > 0) {
      warnings.push(
        `⚠️ ${invalid.length} targeting options không tìm thấy trên Facebook`
      );
    }

    const lowConfidence = validated.filter(
      v => v.isValid && v.confidence < 80
    );
    if (lowConfidence.length > 0) {
      warnings.push(
        `⚠️ ${lowConfidence.length} targeting options có độ chính xác thấp (<80%)`
      );
    }

    const noMatch = validated.filter(v => !v.fbMatch);
    if (noMatch.length > 0) {
      warnings.push(
        `⚠️ ${noMatch.length} targeting options không có match chính xác`
      );
    }

    return warnings;
  }

  /**
   * Auto-fix invalid targeting by replacing with best alternatives
   */
  autoFix(validated: ValidatedTargeting[]): {
    fixed: ValidatedTargeting[];
    replacements: Array<{ original: string; replacement: string }>;
  } {
    const fixed: ValidatedTargeting[] = [];
    const replacements: Array<{ original: string; replacement: string }> = [];

    for (const item of validated) {
      if (item.isValid) {
        fixed.push(item);
      } else if (item.alternatives && item.alternatives.length > 0) {
        // Use the best alternative
        const bestAlt = item.alternatives[0];
        const fixedItem: ValidatedTargeting = {
          original: bestAlt.name,
          fbMatch: bestAlt,
          confidence: 100,
          isValid: true,
          type: item.type,
        };
        fixed.push(fixedItem);
        replacements.push({
          original: item.original,
          replacement: bestAlt.name,
        });
      }
    }

    return { fixed, replacements };
  }

  /**
   * Get suggested improvements for low-confidence items
   */
  getSuggestions(validated: ValidatedTargeting[]): Array<{
    original: string;
    suggestions: string[];
  }> {
    return validated
      .filter(v => !v.isValid || v.confidence < 80)
      .map(v => ({
        original: v.original,
        suggestions: v.alternatives?.map(alt => alt.name) || [],
      }));
  }

  /**
   * Calculate overall validation score
   */
  calculateValidationScore(validated: ValidatedTargeting[]): number {
    if (validated.length === 0) return 0;

    const confidences = validated.map(v => v.confidence);
    return Math.round(average(confidences));
  }
}

/**
 * Helper: Validate targeting options format (pre-API check)
 */
export function validateTargetingFormat(targeting: {
  interests?: string[];
  behaviors?: string[];
  demographics?: string[];
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if at least one category is provided
  if (
    !targeting.interests?.length &&
    !targeting.behaviors?.length &&
    !targeting.demographics?.length
  ) {
    errors.push('Phải có ít nhất một loại targeting (interests/behaviors/demographics)');
  }

  // Check for empty strings
  const checkEmpty = (arr: string[] | undefined, name: string) => {
    if (arr) {
      const emptyCount = arr.filter(item => !item.trim()).length;
      if (emptyCount > 0) {
        errors.push(`${name} chứa ${emptyCount} giá trị rỗng`);
      }
    }
  };

  checkEmpty(targeting.interests, 'Interests');
  checkEmpty(targeting.behaviors, 'Behaviors');
  checkEmpty(targeting.demographics, 'Demographics');

  // Check for duplicates
  const checkDuplicates = (arr: string[] | undefined, name: string) => {
    if (arr) {
      const unique = new Set(arr.map(item => item.toLowerCase().trim()));
      if (unique.size < arr.length) {
        errors.push(`${name} chứa giá trị trùng lặp`);
      }
    }
  };

  checkDuplicates(targeting.interests, 'Interests');
  checkDuplicates(targeting.behaviors, 'Behaviors');
  checkDuplicates(targeting.demographics, 'Demographics');

  return {
    isValid: errors.length === 0,
    errors,
  };
}