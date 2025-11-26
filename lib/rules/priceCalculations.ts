import { IngestionRule } from '@/lib/api/rules';

/**
 * Validates that min price is less than max price
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @returns True if range is valid
 */
export function validatePriceRange(minPrice: number, maxPrice: number): boolean {
  return minPrice < maxPrice;
}

/**
 * Calculates auto-prefill value for next row's min_price based on current row's max_price
 * @param newMaxPrice - The new maximum price value
 * @returns The calculated minimum price for next row (max + 1)
 */
export function calculateNextMinPrice(newMaxPrice: number): number {
  return newMaxPrice + 1;
}

/**
 * Checks if a rule should have its min_price auto-updated
 * @param ruleId - The rule ID to check
 * @param manuallyEditedRows - Set of manually edited rule IDs
 * @returns True if the rule can be auto-updated
 */
export function canAutoUpdateMinPrice(ruleId: number, manuallyEditedRows: Set<number>): boolean {
  return !manuallyEditedRows.has(ruleId);
}

/**
 * Gets the next rule after the current one in the display list
 * @param displayRules - Array of rules in display order
 * @param currentRuleId - Current rule ID
 * @returns The next rule or undefined if at the end
 */
export function getNextRule(displayRules: IngestionRule[], currentRuleId: number): IngestionRule | undefined {
  const currentIndex = displayRules.findIndex(r => r.id === currentRuleId);
  
  if (currentIndex >= 0 && currentIndex < displayRules.length - 1) {
    return displayRules[currentIndex + 1];
  }
  
  return undefined;
}

