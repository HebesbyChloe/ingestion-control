'use client';

import { cn } from '@/lib/utils';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Plus, Trash2 } from 'lucide-react';

interface RuleTypeTabsProps {
  ruleTypes: string[];
  selectedRuleType: string | null;
  isLoadingRuleTypes: boolean;
  onSelectRuleType: (type: string) => void;
  onDeleteRuleType: (type: string) => void;
  onAddRuleType: () => void;
  selectedFeed: string | null;
}

/**
 * RuleTypeTabs Component
 * 
 * Displays horizontal tabs for rule type selection with:
 * - Rule type tab buttons with context menu for deletion
 * - Add Rule Type button
 * - Visual "Rule Types:" label for clarity
 * - Only renders when a feed is selected
 * 
 * @component
 */
export function RuleTypeTabs({
  ruleTypes,
  selectedRuleType,
  isLoadingRuleTypes,
  onSelectRuleType,
  onDeleteRuleType,
  onAddRuleType,
  selectedFeed,
}: RuleTypeTabsProps) {
  // Don't render if no feed is selected
  if (!selectedFeed) {
    return null;
  }

  return (
    <div className="border-b border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-x-auto pl-4">
          {/* Visual label for clarity with indentation to show hierarchy */}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Rule Types:
          </span>
          
          {isLoadingRuleTypes ? (
            <div className="px-4 py-2 text-sm text-slate-500">Loading rule types...</div>
          ) : (
            <>
              {ruleTypes.map((ruleType) => (
                <ContextMenu key={ruleType}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => onSelectRuleType(ruleType)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                        selectedRuleType === ruleType
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      {ruleType}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => onDeleteRuleType(ruleType)}
                      className="text-rose-600 focus:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Rule Type
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </>
          )}
        </div>
        
        {/* Action button - far right */}
        {!isLoadingRuleTypes && (
          <div className="ml-auto">
            {/* Add Rule Type button */}
            <button
              onClick={onAddRuleType}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all whitespace-nowrap border-b-2 border-transparent"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add Rule Type
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

