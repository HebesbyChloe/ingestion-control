import { IngestionRule } from '@/lib/api/rules';

/**
 * Normalizes a key to snake_case format
 * @param key - The key to normalize
 * @returns Normalized key in snake_case
 */
export function normalizeKey(key: string): string {
  return key
    .replace(/\s+/g, '_')  // Replace spaces with underscores
    .replace(/([A-Z])/g, '_$1')  // Add underscore before capitals
    .toLowerCase()
    .replace(/^_/, '');  // Remove leading underscore
}

/**
 * Normalizes a string by replacing spaces with underscores
 * @param str - The string to normalize
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
  return str.replace(/\s+/g, '_');
}

/**
 * Recursively normalizes object keys and string values
 * @param obj - The object to normalize
 * @returns Normalized object
 */
export function normalizeObject(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === 'string') return normalizeString(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeObject);
  
  const normalized: any = {};
  Object.keys(obj).forEach(key => {
    const normalizedKey = normalizeKey(key);
    normalized[normalizedKey] = normalizeObject(obj[key]);
  });
  return normalized;
}

/**
 * Cleans an object by removing null/undefined values and empty arrays/objects
 * @param obj - The object to clean
 * @returns Cleaned object
 */
export function cleanObject(obj: any): any {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      // Keep non-empty arrays
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value;
        }
        return;
      }
      // Skip empty objects (like empty condition)
      if (typeof value === 'object' && Object.keys(value).length === 0) {
        return;
      }
      cleaned[key] = value;
    }
  });
  return cleaned;
}

/**
 * Generates combined JSON configuration for all rules of a feed
 * @param allFeedRules - All rules for the selected feed
 * @param selectedFeed - The selected feed key
 * @returns Combined configuration object
 */
export function getCombinedConfig(allFeedRules: IngestionRule[], selectedFeed: string): any {
  // Parse all rules for the feed
  const parsedAllRules = (allFeedRules || []).map(rule => {
    let parsedConfig = rule.config;
    if (typeof rule.config === 'string') {
      try {
        parsedConfig = JSON.parse(rule.config);
      } catch (e) {
        console.error('Failed to parse config:', e);
        parsedConfig = {};
      }
    }
    return {
      ...rule,
      config: parsedConfig || {},
    };
  });

  // Get ALL enabled rules for the selected feed (across all rule types)
  const enabledFeedRules = parsedAllRules.filter(rule => 
    rule.enabled && 
    rule.feed_key === selectedFeed
  );
  
  // Build the structured config
  const config: any = {
    feed_name: selectedFeed,
    field_mapping: [],
    markup_rules: [],
    value_transform_rules: {},
    scoring_rules: [],
    filter_rules: [],
    default_values: {}
  };

  enabledFeedRules.forEach(rule => {
    const ruleConfig = rule.config as any;

    // Standardized format for all rule types
    const standardizedRule: any = {
      source_field: null,
      source_value: null,
      target_field: null,
      target_value: null,
      condition: {}
    };

    switch (rule.rule_type) {
      case 'origin':
        standardizedRule.source_field = ruleConfig.source_field || null;
        standardizedRule.source_value = ruleConfig.source_value || null;
        standardizedRule.target_field = ruleConfig.target_field || null;
        standardizedRule.target_value = ruleConfig.target_value || null;
        // No additional conditions for origin
        config.field_mapping.push(normalizeObject(cleanObject(standardizedRule)));
        break;

      case 'pricing':
        standardizedRule.source_field = ruleConfig.source_field || null;
        standardizedRule.source_value = null;
        standardizedRule.target_field = ruleConfig.target_field || null;
        standardizedRule.target_value = null;
        standardizedRule.condition = {
          min_price: ruleConfig.min_price ?? 0,
          max_price: ruleConfig.max_price ?? 0,
          percent: ruleConfig.percent ?? 0,
          fixed_amount: ruleConfig.fixed_amount ?? 0,
        };
        config.markup_rules.push(normalizeObject(cleanObject(standardizedRule)));
        break;

      case 'scoring':
        standardizedRule.source_field = ruleConfig.field_name || null;
        standardizedRule.source_value = ruleConfig.field_value || null;
        standardizedRule.target_field = ruleConfig.target_field || null;
        standardizedRule.target_value = ruleConfig.score_multiplier ?? 1;
        // Put any extra fields into condition
        const scoringCondition: any = {};
        Object.keys(ruleConfig).forEach(key => {
          if (!['field_name', 'field_value', 'target_field', 'score_multiplier'].includes(key)) {
            scoringCondition[key] = ruleConfig[key];
          }
        });
        if (Object.keys(scoringCondition).length > 0) {
          standardizedRule.condition = scoringCondition;
        }
        config.scoring_rules.push(normalizeObject(cleanObject(standardizedRule)));
        break;

      case 'filter':
        standardizedRule.source_field = ruleConfig.field_name || null;
        standardizedRule.source_value = ruleConfig.field_value || null;
        standardizedRule.target_field = null;
        standardizedRule.target_value = null;
        standardizedRule.condition = {
          operator: ruleConfig.operator || 'equals',
        };
        config.filter_rules.push(normalizeObject(cleanObject(standardizedRule)));
        break;

      default:
        // For custom rule types, extract standard fields and put rest in condition
        standardizedRule.source_field = ruleConfig.source_field || null;
        standardizedRule.source_value = ruleConfig.source_value || null;
        standardizedRule.target_field = ruleConfig.target_field || null;
        standardizedRule.target_value = ruleConfig.target_value || null;
        
        // Everything else goes into condition
        const customCondition: any = {};
        Object.keys(ruleConfig).forEach(key => {
          if (!['source_field', 'source_value', 'target_field', 'target_value'].includes(key)) {
            customCondition[key] = ruleConfig[key];
          }
        });
        if (Object.keys(customCondition).length > 0) {
          standardizedRule.condition = customCondition;
        }
        
        const ruleTypeKey = normalizeKey(rule.rule_type) + '_rules';
        if (!config[ruleTypeKey]) {
          config[ruleTypeKey] = [];
        }
        config[ruleTypeKey].push(normalizeObject(cleanObject(standardizedRule)));
        break;
    }
  });

  // Remove empty arrays/objects to keep JSON clean
  if (config.field_mapping.length === 0) delete config.field_mapping;
  if (config.markup_rules.length === 0) delete config.markup_rules;
  if (config.scoring_rules.length === 0) delete config.scoring_rules;
  if (config.filter_rules.length === 0) delete config.filter_rules;
  if (Object.keys(config.value_transform_rules).length === 0) delete config.value_transform_rules;
  if (Object.keys(config.default_values).length === 0) delete config.default_values;

  return config;
}

