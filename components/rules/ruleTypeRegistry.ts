import PricingRuleColumns, { PRICING_HEADERS } from './PricingRuleColumns';
import OriginRuleColumns, { ORIGIN_HEADERS } from './OriginRuleColumns';
import ScoringRuleColumns, { SCORING_HEADERS } from './ScoringRuleColumns';
import FilterRuleColumns, { FILTER_HEADERS } from './FilterRuleColumns';
import GenericRuleColumns, { GENERIC_HEADERS } from './GenericRuleColumns';
import { RuleTypeConfig } from './types';

// Base template configurations
const TEMPLATE_CONFIGS: Record<string, RuleTypeConfig> = {
  'pricing': {
    component: PricingRuleColumns,
    headers: PRICING_HEADERS,
    defaultConfig: { source_field: [], target_field: [], min_price: 0, max_price: 0, percent: 0, fixed_amount: 0 },
  },
  'origin': {
    component: OriginRuleColumns,
    headers: ORIGIN_HEADERS,
    defaultConfig: { source_field: '', source_value: '', target_field: '', target_value: '' },
  },
  'scoring': {
    component: ScoringRuleColumns,
    headers: SCORING_HEADERS,
    defaultConfig: { field_name: '', field_value: '', target_field: '', score_multiplier: 1 },
  },
  'filter': {
    component: FilterRuleColumns,
    headers: FILTER_HEADERS,
    defaultConfig: { field_name: '', field_value: '' },
  },
  'generic': {
    component: GenericRuleColumns,
    headers: GENERIC_HEADERS,
    defaultConfig: { source_field: '', source_value: '', target_field: '', target_value: '' },
  },
};

// Default registry - maps rule types to their templates
export const RULE_TYPE_REGISTRY: Record<string, RuleTypeConfig> = {
  'pricing': TEMPLATE_CONFIGS['pricing'],
  'origin': TEMPLATE_CONFIGS['origin'],
  'scoring': TEMPLATE_CONFIGS['scoring'],
  'filter': TEMPLATE_CONFIGS['filter'],
};

const STORAGE_KEY = 'ruleTypeTemplates';

// Get rule type to template mappings from localStorage
export function getRuleTypeTemplates(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save rule type to template mapping
export function saveRuleTypeTemplate(ruleType: string, templateName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const templates = getRuleTypeTemplates();
    templates[ruleType] = templateName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save rule type template:', e);
  }
}

// Get configuration for a rule type (checks localStorage first, then defaults)
export function getRuleTypeConfig(ruleType: string): RuleTypeConfig {
  // Check if there's a saved template mapping
  const templates = getRuleTypeTemplates();
  const templateName = templates[ruleType];
  
  if (templateName && TEMPLATE_CONFIGS[templateName]) {
    return TEMPLATE_CONFIGS[templateName];
  }
  
  // Check default registry
  if (RULE_TYPE_REGISTRY[ruleType]) {
    return RULE_TYPE_REGISTRY[ruleType];
  }
  
  // Fall back to generic
  return TEMPLATE_CONFIGS['generic'];
}

// Check if a rule type has a template assigned
export function hasTemplateAssigned(ruleType: string): boolean {
  const templates = getRuleTypeTemplates();
  return !!templates[ruleType] || !!RULE_TYPE_REGISTRY[ruleType];
}

