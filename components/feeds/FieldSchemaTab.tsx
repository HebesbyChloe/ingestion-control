'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Key,
  DollarSign,
  CheckCircle2,
  XCircle,
  FileJson,
} from 'lucide-react';
import type { FieldSchema, FieldSchemaField } from '@/lib/api/feeds';
import FieldSchemaFieldForm from './FieldSchemaFieldForm';

interface FieldSchemaTabProps {
  fieldSchema: FieldSchema | undefined;
  isEditing: boolean;
  onUpdate: (fieldSchema: FieldSchema) => void;
}

export default function FieldSchemaTab({
  fieldSchema,
  isEditing,
  onUpdate,
}: FieldSchemaTabProps) {
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<FieldSchemaField | undefined>();
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const fields = fieldSchema?.fields || [];

  const handleAddField = () => {
    setEditingField(undefined);
    setShowFieldForm(true);
  };

  const handleEditField = (field: FieldSchemaField) => {
    setEditingField(field);
    setShowFieldForm(true);
  };

  const handleSaveField = (field: FieldSchemaField) => {
    const updatedFields = editingField
      ? fields.map((f) => (f.name === editingField.name ? field : f))
      : [...fields, field];

    onUpdate({
      fields: updatedFields,
      source: fieldSchema?.source || 'manual',
      lastUpdated: new Date().toISOString(),
    });

    setShowFieldForm(false);
    setEditingField(undefined);
  };

  const handleDeleteField = (fieldName: string) => {
    if (confirm(`Are you sure you want to delete field "${fieldName}"?`)) {
      onUpdate({
        fields: fields.filter((f) => f.name !== fieldName),
        source: fieldSchema?.source || 'manual',
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  const handleExportJson = () => {
    const json = JSON.stringify(fieldSchema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field-schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            if (json.fields && Array.isArray(json.fields)) {
              onUpdate({
                fields: json.fields,
                source: json.source || 'imported',
                lastUpdated: new Date().toISOString(),
              });
            } else {
              alert('Invalid field schema JSON format');
            }
          } catch (error) {
            alert('Failed to parse JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'number':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'boolean':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Field Schema</h3>
          <p className="text-sm text-slate-500">
            Define the structure and metadata of feed fields
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileJson className="w-4 h-4" />
            {showJsonPreview ? 'Hide' : 'Show'} JSON
          </Button>
          {isEditing && (
            <>
              <Button
                onClick={handleImportJson}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button
                onClick={handleExportJson}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={fields.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                onClick={handleAddField}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </Button>
            </>
          )}
        </div>
      </div>

      {/* JSON Preview */}
      {showJsonPreview && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <pre className="text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(fieldSchema, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Schema Info */}
      {fieldSchema && (
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div>
            <span className="font-medium">Source:</span>{' '}
            <Badge variant="outline" className="ml-1">
              {fieldSchema.source}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Last Updated:</span>{' '}
            {new Date(fieldSchema.lastUpdated).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Total Fields:</span> {fields.length}
          </div>
        </div>
      )}

      {/* Fields Table */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Fields ({fields.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="py-12 text-center">
              <FileJson className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No fields defined</p>
              <p className="text-sm text-slate-500 mb-4">
                Add fields to define the schema for this feed
              </p>
              {isEditing && (
                <Button onClick={handleAddField} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Field
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead>Aliases</TableHead>
                    <TableHead className="text-center">Flags</TableHead>
                    <TableHead>Description</TableHead>
                    {isEditing && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={index} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {field.name}
                          </span>
                          {field.isPrimaryKey && (
                            <span title="Primary Key">
                              <Key className="w-3 h-3 text-amber-600" />
                            </span>
                          )}
                          {field.isPriceField && (
                            <span title="Price Field">
                              <DollarSign className="w-3 h-3 text-green-600" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(field.type)}>
                          {field.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {field.sample || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {field.aliases.length > 0 ? (
                            field.aliases.slice(0, 3).map((alias, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-slate-50"
                              >
                                {alias}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                          {field.aliases.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-slate-50">
                              +{field.aliases.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {field.required ? (
                            <span title="Required">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </span>
                          ) : (
                            <span title="Optional">
                              <XCircle className="w-4 h-4 text-slate-300" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 line-clamp-2">
                          {field.description || '-'}
                        </span>
                      </TableCell>
                      {isEditing && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => handleEditField(field)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteField(field.name)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Form Modal */}
      {showFieldForm && (
        <FieldSchemaFieldForm
          field={editingField}
          existingFieldNames={fields.map((f) => f.name)}
          onSave={handleSaveField}
          onCancel={() => {
            setShowFieldForm(false);
            setEditingField(undefined);
          }}
        />
      )}
    </div>
  );
}

