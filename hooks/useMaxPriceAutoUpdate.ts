import type { IngestionRule } from '@/lib/api/rules';
import type { PendingCreateRule } from './useRulesState';
import { calculateNextMinPrice, canAutoUpdateMinPrice, getNextRule } from '@/lib/rules/priceCalculations';

interface UseMaxPriceAutoUpdateParams {
  localRules: IngestionRule[];
  setLocalRules: (rules: IngestionRule[]) => void;
  editingRuleId: number | null;
  editFormData: any;
  setEditFormData: (data: any) => void;
  pendingChanges: Map<number, any>;
  setPendingChanges: (changes: Map<number, any>) => void;
  pendingCreates: PendingCreateRule[];
  setPendingCreates: (creates: PendingCreateRule[]) => void;
  manuallyEditedRows: Set<number>;
  selectedRuleType: string | null;
  getDisplayRules: () => IngestionRule[];
}

/**
 * useMaxPriceAutoUpdate Hook
 * 
 * Handles automatic min_price calculation for pricing rules.
 * When a rule's max_price changes, automatically updates the next rule's
 * min_price to max_price + 1 (unless the next rule was manually edited).
 * 
 * This creates a seamless price range flow for pricing rules.
 * 
 * @hook
 */
export function useMaxPriceAutoUpdate({
  localRules,
  setLocalRules,
  editingRuleId,
  editFormData,
  setEditFormData,
  pendingChanges,
  setPendingChanges,
  pendingCreates,
  setPendingCreates,
  manuallyEditedRows,
  selectedRuleType,
  getDisplayRules,
}: UseMaxPriceAutoUpdateParams) {
  
  /**
   * Auto-calculate min_price for next row when max_price changes
   */
  const handleMaxPriceChange = (ruleId: number, newMaxPrice: number) => {
    const displayRules = getDisplayRules();
    const nextRule = getNextRule(displayRules, ruleId);
    
    // Only auto-update for pricing rules
    if (nextRule && canAutoUpdateMinPrice(nextRule.id, manuallyEditedRows) && selectedRuleType === 'pricing') {
      const nextConfig = { ...nextRule.config } as any;
      const newMinPrice = calculateNextMinPrice(newMaxPrice);
      
      if (nextConfig.min_price !== newMinPrice) {
        // Update next rule's min_price
        const updatedRules = localRules.map(r => {
          if (r.id === nextRule.id) {
            return {
              ...r,
              config: { ...nextConfig, min_price: newMinPrice },
            };
          }
          return r;
        });
        setLocalRules(updatedRules);
        
        // If editing, update editFormData
        if (editingRuleId === nextRule.id) {
          setEditFormData({
            ...editFormData,
            config: { ...nextConfig, min_price: newMinPrice },
          });
        }
        
        // Update pending changes
        if (nextRule.id > 0) {
          const newPendingChanges = new Map(pendingChanges);
          const existingChange = newPendingChanges.get(nextRule.id) || {};
          newPendingChanges.set(nextRule.id, {
            ...existingChange,
            config: { ...nextConfig, min_price: newMinPrice },
          });
          setPendingChanges(newPendingChanges);
        } else {
          const updatedCreates = pendingCreates.map(create =>
            create.tempId === nextRule.id
              ? { ...create, config: { ...nextConfig, min_price: newMinPrice } }
              : create
          );
          setPendingCreates(updatedCreates);
        }
      }
    }
  };

  return {
    handleMaxPriceChange,
  };
}

