'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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
  
  // Debug: Log props when they change
  useEffect(() => {
    console.log('FieldMappingsTable - Props received:', {
      feedId,
      hasFieldSchema: !!fieldSchema,
      fieldSchemaFieldsCount: fieldSchema?.fields?.length || 0,
      fieldSchemaSource: fieldSchema?.source,
      fieldSchemaFields: fieldSchema?.fields?.map(f => f.name) || []
    });
  }, [feedId, fieldSchema]);
  
  // Module selection state
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleColumns, setModuleColumns] = useState<ModuleColumns | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  
  // Refs for current mappings state
  const mappingsRef = useRef<FieldMapping[]>([]);
  const fieldSchemaSourceRef = useRef<string>('');
  
  // Keep ref in sync with state
  useEffect(() => {
    mappingsRef.current = mappings;
  }, [mappings]);

  // Load field mappings from feed
  useEffect(() => {
    if (feedId) {
      setIsLoading(true);
      setHasAutoPopulated(false); // Reset auto-populate flag when feed changes
      fieldSchemaSourceRef.current = ''; // Reset schema source ref when feed changes
      feedRulesApi.getFieldMappings(feedId)
        .then((loadedMappings) => {
          console.log('Loaded field mappings from API:', loadedMappings.length, loadedMappings);
          setMappings(loadedMappings);
        })
        .catch((error) => {
          console.error('Error loading field mappings:', error);
          setMappings([]);
        })
        .finally(() => setIsLoading(false));
    } else {
      setMappings([]);
      setHasAutoPopulated(false);
      fieldSchemaSourceRef.current = '';
    }
  }, [feedId]);
  
  // Auto-populate all fields from field_schema (run after mappings are loaded AND fieldSchema is available)
  useEffect(() => {
    console.log('🔍 AUTO-POPULATE EFFECT RUNNING');
    console.log('📥 Input data:', {
      isLoading,
      feedId,
      hasFieldSchema: !!fieldSchema,
      fieldSchemaType: typeof fieldSchema,
      fieldSchemaKeys: fieldSchema ? Object.keys(fieldSchema) : [],
      fieldSchemaFields: fieldSchema?.fields,
      fieldSchemaFieldsCount: fieldSchema?.fields?.length || 0,
      currentMappings: mappings,
      currentMappingsCount: mappings.length,
      hasAutoPopulated
    });
    
    const hasSchema = !!fieldSchema?.fields && fieldSchema.fields.length > 0;
    const currentSchemaSource = fieldSchema?.source || '';
    const schemaId = hasSchema ? `${currentSchemaSource}-${fieldSchema.fields.length}` : '';
    const schemaChanged = fieldSchemaSourceRef.current !== schemaId;
    
    console.log('🔍 Schema detection:', {
      hasSchema,
      currentSchemaSource,
      schemaId,
      schemaChanged,
      previousRef: fieldSchemaSourceRef.current
    });
    
    // Reset hasAutoPopulated if fieldSchema changed or became available for the first time
    if (hasSchema && (schemaChanged || fieldSchemaSourceRef.current === '')) {
      console.log('🔄 Field schema changed or became available, resetting auto-populate flag', {
        oldRef: fieldSchemaSourceRef.current,
        newRef: schemaId,
        fieldsCount: fieldSchema.fields.length,
        fieldNames: fieldSchema.fields.map(f => f.name)
      });
      setHasAutoPopulated(false);
      fieldSchemaSourceRef.current = schemaId;
    }
    
    console.log('🔍 Auto-populate effect check:', {
      isLoading,
      hasFieldSchema: hasSchema,
      fieldSchemaFieldsCount: fieldSchema?.fields?.length || 0,
      feedId,
      hasAutoPopulated,
      currentMappingsCount: mappings.length,
      schemaChanged,
      willRun: !isLoading && hasSchema && feedId && !hasAutoPopulated
    });
    
    // Only run if not loading, has fieldSchema, has feedId, and hasn't populated yet
    if (!isLoading && hasSchema && feedId && !hasAutoPopulated) {
      console.log('✅ CONDITIONS MET - Running auto-populate logic');
      const existingSources = new Set(mappings.map(m => m.source).filter(Boolean));
      const unmappedFields = fieldSchema.fields.filter(
        f => !existingSources.has(f.name)
      );
      
      console.log('📊 Checking unmapped fields:', {
        totalFieldsInSchema: fieldSchema.fields.length,
        existingMappings: mappings.length,
        existingSources: Array.from(existingSources),
        unmappedCount: unmappedFields.length,
        unmappedFields: unmappedFields.map(f => f.name),
        allSchemaFieldNames: fieldSchema.fields.map(f => f.name)
      });
      
      if (unmappedFields.length > 0) {
        console.log('✅ AUTO-POPULATING unmapped fields:', unmappedFields.length, 'fields');
        const newMappings = unmappedFields.map(field => ({
          source: field.name,
          target: '',
          type: 'direct' as const,
          overwrite: false,
        }));
        setMappings(prev => {
          const combined = [...prev, ...newMappings];
          console.log('✅ Combined mappings after auto-populate:', combined.length, 'total fields');
          console.log('✅ New mappings added:', newMappings);
          return combined;
        });
        setHasAutoPopulated(true);
      } else {
        console.log('ℹ️ All fields already mapped, marking as populated');
        setHasAutoPopulated(true);
      }
    } else {
      console.log('⚠️ Auto-populate skipped:', {
        reason: !isLoading ? 'loading' : !hasSchema ? 'no schema' : !feedId ? 'no feedId' : 'already populated',
        isLoading,
        hasSchema,
        feedId,
        hasAutoPopulated
      });
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
      console.log('📦 useEffect: Loading columns for module:', selectedModule, 'editingIndex:', editingIndex);
      schemaApi.getModuleColumns(selectedModule)
        .then((data) => {
          console.log('✅ useEffect: Loaded module columns:', JSON.stringify(data, null, 2));
          console.log('📊 useEffect: Module columns structure:', {
            hasModule: !!data.module,
            hasTables: !!data.tables,
            tablesCount: data.tables ? Object.keys(data.tables).length : 0,
            tableNames: data.tables ? Object.keys(data.tables) : [],
            tablesObject: data.tables
          });
          setModuleColumns(data);
          // Only reset table/field if we're not currently editing (to preserve selections)
          if (editingIndex === null) {
            setSelectedTable('');
            setSelectedField('');
          }
        })
        .catch((error) => {
          console.error('❌ useEffect: Error loading module columns:', error);
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
    if (!moduleColumns || !selectedTable) {
      console.log('⚠️ getAvailableFields: Missing moduleColumns or selectedTable', {
        hasModuleColumns: !!moduleColumns,
        selectedTable,
        moduleColumnsStructure: moduleColumns ? {
          module: moduleColumns.module,
          tablesKeys: moduleColumns.tables ? Object.keys(moduleColumns.tables) : []
        } : null
      });
      return [];
    }
    const tableData = moduleColumns.tables[selectedTable];
    if (!tableData || !tableData.columns) {
      console.log('⚠️ getAvailableFields: Table data not found', {
        selectedTable,
        hasTableData: !!tableData,
        tableData
      });
      return [];
    }
    const fields = tableData.columns.map(col => col.field);
    console.log('✅ getAvailableFields: Found fields', fields);
    return fields;
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

  const handleManualAutoPopulate = () => {
    console.log('🔄 MANUAL AUTO-POPULATE TRIGGERED');
    console.log('Current state:', {
      feedId,
      hasFieldSchema: !!fieldSchema,
      fieldSchemaFieldsCount: fieldSchema?.fields?.length || 0,
      currentMappingsCount: mappings.length,
      isLoading,
      hasAutoPopulated,
      fieldSchema: fieldSchema
    });
    
    if (!fieldSchema?.fields || fieldSchema.fields.length === 0) {
      console.error('❌ Cannot auto-populate: fieldSchema has no fields');
      alert('Field schema is not available. Please ensure the feed has a field schema loaded.');
      return;
    }
    
    if (!feedId) {
      console.error('❌ Cannot auto-populate: feedId is missing');
      alert('Feed ID is required to auto-populate fields.');
      return;
    }
    
    // Reset the flag to force auto-populate
    setHasAutoPopulated(false);
    fieldSchemaSourceRef.current = '';
    
    // Force trigger auto-populate logic
    const existingSources = new Set(mappings.map(m => m.source).filter(Boolean));
    const unmappedFields = fieldSchema.fields.filter(
      f => !existingSources.has(f.name)
    );
    
    console.log('📊 Auto-populate analysis:', {
      totalFieldsInSchema: fieldSchema.fields.length,
      existingMappings: mappings.length,
      existingSources: Array.from(existingSources),
      unmappedCount: unmappedFields.length,
      unmappedFields: unmappedFields.map(f => f.name),
      allSchemaFields: fieldSchema.fields.map(f => f.name)
    });
    
    if (unmappedFields.length > 0) {
      console.log('✅ Auto-populating', unmappedFields.length, 'unmapped fields');
      const newMappings = unmappedFields.map(field => ({
        source: field.name,
        target: '',
        type: 'direct' as const,
        overwrite: false,
      }));
      setMappings(prev => {
        const combined = [...prev, ...newMappings];
        console.log('✅ Successfully added', newMappings.length, 'new mappings. Total:', combined.length);
        return combined;
      });
      setHasAutoPopulated(true);
    } else {
      console.log('ℹ️ All fields are already mapped');
      alert('All fields from the schema are already mapped.');
    }
  };

  // Note: Auto-save removed - mappings are only saved when user clicks the save button

  const handleEdit = async (index: number) => {
    const mapping = mappings[index];
    console.log('🖊️ Entering edit mode for mapping:', index, mapping);
    setEditingIndex(index);
    
    // Initialize editData - if target is empty, set it to empty string (will show "Map to Field")
    const initialEditData = {
      ...mapping,
      target: mapping.target || '', // Empty string means "Map to Field" is selected but not configured
    };
    setEditData(initialEditData);
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
      
      // Auto-suggest if source field is set and modules are available
      if (mapping.source && modules.length > 0) {
        console.log('🔍 Auto-suggesting for source field:', mapping.source);
        // Try to find best matching module/table/field
        // For now, we'll let user select module, then auto-suggest table/field
        // This will be handled when module is selected
      }
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
    
    // Update the mapping in the local state only (not saved to API until save button is clicked)
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
    console.log('🎯 Target change:', value);
    if (value === 'ignore') {
      handleUpdate('target', 'ignore');
      setSelectedModule('');
      setSelectedTable('');
      setSelectedField('');
    } else if (value === 'map') {
      // User selected "Map to Field" - clear any existing target but don't set a value yet
      // The actual target will be set when module/table/field are selected
      handleUpdate('target', '');
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
      console.log('📦 Loading columns for module in handleModuleChange:', module);
      const data = await schemaApi.getModuleColumns(module);
      console.log('✅ Loaded module columns:', JSON.stringify(data, null, 2));
      console.log('📊 Module columns structure:', {
        hasModule: !!data.module,
        hasTables: !!data.tables,
        tablesCount: data.tables ? Object.keys(data.tables).length : 0,
        tableNames: data.tables ? Object.keys(data.tables) : []
      });
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
        <div className="flex gap-2">
          <Button 
            onClick={handleManualAutoPopulate} 
            size="sm" 
            variant="outline"
            className="gap-2"
            disabled={!fieldSchema?.fields || isLoading}
          >
            <RefreshCw className="w-4 h-4" />
            Auto-Populate Fields
          </Button>
          <Button 
            onClick={handleAdd} 
            size="sm" 
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Mapping
          </Button>
        </div>
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
                    // Note: Removed rowRefs - no longer needed without auto-save on blur
                    // Note: Removed auto-save on blur - only save when save button is clicked
                    onClick={(e) => {
                      // Only trigger edit if clicking directly on the row (not on a cell that already handled it)
                      if (editingIndex !== index && e.target === e.currentTarget) {
                        handleEdit(index);
                      }
                    }}
                    className={isEditing ? 'bg-blue-50' : 'hover:bg-slate-50 cursor-pointer'}
                    tabIndex={0}
                  >
                    <TableCell className="text-center" onClick={(e) => {
                      if (!isEditing) {
                        e.stopPropagation();
                        handleEdit(index);
                      }
                    }}>
                      {index + 1}
                    </TableCell>
                    <TableCell onClick={(e) => {
                      if (!isEditing) {
                        e.stopPropagation();
                        handleEdit(index);
                      }
                    }}>
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
                    <TableCell onClick={(e) => {
                      if (!isEditing) {
                        e.stopPropagation();
                        handleEdit(index);
                      }
                    }}>
                      {isEditing ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
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
                                  {(() => {
                                    console.log('🔍 Rendering table dropdown:', {
                                      hasModuleColumns: !!moduleColumns,
                                      selectedModule,
                                      hasTables: !!moduleColumns?.tables,
                                      tablesKeys: moduleColumns?.tables ? Object.keys(moduleColumns.tables) : [],
                                      isLoadingColumns,
                                      moduleColumnsData: moduleColumns
                                    });
                                    
                                    if (isLoadingColumns) {
                                      return <div className="px-2 py-1.5 text-sm text-slate-400">Loading tables...</div>;
                                    }
                                    
                                    if (!moduleColumns || !selectedModule) {
                                      return <div className="px-2 py-1.5 text-sm text-slate-400">Select a module first</div>;
                                    }
                                    
                                    if (!moduleColumns.tables || Object.keys(moduleColumns.tables).length === 0) {
                                      return <div className="px-2 py-1.5 text-sm text-slate-400">No tables available</div>;
                                    }
                                    
                                    const tableKeys = Object.keys(moduleColumns.tables);
                                    // Filter out the module name if it appears as a key
                                    const filteredTableKeys = tableKeys.filter(key => key !== selectedModule && key !== moduleColumns.module);
                                    console.log('✅ Rendering table options:', {
                                      allKeys: tableKeys,
                                      filteredKeys: filteredTableKeys,
                                      selectedModule,
                                      moduleColumnsModule: moduleColumns.module
                                    });
                                    
                                    if (filteredTableKeys.length === 0) {
                                      return <div className="px-2 py-1.5 text-sm text-slate-400">No tables found (module name may be in keys)</div>;
                                    }
                                    
                                    return filteredTableKeys.map((table) => (
                                      <SelectItem key={table} value={table}>
                                        {table}
                                      </SelectItem>
                                    ));
                                  })()}
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
                    <TableCell onClick={(e) => {
                      if (!isEditing) {
                        e.stopPropagation();
                        handleEdit(index);
                      }
                    }}>
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
