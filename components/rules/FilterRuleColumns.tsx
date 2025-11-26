import React from 'react';
import { Input } from '@/components/ui/input';
import { TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RuleColumnProps, ColumnHeader } from './types';

export const FILTER_HEADERS: ColumnHeader[] = [
  { key: 'field_name', label: 'Field Name' },
  { key: 'operator', label: 'Operator' },
  { key: 'field_value', label: 'Field Value' },
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_or_equal', label: 'Greater or Equal' },
  { value: 'less_or_equal', label: 'Less or Equal' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
];

export default function FilterRuleColumns({
  rule,
  isEditing,
  config,
  onConfigChange,
}: RuleColumnProps) {
  const fieldName = config?.field_name ?? '';
  const operator = config?.operator ?? 'equals';
  const fieldValue = config?.field_value ?? '';

  return (
    <>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={fieldName}
            onChange={(e) => onConfigChange('field_name', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., price"
          />
        ) : (
          <span className="text-sm">{fieldName || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Select 
            value={operator} 
            onValueChange={(val) => onConfigChange('operator', val)}
          >
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm capitalize">{operator.replace(/_/g, ' ')}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={fieldValue}
            onChange={(e) => onConfigChange('field_value', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="Value"
          />
        ) : (
          <span className="text-sm">{fieldValue || '-'}</span>
        )}
      </TableCell>
    </>
  );
}

