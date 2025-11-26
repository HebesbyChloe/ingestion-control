import React from 'react';
import { Input } from '@/components/ui/input';
import { TableCell } from '@/components/ui/table';
import { RuleColumnProps, ColumnHeader } from './types';

export const SCORING_HEADERS: ColumnHeader[] = [
  { key: 'field_name', label: 'Field Name' },
  { key: 'field_value', label: 'Field Value' },
  { key: 'target_field', label: 'Target Field' },
  { key: 'score_multiplier', label: 'Score Multiplier' },
  { key: 'conditions', label: 'Conditions' },
];

export default function ScoringRuleColumns({
  rule,
  isEditing,
  config,
  onConfigChange,
}: RuleColumnProps) {
  const fieldName = config?.field_name ?? '';
  const fieldValue = config?.field_value ?? '';
  const targetField = config?.target_field ?? '';
  const scoreMultiplier = config?.score_multiplier ?? 1;
  const conditions = config?.conditions ?? {};

  return (
    <>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={fieldName}
            onChange={(e) => onConfigChange('field_name', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., clarity"
          />
        ) : (
          <span className="text-sm">{fieldName || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={fieldValue}
            onChange={(e) => onConfigChange('field_value', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., IF"
          />
        ) : (
          <span className="text-sm">{fieldValue || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={targetField}
            onChange={(e) => onConfigChange('target_field', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="e.g., clarity_score"
          />
        ) : (
          <span className="text-sm">{targetField || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={scoreMultiplier}
            onChange={(e) => onConfigChange('score_multiplier', e.target.value === '' ? 1 : Number(e.target.value))}
            className="w-[100px] bg-white"
          />
        ) : (
          <span className="text-sm">{scoreMultiplier}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={typeof conditions === 'string' ? conditions : JSON.stringify(conditions)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onConfigChange('conditions', parsed);
              } catch {
                onConfigChange('conditions', e.target.value);
              }
            }}
            className="w-[150px] bg-white"
            placeholder="{}"
          />
        ) : (
          <span className="text-sm text-slate-500">
            {typeof conditions === 'object' && Object.keys(conditions).length > 0 
              ? JSON.stringify(conditions) 
              : '-'}
          </span>
        )}
      </TableCell>
    </>
  );
}

