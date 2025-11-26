import { useQuery } from '@tanstack/react-query';
import { rulesApi, type IngestionRule, type RuleType } from '@/lib/api/rules';
import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching and managing rules data
 * @param tenantId - The tenant ID
 * @param selectedFeed - Currently selected feed key
 * @param selectedRuleType - Currently selected rule type
 * @returns Object containing all data queries and combined feed/rule type lists
 */
export function useRulesData(tenantId: number, selectedFeed: string, selectedRuleType: string) {
  const [customFeeds, setCustomFeeds] = useState<string[]>([]);
  const [customRuleTypes, setCustomRuleTypes] = useState<string[]>([]);

  // Load custom feeds/types from localStorage on mount
  useEffect(() => {
    const storedFeeds = localStorage.getItem('customFeeds');
    const storedRuleTypes = localStorage.getItem('customRuleTypes');
    
    if (storedFeeds) {
      try {
        setCustomFeeds(JSON.parse(storedFeeds));
      } catch (e) {
        console.error('Failed to parse custom feeds from localStorage', e);
      }
    }
    
    if (storedRuleTypes) {
      try {
        setCustomRuleTypes(JSON.parse(storedRuleTypes));
      } catch (e) {
        console.error('Failed to parse custom rule types from localStorage', e);
      }
    }
  }, []);

  // Persist custom feeds/types to localStorage
  useEffect(() => {
    if (customFeeds.length > 0) {
      localStorage.setItem('customFeeds', JSON.stringify(customFeeds));
    }
  }, [customFeeds]);

  useEffect(() => {
    if (customRuleTypes.length > 0) {
      localStorage.setItem('customRuleTypes', JSON.stringify(customRuleTypes));
    }
  }, [customRuleTypes]);

  // Fetch feed keys from database
  const { data: dbFeedKeys = [], isLoading: isLoadingFeeds } = useQuery({
    queryKey: ['feedKeys', tenantId],
    queryFn: () => rulesApi.getFeedKeys(tenantId),
    retry: 1,
  });

  // Combine database feeds with custom feeds
  const feedKeys = [...new Set([...dbFeedKeys, ...customFeeds])].sort();

  // Fetch rule types from database
  const { data: dbRuleTypes = [], isLoading: isLoadingRuleTypes } = useQuery({
    queryKey: ['ruleTypes', tenantId],
    queryFn: () => rulesApi.getRuleTypes(tenantId),
    retry: 1,
  });

  // Combine database rule types with custom rule types
  const ruleTypes = [...new Set([...dbRuleTypes, ...customRuleTypes])].sort();

  // Fetch rules for selected feed and rule type
  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['rules', selectedFeed, tenantId, selectedRuleType],
    queryFn: () => rulesApi.getByFeed(selectedFeed, tenantId, selectedRuleType as RuleType),
    enabled: !!selectedFeed && !!selectedRuleType,
    retry: 1,
  });

  // Fetch ALL rules for the feed (for JSON config generation)
  const { data: allFeedRules = [] } = useQuery({
    queryKey: ['allRules', selectedFeed, tenantId],
    queryFn: () => rulesApi.getByFeed(selectedFeed, tenantId),
    enabled: !!selectedFeed,
    retry: 1,
  });

  return {
    // Feed data
    feedKeys,
    dbFeedKeys,
    customFeeds,
    setCustomFeeds,
    isLoadingFeeds,
    
    // Rule type data
    ruleTypes,
    dbRuleTypes,
    customRuleTypes,
    setCustomRuleTypes,
    isLoadingRuleTypes,
    
    // Rules data
    rules,
    isLoading,
    error,
    allFeedRules,
  };
}

