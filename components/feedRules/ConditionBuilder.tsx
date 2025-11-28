'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Condition } from '@/lib/api/feedRules';

interface ConditionBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  onClose: () => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'In (Array)' },
  { value: 'regex', label: 'Regex' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
];

export default function ConditionBuilder({ conditions, onChange, onClose }: ConditionBuilderProps) {
  const handleAddCondition = () => {
    const newCondition: Condition = {
      field: '',
      operator: 'equals',
      value: '',
    };
    onChange([...conditions, newCondition]);
  };

  const handleUpdateCondition = (index: number, field: keyof Condition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDeleteCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    onChange(updated);
  };

  const parseValue = (operator: string, valueStr: string) => {
    // For 'in' operator, parse as array
    if (operator === 'in') {
      try {
        // Try parsing as JSON array first
        const parsed = JSON.parse(valueStr);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // If not valid JSON, split by comma
        return valueStr.split(',').map(v => v.trim()).filter(v => v);
      }
    }

    // For numeric operators, try to parse as number
    if (['gt', 'gte', 'lt', 'lte'].includes(operator)) {
      const num = parseFloat(valueStr);
      return isNaN(num) ? valueStr : num;
    }

    return valueStr;
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <Card className="mt-4 border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Edit Conditions</CardTitle>
          <CardDescription>
            Define conditions that must be met for this filter rule
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
            <p>No conditions added yet</p>
            <p className="text-sm mt-2">Click "Add Condition" to create a condition</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Field</label>
                    <Input
                      placeholder="field_name"
                      value={condition.field}
                      onChange={(e) => handleUpdateCondition(index, 'field', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Operator</label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => handleUpdateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      Value
                      {condition.operator === 'in' && (
                        <span className="ml-1 text-xs text-slate-400">(JSON array or comma-separated)</span>
                      )}
                    </label>
                    <Input
                      placeholder={
                        condition.operator === 'in' 
                          ? '["val1", "val2"] or val1, val2' 
                          : 'value'
                      }
                      value={formatValue(condition.value)}
                      onChange={(e) => 
                        handleUpdateCondition(index, 'value', parseValue(condition.operator, e.target.value))
                      }
                      className="h-9"
                    />
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteCondition(index)}
                  className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleAddCondition}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </Button>

        {conditions.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
            <Badge variant="outline" className="text-xs">AND Logic</Badge>
            All conditions must be met for this filter to match
          </div>
        )}
      </CardContent>
    </Card>
  );
}

