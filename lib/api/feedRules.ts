import { Feed, feedsApi } from './feeds';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface FeedRulesConfig {
  filters?: FilterRule[];
  fieldMappings?: FieldMapping[];
  fieldTransformations?: FieldTransformation[];
  calculatedFields?: CalculatedField[];
  shardRules?: ShardRule[];
}

export interface FilterRule {
  name: string;
  slug?: string;
  action?: 'include' | 'exclude';
  logic?: 'and' | 'or';
  conditions: Condition[];
}

export interface Condition {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'regex' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
  logic?: 'and' | 'or';
  conditions?: Condition[]; // for nested logic
}

export interface FieldMapping {
  source: string;
  target: string | 'ignore'; // Can be a field path like "module/table/field" or "ignore"
  type: 'direct';
  overwrite?: boolean; // default: false - adds new field instead of replacing
  module?: string; // Module name for target field
  table?: string; // Table name for target field
  field?: string; // Field name for target field
}

export interface FieldTransformation {
  target: string;
  type: 'conditional' | 'direct';
  value?: any; // for type='direct'
  conditions?: Condition[]; // for type='conditional'
  then?: any;
  else?: any;
  overwrite?: boolean; // default: false
}

export interface CalculatedField {
  target: string;
  type: 'calculate';
  operations: Operation[];
}

export interface Operation {
  type: 'add' | 'subtract' | 'multiply' | 'divide' | 'concat' | 'percentage';
  fields: (string | number)[];
  separator?: string; // for concat operations
}

export interface ShardCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'starts_with';
  value: any;
}

