import React from 'react';
import { Input } from '@/components/ui/input';
import { TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RuleColumnProps, ColumnHeader } from './types';

export const ORIGIN_HEADERS: ColumnHeader[] = [
  { key: 'source_field', label: 'Source Field' },
  { key: 'source_value', label: 'Source Value' },
  { key: 'target_field', label: 'Target Field' },
  { key: 'target_value', label: 'Target Value' },
];

export default function OriginRuleColumns({
  rule,
  isEditing,
  config,
  onConfigChange,
}: RuleColumnProps) {
  const sourceField = config?.source_field ?? '';
  const sourceValue = config?.source_value ?? '';
  const targetField = config?.target_field ?? '';
  const targetValue = config?.target_value ?? '';

  return (
    <>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={sourceField}
            onChange={(e) => onConfigChange('source_field', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., origin_country"
          />
        ) : (
          <span className="text-sm">{sourceField || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={sourceValue}
            onChange={(e) => onConfigChange('source_value', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., USA"
          />
        ) : (
          <span className="text-sm">{sourceValue || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={targetField}
            onChange={(e) => onConfigChange('target_field', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., country"
          />
        ) : (
          <span className="text-sm">{targetField || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={targetValue}
            onChange={(e) => onConfigChange('target_value', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., United States"
          />
        ) : (
          <span className="text-sm">{targetValue || '-'}</span>
        )}
      </TableCell>
    </>
  );
}

