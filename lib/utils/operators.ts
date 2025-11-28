export type OperatorType =
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'starts_with';

export interface OperatorMetadata {
  value: OperatorType;
  label: string;
  inputType: 'text' | 'number' | 'array';
  description: string;
}

export const OPERATORS: OperatorMetadata[] = [
  {
    value: 'equals',
    label: 'Equals',
    inputType: 'text',
    description: 'Field value must exactly match the specified value',
  },
  {
    value: 'not_equals',
    label: 'Not Equals',
    inputType: 'text',
    description: 'Field value must not match the specified value',
  },
  {
    value: 'in',
    label: 'In (Array)',
    inputType: 'array',
    description: 'Field value must be one of the specified values',
  },
  {
    value: 'not_in',
    label: 'Not In (Array)',
    inputType: 'array',
    description: 'Field value must not be any of the specified values',
  },
  {
    value: 'gt',
    label: 'Greater Than',
    inputType: 'number',
    description: 'Field value must be greater than the specified value',
  },
  {
    value: 'gte',
    label: 'Greater Than or Equal',
    inputType: 'number',
    description: 'Field value must be greater than or equal to the specified value',
  },
  {
    value: 'lt',
    label: 'Less Than',
    inputType: 'number',
    description: 'Field value must be less than the specified value',
  },
  {
    value: 'lte',
    label: 'Less Than or Equal',
    inputType: 'number',
    description: 'Field value must be less than or equal to the specified value',
  },
  {
    value: 'contains',
    label: 'Contains',
    inputType: 'text',
    description: 'Field value must contain the specified text',
  },
  {
    value: 'starts_with',
    label: 'Starts With',
    inputType: 'text',
    description: 'Field value must start with the specified text',
  },
];

/**
 * Get human-readable label for an operator
 */
export function getOperatorLabel(operator: OperatorType): string {
  const op = OPERATORS.find((o) => o.value === operator);
  return op?.label || operator;
}

/**
 * Get input type needed for an operator
 */
export function getOperatorInputType(operator: OperatorType): 'text' | 'number' | 'array' {
  const op = OPERATORS.find((o) => o.value === operator);
  return op?.inputType || 'text';
}

/**
 * Get all available operators
 */
export function getAvailableOperators(): OperatorMetadata[] {
  return OPERATORS;
}

/**
 * Validate that a value is appropriate for the given operator
 */
export function validateOperatorValue(operator: OperatorType, value: any): string | null {
  if (value === undefined || value === null) {
    return 'Value is required';
  }

  const inputType = getOperatorInputType(operator);

  switch (inputType) {
    case 'array':
      if (!Array.isArray(value)) {
        return `Value must be an array for "${getOperatorLabel(operator)}" operator`;
      }
      if (value.length === 0) {
        return 'Array must contain at least one value';
      }
      break;

    case 'number':
      if (value === '') {
        return 'Value is required';
      }
      if (isNaN(Number(value))) {
        return `Value must be a number for "${getOperatorLabel(operator)}" operator`;
      }
      break;

    case 'text':
      if (typeof value !== 'string' && typeof value !== 'number') {
        return `Value must be text for "${getOperatorLabel(operator)}" operator`;
      }
      if (String(value).trim() === '') {
        return 'Value cannot be empty';
      }
      break;
  }

  return null; // No error
}

/**
 * Get description for an operator
 */
export function getOperatorDescription(operator: OperatorType): string {
  const op = OPERATORS.find((o) => o.value === operator);
  return op?.description || '';
}

