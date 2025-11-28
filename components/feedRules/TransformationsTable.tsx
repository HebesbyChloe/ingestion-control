'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FeedRulesConfig, FieldTransformation, Condition } from '@/lib/api/feedRules';
import type { FieldSchema } from '@/lib/api/feeds';

interface TransformationsTableProps {
  rules: FeedRulesConfig;
  setRules: (rules: FeedRulesConfig) => void;
  fieldSchema?: FieldSchema;
}

export default function TransformationsTable({ rules, setRules, fieldSchema }: TransformationsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FieldTransformation>>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const transformations = rules.fieldTransformations || [];

  const handleAdd = () => {
    const newTransform: FieldTransformation = {
      target: '',
      type: 'conditional',
      conditions: [],
      then: '',
      else: '',
      overwrite: false,
    };

    setRules({
      ...rules,
      fieldTransformations: [...transformations, newTransform],
    });

    // Start editing the new transformation
    setEditingIndex(transformations.length);
    setEditData(newTransform);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setExpandedIndex(index);
    setEditData({ ...transformations[index] });
  };

  const handleSave = (index: number) => {
    // Validate required fields
    if (!editData.target) {
      alert('Target field is required');
      return;
    }

    if (editData.type === 'conditional') {
      if (!editData.conditions || editData.conditions.length === 0) {
        alert('At least one condition is required for conditional transformations');
        return;
      }
      if (editData.then === undefined) {
        alert('"Then" value is required for conditional transformations');
        return;
      }
    } else if (editData.type === 'direct') {
      if (editData.value === undefined || editData.value === '') {
        alert('Value is required for direct transformations');
        return;
      }
    }

    const updatedTransformations = [...transformations];
    updatedTransformations[index] = editData as FieldTransformation;

    setRules({
      ...rules,
      fieldTransformations: updatedTransformations,
    });

    setEditingIndex(null);
    setEditData({});
    setShowConditionBuilder(false);
  };

  const handleCancel = () => {
    // If editing a new transformation that wasn't saved, remove it
    if (editingIndex === transformations.length - 1 && !transformations[editingIndex].target) {
      const updatedTransformations = transformations.slice(0, -1);
      setRules({
        ...rules,
        fieldTransformations: updatedTransformations,
      });
    }

    setEditingIndex(null);
    setEditData({});
    setShowConditionBuilder(false);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this transformation?')) {
      const updatedTransformations = transformations.filter((_, i) => i !== index);
      setRules({
        ...rules,
        fieldTransformations: updatedTransformations,
      });
    }
  };

  const handleUpdate = (field: keyof FieldTransformation, value: any) => {
    setEditData({ ...editData, [field]: value });
    
    // If changing type, reset fields
    if (field === 'type') {
      if (value === 'direct') {
        // Clear conditional fields
        setEditData({ ...editData, type: value, conditions: undefined, then: undefined, else: undefined });
      } else {
        // Clear direct field, initialize conditions
        setEditData({ ...editData, type: value, value: undefined, conditions: editData.conditions || [] });
      }
    }
  };

  const handleConditionsChange = (conditions: Condition[]) => {
    setEditData({ ...editData, conditions });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {transformations.length} transformation{transformations.length !== 1 ? 's' : ''} configured
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Transformation
        </Button>
      </div>

      {transformations.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No transformations configured</p>
          <p className="text-sm mt-2">Click "Add Transformation" to create your first field transformation</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead className="w-32">Overwrite</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transformations.map((transform, index) => {
                const isEditing = editingIndex === index;
                const isExpanded = expandedIndex === index;
                const showConditions = isEditing && (editData.type || transform.type) === 'conditional';

                return (
                  <>
                    <TableRow key={index} className={isEditing ? 'bg-blue-50' : ''}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editData.target || ''}
                            onChange={(e) => handleUpdate('target', e.target.value)}
                            placeholder="target_field_name"
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium font-mono text-sm">{transform.target}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editData.type || 'conditional'}
                            onValueChange={(value) => handleUpdate('type', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conditional">Conditional</SelectItem>
                              <SelectItem value="direct">Direct</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">
                            {transform.type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-2">
                            {(editData.type || transform.type) === 'conditional' ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <span>{(editData.conditions || []).length} condition(s)</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </Button>
                                <div className="flex gap-2">
                                  <Input
                                    value={editData.then !== undefined ? String(editData.then) : ''}
                                    onChange={(e) => handleUpdate('then', e.target.value)}
                                    placeholder="Then value"
                                    className="h-8 flex-1"
                                  />
                                  <Input
                                    value={editData.else !== undefined ? String(editData.else) : ''}
                                    onChange={(e) => handleUpdate('else', e.target.value)}
                                    placeholder="Else value (optional)"
                                    className="h-8 flex-1"
                                  />
                                </div>
                              </>
                            ) : (
                              <Input
                                value={editData.value !== undefined ? String(editData.value) : ''}
                                onChange={(e) => handleUpdate('value', e.target.value)}
                                placeholder="Constant value"
                                className="h-8"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-600">
                            {transform.type === 'conditional' ? (
                              <div>
                                <div className="text-xs text-slate-500 mb-1">
                                  {transform.conditions?.length || 0} condition(s)
                                </div>
                                <div>
                                  <span className="font-mono text-xs">then: {String(transform.then)}</span>
                                  {transform.else && (
                                    <span className="ml-2 font-mono text-xs">else: {String(transform.else)}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="font-mono text-xs">= {String(transform.value)}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`overwrite-${index}`}
                              checked={editData.overwrite || false}
                              onCheckedChange={(checked) => handleUpdate('overwrite', checked)}
                            />
                            <label
                              htmlFor={`overwrite-${index}`}
                              className="text-sm cursor-pointer"
                            >
                              Yes
                            </label>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-600">
                            {transform.overwrite ? 'Yes' : 'No'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleSave(index)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                                onClick={handleCancel}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEdit(index)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Conditions Row */}
                    {showConditions && isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50 p-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Conditions</h4>
                            {/* Simple inline condition builder */}
                            <div className="space-y-2">
                              {(editData.conditions || []).map((condition: any, condIndex: number) => (
                                <div key={condIndex} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded">
                                  <Input
                                    placeholder="Field"
                                    value={condition.field || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.conditions || [])];
                                      updated[condIndex] = { ...updated[condIndex], field: e.target.value };
                                      handleConditionsChange(updated);
                                    }}
                                    className="h-8 w-40"
                                  />
                                  <select
                                    value={condition.operator || 'equals'}
                                    onChange={(e) => {
                                      const updated = [...(editData.conditions || [])];
                                      updated[condIndex] = { ...updated[condIndex], operator: e.target.value };
                                      handleConditionsChange(updated);
                                    }}
                                    className="h-8 px-2 border border-slate-300 rounded-md text-sm"
                                  >
                                    <option value="equals">equals</option>
                                    <option value="contains">contains</option>
                                    <option value="in">in</option>
                                    <option value="gt">greater than</option>
                                    <option value="lt">less than</option>
                                  </select>
                                  <Input
                                    placeholder="Value"
                                    value={condition.value || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.conditions || [])];
                                      updated[condIndex] = { ...updated[condIndex], value: e.target.value };
                                      handleConditionsChange(updated);
                                    }}
                                    className="h-8 flex-1"
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      const updated = (editData.conditions || []).filter((_, i) => i !== condIndex);
                                      handleConditionsChange(updated);
                                    }}
                                    className="h-8 w-8 text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleConditionsChange([...(editData.conditions || []), { field: '', operator: 'equals', value: '' }]);
                                }}
                                className="w-full gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Add Condition
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-slate-700">
        <p className="font-medium mb-1">💡 Transformation Types:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Conditional:</strong> Apply transformation based on conditions (if-then-else logic)</li>
          <li><strong>Direct:</strong> Assign a constant value to the target field</li>
          <li><strong>Overwrite = No (default):</strong> Creates new field, keeps original fields</li>
          <li><strong>Overwrite = Yes:</strong> Replaces existing field value</li>
        </ul>
      </div>
    </div>
  );
}

