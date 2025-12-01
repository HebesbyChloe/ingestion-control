'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { FieldMapping } from '@/lib/api/feedRules';
import type { FieldSchema } from '@/lib/api/feeds';
import { feedRulesApi } from '@/lib/api/feedRules';
import { schemaApi, type Module, type ModuleColumns } from '@/lib/api/schema';

interface FieldMappingsTableProps {
  feedId: number | null;
  fieldSchema?: FieldSchema;
  onMappingsChange?: (mappings: FieldMapping[]) => void;
}

// Fuzzy matching function to find similar field names
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 80;
  
  // Starts with match
  if (s1.startsWith(s2) || s2.startsWith(s1)) return 70;
  
  // Levenshtein distance (simplified)
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const editDistance = getEditDistance(s1, s2);
  const similarity = ((longer.length - editDistance) / longer.length) * 100;
  
  return Math.max(0, similarity);
}

function getEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function findBestMatch(sourceField: string, targetFields: string[]): string | null {
  if (!targetFields.length) return null;
  
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  for (const targetField of targetFields) {
    const score = calculateSimilarity(sourceField, targetField);
    if (score > bestScore && score >= 60) {
      bestScore = score;
      bestMatch = targetField;
    }
  }
  
  return bestMatch;
}

export default function FieldMappingsTable({ feedId, fieldSchema, onMappingsChange }: FieldMappingsTableProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FieldMapping>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  
  // Module selection state
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleColumns, setModuleColumns] = useState<ModuleColumns | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  
  // Refs for blur detection and current mappings state
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const saveTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const mappingsRef = useRef<FieldMapping[]>([]);
  
  // Keep ref in sync with state
  useEffect(() => {
    mappingsRef.current = mappings;
  }, [mappings]);

  // Load field mappings from feed
  useEffect(() => {
    if (feedId) {
      setIsLoading(true);
      setHasAutoPopulated(false); // Reset auto-populate flag when feed changes
      feedRulesApi.getFieldMappings(feedId)
        .then((loadedMappings) => {
          setMappings(loadedMappings);
          console.log('Loaded field mappings:', loadedMappings);
        })
        .catch((error) => {
          console.error('Error loading field mappings:', error);
          setMappings([]);
        })
        .finally(() => setIsLoading(false));
    } else {
      setMappings([]);
      setHasAutoPopulated(false);
    }
  }, [feedId]);

  // Auto-populate all fields from field_schema (run after mappings are loaded AND fieldSchema is available)
  useEffect(() => {
    console.log('Auto-populate effect:', {
      isLoading,
      hasFieldSchema: !!fieldSchema?.fields,
      fieldSchemaFieldsCount: fieldSchema?.fields?.length || 0,
      feedId,
      hasAutoPopulated,
      currentMappingsCount: mappings.length
    });
    
    // Only run if not loading, has fieldSchema, has feedId, and hasn't populated yet
    // This will run when fieldSchema becomes available OR when mappings finish loading
    if (!isLoading && fieldSchema?.fields && fieldSchema.fields.length > 0 && feedId && !hasAutoPopulated) {
      const existingSources = new Set(mappings.map(m => m.source).filter(Boolean));
      const unmappedFields = fieldSchema.fields.filter(
        f => !existingSources.has(f.name)
      );
      
      console.log('Unmapped fields found:', unmappedFields.length, unmappedFields.map(f => f.name));
      
      if (unmappedFields.length > 0) {
        console.log('Auto-populating unmapped fields:', unmappedFields);
        const newMappings = unmappedFields.map(field => ({
          source: field.name,
          target: '',
          type: 'direct' as const,
          overwrite: false,
        }));
        setMappings(prev => [...prev, ...newMappings]);
        setHasAutoPopulated(true);
      } else {
        // Mark as populated even if no new fields to add (all fields already mapped)
        console.log('No unmapped fields to add, marking as populated');
        setHasAutoPopulated(true);
      }
    }
  }, [isLoading, fieldSchema, feedId, hasAutoPopulated, mappings]);

  // Load modules on mount
  useEffect(() => {
    setIsLoadingModules(true);
    setModuleError(null);
    console.log('Loading modules...');
    schemaApi.getModules()
      .then((loadedModules) => {
        console.log('Loaded modules:', loadedModules);
        setModules(loadedModules);
        if (loadedModules.length === 0) {
          setModuleError('No modules found. Please check API configuration.');
        }
      })
      .catch((error) => {
        console.error('Error loading modules:', error);
        setModuleError(`Failed to load modules: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setModules([]);
      })
      .finally(() => setIsLoadingModules(false));
  }, []);

  // Load columns when module is selected (regardless of editing state)
  useEffect(() => {
    if (selectedModule) {
      setIsLoadingColumns(true);
      console.log('Loading columns for module:', selectedModule, 'editingIndex:', editingIndex);
      schemaApi.getModuleColumns(selectedModule)
        .then((data) => {
          console.log('Loaded module columns:', data);
          setModuleColumns(data);
          // Only reset table/field if we're not currently editing (to preserve selections)
          if (editingIndex === null) {
            setSelectedTable('');
            setSelectedField('');
          }
        })
        .catch((error) => {
          console.error('Error loading module columns:', error);
          setModuleColumns(null);
        })
        .finally(() => setIsLoadingColumns(false));
    } else {
      // Only clear columns if module is deselected
      setModuleColumns(null);
      setSelectedTable('');
      setSelectedField('');
    }
  }, [selectedModule]); // Removed editingIndex dependency - load columns whenever module changes

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

  // Auto-save function with debounce
  const autoSave = useCallback(async (index: number) => {
    // Clear any existing timeout for this index
    const existingTimeout = saveTimeoutRef.current.get(index);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      if (!feedId) {
        console.error('Cannot save: feedId is missing');
        setSaveError('Feed ID is required to save mappings');
        return;
      }

      // Get current mappings from ref
      const currentMappings = mappingsRef.current;
      const mapping = currentMappings[index];
      
      if (!mapping || !mapping.source) {
        console.log('Skipping save: mapping incomplete');
        return;
      }

      // Validate mapping - allow empty target for now (user might be in process of selecting)
      // Only save if target is set or is 'ignore'
      if (mapping.target === '' || mapping.target === undefined) {
        console.log('Skipping auto-save: target not set yet');
        return;
      }

      setSavingIndex(index);
      setSaveError(null);
      
      try {
        console.log('Auto-saving mapping at index', index, 'feedId:', feedId, 'mapping:', JSON.stringify(mapping, null, 2));
        console.log('Auto-saving all mappings:', JSON.stringify(currentMappings, null, 2));
        const result = await feedRulesApi.updateFieldMappings(feedId, currentMappings);
        console.log('Successfully auto-saved field mappings, result:', result);
        setSaveSuccess(index);
        setTimeout(() => setSaveSuccess(null), 2000);
      } catch (error) {
        console.error('Error auto-saving field mappings - full error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = error instanceof Error && error.stack ? error.stack : String(error);
        console.error('Auto-save error details:', errorDetails);
        setSaveError(`Failed to auto-save: ${errorMessage}`);
        setTimeout(() => setSaveError(null), 5000);
      } finally {
        setSavingIndex(null);
      }
    }, 1500); // 1.5 second debounce

    saveTimeoutRef.current.set(index, timeout);
  }, [feedId]);

  // Handle row blur - auto-save
  const handleRowBlur = useCallback((index: number, e: React.FocusEvent) => {
    // Check if focus moved to another element in the same row
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      // Focus is still within the row, don't save yet
      return;
    }

    // Focus left the row, save after a short delay
    if (editingIndex === index) {
      autoSave(index);
    }
  }, [editingIndex, autoSave]);

  const handleEdit = (index: number) => {
    const mapping = mappings[index];
    setEditingIndex(index);
    setEditData({ ...mapping });
    setSaveError(null);
    setSaveSuccess(null);
    
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
    } else {
      setSelectedModule('');
      setSelectedTable('');
      setSelectedField('');
    }
  };

  const handleSave = async (index: number) => {
    if (!feedId) {
      alert('Feed ID is required to save mappings');
      return;
    }

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
      targetValue = editData.target || '';
      if (!targetValue) {
        alert('Please select a target field or choose "ignore"');
        return;
      }
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
    setSavingIndex(index);
    setSaveError(null);
    
    try {
      console.log('Saving field mappings - feedId:', feedId, 'mappings:', JSON.stringify(updatedMappings, null, 2));
      const result = await feedRulesApi.updateFieldMappings(feedId, updatedMappings);
      console.log('Successfully saved field mappings, result:', result);
      setSaveSuccess(index);
      setTimeout(() => setSaveSuccess(null), 2000);
      setEditingIndex(null);
      setEditData({});
      setSelectedModule('');
      setSelectedTable('');
      setSelectedField('');
    } catch (error) {
      console.error('Error saving field mappings - full error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error && error.stack ? error.stack : String(error);
      console.error('Error details:', errorDetails);
      setSaveError(`Failed to save: ${errorMessage}`);
      alert(`Failed to save field mappings: ${errorMessage}\n\nCheck console for details.`);
    } finally {
      setSavingIndex(null);
    }
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
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleDelete = async (index: number) => {
    if (confirm('Are you sure you want to delete this field mapping?')) {
      const updatedMappings = mappings.filter((_, i) => i !== index);
      setMappings(updatedMappings);

      // Save to database
      if (feedId) {
        setSavingIndex(index);
        try {
          await feedRulesApi.updateFieldMappings(feedId, updatedMappings);
          setSaveSuccess(index);
          setTimeout(() => setSaveSuccess(null), 2000);
        } catch (error) {
          console.error('Error deleting field mapping:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setSaveError(`Failed to delete: ${errorMessage}`);
          alert(`Failed to delete field mapping: ${errorMessage}`);
          // Revert on error
          setMappings(mappings);
        } finally {
          setSavingIndex(null);
        }
      }
    }
  };

  const handleUpdate = (field: keyof FieldMapping, value: any) => {
    const updatedEditData = { ...editData, [field]: value };
    setEditData(updatedEditData);
    
    // If target is set to "ignore", clear module/table/field selections
    if (field === 'target' && value === 'ignore') {
      setSelectedModule('');
      setSelectedTable('');
      setSelectedField('');
    }
    
    // Update the mapping in the array immediately (for display and auto-save)
    if (editingIndex !== null) {
      setMappings(prev => {
        const updated = [...prev];
        if (updated[editingIndex]) {
          updated[editingIndex] = {
            ...updated[editingIndex],
            ...updatedEditData,
          };
        }
        return updated;
      });
    }
  };

  const handleSourceChange = (value: string) => {
    handleUpdate('source', value);
    
    // Auto-suggest target field if modules are loaded
    if (value && modules.length > 0 && !selectedModule) {
      // Try to find best matching module/table/field
      // For now, just set the source
      // Suggestions will be shown when module is selected
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

  const handleModuleChange = async (module: string) => {
    setSelectedModule(module);
    setSelectedTable('');
    setSelectedField('');
    
    // Load columns for the module (always, not just when editing)
    setIsLoadingColumns(true);
    try {
      console.log('Loading columns for module in handleModuleChange:', module);
      const data = await schemaApi.getModuleColumns(module);
      setModuleColumns(data);
      
      // Auto-suggest table/field based on source field name (if editing)
      if (editingIndex !== null && editData.source && Object.keys(data.tables || {}).length > 0) {
        // Find best matching table (simplified - use first table for now)
        const firstTable = Object.keys(data.tables)[0];
        if (firstTable) {
          setSelectedTable(firstTable);
          const tableFields = data.tables[firstTable].columns.map(col => col.field);
          const bestMatch = findBestMatch(editData.source, tableFields);
          if (bestMatch) {
            setSelectedField(bestMatch);
            handleUpdate('target', `${module}/${firstTable}/${bestMatch}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading module columns in handleModuleChange:', error);
      setModuleColumns(null);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleTableChange = (table: string) => {
    setSelectedTable(table);
    setSelectedField('');
    
    // Auto-suggest field based on source field name
    if (editData.source && selectedModule && moduleColumns) {
      const tableData = moduleColumns.tables[table];
      if (tableData && tableData.columns) {
        const tableFields = tableData.columns.map(col => col.field);
        const bestMatch = findBestMatch(editData.source, tableFields);
        if (bestMatch) {
          setSelectedField(bestMatch);
          handleUpdate('target', `${selectedModule}/${table}/${bestMatch}`);
        }
      }
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
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>Loading field mappings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error/Success Messages */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{saveError}</span>
        </div>
      )}
      
      {moduleError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4" />
          <span>{moduleError}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} configured
          {fieldSchema?.fields && (
            <span className="ml-2 text-slate-400">
              ({fieldSchema.fields.length} total fields)
            </span>
          )}
        </div>
        <Button 
          onClick={handleAdd} 
          size="sm" 
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </Button>
      </div>

      {mappings.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No field mappings configured</p>
          <p className="text-sm mt-2">
            {fieldSchema?.fields ? 
              'Fields will be auto-populated from field schema' : 
              'Load field schema first to see available fields'}
          </p>
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
                const isSaving = savingIndex === index;
                const isSuccess = saveSuccess === index;
                const targetDisplay = mapping.target === 'ignore' 
                  ? 'ignore' 
                  : mapping.target || 'Not set';
                
                return (
                  <TableRow 
                    key={index} 
                    ref={(el) => {
                      if (el) rowRefs.current.set(index, el);
                    }}
                    onBlur={(e) => {
                      if (editingIndex === index) {
                        handleRowBlur(index, e);
                      }
                    }}
                    onClick={() => {
                      if (editingIndex !== index) {
                        handleEdit(index);
                      }
                    }}
                    className={isEditing ? 'bg-blue-50' : 'hover:bg-slate-50 cursor-pointer'}
                    tabIndex={0}
                  >
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <>
                          <Input
                            value={editData.source !== undefined ? editData.source : mapping.source || ''}
                            onChange={(e) => handleSourceChange(e.target.value)}
                            placeholder="source_field_name"
                            className="h-8"
                            list={`source-fields-list-${index}`}
                            autoFocus={editingIndex === index}
                            onFocus={(e) => e.stopPropagation()}
                          />
                          {availableFields.length > 0 && (
                            <datalist id={`source-fields-list-${index}`}>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={editData.target === 'ignore' ? 'ignore' : (editData.target ? 'map' : '')}
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
                              >
                                <SelectTrigger className="h-8 text-xs" disabled={isLoadingModules}>
                                  <SelectValue placeholder={isLoadingModules ? "Loading..." : "Module"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {modules.length > 0 ? (
                                    modules.map((module) => (
                                      <SelectItem key={module.name} value={module.name}>
                                        {module.label || module.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-sm text-slate-400">No modules available</div>
                                  )}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={selectedTable}
                                onValueChange={handleTableChange}
                              >
                                <SelectTrigger className="h-8 text-xs" disabled={!selectedModule || isLoadingColumns}>
                                  <SelectValue placeholder={isLoadingColumns ? "Loading..." : "Table"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {moduleColumns && selectedModule && Object.keys(moduleColumns.tables || {}).length > 0 ? (
                                    Object.keys(moduleColumns.tables || {}).map((table) => (
                                      <SelectItem key={table} value={table}>
                                        {table}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-sm text-slate-400">No tables available</div>
                                  )}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={selectedField}
                                onValueChange={handleFieldChange}
                              >
                                <SelectTrigger className="h-8 text-xs" disabled={!selectedTable}>
                                  <SelectValue placeholder="Field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableFields().length > 0 ? (
                                    getAvailableFields().map((field) => (
                                      <SelectItem key={field} value={field}>
                                        {field}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-sm text-slate-400">No fields available</div>
                                  )}
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
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
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        ) : isSuccess ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <>
                            {editingIndex === index && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel();
                                }}
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(index);
                              }}
                              title="Delete mapping"
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
          <li><strong>Auto-populate:</strong> All fields from field schema are automatically shown</li>
          <li><strong>Auto-save:</strong> Changes are saved automatically when you click outside the row</li>
          <li><strong>Smart suggestions:</strong> Similar field names are suggested when selecting target fields</li>
          <li><strong>Ignore:</strong> Field will be skipped during mapping</li>
          <li><strong>Overwrite = No (default):</strong> Adds new target field, keeps original source field</li>
          <li><strong>Overwrite = Yes:</strong> Replaces existing target field value if it exists</li>
        </ul>
      </div>
    </div>
  );
}
