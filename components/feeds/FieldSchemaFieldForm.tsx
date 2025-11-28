'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import type { FieldSchemaField } from '@/lib/api/feeds';

interface FieldSchemaFieldFormProps {
  field?: FieldSchemaField;
  existingFieldNames: string[];
  onSave: (field: FieldSchemaField) => void;
  onCancel: () => void;
}

export default function FieldSchemaFieldForm({
  field,
  existingFieldNames,
  onSave,
  onCancel,
}: FieldSchemaFieldFormProps) {
  const [formData, setFormData] = useState<FieldSchemaField>({
    name: field?.name || '',
    type: field?.type || 'string',
    sample: field?.sample || '',
    aliases: field?.aliases || [],
    required: field?.required || false,
    description: field?.description || '',
    isPrimaryKey: field?.isPrimaryKey || false,
    isPriceField: field?.isPriceField || false,
  });

  const [aliasesInput, setAliasesInput] = useState(
    field?.aliases?.join(', ') || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Field name is required';
    } else if (
      existingFieldNames.includes(formData.name) &&
      formData.name !== field?.name
    ) {
      newErrors.name = 'Field name must be unique';
    }

    if (!formData.type) {
      newErrors.type = 'Field type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Parse aliases from comma-separated string
    const aliases = aliasesInput
      .split(',')
      .map((alias) => alias.trim())
      .filter((alias) => alias.length > 0);

    onSave({
      ...formData,
      aliases,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {field ? 'Edit Field' : 'Add Field'}
          </h3>
          <Button onClick={onCancel} variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Field Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              Field Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={errors.name ? 'border-red-300' : ''}
              placeholder="e.g., Item ID"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Field Type */}
          <div>
            <Label htmlFor="type" className="text-sm font-medium text-slate-700">
              Field Type *
            </Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'string' | 'number' | 'boolean',
                })
              }
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.type ? 'border-red-300' : 'border-slate-300'
              }`}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
            {errors.type && (
              <p className="text-xs text-red-600 mt-1">{errors.type}</p>
            )}
          </div>

          {/* Sample Value */}
          <div>
            <Label htmlFor="sample" className="text-sm font-medium text-slate-700">
              Sample Value
            </Label>
            <Input
              id="sample"
              type="text"
              value={formData.sample}
              onChange={(e) =>
                setFormData({ ...formData, sample: e.target.value })
              }
              placeholder="e.g., NAT-12345"
            />
            <p className="text-xs text-slate-500 mt-1">
              Example value to help understand the field
            </p>
          </div>

          {/* Aliases */}
          <div>
            <Label htmlFor="aliases" className="text-sm font-medium text-slate-700">
              Aliases (comma-separated)
            </Label>
            <Input
              id="aliases"
              type="text"
              value={aliasesInput}
              onChange={(e) => setAliasesInput(e.target.value)}
              placeholder="e.g., id, item_id, product_id"
            />
            <p className="text-xs text-slate-500 mt-1">
              Alternative names for this field in source data
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Description
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief description of the field"
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) =>
                  setFormData({ ...formData, required: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <Label htmlFor="required" className="text-sm font-medium text-slate-700">
                Required Field
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimaryKey"
                checked={formData.isPrimaryKey}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    isPrimaryKey: checked,
                    required: checked ? true : formData.required,
                  });
                }}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <Label htmlFor="isPrimaryKey" className="text-sm font-medium text-slate-700">
                Primary Key
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPriceField"
                checked={formData.isPriceField}
                onChange={(e) =>
                  setFormData({ ...formData, isPriceField: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <Label htmlFor="isPriceField" className="text-sm font-medium text-slate-700">
                Price Field
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {field ? 'Update Field' : 'Add Field'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

