'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { FeedRulesConfig, ShardRule, ShardCondition } from '@/lib/api/feedRules';
import type { FieldSchema } from '@/lib/api/feeds';
import ConditionBuilder, { type GenericCondition } from './ConditionBuilder';
import { COMMON_SHARD_KEYS } from '@/lib/constants/shardKeys';

interface ShardRulesTableProps {
  rules: FeedRulesConfig;
  setRules: (rules: FeedRulesConfig) => void;
  fieldSchema?: FieldSchema;
}

export default function ShardRulesTable({ rules, setRules, fieldSchema }: ShardRulesTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<ShardRule>>({});
  const [customShardKey, setCustomShardKey] = useState(false);

  const shardRules = rules.shardRules || [];

  const handleAdd = () => {
    const newRule: ShardRule = {
      name: '',
      shardKey: '',
      conditions: [{ field: '', operator: 'equals', value: '' }],
      conditionLogic: 'AND',
      priority: shardRules.length + 1,
    };

    setRules({
      ...rules,
      shardRules: [...shardRules, newRule],
    });

    setEditingIndex(shardRules.length);
    setExpandedIndex(shardRules.length);
    setEditData(newRule);
    setCustomShardKey(false);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setExpandedIndex(index);
    setEditData({ ...shardRules[index] });
    // Check if shard key is custom
    setCustomShardKey(!COMMON_SHARD_KEYS.includes(shardRules[index].shardKey));
  };

  const handleSave = (index: number) => {
    // Validate required fields
    if (!editData.name || !editData.shardKey || !editData.conditions || editData.conditions.length === 0) {
      alert('Name, shard key, and at least one condition are required');
      return;
    }

    const updatedRules = [...shardRules];
    updatedRules[index] = {
      name: editData.name,
      shardKey: editData.shardKey,
      conditions: editData.conditions,
      conditionLogic: editData.conditionLogic || 'AND',
      priority: editData.priority || index + 1,
    };

    setRules({
      ...rules,
      shardRules: updatedRules,
    });

    setEditingIndex(null);
    setExpandedIndex(null);
    setEditData({});
  };

  const handleCancel = () => {
    // If editing a new rule that wasn't saved, remove it
    if (editingIndex === shardRules.length - 1 && !shardRules[editingIndex].name) {
      const updatedRules = shardRules.slice(0, -1);
      setRules({
        ...rules,
        shardRules: updatedRules,
      });
    }

    setEditingIndex(null);
    setExpandedIndex(null);
    setEditData({});
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this shard rule?')) {
      const updatedRules = shardRules.filter((_, i) => i !== index);
      setRules({
        ...rules,
        shardRules: updatedRules,
      });
    }
  };

  const handleUpdate = (field: keyof ShardRule, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleExpand = (index: number) => {
    if (editingIndex === null) {
      setExpandedIndex(expandedIndex === index ? null : index);
    }
  };

  const getConditionSummary = (rule: ShardRule): string => {
    const count = rule.conditions.length;
    const logic = rule.conditionLogic || 'AND';
    return `${count} condition${count !== 1 ? 's' : ''} (${logic})`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {shardRules.length} rule{shardRules.length !== 1 ? 's' : ''} configured
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Shard Rule
        </Button>
      </div>

      {shardRules.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No shard rules configured</p>
          <p className="text-sm mt-2">Click "Add Shard Rule" to create your first shard routing rule</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Priority</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Shard Key</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shardRules.map((rule, index) => {
                const isEditing = editingIndex === index;
                const isExpanded = expandedIndex === index;

                return (
                  <>
                    <TableRow key={index} className={isEditing ? 'bg-blue-50' : ''}>
                      {/* Priority */}
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="1"
                            value={editData.priority || ''}
                            onChange={(e) => handleUpdate('priority', parseInt(e.target.value))}
                            className="h-8 w-16"
                          />
                        ) : (
                          <Badge variant="outline" className="font-mono">
                            {rule.priority}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editData.name || ''}
                            onChange={(e) => handleUpdate('name', e.target.value)}
                            placeholder="Rule name"
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium text-sm">{rule.name}</span>
                        )}
                      </TableCell>

                      {/* Shard Key */}
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-2">
                            {!customShardKey ? (
                              <select
                                value={editData.shardKey || ''}
                                onChange={(e) => {
                                  if (e.target.value === '__custom__') {
                                    setCustomShardKey(true);
                                    handleUpdate('shardKey', '');
                                  } else {
                                    handleUpdate('shardKey', e.target.value);
                                  }
                                }}
                                className="w-full h-8 px-3 text-sm border border-slate-300 rounded-md"
                              >
                                <option value="">Select shard key...</option>
                                {COMMON_SHARD_KEYS.map((key) => (
                                  <option key={key} value={key}>
                                    {key}
                                  </option>
                                ))}
                                <option value="__custom__">Custom...</option>
                              </select>
                            ) : (
                              <div className="flex gap-1">
                                <Input
                                  value={editData.shardKey || ''}
                                  onChange={(e) => handleUpdate('shardKey', e.target.value)}
                                  placeholder="Enter custom shard key"
                                  className="h-8"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setCustomShardKey(false)}
                                  className="h-8"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            {rule.shardKey}
                          </code>
                        )}
                      </TableCell>

                      {/* Conditions */}
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-medium text-slate-600">Logic:</label>
                              <select
                                value={editData.conditionLogic || 'AND'}
                                onChange={(e) => handleUpdate('conditionLogic', e.target.value)}
                                className="h-8 px-2 text-sm border border-slate-300 rounded-md"
                              >
                                <option value="AND">AND (all must match)</option>
                                <option value="OR">OR (any can match)</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(index)}
                            className="gap-1 h-8"
                          >
                            <span className="text-xs">{getConditionSummary(rule)}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </TableCell>

                      {/* Actions */}
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
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-slate-50">
                          <div className="py-3">
                            {isEditing ? (
                              <ConditionBuilder
                                conditions={editData.conditions || []}
                                onChange={(conditions) => handleUpdate('conditions', conditions as ShardCondition[])}
                                fieldSchema={fieldSchema}
                              />
                            ) : (
                              <div className="space-y-2">
                                {rule.conditions.map((condition, condIndex) => (
                                  <div
                                    key={condIndex}
                                    className="flex items-center gap-2 text-sm p-2 bg-white border border-slate-200 rounded"
                                  >
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {condition.field}
                                    </Badge>
                                    <span className="text-slate-500">{condition.operator}</span>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                      {Array.isArray(condition.value)
                                        ? `[${condition.value.join(', ')}]`
                                        : condition.value}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
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
        <p className="font-medium mb-1">💡 Shard Rules Behavior:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Priority:</strong> Lower number = higher priority (evaluated first)</li>
          <li><strong>Logic:</strong> AND = all conditions must match, OR = any condition can match</li>
          <li><strong>Routing:</strong> First matching rule determines the shard key for the data</li>
          <li>Example: Priority 1 rule checks "Color in [D,E,F] AND Country = USA" → routes to "usa_premium" shard</li>
        </ul>
      </div>
    </div>
  );
}

