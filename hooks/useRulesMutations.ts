import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesApi, type CreateRuleInput } from '@/lib/api/rules';

/**
 * Custom hook for rule mutation operations (create, update, delete)
 * @param selectedFeed - Currently selected feed
 * @param tenantId - Tenant ID
 * @param setPendingChanges - State setter for pending changes
 * @param setPendingDeletes - State setter for pending deletes
 * @param setPendingCreates - State setter for pending creates
 * @param setEditingRuleId - State setter for editing rule ID
 * @param setEditFormData - State setter for edit form data
 * @returns Mutation object and handlers
 */
export function useRulesMutations(
  selectedFeed: string,
  tenantId: number,
  setPendingChanges: (changes: Map<number, Partial<CreateRuleInput>>) => void,
  setPendingDeletes: (deletes: Set<number>) => void,
  setPendingCreates: (creates: any[]) => void,
  setEditingRuleId: (id: number | null) => void,
  setEditFormData: (data: any) => void
) {
  const queryClient = useQueryClient();

  const batchUpdateMutation = useMutation({
    mutationFn: async (changes: { 
      updates: Array<{ id: number; data: Partial<CreateRuleInput> }>, 
      creates: CreateRuleInput[], 
      deletes: number[] 
    }) => {
      console.log('Saving to Supabase:', changes);
      const promises: Promise<any>[] = [];
      
      // Create new rules
      changes.creates.forEach((create) => {
        console.log('Creating rule:', create);
        promises.push(rulesApi.create(create));
      });
      
      // Update existing rules
      changes.updates.forEach((update) => {
        console.log('Updating rule in Supabase:', update.id, update.data);
        promises.push(
          rulesApi.update(update.id, update.data).catch((error) => {
            console.error('Update failed for rule', update.id, ':', error);
            throw error;
          })
        );
      });
      
      // Delete rules
      changes.deletes.forEach((id) => {
        console.log('Deleting rule from Supabase:', id);
        promises.push(
          rulesApi.delete(id, selectedFeed, tenantId).catch((error) => {
            console.error('Delete failed for rule', id, ':', error);
            throw error;
          })
        );
      });
      
      if (promises.length === 0) {
        return [];
      }
      
      const results = await Promise.all(promises);
      console.log('All operations completed:', results);
      return results;
    },
    onSuccess: () => {
      console.log('Successfully saved to Supabase, refreshing...');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      setPendingChanges(new Map());
      setPendingDeletes(new Set());
      setPendingCreates([]);
      setEditingRuleId(null);
      setEditFormData({});
    },
    onError: (error) => {
      console.error('Failed to save to Supabase:', error);
    },
  });

  return {
    batchUpdateMutation,
    queryClient,
  };
}

