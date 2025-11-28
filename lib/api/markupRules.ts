import { Feed, feedsApi } from './feeds';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface MarkupRule {
  minPrice: number | null;
  maxPrice: number | null;
  percent: number;
}

export interface MarkupRulesConfig {
  rules: MarkupRule[];
  priceFields?: string[];
}

export interface FeedWithMarkup extends Feed {
  markup_rules?: MarkupRulesConfig | MarkupRule[] | null;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_PRICE_FIELDS = [
  'price',
  'TotalPrice',
  'price_per_carat',
  'Price Per Carat',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize markup rules to consistent format
 */
export function normalizeMarkupRules(
  markupRules: any
): MarkupRulesConfig | null {
  if (!markupRules) {
    return null;
  }

  // If it's already an array (legacy format), convert to object format
  if (Array.isArray(markupRules)) {
    return {
      rules: markupRules as MarkupRule[],
      priceFields: DEFAULT_PRICE_FIELDS,
    };
  }

  // If it's an object with rules property
  if (markupRules.rules && Array.isArray(markupRules.rules)) {
    return {
      rules: markupRules.rules,
      priceFields: markupRules.priceFields || DEFAULT_PRICE_FIELDS,
    };
  }

  return null;
}

/**
 * Convert markup rules to storage format (can be array or object)
 */
export function denormalizeMarkupRules(
  config: MarkupRulesConfig
): MarkupRulesConfig | MarkupRule[] {
  // If using default price fields, save as array for backward compatibility
  const isDefaultFields =
    JSON.stringify(config.priceFields || []) ===
    JSON.stringify(DEFAULT_PRICE_FIELDS);

  if (isDefaultFields) {
    return config.rules;
  }

  // Otherwise save as object with priceFields
  return {
    rules: config.rules,
    priceFields: config.priceFields,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export const markupRulesApi = {
  /**
   * Normalize markup rules to consistent format
   */
  normalizeMarkupRules,

  /**
   * Convert markup rules to storage format
   */
  denormalizeMarkupRules,

  /**
   * Get all feeds with their markup rules
   */
  getAllFeedsWithMarkup: async (): Promise<FeedWithMarkup[]> => {
    try {
      const feeds = await feedsApi.getAll();
      return feeds as FeedWithMarkup[];
    } catch (error) {
      console.error('Error fetching feeds with markup:', error);
      throw error;
    }
  },

  /**
   * Get markup rules for a specific feed
   */
  getMarkupRules: async (feedId: number): Promise<MarkupRulesConfig | null> => {
    try {
      const feed = await feedsApi.getById(feedId);
      return normalizeMarkupRules((feed as FeedWithMarkup).markup_rules);
    } catch (error) {
      console.error('Error fetching markup rules:', error);
      throw error;
    }
  },

  /**
   * Update markup rules for a specific feed
   */
  updateMarkupRules: async (
    feedId: number,
    config: MarkupRulesConfig
  ): Promise<Feed> => {
    try {
      // Validate rules
      const validation = markupRulesApi.validateMarkupRules(config);
      if (!validation.valid) {
        throw new Error(
          `Invalid markup rules: ${validation.errors.join(', ')}`
        );
      }

      // Convert to storage format
      const markupRules = denormalizeMarkupRules(config);

      // Update the feed
      const updatedFeed = await feedsApi.update(feedId, {
        markup_rules: markupRules as any,
      });

      return updatedFeed;
    } catch (error) {
      console.error('Error updating markup rules:', error);
      throw error;
    }
  },

  /**
   * Validate markup rules configuration
   */
  validateMarkupRules: (
    config: MarkupRulesConfig
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.rules || config.rules.length === 0) {
      errors.push('At least one rule is required');
      return { valid: false, errors };
    }

    config.rules.forEach((rule, index) => {
      // Validate percent
      if (
        rule.percent === undefined ||
        rule.percent === null ||
        isNaN(rule.percent)
      ) {
        errors.push(`Rule ${index + 1}: Percent is required and must be a number`);
      } else if (rule.percent < 0) {
        errors.push(`Rule ${index + 1}: Percent cannot be negative`);
      }

      // Validate price ranges
      if (rule.minPrice !== null && rule.maxPrice !== null) {
        if (rule.minPrice >= rule.maxPrice) {
          errors.push(
            `Rule ${index + 1}: Min price must be less than max price`
          );
        }
      }

      // Check for negative prices
      if (rule.minPrice !== null && rule.minPrice < 0) {
        errors.push(`Rule ${index + 1}: Min price cannot be negative`);
      }
      if (rule.maxPrice !== null && rule.maxPrice < 0) {
        errors.push(`Rule ${index + 1}: Max price cannot be negative`);
      }
    });

    // Validate price fields if provided
    if (config.priceFields && config.priceFields.length === 0) {
      errors.push('Price fields array cannot be empty if provided');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

