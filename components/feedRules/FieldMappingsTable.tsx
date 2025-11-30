'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import type { FieldMapping } from '@/lib/api/feedRules';
import type { FieldSchema } from '@/lib/api/feeds';
import { feedRulesApi } from '@/lib/api/feedRules';
import { schemaApi, type Module, type ModuleColumns } from '@/lib/api/schema';

interface FieldMappingsTableProps {
  feedId: number | null;
  fieldSchema?: FieldSchema;
  onMappingsChange?: (mappings: FieldMapping[]) => void;
}

export default function FieldMappingsTable({ feedId, fieldSchema, onMappingsChange }: FieldMappingsTableProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FieldMapping>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Module selection state
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleColumns, setModuleColumns] = useState<ModuleColumns | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // Load field mappings from feed
  useEffect(() => {
    if (feedId) {
      setIsLoading(true);
      feedRulesApi.getFieldMappings(feedId)
        .then(setMappings)
        .catch((error) => {
          console.error('Error loading field mappings:', error);
          setMappings([]);
        })
        .finally(() => setIsLoading(false));
    } else {
      setMappings([]);
    }
  }, [feedId]);

  // Load modules on mount
  useEffect(() => {
    setIsLoadingModules(true);
    schemaApi.getModules()
      .then(setModules)
      .catch((error) => {
        console.error('Error loading modules:', error);
        setModules([]);
      })
      .finally(() => setIsLoadingModules(false));
  }, []);

  // Load columns when module is selected
  useEffect(() => {
    if (selectedModule && editingIndex !== null) {
      setIsLoadingColumns(true);
      schemaApi.getModuleColumns(selectedModule)
        .then((data) => {
          setModuleColumns(data);
          setSelectedTable('');
          setSelectedField('');
        })
        .catch((error) => {
          console.error('Error loading module columns:', error);
          setModuleColumns(null);
        })
        .finally(() => setIsLoadingColumns(false));
    } else {
      setModuleColumns(null);
      setSelectedTable('');
      setSelectedField('');
    }
  }, [selectedModule, editingIndex]);

  // Notify parent of changes
  useEffect(() => {
    if (onMappingsChange) {
      onMappingsChange(mappings);
    }
  }, [mappings, onMappingsChange]);

  // Build list of all available field names and aliases for autocomplete
  const availableFields: string[] = [];
  const fieldNamesLowerCase = new Set<string>();
  
  if (fieldSchema?.fields) {
    fieldSchema.fields.forEach(field => {
      const fieldLower = field.name.toLowerCase();
      if (!fieldNamesLowerCase.has(fieldLower)) {
        availableFields.push(field.name);
        fieldNamesLowerCase.add(fieldLower);
      }
      
      field.aliases.forEach(alias => {
        const aliasLower = alias.toLowerCase();
        if (!fieldNamesLowerCase.has(aliasLower)) {
          availableFields.push(alias);
          fieldNamesLowerCase.add(aliasLower);
        }
      });
    });
    
    availableFields.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }

  // Get available fields for selected table
  const getAvailableFields = (): string[] => {
    if (!moduleColumns || !selectedTable) return [];
    const tableData = moduleColumns.tables[selectedTable];
    if (!tableData || !tableData.columns) return [];
    return tableData.columns.map(col => col.field);
  };

  const handleAdd = () => {
    const newMapping: FieldMapping = {
      source: '',
      target: '',
      type: 'direct',
      overwrite: false,
    };

    setMappings([...mappings, newMapping]);
    setEditingIndex(mappings.length);
    setEditData(newMapping);
    setSelectedModule('');
    setSelectedTable('');
    setSelectedField('');
  };

  const handleEdit = (index: number) => {
    const mapping = mappings[index];
    setEditingIndex(index);
    setEditData({ ...mapping });
    
    // Parse target if it's a path
    if (mapping.target && mapping.target !== 'ignore' && mapping.target.includes('/')) {
      const parts = mapping.target.split('/');
      if (parts.length === 3) {
        setSelectedModule(parts[0]);
        setSelectedTable(parts[1]);
        setSelectedField(parts[2]);
      }
    } else if (mapping.module && mapping.table && mapping.field) {
      setSelectedModule(mapping.module);
      setSelectedTable(mapping.table);
      setSelectedField(mapping.field);
    }
  };

  const handleSave = async (index: number) => {
    // Validate required fields
    if (!editData.source) {
      alert('Source field is required');
      return;
    }

    if (!editData.target || editData.target === '') {
      alert('Target field is required (or select "ignore")');
      return;
    }

    let targetValue: string;
    let moduleValue: string | undefined;
    let tableValue: string | undefined;
    let fieldValue: string | undefined;

    if (editData.target === 'ignore') {
      targetValue = 'ignore';
    } else if (selectedModule && selectedTable && selectedField) {
      targetValue = `${selectedModule}/${selectedTable}/${selectedField}`;
      moduleValue = selectedModule;
      tableValue = selectedTable;
      fieldValue = selectedField;
    } else {
      // Fallback to direct target value
      targetValue = editData.target;
    }

    const updatedMapping: FieldMapping = {
      source: editData.source,
      target: targetValue,
      type: 'direct',
      overwrite: editData.overwrite || false,
      module: moduleValue,
      table: tableValue,
      field: fieldValue,
    };

    const updatedMappings = [...mappings];
    updatedMappings[index] = updatedMapping;
    setMappings(updatedMappings);

    // Save to database
    if (feedId) {
      try {
        await feedRulesApi.updateFieldMappings(feedId, updatedMappings);
      } catch (error) {
        console.error('Error saving field mappings:', error);
        alert('Failed to save field mappings. Please try again.');
        return;
      }
    }

    setEditingIndex(null);
    setEditData({});
    setSelectedModule('');
    setSelectedTable('');
    setSelectedField('');
  };

  const handleCancel = () => {
    // If editing a new mapping that wasn't saved, remove it
    if (editingIndex !== null && editingIndex === mappings.length - 1 && !mappings[editingIndex].source) {
      setMappings(mappings.slice(0, -1));
    }

    setEditingIndex(null);
    setEditData({});
    setSelectedModule('');
    setSelectedTable('');
    setSelectedField('');
  };

  const handleDelete = async (index: number) => {
    if (confirm('Are you sure you want to delete this field mapping?')) {
      const updatedMappings = mappings.filter((_, i) => i !== index);
      setMappings(updatedMappings);

      // Save to database
      if (feedId) {
        try {
          await feedRulesApi.updateFieldMappings(feedId, updatedMappings);
        } catch (error) {
          console.error('Error deleting field mapping:', error);
          alert('Failed to delete field mapping. Please try again.');
          // Revert on error
          setMappings(mappings);
        }
      }
    }
  };

  const handleUpdate = (field: keyof FieldMapping, value: any) => {
    setEditData({ ...editData, [field]: value });
    
    // If target is set to "ignore", clear module/table/field selections
    if (field === 'target' && value === 'ignore') {
      setSelectedModule('');
      setSelectedTable('');
      setSelectedField('');
    }
  };

  const handleTargetChange = (value: string) => {
    if (value === 'ignore') {
      handleUpdate('target', 'ignore');
      setSelectedModule('');
      setSelectedTable('');
      setSelectedField('');
    } else {
      // This will be handled by module/table/field selection
      setEditData({ ...editData, target: value });
    }
  };

  const handleModuleChange = (module: string) => {
    setSelectedModule(module);
    setSelectedTable('');
    setSelectedField('');
    // Update target when module changes
    if (module && selectedTable && selectedField) {
      handleUpdate('target', `${module}/${selectedTable}/${selectedField}`);
    }
  };

  const handleTableChange = (table: string) => {
    setSelectedTable(table);
    setSelectedField('');
    // Update target when table changes
    if (selectedModule && table && selectedField) {
      handleUpdate('target', `${selectedModule}/${table}/${selectedField}`);
    }
  };

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    // Update target when field changes
    if (selectedModule && selectedTable && field) {
      handleUpdate('target', `${selectedModule}/${selectedTable}/${field}`);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">
        Loading field mappings...
      </div>
    );
  }

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
                <TableHead>Target (Module/Table/Field or Ignore)</TableHead>
                <TableHead className="w-32">Overwrite</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => {
                const isEditing = editingIndex === index;
                const targetDisplay = mapping.target === 'ignore' 
                  ? 'ignore' 
                  : mapping.target || 'Not set';
                
                return (
                  <TableRow key={index} className={isEditing ? 'bg-blue-50' : ''}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <>
                          <Input
                            value={editData.source || ''}
                            onChange={(e) => handleUpdate('source', e.target.value)}
                            placeholder="source_field_name"
                            className="h-8"
                            list="source-fields-list"
                          />
                          {availableFields.length > 0 && (
                            <datalist id="source-fields-list">
                              {availableFields.map((field, idx) => (
                                <option key={idx} value={field} />
                              ))}
                            </datalist>
                          )}
                        </>
                      ) : (
                        <span className="font-medium font-mono text-sm">{mapping.source}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Select
                            value={editData.target === 'ignore' ? 'ignore' : 'map'}
                            onValueChange={handleTargetChange}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore">Ignore</SelectItem>
                              <SelectItem value="map">Map to Field</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {editData.target !== 'ignore' && (
                            <div className="grid grid-cols-3 gap-2">
                              <Select
                                value={selectedModule}
                                onValueChange={handleModuleChange}
                                disabled={isLoadingModules}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder={isLoadingModules ? "Loading..." : "Module"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {modules.map((module) => (
                                    <SelectItem key={module.name} value={module.name}>
                                      {module.label || module.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={selectedTable}
                                onValueChange={handleTableChange}
                                disabled={!selectedModule || isLoadingColumns}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder={isLoadingColumns ? "Loading..." : "Table"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {moduleColumns && selectedModule && Object.keys(moduleColumns.tables || {}).map((table) => (
                                    <SelectItem key={table} value={table}>
                                      {table}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={selectedField}
                                onValueChange={handleFieldChange}
                                disabled={!selectedTable}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableFields().map((field) => (
                                    <SelectItem key={field} value={field}>
                                      {field}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium font-mono text-sm">
                          {targetDisplay}
                        </span>
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
          <li><strong>Ignore:</strong> Field will be skipped during mapping</li>
          <li><strong>Map to Field:</strong> Select module, table, and field to map source to target</li>
          <li><strong>Overwrite = No (default):</strong> Adds new target field, keeps original source field</li>
          <li><strong>Overwrite = Yes:</strong> Replaces existing target field value if it exists</li>
          {availableFields.length > 0 && (
            <li className="text-indigo-700">
              <strong>🔍 Autocomplete enabled:</strong> Type in source field to see suggestions from feed schema
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
