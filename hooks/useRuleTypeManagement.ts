import { useQueryClient } from '@tanstack/react-query';
import { rulesApi } from '@/lib/api/rules';
import { saveRuleTypeTemplate } from '@/components/rules/ruleTypeRegistry';
import { canDeleteRuleType } from '@/lib/rules/ruleValidation';

/**
 * Custom hook for rule type management operations
 * @param tenantId - Tenant ID
 * @param selectedRuleType - Currently selected rule type
 * @param dbRuleTypes - Rule types from database
 * @param customRuleTypes - Custom rule types from localStorage
 * @param ruleTypes - Combined rule types
 * @param setSelectedRuleType - State setter for selected rule type
 * @param setCustomRuleTypes - State setter for custom rule types
 * @param setShowTemplateSelector - State setter for template selector modal
 * @returns Rule type management handler functions
 */
export function useRuleTypeManagement(
  tenantId: number,
  selectedRuleType: string,
  dbRuleTypes: string[],
  customRuleTypes: string[],
  ruleTypes: string[],
  setSelectedRuleType: (ruleType: string) => void,
  setCustomRuleTypes: (ruleTypes: string[]) => void,
  setShowTemplateSelector: (show: boolean) => void
) {
  const queryClient = useQueryClient();

  /**
   * Handles adding a new rule type (opens template selector)
   */
  const handleAddRuleType = () => {
    // Show template selector with empty name (user will type in the modal)
    setShowTemplateSelector(true);
  };

  /**
   * Handles template selection for a new rule type
   */
  const handleTemplateSelected = (ruleTypeName: string, templateName: string) => {
    // Save the template mapping
    saveRuleTypeTemplate(ruleTypeName, templateName);
    
    // Add to custom rule types if not already in database
    if (!dbRuleTypes.includes(ruleTypeName) && !customRuleTypes.includes(ruleTypeName)) {
      setCustomRuleTypes([...customRuleTypes, ruleTypeName]);
    }
    
    // Switch to the new rule type
    setSelectedRuleType(ruleTypeName);
    
    // Close selector
    setShowTemplateSelector(false);
  };

  /**
   * Handles canceling template selection
   */
  const handleTemplateCanceled = () => {
    setShowTemplateSelector(false);
  };

  /**
   * Handles deleting a rule type (only if no rules exist)
   */
  const handleDeleteRuleType = async (ruleType: string) => {
    try {
      // Check if there are any rules for this rule type
      const count = await rulesApi.countRulesByType(ruleType, tenantId);
      
      if (!canDeleteRuleType(count)) {
        alert(`Cannot delete rule type "${ruleType}". It has ${count} rule(s). Please delete all rules first.`);
        return;
      }
      
      // Remove from custom rule types
      setCustomRuleTypes(customRuleTypes.filter(t => t !== ruleType));
      
      // If no rules, just remove from selection (rule type will disappear when no rules exist)
      if (selectedRuleType === ruleType) {
        // Select first available rule type or empty
        const remainingTypes = ruleTypes.filter(t => t !== ruleType);
        setSelectedRuleType(remainingTypes[0] || '');
      }
      
      // Refresh rule types
      queryClient.invalidateQueries({ queryKey: ['ruleTypes'] });
      alert(`Rule type "${ruleType}" removed successfully.`);
    } catch (error) {
      console.error('Failed to delete rule type:', error);
      alert(`Failed to delete rule type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    handleAddRuleType,
    handleTemplateSelected,
    handleTemplateCanceled,
    handleDeleteRuleType,
  };
}

