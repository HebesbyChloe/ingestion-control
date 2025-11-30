'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesApi, type IngestionRule, type RuleType, type CreateRuleInput, type PricingRuleConfig, type OriginRuleConfig, type ScoringRuleConfig } from '@/lib/api/rules';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Plus, Trash2, Save, Edit2, X, Check, ChevronDown, ChevronUp, GripVertical, AlertTriangle, Copy } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getRuleTypeConfig, hasTemplateAssigned, saveRuleTypeTemplate } from '@/components/rules/ruleTypeRegistry';
import TemplateSelector from '@/components/rules/TemplateSelector';
import RuleDetailsPanel from '@/components/rules/RuleDetailsPanel';
import { getCombinedConfig, parseCombinedConfig } from '@/lib/rules/jsonGenerator';
import { useRulesData } from '@/hooks/useRulesData';
import { useRulesState, type PendingCreateRule } from '@/hooks/useRulesState';
import { useRulesMutations } from '@/hooks/useRulesMutations';
import { useFeedManagement } from '@/hooks/useFeedManagement';
import { useRuleTypeManagement } from '@/hooks/useRuleTypeManagement';
import { SortableRow } from '@/components/rules/table/SortableRow';
import { FeedTabs } from '@/components/rules/tabs/FeedTabs';
import { RuleTypeTabs } from '@/components/rules/tabs/RuleTypeTabs';
import { ActionButtons } from '@/components/rules/ActionButtons';
import { JsonConfigCard } from '@/components/rules/JsonConfigCard';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useMaxPriceAutoUpdate } from '@/hooks/useMaxPriceAutoUpdate';
import { useSimpleHandlers } from '@/hooks/useSimpleHandlers';

// Note: Chrome extension errors in console are from browser extensions, not this application
// You can ignore errors like "Cannot read properties of undefined (reading 'isCheckout')"
// These come from browser extensions, not this code

/**
 * Pricing Rules Page Component
 * 
 * Main orchestrator component for the Pricing Rules management interface.
 * This component coordinates:
 * - Data fetching (feeds, rule types, rules)
 * - State management (selection, editing, pending changes)
 * - User interactions (CRUD operations, drag-and-drop, filtering)
 * - UI rendering (tabs, table, modals, panels)
 * 
 * Architecture:
 * - Business logic extracted to lib/rules/
 * - State management via custom hooks in hooks/
 * - UI components in components/rules/
 * - This file serves as the orchestrator only
 * 
 * @component
 */
