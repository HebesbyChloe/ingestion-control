'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FeedRulesConfig, CalculatedField, Operation } from '@/lib/api/feedRules';

interface CalculatedFieldsTableProps {
  rules: FeedRulesConfig;
  setRules: (rules: FeedRulesConfig) => void;
}

export default function CalculatedFieldsTable({ rules, setRules }: CalculatedFieldsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<CalculatedField>>({});
  const [showOperationBuilder, setShowOperationBuilder] = useState(false);

  const calculatedFields = rules.calculatedFields || [];

  const handleAdd = () => {
    const newField: CalculatedField = {
      target: '',
      type: 'calculate',
      operations: [],
    };

    setRules({
      ...rules,
      calculatedFields: [...calculatedFields, newField],
    });

    // Start editing the new calculated field
    setEditingIndex(calculatedFields.length);
    setEditData(newField);
    setShowOperationBuilder(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...calculatedFields[index] });
    setShowOperationBuilder(true);
  };

  const handleSave = (index: number) => {
    // Validate required fields
    if (!editData.target) {
      alert('Target field is required');
      return;
    }

    if (!editData.operations || editData.operations.length === 0) {
      alert('At least one operation is required');
      return;
    }

    const updatedFields = [...calculatedFields];
    updatedFields[index] = editData as CalculatedField;

    setRules({
      ...rules,
      calculatedFields: updatedFields,
    });

    setEditingIndex(null);
    setEditData({});
    setShowOperationBuilder(false);
  };

  const handleCancel = () => {
    // If editing a new field that wasn't saved, remove it
    if (editingIndex === calculatedFields.length - 1 && !calculatedFields[editingIndex].target) {
      const updatedFields = calculatedFields.slice(0, -1);
      setRules({
        ...rules,
        calculatedFields: updatedFields,
      });
    }

    setEditingIndex(null);
    setEditData({});
    setShowOperationBuilder(false);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this calculated field?')) {
      const updatedFields = calculatedFields.filter((_, i) => i !== index);
      setRules({
        ...rules,
        calculatedFields: updatedFields,
      });
    }
  };

  const handleUpdate = (field: keyof CalculatedField, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleAddOperation = () => {
    const newOperation: Operation = {
      type: 'add',
      fields: ['', ''],
    };
    
    const operations = [...(editData.operations || []), newOperation];
    setEditData({ ...editData, operations });
  };

  const handleUpdateOperation = (opIndex: number, field: keyof Operation, value: any) => {
    const operations = [...(editData.operations || [])];
    operations[opIndex] = { ...operations[opIndex], [field]: value };
    setEditData({ ...editData, operations });
  };

  const handleDeleteOperation = (opIndex: number) => {
    const operations = (editData.operations || []).filter((_, i) => i !== opIndex);
    setEditData({ ...editData, operations });
  };

  const formatOperationSummary = (operations: Operation[]): string => {
    if (!operations || operations.length === 0) return 'No operations';
    
    return operations.map(op => {
      if (op.type === 'concat') {
        return `concat(${op.fields.join(', ')})`;
      }
      const symbol = {
        add: '+',
        subtract: '-',
        multiply: '*',
        divide: '/',
        percentage: '%',
      }[op.type] || op.type;
      
      return `${op.fields.join(` ${symbol} `)}`;
    }).join(' → ');
  };

  const parseFieldsInput = (value: string): (string | number)[] => {
    return value.split(',').map(v => {
      v = v.trim();
      const num = parseFloat(v);
      return isNaN(num) ? v : num;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {calculatedFields.length} calculated field{calculatedFields.length !== 1 ? 's' : ''} configured
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Calculated Field
        </Button>
      </div>

      {calculatedFields.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No calculated fields configured</p>
          <p className="text-sm mt-2">Click "Add Calculated Field" to create your first calculated field</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead>Operations</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculatedFields.map((field, index) => {
                const isEditing = editingIndex === index;
                return (
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
                        <span className="font-medium font-mono text-sm">{field.target}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 font-mono text-xs">
                        {formatOperationSummary(field.operations)}
                      </div>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Operation Builder */}
      {showOperationBuilder && editingIndex !== null && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Edit Operations</CardTitle>
              <CardDescription>
                Define operations to calculate the field value
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOperationBuilder(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(editData.operations || []).length === 0 ? (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                <p>No operations added yet</p>
                <p className="text-sm mt-2">Click "Add Operation" to create an operation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(editData.operations || []).map((operation, opIndex) => (
                  <div key={opIndex} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Operation</label>
                        <Select
                          value={operation.type}
                          onValueChange={(value) => handleUpdateOperation(opIndex, 'type', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">Add (+)</SelectItem>
                            <SelectItem value="subtract">Subtract (-)</SelectItem>
                            <SelectItem value="multiply">Multiply (*)</SelectItem>
                            <SelectItem value="divide">Divide (/)</SelectItem>
                            <SelectItem value="concat">Concatenate</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">
                          Fields (comma-separated)
                        </label>
                        <Input
                          placeholder="field1, field2, 100"
                          value={operation.fields.join(', ')}
                          onChange={(e) => handleUpdateOperation(opIndex, 'fields', parseFieldsInput(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      {operation.type === 'concat' && (
                        <div>
                          <label className="text-xs text-slate-600 mb-1 block">Separator</label>
                          <Input
                            placeholder="e.g., ' ', '-'"
                            value={operation.separator || ''}
                            onChange={(e) => handleUpdateOperation(opIndex, 'separator', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteOperation(opIndex)}
                      className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleAddOperation}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Operation
            </Button>

            {(editData.operations || []).length > 1 && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                <Badge variant="outline" className="text-xs">Sequential</Badge>
                Operations are executed in order, use "result" to reference previous operation
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-slate-700">
        <p className="font-medium mb-1">💡 Operation Types:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Add/Subtract/Multiply/Divide:</strong> Mathematical operations on numeric fields</li>
          <li><strong>Concat:</strong> Join string fields with an optional separator</li>
          <li><strong>Percentage:</strong> Calculate percentage (field1 / field2 * 100)</li>
          <li>Fields can be field names or numbers (e.g., "price, tax" or "price, 1.1")</li>
          <li>Operations execute in order; use "result" to reference previous calculation</li>
        </ul>
      </div>
    </div>
  );
}

