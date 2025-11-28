import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedRulesApi, type FeedRulesConfig } from '@/lib/api/feedRules';

/**
 * Custom hook for feed rules mutations
 * Handles saving rules with optimistic updates and error handling
 */
export function useFeedRulesMutations(
  feedId: number | null,
  setLocalRules: (rules: FeedRulesConfig) => void
) {
  const queryClient = useQueryClient();

  const saveRulesMutation = useMutation({
    mutationFn: async (rules: FeedRulesConfig) => {
      if (!feedId) {
        throw new Error('No feed selected');
      }
      return feedRulesApi.updateFeedRules(feedId, rules);
    },
    onMutate: async (newRules) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feedRules', feedId] });

      // Snapshot the previous value
      const previousRules = queryClient.getQueryData(['feedRules', feedId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['feedRules', feedId], newRules);

      // Return a context object with the snapshotted value
      return { previousRules };
    },
    onError: (err, newRules, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRules) {
        queryClient.setQueryData(['feedRules', feedId], context.previousRules);
        setLocalRules(context.previousRules as FeedRulesConfig);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['feedRules', feedId] });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      
      // Update local rules to match saved data
      if (data.rules) {
        const savedRules = typeof data.rules === 'string' 
          ? JSON.parse(data.rules) 
          : data.rules;
        setLocalRules(savedRules);
      }
    },
  });

  return {
    saveRulesMutation,
  };
}
