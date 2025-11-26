import { useQueryClient } from '@tanstack/react-query';
import { rulesApi, type CreateRuleInput } from '@/lib/api/rules';
import { canDeleteFeed } from '@/lib/rules/ruleValidation';

/**
 * Custom hook for feed management operations
 * @param tenantId - Tenant ID
 * @param selectedFeed - Currently selected feed
 * @param dbFeedKeys - Feed keys from database
 * @param customFeeds - Custom feeds from localStorage
 * @param feedKeys - Combined feed keys
 * @param setSelectedFeed - State setter for selected feed
 * @param setCustomFeeds - State setter for custom feeds
 * @param setNewFeedKey - State setter for new feed key input
 * @param setIsAddingFeed - State setter for add feed modal
 * @param setCopyToFeedKey - State setter for copy feed key input
 * @param setIsCopyingFeed - State setter for copy feed modal
 * @returns Feed management handler functions
 */
export function useFeedManagement(
  tenantId: number,
  selectedFeed: string,
  dbFeedKeys: string[],
  customFeeds: string[],
  feedKeys: string[],
  setSelectedFeed: (feed: string) => void,
  setCustomFeeds: (feeds: string[]) => void,
  setNewFeedKey: (key: string) => void,
  setIsAddingFeed: (isAdding: boolean) => void,
  setCopyToFeedKey: (key: string) => void,
  setIsCopyingFeed: (isCopying: boolean) => void
) {
  const queryClient = useQueryClient();

  /**
   * Handles adding a new feed
   */
  const handleAddFeed = (newFeedKey: string) => {
    if (newFeedKey.trim()) {
      const feedKey = newFeedKey.trim();
      
      // Add to custom feeds if not already in database feeds
      if (!dbFeedKeys.includes(feedKey) && !customFeeds.includes(feedKey)) {
        setCustomFeeds([...customFeeds, feedKey]);
      }
      
      setSelectedFeed(feedKey);
      setNewFeedKey('');
      setIsAddingFeed(false);
    }
  };

  /**
   * Handles copying all rules from one feed to another
   */
  const handleCopyFeed = async (copyToFeedKey: string) => {
    if (!copyToFeedKey.trim()) {
      alert('Please enter a new feed key');
      return;
    }
    
    if (!selectedFeed) {
      alert('Please select a feed to copy from');
      return;
    }

    const newFeedKey = copyToFeedKey.trim();
    
    try {
      // Get all rules for the current feed (across all rule types)
      const allRules = await rulesApi.getByFeed(selectedFeed, tenantId);
      
      if (allRules.length === 0) {
        alert('No rules found in the selected feed to copy');
        return;
      }

      // Create copies of all rules with the new feed_key
      const copyPromises = allRules.map(rule => {
        const newRule: CreateRuleInput = {
          feed_key: newFeedKey,
          rule_type: rule.rule_type,
          name: rule.name + ' (copy)',
          priority: rule.priority,
          enabled: rule.enabled,
          config: rule.config as any,
          notes: rule.notes ? rule.notes + ' (copied from ' + selectedFeed + ')' : 'Copied from ' + selectedFeed,
          tenant_id: tenantId,
        };
        return rulesApi.create(newRule);
      });

      await Promise.all(copyPromises);
      
      // Add to custom feeds if not already in database feeds
      if (!dbFeedKeys.includes(newFeedKey) && !customFeeds.includes(newFeedKey)) {
        setCustomFeeds([...customFeeds, newFeedKey]);
      }
      
      // Switch to the new feed
      setSelectedFeed(newFeedKey);
      setCopyToFeedKey('');
      setIsCopyingFeed(false);
      
      // Refresh the queries
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['feedKeys'] });
      
      alert(`Successfully copied ${allRules.length} rules from "${selectedFeed}" to "${newFeedKey}"`);
    } catch (error) {
      console.error('Failed to copy feed:', error);
      alert('Failed to copy feed. Please try again.');
    }
  };

  /**
   * Handles deleting a feed (only if no rules exist)
   */
  const handleDeleteFeed = async (feedKey: string) => {
    try {
      // Check if there are any rules for this feed
      const count = await rulesApi.countRulesByFeed(feedKey, tenantId);
      
      if (!canDeleteFeed(count)) {
        alert(`Cannot delete feed "${feedKey}". It has ${count} rule(s). Please delete all rules first.`);
        return;
      }
      
      // Remove from custom feeds
      setCustomFeeds(customFeeds.filter(f => f !== feedKey));
      
      // If no rules, just remove from selection (feed will disappear when no rules exist)
      if (selectedFeed === feedKey) {
        // Select first available feed or empty
        const remainingFeeds = feedKeys.filter(f => f !== feedKey);
        setSelectedFeed(remainingFeeds[0] || '');
      }
      
      // Refresh feed keys
      queryClient.invalidateQueries({ queryKey: ['feedKeys'] });
      alert(`Feed "${feedKey}" removed successfully.`);
    } catch (error) {
      console.error('Failed to delete feed:', error);
      alert(`Failed to delete feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    handleAddFeed,
    handleCopyFeed,
    handleDeleteFeed,
  };
}

