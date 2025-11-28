/**
 * Feed Rules Validation
 * 
 * Validation logic for feed rules configuration.
 * The main validation function is exported from the feedRules API module.
 */

import { feedRulesApi, type FeedRulesConfig, type ValidationResult, type ValidationError } from '../api/feedRules';

/**
 * Re-export the main validation function from the API module
 */
export const validateFeedRules = feedRulesApi.validateRules;

/**
 * Validate a specific rule type
 */
export function validateRuleType(
  ruleType: keyof FeedRulesConfig,
  rules: FeedRulesConfig
): ValidationResult {
  // Create a partial rules config with only the specified type
  const partialRules: FeedRulesConfig = {
    [ruleType]: rules[ruleType],
  };

  return validateFeedRules(partialRules);
}

/**
 * Check if a field name is reserved
 */
export function isReservedFieldName(fieldName: string): boolean {
  const reserved = ['_metadata', '_id', '_checksum'];
  return reserved.includes(fieldName);
}

/**
 * Check if a rule name is unique within its type
 */
export function isRuleNameUnique(
  ruleName: string,
  ruleType: keyof FeedRulesConfig,
  rules: FeedRulesConfig,
  excludeIndex?: number
): boolean {
  const rulesOfType = rules[ruleType];
  
  if (!rulesOfType || !Array.isArray(rulesOfType)) {
    return true;
  }

  return !rulesOfType.some((rule: any, index: number) => {
    if (excludeIndex !== undefined && index === excludeIndex) {
      return false;
    }
    return rule.name === ruleName;
  });
}

/**
 * Validate operator and value type compatibility
 */
export function validateOperatorValueType(operator: string, value: any): ValidationError | null {
  const numericOperators = ['gt', 'gte', 'lt', 'lte'];
  
  if (numericOperators.includes(operator)) {
    if (typeof value !== 'number' && isNaN(parseFloat(value))) {
      return {
        field: 'value',
        message: `Operator "${operator}" requires a numeric value`,
        type: 'error',
      };
    }
  }

  if (operator === 'in' && !Array.isArray(value)) {
    return {
      field: 'value',
      message: 'Operator "in" requires an array value',
      type: 'error',
    };
  }

  return null;
}

/**
 * Get user-friendly error messages for validation errors
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  const errorMessages = errors
    .filter(e => e.type === 'error')
    .map(e => `• ${e.field}: ${e.message}`)
    .join('\n');

  return errorMessages;
}

/**
 * Get warning messages separately
 */
export function formatValidationWarnings(errors: ValidationError[]): string {
  const warnings = errors
    .filter(e => e.type === 'warning')
    .map(e => `• ${e.field}: ${e.message}`)
    .join('\n');

  return warnings;
}

// Re-export types for convenience
export type { ValidationResult, ValidationError, FeedRulesConfig };