export default function RulesPage() {
  const tenantId = 1;

  // Use custom hooks for state management
  const state = useRulesState();
  
  // Use custom hook for data fetching
  const rulesData = useRulesData(tenantId, state.selectedFeed, state.selectedRuleType);
  
  // Use custom hook for mutations
  const { batchUpdateMutation, queryClient } = useRulesMutations(
    state.selectedFeed,
    tenantId,
    state.setPendingChanges,
    state.setPendingDeletes,
    state.setPendingCreates,
    state.setEditingRuleId,
    state.setEditFormData
  );
  
  // Use custom hook for feed management
  const feedManagement = useFeedManagement(
    tenantId,
    state.selectedFeed,
    rulesData.dbFeedKeys,
    rulesData.customFeeds,
    rulesData.feedKeys,
    state.setSelectedFeed,
    rulesData.setCustomFeeds,
    state.setNewFeedKey,
    state.setIsAddingFeed,
    state.setCopyToFeedKey,
    state.setIsCopyingFeed
  );
  
  // Use custom hook for rule type management
  const ruleTypeManagement = useRuleTypeManagement(
    tenantId,
    state.selectedRuleType,
    rulesData.dbRuleTypes,
    rulesData.customRuleTypes,
    rulesData.ruleTypes,
    state.setSelectedRuleType,
    rulesData.setCustomRuleTypes,
    state.setShowTemplateSelector
  );
  
  // Use custom hook for drag and drop
  const dragDrop = useDragAndDrop({
    localRules: state.localRules,
    setLocalRules: state.setLocalRules,
    pendingDeletes: state.pendingDeletes,
    pendingChanges: state.pendingChanges,
    setPendingChanges: state.setPendingChanges,
    pendingCreates: state.pendingCreates,
    setPendingCreates: state.setPendingCreates,
  });
  
  // Use custom hook for price auto-update
  const priceAutoUpdate = useMaxPriceAutoUpdate({
    localRules: state.localRules,
    setLocalRules: state.setLocalRules,
    editingRuleId: state.editingRuleId,
    editFormData: state.editFormData,
    setEditFormData: state.setEditFormData,
    pendingChanges: state.pendingChanges,
    setPendingChanges: state.setPendingChanges,
    pendingCreates: state.pendingCreates,
    setPendingCreates: state.setPendingCreates,
    manuallyEditedRows: state.manuallyEditedRows,
    selectedRuleType: state.selectedRuleType,
    getDisplayRules: dragDrop.getDisplayRules,
  });
  
  // Use custom hook for simple event handlers
  const simpleHandlers = useSimpleHandlers({
    editingRuleId: state.editingRuleId,
    setEditingRuleId: state.setEditingRuleId,
    editFormData: state.editFormData,
    setEditFormData: state.setEditFormData,
    setIsPanelOpen: state.setIsPanelOpen,
    setSelectedRuleForPanel: state.setSelectedRuleForPanel,
    manuallyEditedRows: state.manuallyEditedRows,
    setManuallyEditedRows: state.setManuallyEditedRows,
    localRules: state.localRules,
  });
  
  // Destructure for easier access
  const {
    selectedFeed, setSelectedFeed,
    selectedRuleType, setSelectedRuleType,
    newFeedKey, setNewFeedKey,
    isAddingFeed, setIsAddingFeed,
    isCopyingFeed, setIsCopyingFeed,
    copyToFeedKey, setCopyToFeedKey,
    showTemplateSelector, setShowTemplateSelector,
    selectedRuleForPanel, setSelectedRuleForPanel,
    isPanelOpen, setIsPanelOpen,
    editingRuleId, setEditingRuleId,
    editFormData, setEditFormData,
    showConfig, setShowConfig,
    pendingChanges, setPendingChanges,
    pendingDeletes, setPendingDeletes,
    pendingCreates, setPendingCreates,
    localRules, setLocalRules,
    manuallyEditedRows, setManuallyEditedRows,
    isInitialLoad, setIsInitialLoad,
    tempIdCounter,
    tableAreaRef,
    hasPendingChanges,
  } = state;
  
  const {
    feedKeys,
    dbFeedKeys,
    customFeeds,
    setCustomFeeds,
    isLoadingFeeds,
    ruleTypes,
    dbRuleTypes,
    customRuleTypes,
    setCustomRuleTypes,
    isLoadingRuleTypes,
    rules,
    isLoading,
    error,
    allFeedRules,
  } = rulesData;

  useEffect(() => {
    if (!isLoading && rules) {
      // Parse config if it's a string (from Supabase JSONB)
      const parsedRules = (rules || []).map(rule => {
        let parsedConfig = rule.config;
        if (typeof rule.config === 'string') {
          try {
            parsedConfig = JSON.parse(rule.config);
          } catch (e) {
            console.error('Failed to parse config:', e);
            parsedConfig = {};
          }
        }
        return {
          ...rule,
          config: parsedConfig || {},
        };
      });
      
      // Only update local rules if they actually changed (prevent infinite loop)
      setLocalRules(prev => {
        if (JSON.stringify(prev) === JSON.stringify(parsedRules)) {
          return prev;
        }
        return parsedRules;
      });
      
      // Only reset pending changes on initial load, not on refetches
      if (isInitialLoad) {
        console.log('Initial load - resetting pending changes');
        setPendingChanges(new Map());
        setPendingDeletes(new Set());
        setPendingCreates([]);
        setEditingRuleId(null);
        setEditFormData({});
        setIsInitialLoad(false);
      }
    }
  }, [rules, isLoading, isInitialLoad]);

  // Set initial feed when feedKeys load
  useEffect(() => {
    if (feedKeys.length > 0 && !selectedFeed) {
      setSelectedFeed(feedKeys[0]);
    }
  }, [feedKeys, selectedFeed, setSelectedFeed]);

  // Set initial rule type when ruleTypes load
  useEffect(() => {
    if (ruleTypes.length > 0 && !selectedRuleType) {
      setSelectedRuleType(ruleTypes[0]);
    }
  }, [ruleTypes, selectedRuleType, setSelectedRuleType]);


  const handlePanelSave = async (rule: IngestionRule, updates: Partial<IngestionRule>) => {
    // Update the rule with the changes from the panel
    const updateData: Partial<CreateRuleInput> = {
      name: updates.name,
      priority: updates.priority,
      enabled: updates.enabled,
      notes: updates.notes,
      config: updates.config as any,
    };

    // Actually save to database immediately
    if (rule.id > 0) {
      // Existing rule - update in database
      try {
        await rulesApi.update(rule.id, updateData);
        console.log('✅ Panel save successful for rule', rule.id);
      
        // Update local state
        const updatedRules = localRules.map(r => 
          r.id === rule.id 
            ? { ...r, ...updates, updated_at: new Date().toISOString() }
            : r
        );
        setLocalRules(updatedRules);
        
        // Update the selected rule for the panel to reflect changes
        const updatedRule = updatedRules.find(r => r.id === rule.id);
        if (updatedRule) {
          setSelectedRuleForPanel(updatedRule);
        }
        
        // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['rules'] });
        queryClient.invalidateQueries({ queryKey: ['allRules', selectedFeed, tenantId] });
      } catch (error) {
        console.error('❌ Panel save failed:', error);
        alert('Failed to save changes. Please try again.');
      }
    } else {
      // New rule (negative ID) - update pending create
      const pendingIndex = pendingCreates.findIndex(create => create.tempId === rule.id);
      if (pendingIndex >= 0) {
        const updatedCreates = [...pendingCreates];
        updatedCreates[pendingIndex] = { ...updatedCreates[pendingIndex], ...updateData };
        setPendingCreates(updatedCreates);
        
        // Update local rules for immediate display
        const updatedRules = localRules.map(r => 
          r.id === rule.id 
            ? { ...r, ...updates, updated_at: new Date().toISOString() }
            : r
        );
        setLocalRules(updatedRules);
        
        // Update the selected rule for the panel
        const updatedRule = updatedRules.find(r => r.id === rule.id);
        if (updatedRule) {
          setSelectedRuleForPanel(updatedRule);
        }
      }
    }
  };


  const handleImportRules = (importedRules: IngestionRule[]) => {
    if (!selectedFeed || importedRules.length === 0) return;

    // Show confirmation
    const confirmed = window.confirm(
      `Import ${importedRules.length} rule(s)? Existing rules with matching configuration will be updated, new ones will be added.`
    );
    if (!confirmed) return;

    // Merge strategy: match by rule_type + config signature
    const matchRule = (existing: IngestionRule, imported: IngestionRule): boolean => {
      if (existing.rule_type !== imported.rule_type) return false;
      
      // Create a signature from key config fields
      const getSignature = (config: any, ruleType: string): string => {
        switch (ruleType) {
          case 'pricing':
            return `${config.min_price ?? 'null'}-${config.max_price ?? 'null'}-${config.source_field ?? 'null'}-${config.target_field ?? 'null'}`;
          case 'origin':
            return `${config.source_field ?? 'null'}-${config.target_field ?? 'null'}`;
          case 'scoring':
            return `${config.field_name ?? 'null'}-${config.field_value ?? 'null'}`;
          case 'filter':
            return `${config.field_name ?? 'null'}-${config.field_value ?? 'null'}-${config.operator ?? 'null'}`;
          default:
            return JSON.stringify(config);
        }
      };

      return getSignature(existing.config, existing.rule_type) === 
             getSignature(imported.config, imported.rule_type);
    };

    const updatedLocalRules = [...localRules];
    const newPendingCreates: PendingCreateRule[] = [];
    let updatedCount = 0;
    let addedCount = 0;

    importedRules.forEach((importedRule) => {
      // Find matching existing rule
      const existingIndex = updatedLocalRules.findIndex((existing) =>
        matchRule(existing, importedRule)
      );

      if (existingIndex >= 0) {
        // Update existing rule
        const existing = updatedLocalRules[existingIndex];
        updatedLocalRules[existingIndex] = {
          ...existing,
          config: importedRule.config,
          name: importedRule.name || existing.name,
        };
        
        // Mark as pending change
        setPendingChanges((prev) => {
          const newMap = new Map(prev);
          newMap.set(existing.id, {
            config: importedRule.config,
            name: importedRule.name || existing.name,
          });
          return newMap;
        });
        updatedCount++;
      } else {
        // Add as new rule
        const tempId = tempIdCounter.current--;
        const newRule: PendingCreateRule = {
          ...importedRule,
          tempId,
          priority: localRules.length + newPendingCreates.length,
        };
        newPendingCreates.push(newRule);
        
        // Add to local rules for immediate display
        updatedLocalRules.push({
          ...importedRule,
          id: tempId,
          priority: localRules.length + newPendingCreates.length - 1,
        });
        addedCount++;
      }
    });

    setLocalRules(updatedLocalRules);
    setPendingCreates((prev) => [...prev, ...newPendingCreates]);
    
    alert(`Import complete: ${updatedCount} rule(s) updated, ${addedCount} rule(s) added.`);
  };

  const handleAddRule = () => {
    // Get default config from registry
    const ruleTypeConfig = getRuleTypeConfig(selectedRuleType);
    let ruleConfig: any = { ...ruleTypeConfig.defaultConfig };

    // For pricing rules, auto-prefill min_price from last row's max_price + 1
    if (selectedRuleType === 'pricing') {
      const displayRules = dragDrop.getDisplayRules();
      if (displayRules.length > 0) {
        const lastRule = displayRules[displayRules.length - 1];
        const lastConfig = lastRule.config as any;
        const lastMaxPrice = lastConfig?.max_price ?? 0;
        ruleConfig.min_price = lastMaxPrice + 1;
        // Copy source_field and target_field from last rule for convenience
        ruleConfig.source_field = lastConfig?.source_field || [];
        ruleConfig.target_field = lastConfig?.target_field || [];
      }
    }

    const newRule: CreateRuleInput = {
      tenant_id: tenantId,
      feed_key: selectedFeed,
      rule_type: selectedRuleType as RuleType,
      name: `New ${selectedRuleType} Rule`,
      priority: localRules.length + pendingCreates.length,
      enabled: true,
      config: ruleConfig as PricingRuleConfig | OriginRuleConfig | ScoringRuleConfig,
      notes: '',
    };

    const tempId = tempIdCounter.current--;
    const now = new Date().toISOString();
    const pendingCreate: PendingCreateRule = {
      ...newRule,
      tempId,
    };

    setPendingCreates([...pendingCreates, pendingCreate]);
    
    // Add to local rules for immediate display - use negative ID as placeholder
    // Supabase will generate the real ID when saved
    const newLocalRule: IngestionRule = {
      id: tempId,
      tenant_id: tenantId,
      feed_key: selectedFeed,
      rule_type: selectedRuleType as RuleType,
      name: newRule.name || `New ${selectedRuleType} Rule`,
      priority: newRule.priority ?? (localRules.length + pendingCreates.length),
      enabled: true,
      config: ruleConfig,
      notes: '',
      updated_at: now,
      created_at: now,
    };

    setLocalRules([...localRules, newLocalRule]);
    setEditingRuleId(tempId);
    setEditFormData({
      name: newLocalRule.name,
      priority: newLocalRule.priority,
      enabled: newLocalRule.enabled,
      notes: newLocalRule.notes,
      config: { ...newLocalRule.config },
    });
  };


  const handleSaveEdit = (rule: IngestionRule) => {
    const ruleId = rule.id;
    
    console.log('✏️ Saving edit for rule:', ruleId);
    console.log('✏️ Current editFormData:', editFormData);
    console.log('✏️ Current pendingChanges before:', Array.from(pendingChanges.entries()));
    
    // Ensure we have all required fields, fallback to rule values if not in editFormData
    const updateData: Partial<CreateRuleInput> = {
      name: editFormData.name ?? rule.name,
      priority: editFormData.priority ?? rule.priority,
      enabled: editFormData.enabled ?? rule.enabled,
      notes: editFormData.notes ?? rule.notes,
      config: (editFormData.config ?? rule.config) as any,
    };
    
    // Ensure config is a proper object, not undefined
    if (!updateData.config) {
      updateData.config = rule.config as any;
    }
    
    console.log('✏️ Update data to save:', updateData);
    
    // Store in pending changes (only for existing rules with positive IDs)
    if (ruleId > 0) {
      const newPendingChanges = new Map(pendingChanges);
      newPendingChanges.set(ruleId, updateData);
      setPendingChanges(newPendingChanges);
    } else {
      // For new rules (negative IDs), update the pending create
      const pendingIndex = pendingCreates.findIndex(create => create.tempId === ruleId);
      if (pendingIndex >= 0) {
        const updatedCreates = [...pendingCreates];
        updatedCreates[pendingIndex] = { ...updatedCreates[pendingIndex], ...updateData };
        setPendingCreates(updatedCreates);
      }
    }
    
    console.log('✏️ Pending changes after save:', Array.from(pendingChanges.entries()));
    console.log('✏️ hasPendingChanges will be:', pendingChanges.size > 0 || pendingDeletes.size > 0 || pendingCreates.length > 0);
    
    // Update local rules for immediate display
    setLocalRules(localRules.map(r => 
      r.id === ruleId 
        ? { ...r, ...updateData, updated_at: new Date().toISOString() }
        : r
    ));
    
    setEditingRuleId(null);
    setEditFormData({});
  };

  const handleDeleteRule = (ruleId: number) => {
    console.log('🗑️ Deleting rule:', ruleId);
    console.log('🗑️ Current pendingDeletes before:', Array.from(pendingDeletes));
    
    // Check if it's a new rule (negative ID)
    const isNewRule = ruleId < 0;
    
    if (isNewRule) {
      // Remove from pending creates
      const updatedCreates = pendingCreates.filter(create => create.tempId !== ruleId);
      setPendingCreates(updatedCreates);
      console.log('🗑️ Removed from pendingCreates, new length:', updatedCreates.length);
    } else {
      // Add to pending deletes for existing rules
      const newPendingDeletes = new Set(pendingDeletes);
      newPendingDeletes.add(ruleId);
      setPendingDeletes(newPendingDeletes);
      
      // Remove from pending changes if it exists there
      const newPendingChanges = new Map(pendingChanges);
      newPendingChanges.delete(ruleId);
      setPendingChanges(newPendingChanges);
    }
    
    // Update local rules for immediate display
    setLocalRules(localRules.filter(r => r.id !== ruleId));
    
    // Remove from manually edited rows if present
    const newManuallyEdited = new Set(manuallyEditedRows);
    newManuallyEdited.delete(ruleId);
    setManuallyEditedRows(newManuallyEdited);
    
    console.log('🗑️ Pending deletes after delete:', Array.from(pendingDeletes));
  };


  const handleSaveChanges = () => {
    const updates = Array.from(pendingChanges.entries())
      .filter(([id]) => !pendingDeletes.has(id) && id > 0) // Only positive IDs (existing rules)
      .map(([id, data]) => ({ id, data }));
    
    const deletes = Array.from(pendingDeletes).filter(id => id > 0); // Only positive IDs
    
    const createPayloads = pendingCreates.map(({ tempId, ...rest }) => rest);

    if (updates.length === 0 && createPayloads.length === 0 && deletes.length === 0) {
      alert('No changes to save. Make sure you click the checkmark (✓) after editing a rule, or add a new rule first.');
      return;
    }
    
    console.log('Saving changes to Supabase:', { 
      updates: updates.length, 
      creates: pendingCreates.length, 
      deletes: deletes.length 
    });
    
    batchUpdateMutation.mutate({
      updates,
      creates: createPayloads,
      deletes,
    }, {
      onError: (error) => {
        console.error('Failed to save changes:', error);
        alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      onSuccess: () => {
        console.log('Changes saved successfully to Supabase');
        alert('Changes saved successfully!');
        // Reset manually edited rows after successful save
        setManuallyEditedRows(new Set());
      },
    });
  };

  const getRuleTypeDescription = () => {
    switch (selectedRuleType) {
      case 'pricing':
        return 'Set markup percentages based on price ranges';
      case 'origin':
        return 'Map source data fields to internal schema';
      case 'scoring':
        return 'Assign relevance scores (1-100) to specific attributes';
      case 'filter':
        return 'Filter products based on field values';
      default:
        return `Custom rules for ${selectedRuleType}`;
    }
  };


  // Use the extracted JSON generator utility
  const getCombinedConfigForDisplay = () => {
    return getCombinedConfig(allFeedRules, selectedFeed);
  };


  useEffect(() => {
    if (editingRuleId === null) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!tableAreaRef.current) {
        return;
      }

      if (tableAreaRef.current.contains(event.target as Node)) {
        return;
      }

      const editingRule = localRules.find(r => r.id === editingRuleId);
      if (editingRule) {
        handleSaveEdit(editingRule);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [editingRuleId, localRules, handleSaveEdit]);

  const renderTableRows = () => {
    // Calculate total column count: common columns (7) + rule type specific columns
    const ruleTypeConfig = getRuleTypeConfig(selectedRuleType);
    const totalColSpan = 7 + ruleTypeConfig.headers.length;

    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={totalColSpan} className="text-center py-8 text-slate-500">
            Loading rules...
          </TableCell>
        </TableRow>
      );
    }

    const displayRules = dragDrop.getDisplayRules();
    if (displayRules.length === 0 && pendingCreates.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={totalColSpan} className="text-center py-8 text-slate-500">
            No rules found. Click "Add New Rule" to create one.
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        <SortableContext
          items={displayRules.map(r => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {displayRules.map((rule) => {
            const isEditing = editingRuleId === rule.id;
            const isPending = pendingChanges.has(rule.id) || pendingDeletes.has(rule.id);
            const pendingChange = pendingChanges.get(rule.id);

            return (
              <SortableRow
                key={rule.id}
                rule={rule}
                isEditing={isEditing}
                isPending={isPending}
                editFormData={editFormData}
                pendingChange={pendingChange}
                selectedFeed={selectedFeed}
                selectedRuleType={selectedRuleType}
                manuallyEditedRows={manuallyEditedRows}
                onStartEdit={simpleHandlers.handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={simpleHandlers.handleCancelEdit}
                onDelete={handleDeleteRule}
                onConfigChange={simpleHandlers.handleConfigChangeInRow}
                onMaxPriceChange={priceAutoUpdate.handleMaxPriceChange}
                onManualEdit={simpleHandlers.handleManualEdit}
                editingRuleId={editingRuleId}
                onRowClick={simpleHandlers.handleRowClick}
              />
            );
          })}
        </SortableContext>
      </>
    );
  };
  
  // Debug: Log pending changes state
  useEffect(() => {
    console.log('Pending changes state:', {
      pendingChanges: Array.from(pendingChanges.entries()),
      pendingDeletes: Array.from(pendingDeletes),
      pendingCreates,
      hasPendingChanges,
    });
  }, [pendingChanges, pendingDeletes, pendingCreates, hasPendingChanges]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
          <h2 className="text-2xl font-semibold text-slate-900">Pricing Rules</h2>
          <p className="text-slate-500">Manage pricing markup rules for product feeds</p>
        </div>
      </div>

      {/* Two-tier tab interface */}
                <div className="space-y-4">
        <FeedTabs
          feedKeys={feedKeys}
          selectedFeed={selectedFeed}
          isLoadingFeeds={isLoadingFeeds}
          onSelectFeed={setSelectedFeed}
          onDeleteFeed={feedManagement.handleDeleteFeed}
          onAddFeed={feedManagement.handleAddFeed}
          onCopyFeed={feedManagement.handleCopyFeed}
          newFeedKey={newFeedKey}
          setNewFeedKey={setNewFeedKey}
          isAddingFeed={isAddingFeed}
          setIsAddingFeed={setIsAddingFeed}
          copyToFeedKey={copyToFeedKey}
          setCopyToFeedKey={setCopyToFeedKey}
          isCopyingFeed={isCopyingFeed}
          setIsCopyingFeed={setIsCopyingFeed}
        />

        <RuleTypeTabs
          ruleTypes={ruleTypes}
          selectedRuleType={selectedRuleType}
          isLoadingRuleTypes={isLoadingRuleTypes}
          onSelectRuleType={setSelectedRuleType}
          onDeleteRuleType={ruleTypeManagement.handleDeleteRuleType}
          onAddRuleType={ruleTypeManagement.handleAddRuleType}
          selectedFeed={selectedFeed}
        />
          </div>

      {/* Action buttons - single row */}
      <ActionButtons
        onAddRule={handleAddRule}
        onSaveChanges={handleSaveChanges}
        hasPendingChanges={hasPendingChanges}
        isSaving={batchUpdateMutation.isPending}
        pendingCount={pendingChanges.size + pendingDeletes.size + pendingCreates.length}
      />

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="capitalize text-slate-900">{selectedRuleType} Rules</CardTitle>
          <CardDescription className="text-slate-500">
            {getRuleTypeDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" ref={tableAreaRef}>
            <DndContext
              sensors={dragDrop.sensors}
              collisionDetection={closestCenter}
              onDragEnd={dragDrop.handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200">
                    <TableHead>ID</TableHead>
                    <TableHead>Feed Key</TableHead>
                    <TableHead>Rule Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    {getRuleTypeConfig(selectedRuleType).headers.map(header => (
                      <TableHead key={header.key}>{header.label}</TableHead>
                    ))}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableRows()}
                </TableBody>
              </Table>
            </DndContext>
          </div>
            </CardContent>
          </Card>

      {/* Config JSON Display - Collapsible */}
      <JsonConfigCard
        selectedFeed={selectedFeed}
        allFeedRules={allFeedRules}
        showConfig={showConfig}
        onToggleConfig={() => setShowConfig(!showConfig)}
        getCombinedConfig={getCombinedConfigForDisplay}
        onImportRules={handleImportRules}
      />

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        ruleTypeName=""
        onSelect={ruleTypeManagement.handleTemplateSelected}
        onCancel={ruleTypeManagement.handleTemplateCanceled}
      />

      {/* Rule Details Panel */}
      <RuleDetailsPanel
        rule={selectedRuleForPanel}
        isOpen={isPanelOpen}
        onClose={simpleHandlers.handlePanelClose}
        onSave={handlePanelSave}
        selectedRuleType={selectedRuleType}
      />
    </div>
  );
}
