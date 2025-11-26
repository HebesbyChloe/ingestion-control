/**
 * Validates a feed key before creation/deletion
 * @param feedKey - The feed key to validate
 * @param existingFeeds - Array of existing feed keys
 * @returns Validation result with success and optional error message
 */
export function validateFeedKey(feedKey: string, existingFeeds: string[]): { valid: boolean; error?: string } {
  if (!feedKey || feedKey.trim().length === 0) {
    return { valid: false, error: 'Feed key cannot be empty' };
  }
  
  if (existingFeeds.includes(feedKey.trim())) {
    return { valid: false, error: 'Feed key already exists' };
  }
  
  // Check for invalid characters (only allow alphanumeric, dash, underscore)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(feedKey.trim())) {
    return { valid: false, error: 'Feed key can only contain letters, numbers, dashes, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validates a rule type before creation/deletion
 * @param ruleType - The rule type to validate
 * @param existingRuleTypes - Array of existing rule types
 * @returns Validation result with success and optional error message
 */
export function validateRuleType(ruleType: string, existingRuleTypes: string[]): { valid: boolean; error?: string } {
  if (!ruleType || ruleType.trim().length === 0) {
    return { valid: false, error: 'Rule type cannot be empty' };
  }
  
  if (existingRuleTypes.includes(ruleType.trim())) {
    return { valid: false, error: 'Rule type already exists' };
  }
  
  // Check for invalid characters (only allow alphanumeric, dash, underscore, space)
  const validPattern = /^[a-zA-Z0-9_\- ]+$/;
  if (!validPattern.test(ruleType.trim())) {
    return { valid: false, error: 'Rule type can only contain letters, numbers, spaces, dashes, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validates if a feed can be deleted (no rules associated)
 * @param ruleCount - Number of rules associated with the feed
 * @returns True if feed can be deleted
 */
export function canDeleteFeed(ruleCount: number): boolean {
  return ruleCount === 0;
}

/**
 * Validates if a rule type can be deleted (no rules of that type)
 * @param ruleCount - Number of rules of that type
 * @returns True if rule type can be deleted
 */
export function canDeleteRuleType(ruleCount: number): boolean {
  return ruleCount === 0;
}

/**
 * Validates rule configuration based on rule type
 * @param ruleType - The type of rule
 * @param config - The configuration object
 * @returns Validation result
 */
export function validateRuleConfig(ruleType: string, config: any): { valid: boolean; error?: string } {
  if (!config) {
    return { valid: false, error: 'Configuration is required' };
  }
  
  // Type-specific validation
  switch (ruleType) {
    case 'pricing':
      if (config.min_price !== undefined && config.max_price !== undefined) {
        if (config.min_price >= config.max_price) {
          return { valid: false, error: 'Min price must be less than max price' };
        }
      }
      break;
    
    case 'origin':
      if (!config.source_field || !config.target_field) {
        return { valid: false, error: 'Origin rules require source_field and target_field' };
      }
      break;
    
    case 'scoring':
      if (!config.field_name) {
        return { valid: false, error: 'Scoring rules require field_name' };
      }
      break;
    
    case 'filter':
      if (!config.field_name) {
        return { valid: false, error: 'Filter rules require field_name' };
      }
      break;
  }
  
  return { valid: true };
}

