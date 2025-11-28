'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';
import { getAvailableOperators, getOperatorInputType, validateOperatorValue, type OperatorType } from '@/lib/utils/operators';
import type { FieldSchema } from '@/lib/api/feeds';

// Generic condition type to support both ShardCondition and Condition
interface GenericCondition {
  field: string;
  operator: string;
  value: any;
}

interface ConditionBuilderProps {
  conditions: GenericCondition[];
  onChange: (conditions: GenericCondition[]) => void;
  fieldSchema?: FieldSchema;
  allowedOperators?: string[]; // Optional: filter operators to specific ones
}

export default function ConditionBuilder({ conditions, onChange, fieldSchema, allowedOperators }: ConditionBuilderProps) {
  const [arrayInput, setArrayInput] = useState<Record<number, string>>({});

  // Get all operators, then filter if allowedOperators is provided
  const allOperators = getAvailableOperators();
  const operators = allowedOperators
    ? allOperators.filter(op => allowedOperators.includes(op.value))
    : allOperators;

  // Build list of available field names for autocomplete
  const availableFields: string[] = [];
  if (fieldSchema?.fields) {
    fieldSchema.fields.forEach(field => {
      availableFields.push(field.name);
      field.aliases.forEach(alias => {
        if (!availableFields.includes(alias)) {
          availableFields.push(alias);
        }
      });
    });
  }

  const handleAddCondition = () => {
    onChange([
      ...conditions,
      { field: '', operator: 'equals', value: '' },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, field: keyof GenericCondition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };

    // Reset value when operator changes
    if (field === 'operator') {
      try {
        const inputType = getOperatorInputType(value as OperatorType);
        if (inputType === 'array') {
          updated[index].value = [];
          setArrayInput({ ...arrayInput, [index]: '' });
        } else {
          updated[index].value = '';
        }
      } catch {
        // If operator is not recognized, keep current value
        updated[index].value = '';
      }
    }

    onChange(updated);
  };

  const handleArrayInputChange = (index: number, input: string) => {
    setArrayInput({ ...arrayInput, [index]: input });
  };

  const handleAddArrayValue = (index: number) => {
    const input = arrayInput[index]?.trim();
    if (!input) return;

    const condition = conditions[index];
    const currentArray = Array.isArray(condition.value) ? condition.value : [];
    
    if (!currentArray.includes(input)) {
      handleUpdateCondition(index, 'value', [...currentArray, input]);
    }
    
    setArrayInput({ ...arrayInput, [index]: '' });
  };

  const handleRemoveArrayValue = (conditionIndex: number, valueIndex: number) => {
    const condition = conditions[conditionIndex];
    const currentArray = Array.isArray(condition.value) ? condition.value : [];
    handleUpdateCondition(conditionIndex, 'value', currentArray.filter((_, i) => i !== valueIndex));
  };

  return (
    <div className="space-y-3">
      {conditions.map((condition, index) => {
        const inputType = getOperatorInputType(condition.operator as OperatorType);
        const error = validateOperatorValue(condition.operator as OperatorType, condition.value);

        return (
          <div key={index} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Field Name */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Field
                  </label>
                  <Input
                    value={condition.field}
                    onChange={(e) => handleUpdateCondition(index, 'field', e.target.value)}
                    placeholder="Field name"
                    className="h-9 text-sm"
                    list={`field-list-${index}`}
                  />
                  {availableFields.length > 0 && (
                    <datalist id={`field-list-${index}`}>
                      {availableFields.map((field, idx) => (
                        <option key={idx} value={field} />
                      ))}
                    </datalist>
                  )}
                </div>

                {/* Operator */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Operator
                  </label>
                  <select
                    value={condition.operator}
                    onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Value
                  </label>
                  {inputType === 'array' ? (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <Input
                          value={arrayInput[index] || ''}
                          onChange={(e) => handleArrayInputChange(index, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddArrayValue(index);
                            }
                          }}
                          placeholder="Add value"
                          className="h-9 text-sm flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddArrayValue(index)}
                          className="h-9"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {Array.isArray(condition.value) && condition.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 p-2 border border-slate-200 rounded bg-white min-h-[36px]">
                          {condition.value.map((val, valIndex) => (
                            <Badge key={valIndex} variant="secondary" className="gap-1 pr-1">
                              <span className="text-xs">{val}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveArrayValue(index, valIndex)}
                                className="hover:bg-slate-300 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      type={inputType === 'number' ? 'number' : 'text'}
                      value={condition.value}
                      onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                      placeholder="Enter value"
                      className={`h-9 text-sm ${error ? 'border-red-300' : ''}`}
                    />
                  )}
                  {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  )}
                </div>
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveCondition(index)}
                className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 mt-5"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Add Condition Button */}
      <Button
        type="button"
        onClick={handleAddCondition}
        variant="outline"
        size="sm"
        className="w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Condition
      </Button>
    </div>
  );
}
