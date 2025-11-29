import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { feedRulesApi, type FeedRulesConfig } from '@/lib/api/feedRules';

/**
 * Custom hook for managing feed rules
 * Handles fetching, local state, and tracking pending changes
 */
export function useFeedRules(feedId: number | null) {
  const [localRules, setLocalRules] = useState<FeedRulesConfig>({
    filters: [],
    fieldMappings: [],
    fieldTransformations: [],
    calculatedFields: [],
  });
  const [initialRules, setInitialRules] = useState<string>('');

  // Fetch rules from API
  const {
    data: rules,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['feedRules', feedId],
    queryFn: async () => {
      try {
        return await feedRulesApi.getFeedRules(feedId!);
      } catch (err) {
        console.error('Error fetching feed rules:', err);
        // Return empty rules config on error instead of throwing
        return {
          filters: [],
          fieldMappings: [],
          fieldTransformations: [],
          calculatedFields: [],
          shardRules: [],
        };
      }
    },
    enabled: feedId !== null,
    retry: 1,
  });

  // Update local rules when fetched rules change
  useEffect(() => {
    if (rules) {
      // Ensure all rule arrays are actually arrays (safety check)
      const safeRules: FeedRulesConfig = {
        filters: Array.isArray(rules.filters) ? rules.filters : [],
        fieldMappings: Array.isArray(rules.fieldMappings) ? rules.fieldMappings : [],
        fieldTransformations: Array.isArray(rules.fieldTransformations) ? rules.fieldTransformations : [],
        calculatedFields: Array.isArray(rules.calculatedFields) ? rules.calculatedFields : [],
        shardRules: Array.isArray(rules.shardRules) ? rules.shardRules : [],
      };
      setLocalRules(safeRules);
      setInitialRules(JSON.stringify(safeRules));
    }
  }, [rules]);

  // Calculate if there are pending changes
  const currentRulesString = JSON.stringify(localRules);
  const hasPendingChanges = currentRulesString !== initialRules;

  // Count total pending changes
  const countPendingChanges = (): number => {
    if (!hasPendingChanges) return 0;

    let count = 0;
    const initial = initialRules ? JSON.parse(initialRules) : {};
    
    // Compare each rule type
    if (JSON.stringify(localRules.filters) !== JSON.stringify(initial.filters || [])) {
      count += Math.abs((localRules.filters?.length || 0) - (initial.filters?.length || 0));
    }
    if (JSON.stringify(localRules.fieldMappings) !== JSON.stringify(initial.fieldMappings || [])) {
      count += Math.abs((localRules.fieldMappings?.length || 0) - (initial.fieldMappings?.length || 0));
    }
    if (JSON.stringify(localRules.fieldTransformations) !== JSON.stringify(initial.fieldTransformations || [])) {
      count += Math.abs((localRules.fieldTransformations?.length || 0) - (initial.fieldTransformations?.length || 0));
    }
    if (JSON.stringify(localRules.calculatedFields) !== JSON.stringify(initial.calculatedFields || [])) {
      count += Math.abs((localRules.calculatedFields?.length || 0) - (initial.calculatedFields?.length || 0));
    }

    return Math.max(count, 1); // At least 1 if there are changes
  };

  return {
    rules,
    localRules,
    setLocalRules,
    isLoading,
    error,
    hasPendingChanges,
    pendingChanges: countPendingChanges(),
  };
}
