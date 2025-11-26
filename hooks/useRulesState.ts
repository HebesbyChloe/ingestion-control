import { useState, useRef } from 'react';
import { type IngestionRule, type CreateRuleInput } from '@/lib/api/rules';

export type PendingCreateRule = CreateRuleInput & { tempId: number };

/**
 * Custom hook for managing all rules page state
 * @returns Object containing all state variables and their setters
 */
export function useRulesState() {
  // Selection state
  const [selectedFeed, setSelectedFeed] = useState<string>('');
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  
  // Modal/Dialog state
  const [newFeedKey, setNewFeedKey] = useState<string>('');
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [isCopyingFeed, setIsCopyingFeed] = useState(false);
  const [copyToFeedKey, setCopyToFeedKey] = useState<string>('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Panel state
  const [selectedRuleForPanel, setSelectedRuleForPanel] = useState<IngestionRule | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Editing state
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<IngestionRule>>({});
  const [showConfig, setShowConfig] = useState<boolean>(false);
  
  // Batch changes - pending operations
  const [pendingChanges, setPendingChanges] = useState<Map<number, Partial<CreateRuleInput>>>(new Map());
  const [pendingDeletes, setPendingDeletes] = useState<Set<number>>(new Set());
  const [pendingCreates, setPendingCreates] = useState<PendingCreateRule[]>([]);
  const [localRules, setLocalRules] = useState<IngestionRule[]>([]);
  
  // Track manually edited rows for price auto-calculation
  const [manuallyEditedRows, setManuallyEditedRows] = useState<Set<number>>(new Set());
  
  // Track initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Refs
  const tempIdCounter = useRef<number>(-1);
  const tableAreaRef = useRef<HTMLDivElement | null>(null);
  
  // Computed state
  const hasPendingChanges = pendingChanges.size > 0 || pendingDeletes.size > 0 || pendingCreates.length > 0;
  
  return {
    // Selection
    selectedFeed,
    setSelectedFeed,
    selectedRuleType,
    setSelectedRuleType,
    
    // Modal/Dialog
    newFeedKey,
    setNewFeedKey,
    isAddingFeed,
    setIsAddingFeed,
    isCopyingFeed,
    setIsCopyingFeed,
    copyToFeedKey,
    setCopyToFeedKey,
    showTemplateSelector,
    setShowTemplateSelector,
    
    // Panel
    selectedRuleForPanel,
    setSelectedRuleForPanel,
    isPanelOpen,
    setIsPanelOpen,
    
    // Editing
    editingRuleId,
    setEditingRuleId,
    editFormData,
    setEditFormData,
    showConfig,
    setShowConfig,
    
    // Batch changes
    pendingChanges,
    setPendingChanges,
    pendingDeletes,
    setPendingDeletes,
    pendingCreates,
    setPendingCreates,
    localRules,
    setLocalRules,
    
    // Tracking
    manuallyEditedRows,
    setManuallyEditedRows,
    isInitialLoad,
    setIsInitialLoad,
    
    // Refs
    tempIdCounter,
    tableAreaRef,
    
    // Computed
    hasPendingChanges,
  };
}