export interface ShardRule {
  name: string;
  shardKey: string;
  conditions: ShardCondition[];
  conditionLogic?: 'AND' | 'OR'; // default: AND
  priority: number;
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// API Functions
// ============================================================================

export const feedRulesApi = {
  /**
   * Get rules configuration for a specific feed
   */
  getFeedRules: async (feedId: number): Promise<FeedRulesConfig> => {
    try {
      const feed = await feedsApi.getById(feedId);
      
      // If rules is null or undefined, return empty config
      if (!feed.rules) {
        return {
          filters: [],
          fieldMappings: [],
          fieldTransformations: [],
          calculatedFields: [],
          shardRules: [],
        };
      }

      // Parse rules if it's a string (shouldn't happen but safety check)
      let rules = feed.rules;
      if (typeof rules === 'string') {
        try {
          rules = JSON.parse(rules);
        } catch (e) {
          console.error('Failed to parse rules JSON:', e);
          return {
            filters: [],
            fieldMappings: [],
            fieldTransformations: [],
            calculatedFields: [],
            shardRules: [],
          };
        }
      }

      // Handle legacy format where rules is just an array (old filter-only format)
      if (Array.isArray(rules)) {
        return {
          filters: rules as FilterRule[],
          fieldMappings: [],
          fieldTransformations: [],
          calculatedFields: [],
          shardRules: [],
        };
      }

      // Return full rules object with defaults for missing properties
      // Ensure each property is an array (handle cases where it might be an object or other type)
      return {
        filters: Array.isArray(rules.filters) ? rules.filters : [],
        fieldMappings: Array.isArray(rules.fieldMappings) ? rules.fieldMappings : [],
        fieldTransformations: Array.isArray(rules.fieldTransformations) ? rules.fieldTransformations : [],
        calculatedFields: Array.isArray(rules.calculatedFields) ? rules.calculatedFields : [],
        shardRules: Array.isArray(rules.shardRules) ? rules.shardRules : [],
      };
    } catch (error) {
      console.error('Error fetching feed rules:', error);
      throw error;
    }
  },

  /**
   * Update rules configuration for a specific feed
   */
  updateFeedRules: async (feedId: number, rules: FeedRulesConfig): Promise<Feed> => {
    try {
      // Validate rules before saving
      const validation = feedRulesApi.validateRules(rules);
      if (!validation.valid) {
        const errorMessages = validation.errors
          .filter(e => e.type === 'error')
          .map(e => `${e.field}: ${e.message}`)
          .join(', ');
        throw new Error(`Invalid rules configuration: ${errorMessages}`);
      }

      // Clean up empty arrays to keep JSON clean
      const cleanRules: FeedRulesConfig = {};
      if (rules.filters && rules.filters.length > 0) {
        cleanRules.filters = rules.filters;
      }
      if (rules.fieldMappings && rules.fieldMappings.length > 0) {
        cleanRules.fieldMappings = rules.fieldMappings;
      }
      if (rules.fieldTransformations && rules.fieldTransformations.length > 0) {
        cleanRules.fieldTransformations = rules.fieldTransformations;
      }
      if (rules.calculatedFields && rules.calculatedFields.length > 0) {
        cleanRules.calculatedFields = rules.calculatedFields;
      }
      if (rules.shardRules && rules.shardRules.length > 0) {
        cleanRules.shardRules = rules.shardRules;
      }

      // Update the feed with new rules
      const updatedFeed = await feedsApi.update(feedId, {
        rules: cleanRules,
      });

      return updatedFeed;
    } catch (error) {
      console.error('Error updating feed rules:', error);
      throw error;
    }
  },

  /**
   * Validate rules configuration
   */
  validateRules: (rules: FeedRulesConfig): ValidationResult => {
    const errors: ValidationError[] = [];

    // Reserved field names that cannot be used
    const reservedFields = ['_metadata', '_id', '_checksum'];

    // Validate filters
    if (rules.filters) {
      const filterNames = new Set<string>();
      
      rules.filters.forEach((filter, index) => {
        // Check required fields
        if (!filter.name || filter.name.trim() === '') {
          errors.push({
            field: `filters[${index}].name`,
            message: 'Filter name is required',
            type: 'error',
          });
        }

        // Check for duplicate names
        if (filter.name && filterNames.has(filter.name)) {
          errors.push({
            field: `filters[${index}].name`,
            message: `Duplicate filter name: "${filter.name}"`,
            type: 'error',
          });
        }
        filterNames.add(filter.name);

        // Validate conditions
        if (!filter.conditions || filter.conditions.length === 0) {
          errors.push({
            field: `filters[${index}].conditions`,
            message: 'At least one condition is required',
            type: 'error',
          });
        } else {
          filter.conditions.forEach((condition, condIndex) => {
            if (!condition.field) {
              errors.push({
                field: `filters[${index}].conditions[${condIndex}].field`,
                message: 'Field name is required',
                type: 'error',
              });
            }
            if (!condition.operator) {
              errors.push({
                field: `filters[${index}].conditions[${condIndex}].operator`,
                message: 'Operator is required',
                type: 'error',
              });
            }
          });
        }
      });
    }

    // Validate field mappings
    if (rules.fieldMappings) {
      rules.fieldMappings.forEach((mapping, index) => {
        if (!mapping.source || mapping.source.trim() === '') {
          errors.push({
            field: `fieldMappings[${index}].source`,
            message: 'Source field is required',
            type: 'error',
          });
        }
        if (!mapping.target || mapping.target.trim() === '') {
          errors.push({
            field: `fieldMappings[${index}].target`,
            message: 'Target field is required',
            type: 'error',
          });
        }
        // Check for reserved field names
        if (mapping.target && reservedFields.includes(mapping.target)) {
          errors.push({
            field: `fieldMappings[${index}].target`,
            message: `Cannot use reserved field name: ${mapping.target}`,
            type: 'error',
          });
        }
      });
    }

    // Validate field transformations
    if (rules.fieldTransformations) {
      rules.fieldTransformations.forEach((transform, index) => {
        if (!transform.target || transform.target.trim() === '') {
          errors.push({
            field: `fieldTransformations[${index}].target`,
            message: 'Target field is required',
            type: 'error',
          });
        }
        // Check for reserved field names
        if (transform.target && reservedFields.includes(transform.target)) {
          errors.push({
            field: `fieldTransformations[${index}].target`,
            message: `Cannot use reserved field name: ${transform.target}`,
            type: 'error',
          });
        }
        
        if (transform.type === 'conditional') {
          if (!transform.conditions || transform.conditions.length === 0) {
            errors.push({
              field: `fieldTransformations[${index}].conditions`,
              message: 'Conditional transformations require at least one condition',
              type: 'error',
            });
          }
          if (transform.then === undefined) {
            errors.push({
              field: `fieldTransformations[${index}].then`,
              message: '"then" value is required for conditional transformations',
              type: 'error',
            });
          }
        } else if (transform.type === 'direct') {
          if (transform.value === undefined) {
            errors.push({
              field: `fieldTransformations[${index}].value`,
              message: 'Value is required for direct transformations',
              type: 'error',
            });
          }
        }
      });
    }

    // Validate calculated fields
    if (rules.calculatedFields) {
      rules.calculatedFields.forEach((calc, index) => {
        if (!calc.target || calc.target.trim() === '') {
          errors.push({
            field: `calculatedFields[${index}].target`,
            message: 'Target field is required',
            type: 'error',
          });
        }
        // Check for reserved field names
        if (calc.target && reservedFields.includes(calc.target)) {
          errors.push({
            field: `calculatedFields[${index}].target`,
            message: `Cannot use reserved field name: ${calc.target}`,
            type: 'error',
          });
        }
        
        if (!calc.operations || calc.operations.length === 0) {
          errors.push({
            field: `calculatedFields[${index}].operations`,
            message: 'At least one operation is required',
            type: 'error',
          });
        } else {
          calc.operations.forEach((op, opIndex) => {
            if (!op.type) {
              errors.push({
                field: `calculatedFields[${index}].operations[${opIndex}].type`,
                message: 'Operation type is required',
                type: 'error',
              });
            }
            if (!op.fields || op.fields.length === 0) {
              errors.push({
                field: `calculatedFields[${index}].operations[${opIndex}].fields`,
                message: 'At least one field is required',
                type: 'error',
              });
            }
          });
        }
      });
    }

    // Validate shard rules
    if (rules.shardRules) {
      const ruleNames = new Set<string>();
      const priorities = new Set<number>();

      rules.shardRules.forEach((rule, index) => {
        // Check required fields
        if (!rule.name || rule.name.trim() === '') {
          errors.push({
            field: `shardRules[${index}].name`,
            message: 'Shard rule name is required',
            type: 'error',
          });
        }

        // Check for duplicate names
        if (rule.name && ruleNames.has(rule.name)) {
          errors.push({
            field: `shardRules[${index}].name`,
            message: `Duplicate shard rule name: "${rule.name}"`,
            type: 'error',
          });
        }
        ruleNames.add(rule.name);

        // Check shard key
        if (!rule.shardKey || rule.shardKey.trim() === '') {
          errors.push({
            field: `shardRules[${index}].shardKey`,
            message: 'Shard key is required',
            type: 'error',
          });
        }

        // Check priority
        if (rule.priority === undefined || rule.priority === null) {
          errors.push({
            field: `shardRules[${index}].priority`,
            message: 'Priority is required',
            type: 'error',
          });
        } else if (typeof rule.priority !== 'number' || rule.priority < 1) {
          errors.push({
            field: `shardRules[${index}].priority`,
            message: 'Priority must be a positive number',
            type: 'error',
          });
        }

        // Warn about duplicate priorities
        if (rule.priority && priorities.has(rule.priority)) {
          errors.push({
            field: `shardRules[${index}].priority`,
            message: `Duplicate priority: ${rule.priority}`,
            type: 'warning',
          });
        }
        priorities.add(rule.priority);

        // Validate conditions
        if (!rule.conditions || rule.conditions.length === 0) {
          errors.push({
            field: `shardRules[${index}].conditions`,
            message: 'At least one condition is required',
            type: 'error',
          });
        } else {
          rule.conditions.forEach((condition, condIndex) => {
            if (!condition.field || condition.field.trim() === '') {
              errors.push({
                field: `shardRules[${index}].conditions[${condIndex}].field`,
                message: 'Field name is required',
                type: 'error',
              });
            }
            if (!condition.operator) {
              errors.push({
                field: `shardRules[${index}].conditions[${condIndex}].operator`,
                message: 'Operator is required',
                type: 'error',
              });
            }
            // Validate value based on operator
            if (condition.value === undefined || condition.value === null || condition.value === '') {
              errors.push({
                field: `shardRules[${index}].conditions[${condIndex}].value`,
                message: 'Value is required',
                type: 'error',
              });
            } else if (['in', 'not_in'].includes(condition.operator) && !Array.isArray(condition.value)) {
              errors.push({
                field: `shardRules[${index}].conditions[${condIndex}].value`,
                message: 'Value must be an array for "in" and "not_in" operators',
                type: 'error',
              });
            }
          });
        }
      });
    }

    return {
      valid: errors.filter(e => e.type === 'error').length === 0,
      errors,
    };
  },

  /**
   * Get field mappings from field_mapping column
   */
  getFieldMappings: async (feedId: number): Promise<FieldMapping[]> => {
    try {
      const feed = await feedsApi.getById(feedId);
      return Array.isArray(feed.field_mapping) ? feed.field_mapping : [];
    } catch (error) {
      console.error('Error fetching field mappings:', error);
      throw error;
    }
  },

  /**
   * Update field mappings in field_mapping column
   */
  updateFieldMappings: async (feedId: number, mappings: FieldMapping[]): Promise<Feed> => {
    try {
      console.log('Updating field mappings for feed:', feedId, mappings);
      const updatedFeed = await feedsApi.update(feedId, {
        field_mapping: mappings,
      });
      console.log('Successfully updated field mappings:', updatedFeed);
      return updatedFeed;
    } catch (error) {
      console.error('Error updating field mappings:', {
        feedId,
        mappingsCount: mappings.length,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },
};

