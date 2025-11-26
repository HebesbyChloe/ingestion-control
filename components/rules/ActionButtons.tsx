'use client';

import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';

interface ActionButtonsProps {
  onAddRule: () => void;
  onSaveChanges: () => void;
  hasPendingChanges: boolean;
  isSaving: boolean;
  pendingCount: number;
}

/**
 * ActionButtons Component
 * 
 * Displays the action buttons for adding rules and saving changes.
 * - Add New Rule button (left-aligned)
 * - Save Changes button (right-aligned) with pending changes badge
 * 
 * @component
 */
export function ActionButtons({
  onAddRule,
  onSaveChanges,
  hasPendingChanges,
  isSaving,
  pendingCount,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        onClick={onAddRule}
        variant="outline"
        className="border-slate-200 w-[250px]"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Rule
      </Button>
      
      <Button
        onClick={onSaveChanges}
        disabled={!hasPendingChanges || isSaving}
        className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed w-[250px]"
      >
        <Save className="w-4 h-4 mr-2" /> 
        {isSaving ? 'Saving...' : 'Save Changes'}
        {hasPendingChanges && !isSaving && (
          <span className="ml-2 px-2 py-0.5 bg-indigo-500 rounded-full text-xs">
            {pendingCount}
          </span>
        )}
      </Button>
    </div>
  );
}

