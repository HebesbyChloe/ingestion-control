import type { IngestionRule } from '@/lib/api/rules';

interface UseSimpleHandlersParams {
  editingRuleId: number | null;
  setEditingRuleId: (id: number | null) => void;
  editFormData: any;
  setEditFormData: (data: any) => void;
  setIsPanelOpen: (open: boolean) => void;
  setSelectedRuleForPanel: (rule: IngestionRule | null) => void;
  manuallyEditedRows: Set<number>;
  setManuallyEditedRows: (rows: Set<number>) => void;
  localRules: IngestionRule[];
}

/**
 * useSimpleHandlers Hook
 * 
 * Provides simple event handlers with minimal logic and dependencies.
 * These handlers manage UI state and user interactions without
 * complex business logic or API calls.
 * 
 * Includes:
 * - Row click handling (opens detail panel)
 * - Panel close handling
 * - Edit mode start/cancel
 * - Config field changes
 * - Manual edit tracking
 * 
 * @hook
 */
export function useSimpleHandlers({
  editingRuleId,
  setEditingRuleId,
  editFormData,
  setEditFormData,
  setIsPanelOpen,
  setSelectedRuleForPanel,
  manuallyEditedRows,
  setManuallyEditedRows,
  localRules,
}: UseSimpleHandlersParams) {
  
  /**
   * Handle row click - opens the detail panel
   * Don't open if currently editing any row
   */
  const handleRowClick = (rule: IngestionRule) => {
    if (editingRuleId !== null) {
      return;
    }
    setSelectedRuleForPanel(rule);
    setIsPanelOpen(true);
  };

  /**
   * Handle panel close - closes the detail panel
   */
  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setSelectedRuleForPanel(null);
  };

  /**
   * Handle start edit - enters edit mode for a rule
   */
  const handleStartEdit = (rule: IngestionRule) => {
    setEditingRuleId(rule.id);
    setEditFormData({
      name: rule.name,
      priority: rule.priority,
      enabled: rule.enabled,
      notes: rule.notes,
      config: { ...rule.config }, // Deep copy to avoid mutations
    });
  };

  /**
   * Handle cancel edit - exits edit mode without saving
   */
  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditFormData({});
  };

  /**
   * Handle config change in row - updates form data during editing
   */
  const handleConfigChangeInRow = (field: string, value: any) => {
    if (editingRuleId === null) return;
    
    if (field === 'name' || field === 'priority' || field === 'enabled' || field === 'notes') {
      setEditFormData({ ...editFormData, [field]: value });
    } else {
      // Config field
      const currentRule = localRules.find(r => r.id === editingRuleId);
      const currentConfig = editFormData.config || currentRule?.config || {};
      const updatedConfig = { ...currentConfig, [field]: value };
      setEditFormData({ ...editFormData, config: updatedConfig });
    }
  };

  /**
   * Handle manual edit - marks a row as manually edited
   * Used to prevent auto-updates for manually edited rows
   */
  const handleManualEdit = (ruleId: number) => {
    setManuallyEditedRows(new Set([...manuallyEditedRows, ruleId]));
  };

  return {
    handleRowClick,
    handlePanelClose,
    handleStartEdit,
    handleCancelEdit,
    handleConfigChangeInRow,
    handleManualEdit,
  };
}

