import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { IngestionRule } from '@/lib/api/rules';
import type { PendingCreateRule } from './useRulesState';

interface UseDragAndDropParams {
  localRules: IngestionRule[];
  setLocalRules: (rules: IngestionRule[]) => void;
  pendingDeletes: Set<number>;
  pendingChanges: Map<number, any>;
  setPendingChanges: (changes: Map<number, any>) => void;
  pendingCreates: PendingCreateRule[];
  setPendingCreates: (creates: PendingCreateRule[]) => void;
}

/**
 * useDragAndDrop Hook
 * 
 * Handles drag-and-drop functionality for reordering rules in the table.
 * Manages:
 * - Sensor setup for drag events
 * - Rule reordering logic
 * - Priority updates
 * - Pending changes tracking
 * 
 * @hook
 */
export function useDragAndDrop({
  localRules,
  setLocalRules,
  pendingDeletes,
  pendingChanges,
  setPendingChanges,
  pendingCreates,
  setPendingCreates,
}: UseDragAndDropParams) {
  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Get rules that should be displayed (not pending delete), sorted by priority
   */
  const getDisplayRules = () => {
    return localRules
      .filter(r => !pendingDeletes.has(r.id))
      .sort((a, b) => a.priority - b.priority);
  };

  /**
   * Handle drag end event - reorder rules and update priorities
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const displayRules = getDisplayRules();
    const oldIndex = displayRules.findIndex(r => r.id === active.id);
    const newIndex = displayRules.findIndex(r => r.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    // Reorder display rules
    const reorderedDisplayRules = arrayMove(displayRules, oldIndex, newIndex);
    
    // Update priorities based on new order
    const updatedDisplayRules = reorderedDisplayRules.map((rule, index) => ({
      ...rule,
      priority: index,
    }));
    
    // Update local rules - replace displayed rules with reordered ones
    const deletedRules = localRules.filter(r => pendingDeletes.has(r.id));
    setLocalRules([...updatedDisplayRules, ...deletedRules]);
    
    // Update pending changes for all reordered rules
    const newPendingChanges = new Map(pendingChanges);
    const updatedCreates = [...pendingCreates];
    
    // Create a map of rule ID to original index in displayRules (before reordering)
    const originalIndexMap = new Map<number, number>();
    displayRules.forEach((rule, idx) => {
      originalIndexMap.set(rule.id, idx);
    });
    
    updatedDisplayRules.forEach((rule, newPriority) => {
      if (rule.id > 0) {
        // Existing rule - update priority in pending changes
        const existingChange = newPendingChanges.get(rule.id) || {};
        newPendingChanges.set(rule.id, { ...existingChange, priority: newPriority });
      } else {
        // New rule - update matching pending create by temp ID
        const pendingIndex = updatedCreates.findIndex(create => create.tempId === rule.id);
        if (pendingIndex >= 0) {
          updatedCreates[pendingIndex] = { ...updatedCreates[pendingIndex], priority: newPriority };
        }
      }
    });
    
    setPendingChanges(newPendingChanges);
    setPendingCreates(updatedCreates);
  };

  return {
    sensors,
    handleDragEnd,
    getDisplayRules,
  };
}

