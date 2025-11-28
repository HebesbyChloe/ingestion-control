'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { FeedRulesConfig, FieldMapping } from '@/lib/api/feedRules';

interface FieldMappingsTableProps {
  rules: FeedRulesConfig;
  setRules: (rules: FeedRulesConfig) => void;
}

export default function FieldMappingsTable({ rules, setRules }: FieldMappingsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FieldMapping>>({});

  const mappings = rules.fieldMappings || [];

  const handleAdd = () => {
    const newMapping: FieldMapping = {
      source: '',
      target: '',
      type: 'direct',
      overwrite: false,
    };

    setRules({
      ...rules,
      fieldMappings: [...mappings, newMapping],
    });

    // Start editing the new mapping
    setEditingIndex(mappings.length);
    setEditData(newMapping);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...mappings[index] });
  };

  const handleSave = (index: number) => {
    // Validate required fields
    if (!editData.source || !editData.target) {
      alert('Source and target fields are required');
      return;
    }

    const updatedMappings = [...mappings];
    updatedMappings[index] = {
      source: editData.source,
      target: editData.target,
      type: 'direct',
      overwrite: editData.overwrite || false,
    };

    setRules({
      ...rules,
      fieldMappings: updatedMappings,
    });

    setEditingIndex(null);
    setEditData({});
  };

  const handleCancel = () => {
    // If editing a new mapping that wasn't saved, remove it
    if (editingIndex === mappings.length - 1 && !mappings[editingIndex].source) {
      const updatedMappings = mappings.slice(0, -1);
      setRules({
        ...rules,
        fieldMappings: updatedMappings,
      });
    }

    setEditingIndex(null);
    setEditData({});
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this field mapping?')) {
      const updatedMappings = mappings.filter((_, i) => i !== index);
      setRules({
        ...rules,
        fieldMappings: updatedMappings,
      });
    }
  };

  const handleUpdate = (field: keyof FieldMapping, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} configured
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Mapping
        </Button>
      </div>

      {mappings.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No field mappings configured</p>
          <p className="text-sm mt-2">Click "Add Mapping" to create your first field mapping</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Source Field</TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead className="w-32">Overwrite</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => {
                const isEditing = editingIndex === index;
                return (
                  <TableRow key={index} className={isEditing ? 'bg-blue-50' : ''}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.source || ''}
                          onChange={(e) => handleUpdate('source', e.target.value)}
                          placeholder="source_field_name"
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium font-mono text-sm">{mapping.source}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.target || ''}
                          onChange={(e) => handleUpdate('target', e.target.value)}
                          placeholder="target_field_name"
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium font-mono text-sm">{mapping.target}</span>
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
                          {mapping.overwrite ? 'Yes' : 'No'}
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-slate-700">
        <p className="font-medium mb-1">💡 Field Mapping Behavior:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Overwrite = No (default):</strong> Adds new target field, keeps original source field</li>
          <li><strong>Overwrite = Yes:</strong> Replaces existing target field value if it exists</li>
          <li>Example: source="Item ID", target="id" → Row will have both "Item ID" and "id" fields</li>
        </ul>
      </div>
    </div>
  );
}

